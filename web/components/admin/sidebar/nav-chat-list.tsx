"use client"

import {
  SidebarGroup,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar"
import { format } from 'date-fns';
import type { Chat } from "@/app/[locale]/types";
import { MoreHorizontal } from "lucide-react";

export function NavChatList({
  chats,
  onSelectChat,
  currentChatId,
}: {
  chats: Chat[]
  onSelectChat?: (chat: Chat) => void
  currentChatId?: number
}) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarGroup className="p-0">
      <SidebarGroupContent>
        {isCollapsed ? (
          <div className="flex items-center justify-center p-4">
            <MoreHorizontal className="w-4 h-4 text-gray-500" />
          </div>
        ) : (
          chats.map((chat, idx) => (
            <a
              href="#"
              key={idx}
              className={`flex flex-col items-start gap-2 whitespace-nowrap border-b p-4 text-sm leading-tight last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${currentChatId === chat.id ? 'bg-purple-50 z-10 border-r-4 border-r-purple-400' : 'border-r-0'}`}
              onClick={e => {
                e.preventDefault();
                if (onSelectChat) {
                  onSelectChat(chat);
                }
              }}
            >
              <div className="flex w-full items-center gap-2 relative">
                <span className="font-medium truncate max-w-[72%]">{chat.title}</span>
                <span className="absolute right-0 top-0 text-xs whitespace-nowrap text-gray-500">{
                  (() => {
                    const date = new Date(chat.updated_at);
                    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
                    const now = new Date();
                    const isToday = localDate.getFullYear() === now.getFullYear() &&
                      localDate.getMonth() === now.getMonth() &&
                      localDate.getDate() === now.getDate();
                    return isToday
                      ? format(localDate, 'HH:mm:ss')
                      : format(localDate, 'yy/MM/dd');
                  })()
                }</span>
              </div>
              <span className="line-clamp-2 whitespace-break-spaces text-xs max-w-[100%]">
                {chat.content}
              </span>
            </a>
          ))
        )}
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
