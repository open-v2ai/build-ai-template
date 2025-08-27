"use client"

import {
  Settings,
  ChevronsUpDown,
  LogOut,
  User,
  Shield,
  Crown,
  Star,
  User as UserIcon,
  Github,
} from "lucide-react"
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'

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
  const [isAdmin, setIsAdmin] = useState(false)
  const [userType, setUserType] = useState<string>('normal')

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = () => {
      // Check user type in localStorage
      const storedUserType = localStorage.getItem('user_type') || 'normal';
      
      // Check multiple possible admin identifiers
      const isAdminUser = storedUserType === 'admin' || 
                         storedUserType === 'super_admin';
      
      setIsAdmin(isAdminUser);
      setUserType(storedUserType);
    };

    if (user.email) {
      checkAdminStatus();
    }
    
    // Also listen for localStorage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_type') {
        checkAdminStatus();
      }
    };
    
    // Listen for custom events (for state changes within the same page)
    const handleUserTypeChange = () => {
      checkAdminStatus();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('user-type-changed', handleUserTypeChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('user-type-changed', handleUserTypeChange);
    };
  }, [user.email])

  // Get user type icon
  const getUserTypeIcon = (type: string) => {
    switch (type) {
      case 'super_admin':
        return <Crown className="w-2.5 h-2.5" />;
      case 'admin':
        return <Shield className="w-2.5 h-2.5" />;
      case 'premium':
        return <Star className="w-2.5 h-2.5" />;
      default:
        return <UserIcon className="w-2.5 h-2.5" />;
    }
  };

  // Get user type color
  const getUserTypeColor = (type: string) => {
    switch (type) {
      case 'super_admin':
        return 'bg-red-50 text-red-400 dark:bg-red-950 dark:text-red-500';
      case 'admin':
        return 'bg-purple-50 text-purple-400 dark:bg-purple-950 dark:text-purple-500';
      case 'premium':
        return 'bg-yellow-50 text-yellow-500 dark:bg-yellow-950 dark:text-yellow-600';
      default:
        return 'bg-slate-50 text-slate-400 dark:bg-slate-900 dark:text-slate-500';
    }
  };

  // Get user type display text
  const getUserTypeText = (type: string) => {
    switch (type) {
      case 'super_admin':
        return t('SUPER_ADMIN_USER');
      case 'admin':
        return t('ADMIN_USER');
      case 'premium':
        return t('PREMIUM_USER');
      default:
        return t('NORMAL_USER');
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem className="relative">
        <div className="flex items-center gap-1">
          <div className="flex-1">
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
                      <span className="truncate font-medium flex-1 min-w-0">{user.name}</span>
                      <span 
                        className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium flex-shrink-0 ${getUserTypeColor(userType)}`}
                        title={getUserTypeText(userType)}
                      >
                        {getUserTypeIcon(userType)}
                      </span>
                    </div>
                    <span className="truncate text-xs">{user.email}</span>
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
                    <span className="truncate font-medium flex-1 min-w-0">{user.name}</span>
                    <span 
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium flex-shrink-0 ${getUserTypeColor(userType)}`}
                      title={getUserTypeText(userType)}
                    >
                      {getUserTypeIcon(userType)}
                    </span>
                  </div>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Settings />
                {t('SETTINGS')}
              </DropdownMenuItem>

              {/* 只有管理员才显示管理后台按钮 */}
              {isAdmin && (
                <DropdownMenuItem
                  onClick={() => {
                    router.push('/admin')
                  }}
                >
                  <Shield />
                  {t('ENTER_ADMIN_PANEL')}
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
                {t('GITHUB_REPOSITORY')}
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                localStorage.removeItem('email');
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user_type');
                setTimeout(() => {
                  router.push('/login');
                }, 1000);
                toast.success(t('LOGOUT_SUCCESS'));
              }}
            >
              <LogOut />
              {t('LOG_OUT')}
            </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="w-px h-6 bg-border mx-1"></div>
          <a
            href="https://github.com/open-v2ai/build-ai-template"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors flex-shrink-0"
            title="GitHub Repository"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
