'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Send, Bot, User, Copy, RefreshCw, Loader2, FileText, Square } from 'lucide-react'

import { Button } from '@/components/ui/button'
import AIStreamText from '@/components/ai-stream-text'
import { fetcher } from '@/util/fetcher'
import { useMembershipStatus, refreshMembershipStatusGlobally } from '@/hooks/use-global-user-data'
import { useGlobalChatState } from '@/hooks/use-global-chat-state'
import { useGlobalDataCache } from '@/hooks/use-global-data-cache'
import type { Chat, Message, Agent } from '@/app/[locale]/types'

/**
 * Token 使用统计
 */
interface TokenUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

/**
 * 格式化时间显示
 */
function formatTime(ts: string) {
  const date = new Date(ts)
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toLocaleDateString() + ' ' + localDate.toLocaleTimeString([])
}

interface ChatContentPageProps {
  chat: Chat
  isNewChat?: boolean
  onStartNewChat?: () => void
  initialMessage?: string
  onInitialMessageSent?: () => void
}

/**
 * 简化重构后的聊天内容页面组件
 * 
 * 功能:
 * - 简化状态管理逻辑
 * - 保持原有的 UI 交互体验
 * - 集成全局对话锁和会员限制
 * - 移除复杂的本地存储逻辑
 */
