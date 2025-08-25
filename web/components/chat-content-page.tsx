import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import type { Chat, Message } from '@/app/[locale]/types';
import { fetcher } from '@/util/fetcher';
import { useTranslations } from 'next-intl';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';


function formatTime(ts: string) {
  const date = new Date(ts);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toLocaleDateString() + ' ' + localDate.toLocaleTimeString([]);
}

export default function ChatContentPage({ chat, taskPanelOpen = true, isNewChat, setIsNewChat }: 
  { chat: Chat, taskPanelOpen?: boolean, isNewChat?: boolean, setIsNewChat?: (isNewChat: boolean) => void }) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const hasSent = useRef(false);
  const t = useTranslations();
  const [taskContent, setTaskContent] = useState('');

  useEffect(() => {
     // If chat is not newly created, request chat details
     if (!isNewChat) {
      fetcher(`/chat/${chat.id}`, {
        method: 'GET',
        auth: true,
      }).then(res => {
        const chat = res as Chat;
        setMessages(chat.messages);
      });
     }

     // If chat is newly created, send message
     if (isNewChat && !hasSent.current) {
      if (setIsNewChat) setIsNewChat(false);
      hasSent.current = true;
      handleSend(chat.content, true);
    }
  // eslint-disable-next-line
  }, [chat.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Extract message sending logic
  const handleSend = async (content: string, stream: boolean = false) => {
    const now = new Date().toUTCString().slice(0, 25);
    const userMsg = { id: 0, content, role: 'user', created_at: now, updated_at: now };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    if (content) {
      const assistantMsg = { id: 0, content: '...', role: 'assistant', created_at: now, updated_at: now };
      setMessages(prev => [...prev, assistantMsg]);
      setTaskContent('');

      if (stream) {
        let assistantContent = '';
        let taskContent = '';
        await fetcher('/chat/message?stream=true',
          {
            method: 'POST',
            auth: true,
            body: JSON.stringify({ content, chat_id: chat.id, role: 'user' }),
            headers: { 'Content-Type': 'application/json' },
            stream: true,
          },
          (chunk: string) => {
            if (chunk.startsWith("<answer>")) {
              if (assistantContent === t('TASK_PROCESSING')) {
                assistantContent = '';
              }
              assistantContent += chunk.replace(/<answer>|<\/answer>/g, "");
            } else if (chunk.startsWith("<task>")) {
              assistantContent = t('TASK_PROCESSING');
              taskContent += chunk.replace(/<task>|<\/task>/g, "");
            } else {
              assistantContent += chunk;
            }
            setMessages(prev => {
              const newMsgs = [...prev];
              newMsgs[newMsgs.length - 1] = { ...assistantMsg, content: assistantContent };
              return newMsgs;
            });
            setTaskContent(taskContent);
          }
        );
      } else {
        await fetcher('/chat/message?stream=false',
          {
            method: 'POST',
            auth: true,
            body: JSON.stringify({ content, chat_id: chat.id, role: 'user' }),
            headers: { 'Content-Type': 'application/json' },
            stream: false,
          }
        ).then(res => {
          const resMsgs = res as Message[];
          setMessages(prev => {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1] = { ...assistantMsg, content: resMsgs[resMsgs.length - 1].content };
            return newMsgs;
          });
        });
      }
    }
  };

  return (
    <div className="flex flex-row w-full h-full min-h-0">
      {/* Left chat area */}
      <div className={`flex flex-col ${taskPanelOpen ? 'flex-[2_2_0%]' : 'flex-1'} h-full min-h-0 bg-background rounded-l p-0 transition-all duration-300`}>
        {/* Scrollable message history */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex mb-2 items-end ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full mr-2 mb-6 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-foreground" />
                </div>
              )}
              <div className="flex flex-col items-end max-w-[80%]">
                <div
                  className={`px-4 py-2 rounded-lg break-words shadow ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white self-end'
                      : 'bg-muted text-foreground self-start'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
                <span className="text-xs text-muted-foreground mt-1 self-end">{formatTime(msg.created_at!)}</span>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full ml-2 mb-6 flex items-center justify-center">
                  <User className="w-5 h-5 text-foreground" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        {/* Fixed bottom input area */}
        <div className="px-4 py-3 border-t bg-background sticky bottom-0 z-10">
          <div className="flex w-full gap-2">
            <input
              className="flex-1 border rounded px-2 py-2 h-10"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={t('ENTER_QUESTION')}
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  const content = input.trim();
                  if (content) {
                    await handleSend(content, true);
                  }
                }
              }}
            />
            <button
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-1 rounded transition-colors"
              onClick={async () => {
                const content = input.trim();
                if (content) {
                  await handleSend(content, true);
                }
              }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      {/* Right task execution area, can be expanded/collapsed */}
      <div className={`relative flex flex-col ${taskPanelOpen ? 'flex-[1_1_0%] max-w-xl' : 'w-0 min-w-0 p-0 border-0'} h-full min-h-0 bg-muted/30 rounded-r border-l border-border transition-all duration-300`}> 
        {taskPanelOpen ? (
          <div className="sticky top-0 p-4 overflow-y-auto">
            <div className="text-lg font-bold mb-4">{t('TASK_EXECUTION')}</div>
            <div className="text-muted-foreground">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{taskContent ? taskContent : t('TASK_EXECUTION_DESC')}</ReactMarkdown>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
} 