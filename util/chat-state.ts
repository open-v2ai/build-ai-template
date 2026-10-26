/**
 * 聊天状态持久化工具
 * 
 * 功能:
 * - 保存和恢复当前选中的聊天状态
 * - 支持新对话和已有对话的状态记忆
 * - 处理页面刷新后的状态恢复
 */

// 本地存储键名
const CHAT_STATE_KEY = 'chat_current_state'

/**
 * 聊天状态类型
 */
export interface ChatState {
  /** 当前页面类型：'new' 表示新对话，'chat' 表示已有对话 */
  currentPage: 'new' | 'chat'
  /** 当前选中的聊天 ID，null 表示新对话 */
  currentChatId: number | null
  /** 状态保存时间戳，用于判断状态是否过期 */
  timestamp: number
}

/**
 * 默认聊天状态
 */
const DEFAULT_CHAT_STATE: ChatState = {
  currentPage: 'new',
  currentChatId: null,
  timestamp: Date.now()
}

/**
 * 保存聊天状态到本地存储
 * 
 * @param state - 要保存的聊天状态
 */
export function saveChatState(state: ChatState): void {
  try {
    const stateWithTimestamp = {
      ...state,
      timestamp: Date.now()
    }
    localStorage.setItem(CHAT_STATE_KEY, JSON.stringify(stateWithTimestamp))
  } catch (error) {
    console.warn('保存聊天状态失败:', error)
  }
}

/**
 * 从本地存储加载聊天状态
 * 
 * @param maxAge - 状态最大有效期（毫秒），默认24小时
 * @returns 聊天状态，如果不存在或过期则返回默认状态
 */
export function loadChatState(maxAge: number = 24 * 60 * 60 * 1000): ChatState {
  try {
    const stored = localStorage.getItem(CHAT_STATE_KEY)
    if (!stored) {
      return DEFAULT_CHAT_STATE
    }

    const state = JSON.parse(stored) as ChatState
    
    // 检查状态是否过期
    if (Date.now() - state.timestamp > maxAge) {
      clearChatState()
      return DEFAULT_CHAT_STATE
    }

    return state
  } catch (error) {
    console.warn('加载聊天状态失败:', error)
    return DEFAULT_CHAT_STATE
  }
}

/**
 * 清除保存的聊天状态
 */
export function clearChatState(): void {
  try {
    localStorage.removeItem(CHAT_STATE_KEY)
  } catch (error) {
    console.warn('清除聊天状态失败:', error)
  }
}

/**
 * 保存新对话状态
 */
export function saveNewChatState(): void {
  saveChatState({
    currentPage: 'new',
    currentChatId: null,
    timestamp: Date.now()
  })
}

/**
 * 保存已有对话状态
 * 
 * @param chatId - 聊天 ID
 */
export function saveExistingChatState(chatId: number): void {
  saveChatState({
    currentPage: 'chat',
    currentChatId: chatId,
    timestamp: Date.now()
  })
}

/**
 * 检查是否应该恢复到新对话状态
 * 
 * @param state - 聊天状态
 * @returns 是否应该显示新对话页面
 */
export function shouldShowNewChat(state: ChatState): boolean {
  return state.currentPage === 'new' || state.currentChatId === null
}

/**
 * 检查是否应该恢复到指定聊天
 * 
 * @param state - 聊天状态
 * @param availableChatIds - 可用的聊天 ID 列表
 * @returns 要恢复的聊天 ID，如果不应该恢复则返回 null
 */
export function getChatIdToRestore(state: ChatState, availableChatIds: number[]): number | null {
  if (state.currentPage !== 'chat' || !state.currentChatId) {
    return null
  }

  // 检查要恢复的聊天是否仍然存在
  if (availableChatIds.includes(state.currentChatId)) {
    return state.currentChatId
  }

  return null
}
