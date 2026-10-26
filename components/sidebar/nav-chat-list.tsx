'use client'

import { format } from 'date-fns'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { Edit, Trash2, Loader2 } from 'lucide-react'

import { SidebarGroup, SidebarGroupContent, useSidebar } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import EditChatTitleDialog from '@/components/edit-chat-title-dialog'
import DeleteChatConfirmDialog from '@/components/delete-chat-confirm-dialog'
import { useGlobalDataCache } from '@/hooks/use-global-data-cache'
import { useMembershipStatus } from '@/hooks/use-global-user-data'
import { useScrollPreservation } from '@/hooks/use-scroll-preservation'
import { fetcher } from '@/util/fetcher'
import type { Chat } from '@/app/[locale]/types'

export function NavChatList({ chats, onSelectChat, currentChatId }: { chats: Chat[]; onSelectChat?: (chat: Chat) => void; currentChatId?: number }) {
  const { state } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations()
  const isCollapsed = state === 'collapsed'
  const { fetchChats, chatsLoading, hasMoreChats, updateChatInCache, removeChatFromCache } = useGlobalDataCache()

  // 获取会员状态以获取轮次限制
  const { membershipStatus } = useMembershipStatus()

  // 弹框状态管理
  const [editingChat, setEditingChat] = useState<Chat | null>(null)
  const [deletingChat, setDeletingChat] = useState<Chat | null>(null)

  // 滚动容器引用和状态管理
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 从路径中获取当前聊天 ID，用于高亮显示
  const getCurrentChatIdFromPath = (): number | null => {
    // 使用国际化导航后，pathname 不包含语言前缀
    // 匹配 /chat/123 格式
    const match = pathname.match(/^\/chat\/(\d+)(?:\/.*)?$/)
    return match ? parseInt(match[1], 10) : null
  }

  const activeChatId = getCurrentChatIdFromPath() || currentChatId

  // 使用滚动位置保持 Hook
  const { scrollContainerRef, scrollToSelected, createScrollHandler } = useScrollPreservation<HTMLDivElement>([chats])

  // 监听选中对话变化，智能滚动到选中的对话
  useEffect(() => {
    if (activeChatId && chats && chats.length > 0) {
      // 使用 requestAnimationFrame 确保 DOM 渲染完成，但减少延迟
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // 强制滚动到第二个位置，确保选中对话始终显示在理想位置
          scrollToSelected(`[data-chat-id="${activeChatId}"]`, true)
        })
      })
    }
  }, [activeChatId, scrollToSelected, chats])

  // 加载更多聊天记录
  const loadMoreChats = useCallback(async () => {
    if (chatsLoading || !hasMoreChats) return

    try {
      await fetchChats(true) // 传入 true 表示加载更多
    } catch (error) {
      console.error('Load more chats failed:', error)
    }
  }, [fetchChats, chatsLoading, hasMoreChats])

  // 滚动事件处理（带防抖）
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleScroll = useCallback(
    createScrollHandler(event => {
      const container = event.target as HTMLDivElement
      if (!container) return

      // 清除之前的定时器
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      // 设置新的定时器，防抖处理
      scrollTimeoutRef.current = setTimeout(() => {
        const { scrollTop, scrollHeight, clientHeight } = container
        const distanceFromBottom = scrollHeight - (scrollTop + clientHeight)

        // 当滚动到距离底部50px以内时加载更多
        if (distanceFromBottom <= 50 && hasMoreChats && !chatsLoading) {
          loadMoreChats()
        }
      }, 100) // 100ms 防抖
    }),
    [createScrollHandler, loadMoreChats, hasMoreChats, chatsLoading]
  )

  // 处理编辑聊天标题
  const handleEditTitle = async (newTitle: string) => {
    if (!editingChat) return

    try {
      await fetcher(`/chat/${editingChat.id}`, {
        method: 'PUT',
        body: JSON.stringify({ title: newTitle }),
        auth: true,
      })

      // 更新本地缓存而不是刷新整个列表
      updateChatInCache(editingChat.id, {
        title: newTitle,
        updated_at: new Date().toISOString(),
      })

      toast.success(t('chat.actions.editTitleSuccess'))
    } catch (error) {
      console.error('Edit chat title failed:', error)
      toast.error(t('chat.actions.editTitleFailed'))
      throw error
    }
  }

  // 处理删除聊天
  const handleDeleteChat = async () => {
    if (!deletingChat) return

    try {
      await fetcher(`/chat/${deletingChat.id}`, {
        method: 'DELETE',
        auth: true,
      })

      // 从本地缓存中移除而不是刷新整个列表
      removeChatFromCache(deletingChat.id)

      toast.success(t('chat.actions.deleteChatSuccess'))

      // 如果删除的是当前正在查看的聊天，跳转到首页
      const currentChatIdFromPath = getCurrentChatIdFromPath()
      if (currentChatIdFromPath === deletingChat.id) {
        router.push('/')
      }
    } catch (error) {
      console.error('Delete chat failed:', error)
      toast.error(t('chat.actions.deleteChatFailed'))
      throw error
    }
  }

  // 绑定滚动事件
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    container.addEventListener('scroll', handleScroll)

    return () => {
      container.removeEventListener('scroll', handleScroll)
      // 清理定时器
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [handleScroll, scrollContainerRef])

  // 将 useMemo 移到条件渲染之外，避免 hooks 调用顺序问题
  const chatListItems = useMemo(
    () =>
      chats.map((chat, idx) => (
        <Link
          key={chat.id}
          href={`/chat/${chat.id}`}
          className={`group relative flex flex-col items-start gap-1 whitespace-nowrap border-b text-sm leading-tight last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer ${activeChatId === chat.id ? 'bg-sidebar-accent text-sidebar-accent-foreground z-10 border-r-4 border-r-sidebar-primary' : 'border-r-0'}`}
          data-chat-id={chat.id}
          data-is-selected={activeChatId === chat.id}
          onClick={e => {
            // 检查点击是否来自菜单按钮区域
            const target = e.target as HTMLElement
            const menuButton = target.closest('[data-menu-trigger]')
            if (menuButton) {
              e.preventDefault()
              e.stopPropagation()
              return
            }
            
            // 调用选择聊天的回调函数
            onSelectChat?.(chat)
          }}
        >
          {/* 内容区域 */}
          <div className="relative w-full px-3 py-2.5">
            {/* 主要信息行：标题 + 右上角区域 */}
            <div className="flex w-full items-center gap-2 mb-1 overflow-hidden">
              <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                <span className="font-medium truncate text-sm flex-1 min-w-0">{chat.title}</span>
              </div>

              {/* 右上角：消息统计 / 操作按钮 */}
              <div className="flex items-center flex-shrink-0 min-w-0">
                {/* 默认显示：消息统计 */}
                <div className="group-hover:hidden flex items-center text-xs text-muted-foreground/60">
                  <span className={`whitespace-nowrap ${(() => {
                    // 统一按用户问题数计算轮次：直接统计用户消息数
                    const current = chat.messages?.filter(msg => msg.role === 'user').length || 0
                    const limit = membershipStatus?.conversation_turn_limit || 10
                    const remaining = Math.max(0, limit - current)
                    
                    // 如果轮次达到上限，显示红色；如果接近上限，显示黄色
                    if (remaining <= 0) {
                      return 'text-red-500 font-medium'
                    } else if (remaining <= 2) {
                      return 'text-yellow-800 dark:text-yellow-200'
                    }
                    return ''
                  })()}`}>
                    {(() => {
                      // 统一按用户问题数计算轮次：直接统计用户消息数
                      const current = chat.messages?.filter(msg => msg.role === 'user').length || 0
                      const limit = membershipStatus?.conversation_turn_limit || 10
                      return `${current}/${limit} ${t('chat.rounds')}`
                    })()}
                  </span>
                </div>

                {/* 悬停显示：操作按钮 */}
                <div className="hidden group-hover:flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 text-muted-foreground hover:text-purple-600 hover:bg-transparent opacity-70 hover:opacity-100"
                    title={t('chat.actions.edit')}
                    onClick={e => {
                      e.preventDefault()
                      e.stopPropagation()
                      setEditingChat(chat)
                    }}
                  >
                    <Edit className="h-2.5 w-2.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive hover:bg-transparent opacity-70 hover:opacity-100"
                    title={t('chat.actions.delete')}
                    onClick={e => {
                      e.preventDefault()
                      e.stopPropagation()
                      setDeletingChat(chat)
                    }}
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* 消息内容 */}
            <div className="mb-1.5 pr-1 overflow-hidden">
              <span className="line-clamp-2 whitespace-break-spaces text-xs text-muted-foreground/80 break-words">{chat.content}</span>
            </div>

            {/* 底部信息行：智能体 + 时间 */}
            <div className="flex items-center justify-between gap-1 pr-1 overflow-hidden">
              <div className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
                {/* 默认显示：智能体名称 */}
                {chat.agent && <span className="group-hover:hidden text-xs text-muted-foreground/60 truncate max-w-[80px] flex-shrink-0">{chat.agent.name}</span>}

                {/* 悬停显示：序号 */}
                <span className="hidden group-hover:inline-block text-xs text-muted-foreground/60 flex-shrink-0 font-mono">#{idx + 1}</span>
              </div>

              <div className="text-xs text-muted-foreground/50 flex-shrink-0">
                <span className="whitespace-nowrap">
                  {(() => {
                    const date = new Date(chat.updated_at)
                    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
                    const now = new Date()
                    const isToday = localDate.getFullYear() === now.getFullYear() && localDate.getMonth() === now.getMonth() && localDate.getDate() === now.getDate()
                    return isToday ? format(localDate, 'HH:mm:ss') : format(localDate, 'yyyy/MM/dd')
                  })()}
                </span>
              </div>
            </div>
          </div>
        </Link>
      )),
    [chats, activeChatId, membershipStatus, t, onSelectChat]
  )

  return (
    <SidebarGroup className="p-0 flex-1 overflow-hidden">
      <SidebarGroupContent
        ref={scrollContainerRef}
        className="h-full overflow-y-auto overscroll-contain scrollbar-hide"
        style={{ scrollBehavior: 'auto' }} // 禁用平滑滚动，防止自动滚动
      >
        {isCollapsed ? (
          <div className="flex items-center justify-center p-4">
            <div className="w-4 h-4 text-muted-foreground">...</div>
          </div>
        ) : (
          <>
            {chatListItems}

            {/* 加载更多指示器 */}
            {chatsLoading && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="ml-2 text-xs text-muted-foreground">{t('common.actions.loading')}</span>
              </div>
            )}

            {/* 手动加载更多按钮（用于测试） */}
            {!chatsLoading && hasMoreChats && (
              <div className="flex items-center justify-center p-4">
                <button onClick={loadMoreChats} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {t('common.actions.loadMore')} ({chats.length})
                </button>
              </div>
            )}

            {/* 没有更多数据提示 */}
            {!hasMoreChats && chats.length > 0 && (
              <div className="flex items-center justify-center p-4">
                <span className="text-xs text-muted-foreground">{t('chat.allChatsLoaded')}</span>
              </div>
            )}
          </>
        )}
      </SidebarGroupContent>

      {/* 编辑标题弹框 */}
      {editingChat && <EditChatTitleDialog open={!!editingChat} onOpenChange={open => !open && setEditingChat(null)} currentTitle={editingChat.title} onSave={handleEditTitle} />}

      {/* 删除确认弹框 */}
      {deletingChat && <DeleteChatConfirmDialog open={!!deletingChat} onOpenChange={open => !open && setDeletingChat(null)} chat={deletingChat} onConfirm={handleDeleteChat} />}
    </SidebarGroup>
  )
}
