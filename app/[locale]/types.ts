import { UIMessage } from 'ai'

export interface Message {
  id: number;
  role: string;
  content: string;
  created_at: string;
  updated_at: string;
  // Token 使用统计信息（仅对 assistant 消息有效）
  token_usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * 扩展的 AI SDK 消息类型
 * 兼容现有的 Message 接口和 AI SDK 的 UIMessage
 */
export interface ExtendedUIMessage extends UIMessage {
  /** 数据库消息 ID */
  dbId?: number
  /** 创建时间 */
  created_at?: string
  /** 更新时间 */
  updated_at?: string
}

/**
 * 消息转换工具函数
 */
export class MessageConverter {
  /**
   * 将数据库消息转换为 AI SDK 消息格式
   */
  static toUIMessage(dbMessage: Message): ExtendedUIMessage {
    return {
      id: `msg_${dbMessage.id}`,
      role: dbMessage.role as 'user' | 'assistant',
      parts: [
        {
          type: 'text',
          text: dbMessage.content
        }
      ],
      dbId: dbMessage.id,
      created_at: dbMessage.created_at,
      updated_at: dbMessage.updated_at
    }
  }

  /**
   * 将 AI SDK 消息转换为数据库消息格式
   */
  static toDbMessage(uiMessage: ExtendedUIMessage): Partial<Message> {
    const textContent = uiMessage.parts
      .filter(part => part.type === 'text')
      .map(part => part.text)
      .join('')

    return {
      id: uiMessage.dbId || 0,
      role: uiMessage.role,
      content: textContent,
      created_at: uiMessage.created_at || new Date().toISOString(),
      updated_at: uiMessage.updated_at || new Date().toISOString()
    }
  }

  /**
   * 批量转换数据库消息为 AI SDK 消息
   */
  static toUIMessages(dbMessages: Message[]): ExtendedUIMessage[] {
    return dbMessages.map(msg => this.toUIMessage(msg))
  }
}

export interface Chat {
  id: number;
  title: string;
  content: string;
  agent_id?: number;
  agent?: Agent;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

export interface Agent {
  id: number;
  name: string;
  source: 'llm' | 'dify' | 'fastgpt' | 'coze' | 'custom';
  api_url: string;
  api_key: string;
  model_conf?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
  };
  is_think: boolean;
  is_stream: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}