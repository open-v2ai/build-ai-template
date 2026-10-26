'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { notFound } from 'next/navigation'

import ChatContentPage from '@/components/chat-content-page'
import SharedLayout from '@/components/shared-layout'

import { useGlobalDataCache } from '@/hooks/use-global-data-cache'
import { saveExistingChatState } from '@/util/chat-state'
import type { Chat } from '@/app/[locale]/types'

/**
 * 聊天页面内容组件
 */
function ChatPageContent() {
  const [currentChat, setCurrentChat] = useState<Chat | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFoundError, setNotFoundError] = useState(false)
  const [initialMessage, setInitialMessage] = useState<string>('')
  const [isNewChat, setIsNewChat] = useState(false)
  
  const router = useRouter()
  const params = useParams()
  const t = useTranslations()
  const { chats, fetchChats, getChatById } = useGlobalDataCache()
  
  
  // 从 URL 参数获取聊天 ID 和初始消息
  const chatId = params.id ? parseInt(params.id as string, 10) : null
  
  // 检查 URL 参数中的初始消息
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const messageParam = urlParams.get('initialMessage')
      if (messageParam) {
        const decodedMessage = decodeURIComponent(messageParam)
        setInitialMessage(decodedMessage)
        setIsNewChat(true)
        
        // 清除URL参数，避免刷新时重复发送
        const newUrl = window.location.pathname
        window.history.replaceState({}, '', newUrl)
      }
    }
  }, [])


  // 使用 ref 来避免依赖项问题
  const initializingRef = useRef(false)
  const lastChatIdRef = useRef<number | null>(null)

  // 初始化页面数据 - 避免无限循环
  useEffect(() => {
    // 防止重复初始化同一个聊天
    if (initializingRef.current || lastChatIdRef.current === chatId) {
      return
    }

    const initializePage = async () => {
      if (!chatId || isNaN(chatId)) {
        setNotFoundError(true)
        setIsLoading(false)
        return
      }

      initializingRef.current = true
      lastChatIdRef.current = chatId
      
      try {
        // 先检查缓存中是否已有完整的聊天数据（包含消息）
        if (chats) {
          const cachedChat = chats.find(c => c.id === chatId && c.messages && c.messages.length > 0)
          if (cachedChat) {
            setCurrentChat(cachedChat)
            saveExistingChatState(chatId)
            setIsLoading(false)
            return
          }
        }
        
        // 确保聊天列表已加载（如果没有缓存才加载）
        if (!chats) {
          await fetchChats()
        }
        
        // 然后获取特定聊天详情（使用缓存）
        const targetChat = await getChatById(chatId)
        
        if (!targetChat) {
          // 增加重试机制，可能是临时网络问题
          try {
            await fetchChats()
            const retryChat = await getChatById(chatId)
            if (retryChat) {
              setCurrentChat(retryChat)
              saveExistingChatState(chatId)
            } else {
              setNotFoundError(true)
            }
          } catch {
            setNotFoundError(true)
          }
        } else {
          setCurrentChat(targetChat)
          // 保存当前聊天状态到本地存储
          saveExistingChatState(chatId)
        }
      } catch {
        // 不要立即设置为 not found，先尝试基本的聊天信息获取
        try {
          if (chats) {
            const basicChat = chats.find(c => c.id === chatId)
            if (basicChat) {
              setCurrentChat(basicChat)
              saveExistingChatState(chatId)
            } else {
              setNotFoundError(true)
            }
          } else {
            setNotFoundError(true)
          }
        } catch {
          setNotFoundError(true)
        }
      } finally {
        setIsLoading(false)
        initializingRef.current = false
      }
    }

    initializePage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]) // 只依赖 chatId

  // 当 chatId 变化时重置状态
  useEffect(() => {
    if (lastChatIdRef.current !== chatId) {
      lastChatIdRef.current = null
      setCurrentChat(null)
      setNotFoundError(false)
      setIsLoading(true)
    }
  }, [chatId])

  // 如果聊天不存在，显示 404
  if (notFoundError) {
    notFound()
  }

  // 加载中状态
  if (isLoading) {
    return (
      <SharedLayout breadcrumbTitle={t('common.error.loading')}>
        <div className="flex flex-1 items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t('common.error.loading')}</p>
          </div>
        </div>
      </SharedLayout>
    )
  }

  return (
    <SharedLayout breadcrumbTitle={currentChat?.title}>
      {currentChat && (
        <ChatContentPage
          chat={currentChat}
          isNewChat={isNewChat}
          initialMessage={initialMessage}
          onInitialMessageSent={() => {
            setIsNewChat(false)
            setInitialMessage('')
          }}
          onStartNewChat={() => {
            router.push('/')
          }}
        />
      )}
    </SharedLayout>
  )
}

/**
 * 单个聊天对话页面
 * 
 * 功能:
 * - 显示特定 ID 的聊天对话
 * - 管理聊天消息和交互
 * - 提供侧边栏导航
 * 
 * 路由: /chat/[id]
 * 
 * 注意: Provider 已移动到 layout.tsx 中，避免页面切换时重复挂载
 */
export default function ChatPage() {
  return <ChatPageContent />
}
