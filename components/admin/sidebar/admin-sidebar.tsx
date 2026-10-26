"use client"

import * as React from "react"
// import { useState, useEffect } from "react"
import Image from "next/image"
import { useTranslations } from 'next-intl'

import { BarChart3, Users, MessageSquare, Bot, Package } from "lucide-react"

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
} from "@/components/ui/sidebar"
import { NavUser } from "@/components/admin/sidebar/nav-user"
import { useGlobalUserData } from '@/hooks/use-global-user-data'

export interface AdminSidebarProps extends React.ComponentProps<typeof Sidebar> {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function AdminSidebar({ currentPage, onNavigate, ...props }: AdminSidebarProps) {
  const t = useTranslations();
  const { userProfile } = useGlobalUserData();
  
  // 从全局用户数据中获取用户信息，如果没有则使用默认值
  const email = userProfile?.email || 'admin@example.com';
  const username = userProfile?.username || userProfile?.email?.split('@')[0] || 'Admin';

  const navigationItems = [
    {
      id: 'dashboard',
      label: t('admin.navigation.dashboard'),
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'agents',
      label: t('admin.navigation.agentManagement'),
      icon: <Bot className="w-4 h-4" />,
    },
    {
      id: 'chats',
      label: t('admin.navigation.chatManagement'),
      icon: <MessageSquare className="w-4 h-4" />,
    },
    {
      id: 'users',
      label: t('admin.navigation.userManagement'),
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'orders',
      label: t('admin.navigation.orderManagement'),
      icon: <Package className="w-4 h-4" />,
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a
                href="https://github.com/open-v2ai/build-ai-template"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-left h-10 cursor-pointer"
                title="Visit GitHub Repository"
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
                  <span className="text-black dark:text-white">{t('pages.admin.title')}</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent className="border-y p-2">
        <SidebarMenu>
          {navigationItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                size="lg"
                onClick={() => onNavigate(item.id)}
                isActive={currentPage === item.id}
                className="group-data-[collapsible=icon]:!justify-center px-4 gap-4"
                tooltip={item.label}
              >
                {item.icon}
                <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter>
        <NavUser user={{ name: username, email: email }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
