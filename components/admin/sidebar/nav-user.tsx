"use client"

import {
  Settings,
  ChevronsUpDown,
  LogOut,
  Home,
  Github,
  Crown,
  Shield,
  User,
} from "lucide-react"
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { 
  getAdminUserTypeText,
  getMembershipLevelText,
  useUserStatus,
  handleLogout 
} from '@/util/user-utils'
import { useMembershipStatus } from '@/hooks/use-global-user-data'

import {
  Avatar,
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
  const { userType } = useUserStatus(user.email)
  const { membershipStatus } = useMembershipStatus()

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
                    <div title={getAdminUserTypeText(userType, t)}>
                      <Shield className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
                    </div>
                  )}
                </div>
                <span className={`truncate text-xs ${membershipStatus && membershipStatus.membership_type !== 'free' ? 'text-purple-500' : 'text-muted-foreground'}`}>
                  {getMembershipLevelText(membershipStatus?.membership_type || 'free', t)}
                </span>
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
                      {membershipStatus && membershipStatus.membership_type !== 'free' && (
                        <Crown className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
                      )}
                    </div>
                    {userType === 'admin' && (
                      <div title={getAdminUserTypeText(userType, t)}>
                        <Shield className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
                      </div>
                    )}
                  </div>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Settings />
                {t('ui.settings')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  router.push('/')
                }}
              >
                <Home />
                {t('ui.backToApp')}
              </DropdownMenuItem>
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
                {t('ui.githubRepository')}
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleLogout(router, t, toast)}
            >
              <LogOut />
              {t('ui.logOut')}
            </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
