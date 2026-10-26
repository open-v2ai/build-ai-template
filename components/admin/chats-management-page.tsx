'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { fetcher } from '@/util/fetcher';
import { formatDateTime } from '@/util/dateFormat';
import type { Chat, Message, ChatSearchParams } from '@/app/[locale]/admin/types';

interface ChatDetailModalProps {
  chatId: number | null;
  onClose: () => void;
}

function ChatDetailModal({ chatId, onClose }: ChatDetailModalProps) {
  const t = useTranslations();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChatDetail = useCallback(async () => {
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
  }, [chatId]);

  useEffect(() => {
    if (chatId) {
      fetchChatDetail();
    }
  }, [chatId, fetchChatDetail]);

  if (!chatId) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/10 dark:bg-black/10 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden border border-border">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h3 className="text-lg font-semibold text-foreground">{t('chat.chatDetail')} (ID: {chatId})</h3>
          <Button variant="outline" onClick={onClose}>{t('ui.close')}</Button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8">{t('ui.loading')}</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{t('chat.noMessages')}</div>
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
                      {message.role === 'user' ? t('chat.user') : message.role === 'assistant' ? t('chat.aiAssistant') : t('chat.system')}
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
    <TableRow className="hover:bg-muted/50">
      <TableCell className="text-sm text-foreground">{chat.id}</TableCell>
      <TableCell className="text-sm text-foreground">{chat.user_id}</TableCell>
      <TableCell className="text-sm text-foreground">
        <div className="font-medium">{chat.user_email}</div>
      </TableCell>
      <TableCell className="text-sm text-foreground">
        <div className="font-medium">
          {chat.username || t('admin.chats.noUsername')}
        </div>
      </TableCell>
      <TableCell className="text-sm text-foreground">
        <div className="max-w-xs truncate" title={chat.title}>
          {chat.title}
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{chat.message_count}</TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDateTime(chat.created_at)}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDateTime(chat.updated_at)}
      </TableCell>
      <TableCell className="text-sm">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onViewDetail(chat.id)}
        >
          <Eye className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default function ChatsManagementPage() {
  const t = useTranslations();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [paginationInfo, setPaginationInfo] = useState({
    total: 0,
    total_pages: 0,
    current_page: 1,
    has_next: false,
    has_prev: false,
  });
  const [searchParams, setSearchParams] = useState<ChatSearchParams>({
    limit: 20,
    offset: 0,
    sort_by: 'updated_at',
    sort_order: 'desc',
  });

  const fetchChats = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (searchParams.user_id) queryParams.append('user_id', searchParams.user_id.toString());
      if (searchParams.user_email) queryParams.append('user_email', searchParams.user_email);
      if (searchParams.username) queryParams.append('username', searchParams.username);
      if (searchParams.title) queryParams.append('title', searchParams.title);
      queryParams.append('limit', (searchParams.limit || 20).toString());
      queryParams.append('offset', (searchParams.offset || 0).toString());
      if (searchParams.sort_by) queryParams.append('sort_by', searchParams.sort_by);
      if (searchParams.sort_order) queryParams.append('sort_order', searchParams.sort_order);

      const data = await fetcher(`/admin/chats?${queryParams.toString()}`, {
        method: 'GET',
        auth: true,
      });
      
      const response = data as { chats: Chat[], total: number, total_pages: number, current_page: number, has_next: boolean, has_prev: boolean };
      setChats(response.chats || []);
      setPaginationInfo({
        total: response.total || 0,
        total_pages: response.total_pages || 0,
        current_page: response.current_page || 1,
        has_next: response.has_next || false,
        has_prev: response.has_prev || false,
      });
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ ...searchParams, offset: 0 });
  };

  return (
    <div className="p-6 max-w-full mx-auto overflow-x-hidden">
      {/* 搜索和筛选 */}
      <div className="bg-card rounded-lg p-6 shadow-sm border border-border mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('table.userEmail')}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={t('admin.chats.search.userEmailPlaceholder')}
                  value={searchParams.user_email || ''}
                  onChange={(e) => setSearchParams({ ...searchParams, user_email: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('table.username')}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={t('admin.chats.search.usernamePlaceholder')}
                  value={searchParams.username || ''}
                  onChange={(e) => setSearchParams({ ...searchParams, username: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('table.userId')}</label>
              <Input
                type="number"
                placeholder={t('table.userId')}
                value={searchParams.user_id || ''}
                onChange={(e) => setSearchParams({ 
                  ...searchParams, 
                  user_id: e.target.value ? parseInt(e.target.value) : undefined
                })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('table.chatTitle')}</label>
              <Input
                placeholder={t('admin.chats.search.chatTitlePlaceholder')}
                value={searchParams.title || ''}
                onChange={(e) => setSearchParams({ ...searchParams, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('admin.chats.sort.sortBy')}</label>
              <select
                value={searchParams.sort_by || 'updated_at'}
                onChange={(e) => setSearchParams({ ...searchParams, sort_by: e.target.value })}
                className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
              >
                <option value="id">{t('admin.chats.sort.fields.id')}</option>
                <option value="title">{t('admin.chats.sort.fields.title')}</option>
                <option value="created_at">{t('admin.chats.sort.fields.created_at')}</option>
                <option value="updated_at">{t('admin.chats.sort.fields.updated_at')}</option>
                <option value="user_email">{t('admin.chats.sort.fields.user_email')}</option>
                <option value="username">{t('admin.chats.sort.fields.username')}</option>
                <option value="message_count">{t('admin.chats.sort.fields.message_count')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('admin.chats.sort.sortOrder')}</label>
              <select
                value={searchParams.sort_order || 'desc'}
                onChange={(e) => setSearchParams({ ...searchParams, sort_order: e.target.value as 'asc' | 'desc' })}
                className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
              >
                <option value="asc">{t('admin.chats.sort.directions.asc')}</option>
                <option value="desc">{t('admin.chats.sort.directions.desc')}</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button type="submit" className="w-full">{t('ui.search')}</Button>
            </div>
          </div>
        </form>
      </div>

      {/* 对话列表 */}
      <div className="border border-border rounded-lg overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-purple-500/10 via-violet-500/5 to-purple-500/10 backdrop-blur-sm border-b border-purple-500/20">
                <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[80px]">{t('table.chatId')}</TableHead>
                <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[80px]">{t('table.userId')}</TableHead>
                <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[180px]">{t('table.userEmail')}</TableHead>
                <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[120px]">{t('table.username')}</TableHead>
                <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[200px]">{t('ui.title')}</TableHead>
                <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[100px]">{t('table.messageCount')}</TableHead>
                <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[140px]">{t('table.createdTime')}</TableHead>
                <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[140px]">{t('table.lastUpdate')}</TableHead>
                <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[80px]">{t('table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="px-6 py-12 text-center">
                    <div className="animate-pulse">{t('ui.loading')}</div>
                  </TableCell>
                </TableRow>
              ) : chats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="px-6 py-12 text-center text-muted-foreground">
                    {t('chat.noChatData')}
                  </TableCell>
                </TableRow>
              ) : (
                chats.map((chat) => (
                  <ChatRow 
                    key={chat.id} 
                    chat={chat} 
                    onViewDetail={setSelectedChatId}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* 分页 */}
        <div className="bg-card px-4 py-3 flex items-center justify-between border-t border-border">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="outline"
              onClick={() => setSearchParams({ ...searchParams, offset: Math.max(0, (searchParams.offset || 0) - (searchParams.limit || 20)) })}
              disabled={!paginationInfo.has_prev}
            >
              {t('pagination.previousPage')}
            </Button>
            <div className="text-sm text-muted-foreground flex items-center">
              {t('common.pagination.pageInfo', { current: paginationInfo.current_page, total: paginationInfo.total_pages })}
            </div>
            <Button
              variant="outline"
              onClick={() => setSearchParams({ ...searchParams, offset: (searchParams.offset || 0) + (searchParams.limit || 20) })}
              disabled={!paginationInfo.has_next}
            >
              {t('pagination.nextPage')}
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('common.pagination.showRecordsWithTotal', {
                  start: (searchParams.offset || 0) + 1,
                  end: (searchParams.offset || 0) + chats.length,
                  total: paginationInfo.total
                })}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {t('common.pagination.pageInfo', { current: paginationInfo.current_page, total: paginationInfo.total_pages })}
              </span>
              <nav className="relative z-0 inline-flex rounded-md space-x-2">
                <Button
                  className="shadow-sm"
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchParams({ ...searchParams, offset: Math.max(0, (searchParams.offset || 0) - (searchParams.limit || 20)) })}
                  disabled={!paginationInfo.has_prev}
                >
                  {t('pagination.previousPage')}
                </Button>
                <Button
                  className="shadow-sm"
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchParams({ ...searchParams, offset: (searchParams.offset || 0) + (searchParams.limit || 20) })}
                  disabled={!paginationInfo.has_next}
                >
                  {t('pagination.nextPage')}
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
