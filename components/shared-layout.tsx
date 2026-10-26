'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import LanguageSwitchButton from "@/components/language-switch-button"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import ThemeToggleButton from "@/components/theme-toggle-button"
import UpgradePlanDialog from "@/components/upgrade-plan-dialog"

import { getValidAccessToken } from '@/util/token'
import { useGlobalDataCache } from '@/hooks/use-global-data-cache'
import type { Chat } from '@/app/[locale]/types'

interface SharedLayoutProps {
  children: React.ReactNode
  breadcrumbTitle?: string
}

/**
 * 共享布局组件
 * 
 * 功能:
 * - 提供统一的侧边栏和头部布局
 * - 在路由变化时保持侧边栏状态不变
 * - 避免侧边栏重新挂载导致的滚动位置丢失
 * 
 * @param children - 页面内容
 * @param breadcrumbTitle - 面包屑标题
 */
export default function SharedLayout({ children, breadcrumbTitle }: SharedLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations()
  const { chats, fetchChats } = useGlobalDataCache()
  
  // 从路径中获取当前聊天 ID
  const getCurrentChatId = (): number | null => {
    const match = pathname.match(/^\/chat\/(\d+)(?:\/.*)?$/)
    return match ? parseInt(match[1], 10) : null
  }
  
  const currentChatId = getCurrentChatId()
  
  // 获取当前聊天信息用于面包屑
  const currentChat = chats?.find(chat => chat.id === currentChatId)
  
  // 确定面包屑标题
  const getBreadcrumbTitle = () => {
    if (breadcrumbTitle) return breadcrumbTitle
    if (currentChat) return currentChat.title
    return t('app.slogan')
  }

  // 检查用户认证
  useEffect(() => {
    const checkToken = async () => {
      const accessToken = await getValidAccessToken()
      if (!accessToken) {
        router.push('/login')
        return
      }
    }
    checkToken()
  }, [router])

  // 初始化时获取聊天列表
  useEffect(() => {
    const initializeData = async () => {
      if (!chats) {
        try {
          await fetchChats()
        } catch (error) {
          console.error('Fetch chat list failed:', error)
        }
      }
    }
    
    initializeData()
  }, [chats, fetchChats])

  return (
    <SidebarProvider>
      <AppSidebar
        chats={chats || []}
        onSelectChat={(chat: Chat) => {
          router.push(`/chat/${chat.id}`)
        }}
        onNewChat={() => {
          router.push('/')
        }}
        currentChatId={currentChatId || undefined}
      />
      <SidebarInset>
        <header className="sticky top-0 z-20 bg-background border-b flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block text-lg">
                  <BreadcrumbLink href="#">
                    {getBreadcrumbTitle()}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto justify-end pr-4 flex items-center gap-2">
            <UpgradePlanDialog />
            <ThemeToggleButton />
            <LanguageSwitchButton />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 pt-0">
          <div className="bg-muted/50 min-h-[100vh] flex flex-1 md:min-h-min items-center justify-center">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
