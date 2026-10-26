/**
 * 聊天消息 API
 *
 * 功能说明:
 * - POST: 创建新消息并获取 AI 回复
 * - 支持流式和非流式响应
 * - 自动记录使用统计和 token 消耗
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { Json } from '@/lib/supabase/database.types'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>
type TokenUsage = { prompt_tokens: number; completion_tokens: number; total_tokens: number }

// Create the provider only while handling a request, never while collecting build data.
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
  })
}

/**
 * 估算对话的 token 消耗
 */
function estimateTokens(messages: { content: string }[]): number {
  // 简单估算：每个字符约 0.25 个 token
  let totalChars = 0
  for (const msg of messages) {
    totalChars += msg.content.length
  }
  return Math.ceil(totalChars * 0.25)
}

/**
 * 检查用户是否可以发送消息（会员限制）
 */
async function checkMembershipLimits(
  supabase: SupabaseServerClient,
  userId: number,
  estimatedTokens: number
): Promise<{ canSend: boolean; message?: string }> {
  // 获取用户会员信息
  const { data: membership } = await supabase
    .from('user_memberships')
    .select(`
      *,
      membership_plan:membership_plans(*)
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .single()

  if (!membership) {
    return { canSend: false, message: 'No active membership found' }
  }

  const plan = membership.membership_plan
  if (!plan) return { canSend: false, message: 'Membership plan not found' }

  // 检查每日消息限制
  if (membership.daily_message_count >= plan.daily_message_limit) {
    return {
      canSend: false,
      message: `Daily message limit (${plan.daily_message_limit}) reached`,
    }
  }

  // 检查每日 token 限制
  if (membership.daily_token_count + estimatedTokens > plan.daily_token_limit) {
    return {
      canSend: false,
      message: `Daily token limit (${plan.daily_token_limit}) would be exceeded`,
    }
  }

  return { canSend: true }
}

/**
 * 记录使用统计
 */
async function recordUsage(
  supabase: SupabaseServerClient,
  userId: number,
  messageCount: number,
  tokenCount: number
) {
  const { data: membership } = await supabase
    .from('user_memberships')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()

  if (membership) {
    await supabase
      .from('user_memberships')
      .update({
        daily_message_count: membership.daily_message_count + messageCount,
        daily_token_count: membership.daily_token_count + tokenCount,
        total_message_count: membership.total_message_count + messageCount,
        total_token_count: membership.total_token_count + tokenCount,
      })
      .eq('id', membership.id)
  }
}

// POST /api/chat/message - 创建消息并获取 AI 回复
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 获取当前用户
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 获取用户数据
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { chat_id, content, stream = false } = await request.json()

    if (!chat_id || !content) {
      return NextResponse.json(
        { error: 'chat_id and content are required' },
        { status: 400 }
      )
    }

    // 验证聊天权限
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select(`
        *,
        agent:agents(*)
      `)
      .eq('id', chat_id)
      .eq('user_id', userData.id)
      .eq('is_deleted', false)
      .single()

    if (chatError || !chat) {
      return NextResponse.json(
        { error: 'Chat not found or access denied' },
        { status: 404 }
      )
    }

    // 获取历史消息
    const { data: historyMessages } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chat_id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })

    // 估算 token 消耗
    const allMessages = [...(historyMessages || []), { content, role: 'user' }]
    const estimatedTokens = estimateTokens(allMessages)

    // 检查会员限制
    const limitCheck = await checkMembershipLimits(
      supabase,
      userData.id,
      estimatedTokens
    )

    if (!limitCheck.canSend) {
      return NextResponse.json(
        { error: limitCheck.message },
        { status: 429 }
      )
    }

    // 保存用户消息
    const { data: userMessage, error: userMsgError } = await supabase
      .from('messages')
      .insert({
        chat_id,
        content,
        role: 'user',
        model_conf: {},
      })
      .select()
      .single()

    if (userMsgError) {
      console.error('Save user message error:', userMsgError)
      return NextResponse.json(
        { error: 'Failed to save user message' },
        { status: 500 }
      )
    }

    // 准备 OpenAI 消息格式
    const openaiMessages = allMessages.map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }))

    const agent = chat.agent
    const modelConfig = (
      agent?.model_conf && typeof agent.model_conf === 'object' && !Array.isArray(agent.model_conf)
        ? agent.model_conf
        : {}
    ) as { [key: string]: Json | undefined }
    const model = typeof modelConfig.model === 'string'
      ? modelConfig.model
      : process.env.OPENAI_MODEL || 'gpt-4o-mini'
    const temperature = typeof modelConfig.temperature === 'number'
      ? modelConfig.temperature
      : parseFloat(process.env.OPENAI_TEMPERATURE || '0.7')

    if (!stream) {
      // 非流式响应
      try {
        const completion = await getOpenAIClient().chat.completions.create({
          model,
          messages: openaiMessages,
          temperature,
        })

        const aiContent = completion.choices[0].message.content || ''
        const usage = completion.usage || {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        }

        // 保存 AI 回复
        const { data: assistantMessage } = await supabase
          .from('messages')
          .insert({
            chat_id,
            content: aiContent,
            role: 'assistant',
            model_conf: modelConfig,
            token_usage: {
              prompt_tokens: usage.prompt_tokens,
              completion_tokens: usage.completion_tokens,
              total_tokens: usage.total_tokens,
            },
          })
          .select()
          .single()

        // 记录使用统计
        await recordUsage(supabase, userData.id, 1, usage.total_tokens)

        return NextResponse.json([userMessage, assistantMessage])
      } catch (error: unknown) {
        console.error('OpenAI API error:', error)

        // 即使 AI 失败，也保存错误消息
        await supabase.from('messages').insert({
          chat_id,
          content: `抱歉，AI 回复生成失败: ${error instanceof Error ? error.message : 'Unknown provider error'}`,
          role: 'assistant',
          model_conf: modelConfig,
        })

        return NextResponse.json(
          { error: 'Failed to generate AI response' },
          { status: 500 }
        )
      }
    } else {
      // 流式响应
      const encoder = new TextEncoder()

      const stream = new ReadableStream({
        async start(controller) {
          try {
            // 创建占位消息
            const { data: assistantMessage } = await supabase
              .from('messages')
              .insert({
                chat_id,
                content: '',
                role: 'assistant',
                model_conf: modelConfig,
              })
              .select()
              .single()

            const messageId = assistantMessage.id
            let accumulatedContent = ''
            let tokenUsage: TokenUsage | null = null

            const completion = await getOpenAIClient().chat.completions.create({
              model,
              messages: openaiMessages,
              temperature,
              stream: true,
            })

            for await (const chunk of completion) {
              const content = chunk.choices[0]?.delta?.content || ''
              if (content) {
                accumulatedContent += content
                controller.enqueue(encoder.encode(content))
              }

              // 收集 token 使用信息（在最后一个 chunk）
              if (chunk.choices[0]?.finish_reason === 'stop') {
                // OpenAI 流式 API 不直接返回 usage，需要估算
                tokenUsage = {
                  prompt_tokens: estimateTokens(openaiMessages),
                  completion_tokens: estimateTokens([{ content: accumulatedContent }]),
                  total_tokens: 0,
                }
                tokenUsage.total_tokens = tokenUsage.prompt_tokens + tokenUsage.completion_tokens
              }
            }

            // 更新消息内容和 token 使用
            await supabase
              .from('messages')
              .update({
                content: accumulatedContent,
                token_usage: tokenUsage,
              })
              .eq('id', messageId)

            // 记录使用统计
            await recordUsage(supabase, userData.id, 1, tokenUsage?.total_tokens || 0)

            // 发送完成标记
            if (tokenUsage) {
              controller.enqueue(
                encoder.encode(
                  `\n__TOKEN_USAGE__${tokenUsage.prompt_tokens},${tokenUsage.completion_tokens},${tokenUsage.total_tokens}__END__`
                )
              )
            }

            controller.close()
          } catch (error: unknown) {
            console.error('Stream error:', error)
            controller.enqueue(
              encoder.encode(`\n[错误: ${error instanceof Error ? error.message : 'Unknown provider error'}]`)
            )
            controller.close()
          }
        },
      })

      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    }
  } catch (error) {
    console.error('Create message error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
