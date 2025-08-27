"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { BarChart3, Users, MessageSquare } from "lucide-react"
import { useTranslations } from 'next-intl';
import { getUserProfile } from '@/util/auth';

import { NavUser } from "@/components/admin/sidebar/nav-user"
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

export interface AdminSidebarProps extends React.ComponentProps<typeof Sidebar> {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function AdminSidebar({ currentPage, onNavigate, ...props }: AdminSidebarProps) {
  const t = useTranslations();
  const [email, setEmail] = useState('admin@example.com');
  const [username, setUsername] = useState('管理员');

  // Get user info from API
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userProfile = await getUserProfile();
        if (userProfile) {
          setEmail(userProfile.email);
          setUsername(userProfile.username || userProfile.email.split('@')[0]);
        } else {
          // Fallback to localStorage
          const storedEmail = localStorage.getItem('email');
          if (storedEmail) {
            setEmail(storedEmail);
            setUsername(storedEmail.split('@')[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Fallback to localStorage
        const storedEmail = localStorage.getItem('email');
        if (storedEmail) {
          setEmail(storedEmail);
          setUsername(storedEmail.split('@')[0]);
        }
      }
    };

    fetchUserInfo();
  }, []);

  const navigationItems = [
    {
      id: 'dashboard',
      label: t('DASHBOARD'),
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'users',
      label: t('USER_MANAGEMENT'),
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'chats',
      label: t('CHAT_MANAGEMENT'),
      icon: <MessageSquare className="w-4 h-4" />,
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
                  <span className="text-black dark:text-white">{t('ADMIN')}</span>
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
                className="group-data-[collapsible=icon]:!justify-center px-4"
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