export default function ChatContentPage({ 
  chat, 
  isNewChat,
  onStartNewChat,
  initialMessage,
  onInitialMessageSent
}: ChatContentPageProps) {
  const t = useTranslations()
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const abortController = useRef<AbortController | null>(null)
  const hasSent = useRef(false)
  const isSending = useRef(false)
  
  // 状态管理 - 简化版本
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentStreamingIndex, setCurrentStreamingIndex] = useState(-1)
  const [showRawText, setShowRawText] = useState<{[key: number]: boolean}>({})
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const [hasPageChanged, setHasPageChanged] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取会员状态
  const { membershipStatus } = useMembershipStatus()
  
  // 获取全局对话状态
  const { 
    canSendMessage, 
    startChat, 
    endChat, 
    getLockStatusMessage,
    forceReset,
    activeChatId,
    isGloballyLocked
  } = useGlobalChatState()

  // 获取全局数据缓存
  const { 
    addMessageToChat, 
    updateChatInCache 
  } = useGlobalDataCache()

  // 对话轮次限制相关 - 统一按用户问题数计算
  const MAX_CHAT_ROUNDS = membershipStatus?.conversation_turn_limit || 10
  const getCurrentRounds = () => {
    // 统一按用户问题数计算轮次：只计算用户消息数量
    return messages.filter(msg => msg.role === 'user').length
  }
  const currentRounds = getCurrentRounds()
  const isMaxRoundsReached = currentRounds >= MAX_CHAT_ROUNDS
  
  // 检查当前聊天是否被全局对话锁阻塞
  const isBlockedByGlobalLock = !canSendMessage(chat.id)
  const lockStatusMessage = getLockStatusMessage()
  
  // 绕过逻辑已经在 canSendMessage 中处理，这里不需要额外的绕过逻辑
  const shouldBypassLock = false

  // 检查输入框是否应该被禁用（只在真正需要禁用时禁用）
  const isInputDisabled = isMaxRoundsReached || 
                          (isBlockedByGlobalLock && !shouldBypassLock)
  
  // 检查是否可以发送消息 - 考虑绕过逻辑
  const canSend = !isLoading && 
                  !isSending.current &&
                  !isMaxRoundsReached && 
                  (!isBlockedByGlobalLock || shouldBypassLock) &&
                  input.trim().length > 2


  // 移除重复的全局锁定状态清理逻辑，已合并到下面的 useEffect 中

  // 自动调整文本框高度
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 144) + 'px'
    }
  }, [input])

  // 页面初始化和切换处理 - 只在聊天ID变化时执行
  useEffect(() => {
    setShouldAutoScroll(true)
    setHasPageChanged(true)
    hasSent.current = false
    isSending.current = false
    setError(null)
    setIsLoading(false)
    setCurrentStreamingIndex(-1)
    
    // 只在聊天ID变化时初始化消息，避免覆盖用户正在发送的消息
    if (chat.messages && chat.messages.length > 0) {
      setMessages(chat.messages)
    } else {
      setMessages([])
    }
    
    if (chat.agent) {
      setCurrentAgent(chat.agent)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.id])  // 只依赖 chat.id，避免频繁重置消息

  // 单独处理全局锁定状态清理，避免影响消息显示
  useEffect(() => {
    if (isGloballyLocked && activeChatId !== null && activeChatId !== chat.id) {
      forceReset()
      isSending.current = false
      setIsLoading(false)
      setCurrentStreamingIndex(-1)
    }
  }, [isGloballyLocked, activeChatId, chat.id, forceReset])

  // 流式文本更新
  const displayStreamingText = useCallback((targetText: string, messageIndex: number) => {
    setCurrentStreamingIndex(messageIndex)
    
    requestAnimationFrame(() => {
      setMessages(prev => {
        const newMsgs = [...prev]
        if (newMsgs[messageIndex]) {
          newMsgs[messageIndex] = { ...newMsgs[messageIndex], content: targetText }
        }
        return newMsgs
      })
    })
  }, [])

  // 独立的发送消息函数，避免循环依赖
  const sendMessage = useCallback(async (content: string) => {
    const messageContent = content.trim()
    
    // 检查发送条件（不依赖input状态，直接检查传入的content）
    const canSendNow = !isLoading && 
                       !isSending.current &&
                       !isMaxRoundsReached && 
                       !isBlockedByGlobalLock &&
                       messageContent.length > 2
    
    if (!messageContent || !canSendNow) {
      return
    }

    // 防止重复发送
    if (isSending.current) {
      return
    }
    isSending.current = true

    // 开始对话状态
    startChat(chat.id, chat.title)
    
    setIsLoading(true)
    setInput('')
    setError(null)
    
    const now = new Date().toISOString()
    const userMsg: Message = { 
      id: 0, 
      content: messageContent, 
      role: 'user', 
      created_at: now, 
      updated_at: now 
    }
    
    // 添加 AI 回复占位符
    const assistantMsg: Message = { 
      id: 0, 
      content: '', 
      role: 'assistant', 
      created_at: now, 
      updated_at: now 
    }
    
    // 计算AI消息的索引（在当前消息数组基础上+1，因为会添加用户消息和AI消息）
    const assistantMsgIndex = messages.length + 1
    
    // 立即添加用户消息和AI回复占位符，并强制重新渲染
    setMessages(prev => [...prev, userMsg, assistantMsg])
    
    // 强制滚动到底部
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)

    // 准备请求体
    const requestBody = {
      content: messageContent,
      chat_id: chat.id,
      role: 'user'
    }

    try {
      // 创建新的 AbortController
      abortController.current = new AbortController()
      
      let assistantContent = ''
      let tokenUsage: TokenUsage | null = null
      
      await fetcher('/chat/message?stream=true',
        {
          method: 'POST',
          auth: true,
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
          stream: true,
          signal: abortController.current.signal,
        },
        (chunk: string) => {
          // 检查是否是 token 统计信息
          if (chunk.includes('__TOKEN_USAGE__') && chunk.includes('__END__')) {
            const tokenMatch = chunk.match(/__TOKEN_USAGE__(\d+),(\d+),(\d+)__END__/)
            if (tokenMatch) {
              tokenUsage = {
                prompt_tokens: parseInt(tokenMatch[1]),
                completion_tokens: parseInt(tokenMatch[2]),
                total_tokens: parseInt(tokenMatch[3])
              }
              // 不将 token 统计信息添加到内容中
              return
            }
          }
          
          assistantContent += chunk
          displayStreamingText(assistantContent, assistantMsgIndex)
        }
      )
      
      // 流式响应完成
      setCurrentStreamingIndex(-1)
      refreshMembershipStatusGlobally()
      
      // 如果获取到了 token 统计信息，立即更新消息显示
      if (tokenUsage) {
        setMessages(prev => {
          const newMsgs = [...prev]
          if (newMsgs[assistantMsgIndex]) {
            newMsgs[assistantMsgIndex] = { 
              ...newMsgs[assistantMsgIndex], 
              content: assistantContent,
              token_usage: tokenUsage || undefined
            }
          }
          return newMsgs
        })
      }
      
      // 更新全局缓存 - 添加用户消息和AI回复
      const finalUserMsg = { ...userMsg, id: Date.now() } // 临时ID
      const finalAssistantMsg = { 
        ...assistantMsg, 
        id: Date.now() + 1, 
        content: assistantContent,
        token_usage: tokenUsage || undefined // 包含 token 统计信息
      }
      
      addMessageToChat(chat.id, finalUserMsg)
      addMessageToChat(chat.id, finalAssistantMsg)
      
      // 更新聊天的最后更新时间
      updateChatInCache(chat.id, { 
        updated_at: new Date().toISOString(),
        content: messageContent // 更新聊天的最后消息内容
      })
      
    } catch (error: unknown) {
      // 错误处理
      if (error instanceof Error && error.name === 'AbortError') {
        // 用户终止了对话生成
      } else {
        console.error('Send message failed:', error)
        
        // 获取具体的错误信息
        let errorMessage = t('chat.messages.errorOccurred') // 默认错误信息
        
        if (error instanceof Error) {
          // 优先使用后端返回的具体错误信息
          errorMessage = error.message || t('chat.messages.errorOccurred')
        }
        
        setError(errorMessage)
        setMessages(prev => {
          const newMsgs = [...prev]
          newMsgs[assistantMsgIndex] = { 
            ...assistantMsg, 
            content: errorMessage
          }
          return newMsgs
        })
      }
    } finally {
      setIsLoading(false)
      setCurrentStreamingIndex(-1)
      endChat()
      isSending.current = false
    }
  }, [isLoading, isMaxRoundsReached, isBlockedByGlobalLock, chat.id, chat.title, messages.length, startChat, endChat, displayStreamingText, t, addMessageToChat, updateChatInCache])

  // 处理初始消息自动发送
  useEffect(() => {
    if (initialMessage && isNewChat && !hasSent.current && canSendMessage(chat.id)) {
      setInput(initialMessage)
      const timeoutId = setTimeout(async () => {
        if (!hasSent.current && canSendMessage(chat.id)) {
          hasSent.current = true
          // 直接调用发送逻辑
          const messageContent = initialMessage.trim()
          if (messageContent) {
            // 直接调用内联的发送逻辑，避免循环依赖
            await sendMessage(messageContent)
          }
          if (onInitialMessageSent) {
            onInitialMessageSent()
          }
        }
      }, 100)
      
      return () => clearTimeout(timeoutId)
    }
  }, [initialMessage, isNewChat, onInitialMessageSent, canSendMessage, chat.id, sendMessage])

  // 滚动处理
  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current && hasPageChanged) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
      
      if (!isAtBottom) {
        setShouldAutoScroll(false)
      }
      
      setHasPageChanged(false)
    }
  }, [hasPageChanged])

  // 自动滚动效果
  useEffect(() => {
    if (hasPageChanged && messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [messages, hasPageChanged])

  useEffect(() => {
    if (shouldAutoScroll && !hasPageChanged) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length, shouldAutoScroll, hasPageChanged])

  // 流式响应完成处理
  const handleStreamComplete = useCallback((messageIndex: number) => {
    if (messageIndex === currentStreamingIndex) {
      setCurrentStreamingIndex(-1)
    }
  }, [currentStreamingIndex])

  // 发送消息处理 - 简化版本
  const handleSend = useCallback(async (content?: string) => {
    const messageContent = content || input.trim()
    await sendMessage(messageContent)
  }, [input, sendMessage])

  // 停止生成
  const handleStopGeneration = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort()
      abortController.current = null
    }
    
    setIsLoading(false)
    setCurrentStreamingIndex(-1)
    endChat()
    isSending.current = false
    
    refreshMembershipStatusGlobally()
  }, [endChat])

  // 复制消息内容
  const handleCopy = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
    } catch {
      // 复制失败，静默处理
    }
  }, [])

  // 切换原始文本显示
  const handleToggleRawText = useCallback((messageIndex: number) => {
    setShowRawText(prev => ({ ...prev, [messageIndex]: !prev[messageIndex] }))
  }, [])

  // 重新生成消息
  const handleRefresh = useCallback(async (messageIndex: number) => {
    const userMessage = messages[messageIndex]
    if (userMessage && userMessage.role === 'user' && !isLoading && !isSending.current && canSendMessage(chat.id)) {
      await handleSend(userMessage.content)
    }
  }, [messages, isLoading, canSendMessage, chat.id, handleSend])

  // 重试最后一条消息
  const handleRetry = useCallback(() => {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()
    if (lastUserMessage) {
      handleSend(lastUserMessage.content)
    }
  }, [messages, handleSend])

  return (
    <div className="flex flex-row w-full h-full min-h-0">
      {/* 聊天区域 */}
      <div className="flex flex-col flex-1 h-full min-h-0 bg-background rounded p-0">
        {/* 可滚动的消息历史 */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-y-auto px-4 py-2"
          onScroll={handleScroll}
        >
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {t('chat.noMessages')}
            </div>
          ) : null}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`group flex mb-2 items-start ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-10 h-10 rounded-full mr-2 mt-1 flex items-center justify-center">
                  <Bot className="w-7 h-7 text-foreground" />
                </div>
              )}
              <div className="flex flex-col items-end max-w-[80%]">
                <div className={`flex items-center gap-1 mb-1 ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(msg.created_at!)}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopy(msg.content)}
                      className="p-1 hover:bg-muted rounded"
                      title={t('chat.actions.copy')}
                    >
                      <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                    </button>
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => handleToggleRawText(idx)}
                        className="p-1 hover:bg-muted rounded"
                        title={t('chat.ai.showRawText')}
                      >
                        <FileText className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    )}
                    {msg.role === 'user' && (
                      <button
                        onClick={() => handleRefresh(idx)}
                        className="p-1 hover:bg-muted rounded"
                        title={t('chat.actions.regenerate')}
                        disabled={isLoading}
                      >
                        <RefreshCw className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    )}
                  </div>
                </div>
                <div
                  className={`px-3 py-2 rounded-lg break-words shadow ${
                    msg.role === 'user'
                      ? 'bg-purple-100 dark:bg-purple-800 text-black dark:text-white self-end'
                      : 'bg-muted text-foreground self-start'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="relative">
                      {msg.content === '' && isLoading ? (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span className="text-sm">{t('chat.ai.thinking')}</span>
                        </div>
                      ) : (
                        <AIStreamText
                          text={msg.content}
                          speed={10}
                          enableTypewriter={true}
                          isLoading={currentStreamingIndex === idx}
                          onComplete={() => handleStreamComplete(idx)}
                          showRaw={showRawText[idx] || false}
                          isHistoryMessage={currentStreamingIndex !== idx}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  )}
                </div>
                
                {/* Token 使用统计显示 - 仅对 assistant 消息显示，悬浮时才显示 */}
                {msg.role === 'assistant' && msg.token_usage && (
                  <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-90 transition-opacity self-start pt-1">
                    <span>{msg.token_usage.prompt_tokens} / {msg.token_usage.completion_tokens} / {msg.token_usage.total_tokens} {t('chat.tokens.tokens')}</span>
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-10 h-10 rounded-full ml-2 mt-1 flex items-center justify-center">
                  <User className="w-7 h-7 text-foreground" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 固定底部输入区域 */}
        <div className="p-4 border-t bg-background sticky bottom-0 z-10">
          {/* 轮次限制提示 */}
          {isMaxRoundsReached && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    {t('chat.limits.maxRoundsWarning', { current: currentRounds, max: MAX_CHAT_ROUNDS })}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-800/30"
                  onClick={() => {
                    if (onStartNewChat) {
                      onStartNewChat()
                    } else {
                      window.location.href = '/'
                    }
                  }}
                >
                  {t('chat.limits.startNewChat')}
                </Button>
              </div>
            </div>
          )}
          
          {/* 全局对话锁定提示 - 只在真正被锁定时显示 */}
          {isBlockedByGlobalLock && !shouldBypassLock && lockStatusMessage && (
            <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-red-700 dark:text-red-300 font-medium">
                    {lockStatusMessage}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    forceReset()
                    isSending.current = false
                    setIsLoading(false)
                    setCurrentStreamingIndex(-1)
                  }}
                  className="text-red-700 dark:text-red-300 border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-800/30"
                >
                  {t('common.actions.reset')}
                </Button>
              </div>
            </div>
          )}
          
          {/* 轮次提示 */}
          {!isMaxRoundsReached && currentRounds >= MAX_CHAT_ROUNDS - 2 && currentRounds > 0 && (
            <div className="mb-3 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                <span className="text-xs text-orange-700 dark:text-orange-300">
                  {t('chat.limits.roundsRemaining', { remaining: MAX_CHAT_ROUNDS - currentRounds })}
                </span>
              </div>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRetry}
                  className="text-red-700 dark:text-red-300"
                >
                  {t('common.actions.retry')}
                </Button>
              </div>
            </div>
          )}

          <textarea
            ref={textareaRef}
            className={`w-full text-lg rounded-md bg-background outline-none resize-none focus:ring-0 transition-opacity overflow-hidden ${
              isInputDisabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            style={{
              height: 'auto',
              maxHeight: '15rem',
            }}
            placeholder={
              isBlockedByGlobalLock && !shouldBypassLock
                ? lockStatusMessage || t('chat.limits.globalLockActive')
                : isMaxRoundsReached 
                ? t('chat.limits.maxRoundsReached')
                : isLoading 
                ? t('chat.ai.replying') 
                : t('common.placeholders.enterQuestion')
            }
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isInputDisabled}
            rows={2}
            onKeyDown={async (e) => {
              if (e.key === 'Enter' && !e.shiftKey && canSend) {
                e.preventDefault()
                await handleSend()
              }
            }}
          />
          
          <div className="flex items-center justify-between mt-2">
            {/* 显示当前 agent 信息 */}
            {currentAgent && (
              <div className="flex items-center text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                <Bot className="w-4 h-4 mr-2" />
                <span>{t('chat.currentAgent')}: {currentAgent.name}</span>
              </div>
            )}
            
            {!currentAgent && <div></div>}
            
            <div className="flex items-center gap-2">
              {/* 紧急重置按钮 - 只在真正被锁定时显示 */}
              {isBlockedByGlobalLock && !shouldBypassLock && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    forceReset()
                    isSending.current = false
                    setIsLoading(false)
                    setCurrentStreamingIndex(-1)
                  }}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                  title={t('common.actions.resetChatStatus')}
                >
                  {t('common.actions.reset')}
                </Button>
              )}
              
              <Button
                className={`w-10 h-10 rounded-full flex items-center justify-center p-0 border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 ${
                  isLoading
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
                title={isLoading ? t('chat.actions.stopGeneration') : t('common.actions.send')}
                onClick={async () => {
                  if (isLoading) {
                    handleStopGeneration()
                  } else if (canSend) {
                    await handleSend()
                  }
                }}
                disabled={isLoading ? false : !canSend}
              >
                {isLoading ? (
                  <Square className="w-4 h-4" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
