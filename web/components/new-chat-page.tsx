'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { fetcher } from '@/util/fetcher';
import type { Chat } from '@/app/[locale]/types';

interface NewChatPageProps {
  onChatCreated?: (chat: Chat) => Promise<void>;
}

export default function NewChatPage({ onChatCreated }: NewChatPageProps) {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const t = useTranslations();
  return (
    <div className="flex flex-col w-full max-w-xl mx-auto">
      <div className="flex flex-col w-full max-w-xl mx-auto mb-2">
        <div className="text-[48px] font-light">{t('HELLO_WORLD')}</div>
      </div>
      <textarea
        className="w-full min-h-[3rem] h-[8rem] max-h-40 text-lg px-4 py-2 rounded-md border border-input bg-background shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none resize-none"
        placeholder={t('NEW_CHAT_PLACEHOLDER')}
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        rows={6}
        autoFocus
      />
        <div className="flex gap-2 justify-end mt-2">
          <Button
            className="px-6 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={async () => {
              setLoading(true);
              try {
                const res = await fetcher('/chat', {
                  method: 'POST',
                  auth: true,
                  body: JSON.stringify({ title: inputValue.trim().slice(0, 10), content: inputValue.trim() })
                });
                setInputValue('');
                if (onChatCreated && res) {
                  await onChatCreated(res as Chat);
                }
              } finally {
                setLoading(false);
              }
            }}
            disabled={inputValue.trim().length <= 2 || loading}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="ml-1">{loading ? t('SENDING') : t('SEND')}</span>
          </Button>
        </div>
    </div>
  );
} 