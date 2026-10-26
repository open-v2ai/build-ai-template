'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

import { Send } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { fetcher } from '@/util/fetcher'
import { useGlobalChatState } from '@/hooks/use-global-chat-state'
import { useGlobalDataCache } from '@/hooks/use-global-data-cache'
import type { Chat } from '@/app/[locale]/types'

interface NewChatPageProps {
  onChatCreated?: (chat: Chat, initialMessage: string) => void;
}

export default function NewChatPage({ onChatCreated }: NewChatPageProps) {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const t = useTranslations();
  
  // 获取全局对话状态
  const { isGloballyLocked, getLockStatusMessage } = useGlobalChatState();
  
  // 获取全局数据缓存
  const { agents, fetchAgents } = useGlobalDataCache();

  // 加载可用的 Agent 列表
  useEffect(() => {
    const loadAgents = async () => {
      try {
        const agentsList = await fetchAgents();
        // 设置默认 Agent 为第一个（最小 ID）
        if (agentsList.length > 0 && !selectedAgentId) {
          setSelectedAgentId(agentsList[0].id.toString());
        }
      } catch (err) {
        console.error('Failed to load agents:', err);
      }
    };
    
    loadAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 移除不必要的依赖
  // 获取锁定状态提示信息
  const lockStatusMessage = getLockStatusMessage();

  return (
    <div className="flex flex-col w-full max-w-xl mx-auto h-full justify-center">
      <div className="flex flex-col w-full max-w-xl mx-auto mb-2">
        <div className="text-[48px] font-light">{t('pages.home.helloWorld')}</div>
      </div>
      
      {/* 全局对话锁定提示 */}
      {isGloballyLocked && lockStatusMessage && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-red-700 dark:text-red-300 font-medium">
              {lockStatusMessage}
            </span>
          </div>
        </div>
      )}
      
      <div className="border border-input rounded-lg p-4 bg-background shadow-sm">
        <textarea
          className={`w-full min-h-[3rem] h-[8rem] max-h-40 text-lg rounded-md bg-background outline-none resize-none focus:ring-0 ${
            isGloballyLocked ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          placeholder={
            isGloballyLocked 
              ? lockStatusMessage || t('chat.limits.globalLockActive')
              : t('chat.newChatPlaceholder')
          }
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          disabled={isGloballyLocked}
          onKeyDown={async (e) => {
            // Enter 键发送消息（非 Shift+Enter）
            if (e.key === 'Enter' && !e.shiftKey && !loading && !isGloballyLocked) {
              e.preventDefault();
              const message = inputValue.trim();
              const agentId = selectedAgentId ? parseInt(selectedAgentId) : null;
              
              if (!agentId || message.length <= 2) return;
              
              setLoading(true);
              try {
                // 创建聊天（不包含消息内容，只创建聊天会话）
                const res = await fetcher('/chat', {
                  method: 'POST',
                  auth: true,
                  body: JSON.stringify({ 
                    title: message.slice(0, 20), 
                    agent_id: agentId
                  })
                });
                
                const newChat = res as Chat;
                setInputValue('');
                
                // 创建成功后跳转到聊天页面，并传递初始消息
                if (onChatCreated) {
                  onChatCreated(newChat, message);
                }
              } catch {
              } finally {
                setLoading(false);
              }
            }
            // Shift + Enter 键允许换行，不做任何处理
          }}
          rows={6}
          autoFocus
        />
        <div className="flex gap-2 items-end mt-2">
          {/* Agent selection dropdown */}
          <div className="w-[120px] flex-shrink-0">
            <Select 
              value={selectedAgentId} 
              onValueChange={setSelectedAgentId}
              disabled={loading}
            >
              <SelectTrigger className="w-full !h-10">
                <SelectValue placeholder={t('chat.selectAgent')} />
              </SelectTrigger>
              <SelectContent>
                {(agents || []).map((agent) => (
                  <SelectItem key={agent.id} value={agent.id.toString()}>
                    <div className="truncate max-w-[90px]" title={agent.name}>
                      {agent.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1"></div>
          
          <Button
            className="w-10 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center p-0 border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            onClick={async () => {
              const message = inputValue.trim();
              const agentId = selectedAgentId ? parseInt(selectedAgentId) : null;
              
              if (!agentId || message.length <= 2 || isGloballyLocked) return;
              
              setLoading(true);
              try {
                // 创建聊天（不包含消息内容，只创建聊天会话）
                const res = await fetcher('/chat', {
                  method: 'POST',
                  auth: true,
                  body: JSON.stringify({ 
                    title: message.slice(0, 20),
                    agent_id: agentId
                  })
                });
                
                const newChat = res as Chat;
                setInputValue('');
                
                // 创建成功后跳转到聊天页面，并传递初始消息
                if (onChatCreated) {
                  onChatCreated(newChat, message);
                }
              } catch {
              } finally {
                setLoading(false);
              }
            }}
            // 长度大于 1 且有选中的 Agent 且未加载且未被全局锁定
            disabled={inputValue.trim().length <= 1 || !selectedAgentId || loading || isGloballyLocked}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 