'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import NewChatPage from '@/components/new-chat-page'
import SharedLayout from '@/components/shared-layout'

import { useGlobalDataCache } from '@/hooks/use-global-data-cache'
import { saveNewChatState } from '@/util/chat-state'

/**
 * 主页面内容组件
 */
function HomePageContent() {
  const router = useRouter()
  const { addChatToCache } = useGlobalDataCache()

  // 保存新对话状态
  useEffect(() => {
    saveNewChatState()
  }, [])

  return (
    <SharedLayout>
      <NewChatPage
        onChatCreated={async (chat, initialMessage) => {
          // 添加到缓存而不是重新获取整个列表
          addChatToCache(chat)
          
          // 导航到新创建的聊天页面，通过 URL 参数传递初始消息
          const encodedMessage = encodeURIComponent(initialMessage)
          router.push(`/chat/${chat.id}?initialMessage=${encodedMessage}`)
        }}
      />
    </SharedLayout>
  )
}

/**
 * 主页面 - 新对话页面
 * 
 * 功能:
 * - 显示新对话创建界面
 * - 提供侧边栏聊天列表导航
 * - 创建新对话后自动跳转到对应的聊天路由
 * 
 * 路由: /
 * 
 * 注意: Provider 已移动到 layout.tsx 中，避免页面切换时重复挂载
 */
export default function HomePage() {
  return <HomePageContent />
}