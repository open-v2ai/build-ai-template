"use client"

import * as React from "react"
import { useEffect, useCallback } from "react"
import Image from "next/image"
import { useTranslations } from 'next-intl'

import { PlusCircleIcon, Command } from "lucide-react"

import { Avatar } from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenuBadge,
} from "@/components/ui/sidebar"
import { NavChatList } from "@/components/sidebar/nav-chat-list"
import { NavUser } from "@/components/sidebar/nav-user"
import { useGlobalUserData } from '@/hooks/use-global-user-data'
import type { Chat } from "@/app/[locale]/types" 

export interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onSelectChat?: (chat: Chat) => void;
  onNewChat?: () => void;
  chats: Chat[];
  currentChatId?: number;
}

export function AppSidebar({ onSelectChat, onNewChat, chats, currentChatId, ...props }: AppSidebarProps) {
  const t = useTranslations();
  const { userProfile } = useGlobalUserData();
  
  // 从全局用户数据中获取用户信息，如果没有则使用默认值
  const email = userProfile?.email || 'not_found@example.com';
  const username = userProfile?.username || 'User';

  // Handle new chat shortcut
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'i') {
      event.preventDefault();
      onNewChat?.();
    }
  }, [onNewChat]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a
                href={process.env.NEXT_PUBLIC_DOCS_URL || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-left h-10 cursor-pointer"
                title="Docs"
              >
                <Avatar className="h-10 w-10 rounded-lg">
                  <Image
                    src="/logo.svg"
                    alt="Logo"
                    width={32}
                    height={32}
                    className="cursor-pointer"
                  />
                </Avatar>
                <div className="text-xl font-light relative">
                  <span className="text-foreground">Build AI Template</span>
                  <span className="absolute -top-1 -right-7 text-[8px] text-muted-foreground px-2 py-0.5 rounded font-light ml-2 select-none">BETA</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            {/* New Chat Button */}
            <SidebarMenuButton
              tooltip="New Chat"
              className="text-purple-500 text-lg duration-200 hover:text-purple-800"
              onClick={onNewChat}
            >
              <PlusCircleIcon className="text-foreground" />
              <span>{t('chat.newChat')}</span>
              <SidebarMenuBadge className="ml-2 flex items-center gap-1 text-xs text-muted-foreground">
                <Command className="w-3 h-3" />
                <span>I</span>
              </SidebarMenuBadge>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="border-y">
        {/* Chat list, calls onSelectChat when clicked */}
        <NavChatList
          chats={chats}
          onSelectChat={onSelectChat}
          currentChatId={currentChatId}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{ name: username, email: email }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
