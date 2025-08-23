'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetcher } from '@/util/fetcher';
import { formatDateTime } from '@/util/dateFormat';
import type { Chat, Message, ChatSearchParams } from '@/app/[locale]/types';

interface ChatDetailModalProps {
  chatId: number | null;
  onClose: () => void;
}

function ChatDetailModal({ chatId, onClose }: ChatDetailModalProps) {
  const t = useTranslations();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (chatId) {
      fetchChatDetail();
    }
  }, [chatId]);

  const fetchChatDetail = async () => {
    if (!chatId) return;
    
    try {
      setLoading(true);
      const data = await fetcher(`/admin/chats/${chatId}/messages`, {
        method: 'GET',
        auth: true,
      }) as { messages: Message[] };
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to fetch chat detail:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!chatId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden border border-border">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h3 className="text-lg font-semibold text-foreground">{t('CHAT_DETAIL')} (ID: {chatId})</h3>
          <Button variant="outline" onClick={onClose}>{t('CLOSE')}</Button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8">{t('LOADING')}</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{t('NO_MESSAGES')}</div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`p-4 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-blue-50 dark:bg-blue-950 ml-8' 
                    : message.role === 'assistant' 
                    ? 'bg-muted mr-8' 
                    : 'bg-yellow-50 dark:bg-yellow-950'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-sm font-medium ${
                      message.role === 'user' 
                        ? 'text-blue-700 dark:text-blue-300' 
                        : message.role === 'assistant' 
                        ? 'text-foreground' 
                        : 'text-yellow-700 dark:text-yellow-300'
                    }`}>
                      {message.role === 'user' ? t('USER') : message.role === 'assistant' ? t('AI_ASSISTANT') : t('SYSTEM')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(message.created_at)}
                    </span>
                  </div>
                  <div className="text-sm text-foreground whitespace-pre-wrap">
                    {message.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ChatRowProps {
  chat: Chat;
  onViewDetail: (chatId: number) => void;
}

function ChatRow({ chat, onViewDetail }: ChatRowProps) {
  const t = useTranslations();
  return (
    <tr className="border-b border-border hover:bg-muted/50">
      <td className="px-6 py-4 text-sm text-foreground">{chat.id}</td>
      <td className="px-6 py-4 text-sm text-foreground">
        <div>
          <div className="font-medium">{chat.user_email}</div>
          <div className="text-xs text-muted-foreground">ID: {chat.user_id}</div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-foreground">
        <div className="max-w-xs truncate" title={chat.title}>
          {chat.title}
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-muted-foreground">{chat.message_count}</td>
      <td className="px-6 py-4 text-sm text-muted-foreground">
        {formatDateTime(chat.created_at)}
      </td>
      <td className="px-6 py-4 text-sm text-muted-foreground">
        {formatDateTime(chat.updated_at)}
      </td>
      <td className="px-6 py-4 text-sm">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onViewDetail(chat.id)}
        >
          <Eye className="w-4 h-4 mr-1" />
          {t('VIEW')}
        </Button>
      </td>
    </tr>
  );
}

export default function ChatsManagementPage() {
  const t = useTranslations();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [searchParams, setSearchParams] = useState<ChatSearchParams>({
    limit: 20,
    offset: 0,
  });

  useEffect(() => {
    fetchChats();
  }, [searchParams]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (searchParams.user_id) queryParams.append('user_id', searchParams.user_id.toString());
      if (searchParams.user_email) queryParams.append('user_email', searchParams.user_email);
      if (searchParams.title) queryParams.append('title', searchParams.title);
      queryParams.append('limit', (searchParams.limit || 20).toString());
      queryParams.append('offset', (searchParams.offset || 0).toString());

      const data = await fetcher(`/admin/chats?${queryParams.toString()}`, {
        method: 'GET',
        auth: true,
      });
      setChats(data as Chat[]);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ ...searchParams, offset: 0 });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">{t('CHAT_MANAGEMENT')}</h1>
      
      {/* 搜索和筛选 */}
      <div className="bg-card rounded-lg p-6 shadow-sm border border-border mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('USER_EMAIL')}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={t('SEARCH_USER_EMAIL_PLACEHOLDER')}
                  value={searchParams.user_email || ''}
                  onChange={(e) => setSearchParams({ ...searchParams, user_email: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('USER_ID')}</label>
              <Input
                type="number"
                placeholder={t('USER_ID')}
                value={searchParams.user_id || ''}
                onChange={(e) => setSearchParams({ 
                  ...searchParams, 
                  user_id: e.target.value ? parseInt(e.target.value) : undefined
                })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('CHAT_TITLE')}</label>
              <Input
                placeholder={t('SEARCH_CHAT_TITLE_PLACEHOLDER')}
                value={searchParams.title || ''}
                onChange={(e) => setSearchParams({ ...searchParams, title: e.target.value })}
              />
            </div>

            <div className="flex items-end">
              <Button type="submit" className="w-full">{t('SEARCH')}</Button>
            </div>
          </div>
        </form>
      </div>

      {/* 对话列表 */}
      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('CHAT_ID')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('USER')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('TITLE')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('MESSAGE_COUNT')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('CREATED_TIME')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('LAST_UPDATE')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('ACTIONS')}</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="animate-pulse">{t('LOADING')}</div>
                  </td>
                </tr>
              ) : chats.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    {t('NO_CHAT_DATA')}
                  </td>
                </tr>
              ) : (
                chats.map((chat) => (
                  <ChatRow 
                    key={chat.id} 
                    chat={chat} 
                    onViewDetail={setSelectedChatId}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        <div className="bg-card px-4 py-3 flex items-center justify-between border-t border-border">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="outline"
              onClick={() => setSearchParams({ ...searchParams, offset: Math.max(0, (searchParams.offset || 0) - (searchParams.limit || 20)) })}
              disabled={(searchParams.offset || 0) === 0}
            >
              {t('PREVIOUS_PAGE')}
            </Button>
            <Button
              variant="outline"
              onClick={() => setSearchParams({ ...searchParams, offset: (searchParams.offset || 0) + (searchParams.limit || 20) })}
              disabled={chats.length < (searchParams.limit || 20)}
            >
              {t('NEXT_PAGE')}
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('SHOW_RECORDS', { start: (searchParams.offset || 0) + 1, end: (searchParams.offset || 0) + chats.length })}
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md space-x-2">
                <Button
                  className="shadow-sm"
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchParams({ ...searchParams, offset: Math.max(0, (searchParams.offset || 0) - (searchParams.limit || 20)) })}
                  disabled={(searchParams.offset || 0) === 0}
                >
                  {t('PREVIOUS_PAGE')}
                </Button>
                <Button
                  className="shadow-sm"
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchParams({ ...searchParams, offset: (searchParams.offset || 0) + (searchParams.limit || 20) })}
                  disabled={chats.length < (searchParams.limit || 20)}
                >
                  {t('NEXT_PAGE')}
                </Button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* 对话详情模态框 */}
      <ChatDetailModal 
        chatId={selectedChatId} 
        onClose={() => setSelectedChatId(null)} 
      />
    </div>
  );
}
