'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

/**
 * 全局对话状态接口
 */
interface GlobalChatState {
  /** 当前正在进行对话的聊天 ID，null 表示没有对话在进行 */
  activeChatId: number | null
  /** 是否有对话正在进行中 */
  isChatActive: boolean
  /** 对话锁定状态 - 当为 true 时，任何聊天都无法发送新消息 */
  isGloballyLocked: boolean
  /** 当前锁定的聊天标题（用于显示提示信息） */
  lockedChatTitle: string | null
  /** 开始对话 */
  startChat: (chatId: number, chatTitle?: string) => void
  /** 结束对话 */
  endChat: () => void
  /** 检查指定聊天是否可以发送消息 */
  canSendMessage: (chatId: number) => boolean
  /** 获取锁定状态的描述信息 */
  getLockStatusMessage: () => string | null
  /** 强制重置所有对话状态 */
  forceReset: () => void
}

/**
 * 全局对话状态 Context
 */
const GlobalChatStateContext = createContext<GlobalChatState | undefined>(undefined)

/**
 * 全局对话状态 Provider 组件
 * 
 * 功能:
 * - 管理全局对话状态，确保同一时间只能有一个对话在进行
 * - 提供对话状态查询和控制方法
 * - 防止多个聊天窗口同时发送消息
 * - 实现真正的全局对话锁，即使切换页面也无法开启新对话
 * 
 * @param children - 子组件
 */
export function GlobalChatStateProvider({ children }: { children: ReactNode }) {
  // 当前活跃的聊天 ID
  const [activeChatId, setActiveChatId] = useState<number | null>(null)
  // 当前锁定的聊天标题
  const [lockedChatTitle, setLockedChatTitle] = useState<string | null>(null)
  
  // 是否有对话正在进行中
  const isChatActive = activeChatId !== null
  // 全局锁定状态 - 与 isChatActive 相同，但语义更明确
  const isGloballyLocked = isChatActive
  
  /**
   * 开始对话
   * 
   * @param chatId - 聊天 ID
   * @param chatTitle - 聊天标题（可选，用于显示锁定提示）
   */
  const startChat = (chatId: number, chatTitle?: string) => {
    setActiveChatId(chatId)
    setLockedChatTitle(chatTitle || `聊天 ${chatId}`)
  }
  
  /**
   * 结束对话
   */
  const endChat = () => {
    setActiveChatId(null)
    setLockedChatTitle(null)
  }
  
  /**
   * 强制重置所有对话状态（用于调试和紧急情况）
   */
  const forceReset = () => {
    setActiveChatId(null)
    setLockedChatTitle(null)
  }
  
  /**
   * 检查指定聊天是否可以发送消息
   * 
   * @param chatId - 聊天 ID
   * @returns 是否可以发送消息
   */
  const canSendMessage = (chatId: number): boolean => {
    // 如果没有活跃对话，或者当前聊天就是活跃对话，则可以发送
    const canSend = !isChatActive || activeChatId === chatId
    return canSend
  }
  
  /**
   * 获取锁定状态的描述信息
   * 
   * @returns 锁定状态描述，如果未锁定则返回 null
   */
  const getLockStatusMessage = (): string | null => {
    if (!isGloballyLocked) return null
    return `当前有对话正在进行中${lockedChatTitle ? ` (${lockedChatTitle})` : ''}，请等待回复完成后再开始新对话`
  }
  
  const value: GlobalChatState = {
    activeChatId,
    isChatActive,
    isGloballyLocked,
    lockedChatTitle,
    startChat,
    endChat,
    canSendMessage,
    getLockStatusMessage,
    forceReset
  }
  
  return (
    <GlobalChatStateContext.Provider value={value}>
      {children}
    </GlobalChatStateContext.Provider>
  )
}

/**
 * 使用全局对话状态的 Hook
 * 
 * @returns 全局对话状态对象
 * @throws 如果在 Provider 外部使用会抛出错误
 */
export function useGlobalChatState(): GlobalChatState {
  const context = useContext(GlobalChatStateContext)
  
  if (context === undefined) {
    throw new Error('useGlobalChatState must be used within a GlobalChatStateProvider')
  }
  
  return context
}
