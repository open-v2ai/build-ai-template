'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PanelRight } from 'lucide-react';

import { AppSidebar } from "@/components/sidebar/app-sidebar"
import NewChatPage from '@/components/new-chat-page'
import ChatContentPage from '@/components/chat-content-page'
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

import { getValidAccessToken } from '@/util/token';
import LanguageSwitchButton from "@/components/language-switch-button"

import { fetcher } from '@/util/fetcher';
import type { Chat } from '@/app/[locale]/types';

export default function Page() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentPage, setCurrentPage] = useState<'new' | 'chat'>(() => (chats.length > 0 ? 'chat' : 'new'));
  const [currentChat, setCurrentChat] = useState<Chat | null>(() => (chats.length > 0 ? chats[0] : null));
  const [isNewChat, setIsNewChat] = useState(false);
  const router = useRouter();
  const t = useTranslations();
  const [taskPanelOpen, setTaskPanelOpen] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        router.push('/login');
      }
    };
    checkToken();
  }, [router]);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (chats.length > 0) {
      setCurrentPage('chat');
      setCurrentChat(chats[0]);
    } else {
      setCurrentPage('new');
      setCurrentChat(null);
    }
  }, [chats]);

  const fetchChats = async () => {
    const res = await fetcher('/chat', {
      method: 'GET',
      auth: true,
    });
    setChats(res as Chat[]);
  };

  return (
    <SidebarProvider>
      <AppSidebar
        chats={chats}
        onSelectChat={(chat: Chat) => {
          setCurrentPage('chat');
          setCurrentChat(chat);
        }}
        onNewChat={() => { setCurrentPage('new'); setCurrentChat(null); }}
        currentChatId={currentChat?.id}
      />
      <SidebarInset>
        <header className="sticky top-0 z-20 bg-white border-b flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
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
                    {currentChat?.title || t('SLOGAN')}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto justify-end pr-4 flex items-center gap-2">
            <LanguageSwitchButton />
            {currentPage === 'chat' && currentChat !== null && (
              <div className="flex items-center gap-2">
                <Separator
                  orientation="vertical"
                  className="data-[orientation=vertical]:h-4" />
                <button
                  className="rounded-full p-1 transition-all duration-200"
                  onClick={() => setTaskPanelOpen(open => !open)}
                >
                  <PanelRight className="w-4 h-4" /> 
                </button>
              </div>
            )}
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 pt-0">
          <div className="bg-muted/50 min-h-[100vh] flex flex-1 rounded-xl md:min-h-min items-center justify-center">
            {currentPage === 'new' && (
              <NewChatPage
                onChatCreated={async (chat) => {
                  setCurrentChat(chat);
                  setCurrentPage('chat');
                  setIsNewChat(true);
                  await fetchChats();
                }}
              />
            )}
            {currentPage === 'chat' && currentChat !== null && (
              <ChatContentPage
                chat={currentChat}
                taskPanelOpen={taskPanelOpen}
                isNewChat={isNewChat}
                setIsNewChat={setIsNewChat}
              />
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
