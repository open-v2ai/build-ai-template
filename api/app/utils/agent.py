from agents import Agent, Runner
from typing import AsyncGenerator
import asyncio
from openai.types.responses import ResponseTextDeltaEvent

# 1. 判断是否为任务型问题的 agent
task_type_judge_agent = Agent(
    name="TaskTypeJudge",
    instructions="判断输入是否为任务型问题，是则输出 '任务型'，否则输出 '非任务型'。"
)

# 2. 任务拆解 agent
task_decompose_agent = Agent(
    name="TaskDecomposer",
    instructions="将输入的任务型问题拆解为详细的步骤(主任务和子任务)，并以markdown - [ ] todo列表形式输出。"
)

async def run_agent(question: str) -> AsyncGenerator[str, None]:
    # 先判断问题类型
    judge_result = await Runner.run(task_type_judge_agent, question)
    if "任务型" == judge_result.final_output:
        # 任务型问题，调用任务拆解 agent
        steps = Runner.run_streamed(task_decompose_agent, question)
        async for event in steps.stream_events():
            if event.type == "raw_response_event" and isinstance(event.data, ResponseTextDeltaEvent):
                result1 = "<task>" + event.data.delta + "</task>"
                yield result1
        # 根据步骤执行任务，使用一个新的 agent
        task_executor_agent = Agent(name="TaskExecutor", instructions="根据输入的步骤执行任务，并根据结果返回最终答案")
        answer = Runner.run_streamed(task_executor_agent, steps.final_output + " 用户问题：" + question)
        async for event in answer.stream_events():
            if event.type == "raw_response_event" and isinstance(event.data, ResponseTextDeltaEvent):
                result2 = "<answer>" + event.data.delta + "</answer>"
                yield result2
    else:
        # 非任务型问题，直接用 LLM 回答
        answer_agent = Agent(name="AnswerAgent", instructions="直接回答用户问题。")
        answer = Runner.run_streamed(answer_agent, question)
        async for event in answer.stream_events():
            if event.type == "raw_response_event" and isinstance(event.data, ResponseTextDeltaEvent):
                result3 = "<answer>" + event.data.delta + "</answer>"
                yield result3


if __name__ == "__main__":
    async def main():
        while True:
            question = input("\n输入问题：")
            if question in ["exit", "quit", "q"]:
                break
            async for r in run_agent(question):
                if r.startswith("<answer>"):
                    print(r.replace("<answer>", "").replace("</answer>", ""), end="", flush=True)
                elif r.startswith("<task>"):
                    print(r.replace("<task>", "").replace("</task>", ""), end="", flush=True)
                else:
                    print(r, end="", flush=True)
    asyncio.run(main())
