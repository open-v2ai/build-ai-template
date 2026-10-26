"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

import {
  ChevronsUpDown,
  LogOut,
  User,
  UserPen,
  Shield,
  Github,
  Crown,
  MessageCircle,
  Zap,
  Package
} from "lucide-react"
import { toast } from 'sonner'

import {
  Avatar
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import ProfileDialog from '@/components/profile-dialog'
import UpgradePlanDialog from '@/components/upgrade-plan-dialog'
import OrdersDialog from '@/components/orders-dialog'
import { useMembershipStatus } from '@/hooks/use-global-user-data'
import { 
  getUserTypeText, 
  useUserStatus,
  handleLogout,
  formatTokenCount
} from '@/util/user-utils'

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
  }
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const t = useTranslations()
  const { userType, isAdmin } = useUserStatus(user.email)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)
  const [ordersDialogOpen, setOrdersDialogOpen] = useState(false)
  const { membershipStatus } = useMembershipStatus()

  // 监听打开订单弹框的事件
  useEffect(() => {
    const handleOpenOrdersDialog = () => {
      setOrdersDialogOpen(true)
    }

    window.addEventListener('open-orders-dialog', handleOpenOrdersDialog)
    return () => {
      window.removeEventListener('open-orders-dialog', handleOpenOrdersDialog)
    }
  }, [])

  return (
    <SidebarMenu>
      <SidebarMenuItem className="relative">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground w-full"
            >
              <Avatar className="h-8 w-8 rounded-lg justify-center items-center">
                <User className="h-5 w-5 text-foreground" />
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <span className="truncate font-medium flex-1 min-w-0">{user.name}</span>
                    {membershipStatus && membershipStatus.membership_type !== 'free' && (
                      <Crown className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
                    )}
                  </div>
                  {userType === 'admin' && (
                    <div title={getUserTypeText(userType, t)}>
                      <Shield className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
                    </div>
                  )}
                </div>
                {/* 使用情况显示 */}
                {membershipStatus && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MessageCircle className={`h-3 w-3 ${
                        membershipStatus.daily_message_remaining <= 0 ? 'text-red-500' : ''
                      }`} />
                      <span className={
                        membershipStatus.daily_message_remaining <= 0 
                          ? 'text-red-500 font-medium' 
                          : ''
                      }>
                        {membershipStatus.daily_message_count}/{membershipStatus.daily_message_limit}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className={`h-3 w-3 ${
                        membershipStatus.daily_token_remaining <= 0 ? 'text-red-500' : ''
                      }`} />
                      <span className={
                        membershipStatus.daily_token_remaining <= 0 
                          ? 'text-red-500 font-medium' 
                          : ''
                      }>
                        {formatTokenCount(membershipStatus.daily_token_count)}/{formatTokenCount(membershipStatus.daily_token_limit)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg justify-center items-center">
                  <User className="h-5 w-5 text-foreground" />
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      <span className="truncate font-medium flex-1 min-w-0">{user.name}</span>
                    </div>
                  </div>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {/* 个人中心按钮 */}
              <DropdownMenuItem onClick={() => setProfileDialogOpen(true)}>
                <UserPen />
                {t('profile.title')}
              </DropdownMenuItem>
              
              {/* 我的订单按钮 */}
              <DropdownMenuItem onClick={() => setOrdersDialogOpen(true)}>
                <Package />
                {t('order.title')}
              </DropdownMenuItem>

              {/* 升级会员按钮 - 所有用户都可以看到 */}
              <DropdownMenuItem 
                onClick={() => setUpgradeDialogOpen(true)}
                className="bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-800 focus:bg-purple-100 focus:text-purple-800 dark:bg-purple-950 dark:hover:bg-purple-900 dark:text-purple-300 dark:hover:text-purple-200 dark:focus:bg-purple-900 dark:focus:text-purple-200"
              >
                <Crown className="text-purple-600 dark:text-purple-400" />
                {t('upgrade.buttonText')}
              </DropdownMenuItem>
              {/* 只有管理员才显示管理后台按钮 */}
              {isAdmin && (
                <DropdownMenuItem
                  onClick={() => {
                    router.push('/admin')
                  }}
                >
                  <Shield />
                  {t('pages.admin.enterPanel')}
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a
                href="https://github.com/open-v2ai/build-ai-template"
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer"
              >
                <Github />
                {t('pages.home.githubRepo')}
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleLogout(router, t, toast)}
            >
              <LogOut />
              {t('admin.navigation.logout')}
            </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
      </SidebarMenuItem>
      
      {/* 个人中心弹框 */}
      <ProfileDialog 
        open={profileDialogOpen} 
        onOpenChange={setProfileDialogOpen}
        user={user}
      />
      
      {/* 升级会员弹框 */}
      <UpgradePlanDialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen} />
      
      {/* 订单管理弹框 */}
      <OrdersDialog open={ordersDialogOpen} onOpenChange={setOrdersDialogOpen} />
    </SidebarMenu>
  )
}
