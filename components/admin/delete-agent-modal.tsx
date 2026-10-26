'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Trash2, RotateCcw, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { fetcher } from '@/util/fetcher';

interface Agent {
  id: number;
  name: string;
  source: 'llm' | 'dify' | 'fastgpt' | 'coze' | 'custom';
  api_url: string;
  api_key: string;
  is_think: boolean;
  is_stream: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

interface DeleteAgentModalProps {
  agent: Agent | null;
  onClose: () => void;
  onAgentUpdated: () => void;
}

export default function DeleteAgentModal({ agent, onClose, onAgentUpdated }: DeleteAgentModalProps) {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRestore = agent?.is_deleted === true;
  const action = isRestore ? 'restore' : 'delete';

  const handleAction = async () => {
    if (!agent) return;

    setLoading(true);
    setError(null);

    try {
      await fetcher(`/admin/agents/${agent.id}/actions`, {
        method: 'POST',
        auth: true,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
        }),
      });

      onAgentUpdated();
      onClose();
    } catch (err: unknown) {
      console.error(`Failed to ${action} agent:`, err);
      setError(isRestore ? t('agent.restoreAgentFailed') : t('agent.deleteAgentFailed'));
    } finally {
      setLoading(false);
    }
  };

  const getSourceText = (source: string) => {
    switch (source) {
      case 'dify':
        return t('source.dify');
      case 'fastgpt':
        return t('source.fastgpt');
      case 'coze':
        return t('source.coze');
      case 'custom':
        return t('source.custom');
      default:
        return source;
    }
  };

  if (!agent) return null;

  return (
    <Dialog open={!!agent} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isRestore ? (
              <RotateCcw className="w-5 h-5 text-green-600" />
            ) : (
              <Trash2 className="w-5 h-5 text-red-600" />
            )}
            {isRestore ? t('agent.restoreAgent') : t('agent.deleteAgent')}
          </DialogTitle>
          <DialogDescription>
            {isRestore ? t('agent.restoreAgentDescription') : t('agent.deleteAgentDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-md">
              {error}
            </div>
          )}

          {/* Agent Info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Bot className="w-6 h-6 text-blue-500" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  {agent.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {getSourceText(agent.source)}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">{t('agent.apiUrl')}:</span>
                <p className="font-mono text-xs truncate" title={agent.api_url}>
                  {agent.api_url}
                </p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">{t('table.status')}:</span>
                <p className={agent.is_deleted ? 'text-red-600' : 'text-green-600'}>
                  {agent.is_deleted ? t('ui.deleted') : t('ui.normal')}
                </p>
              </div>
            </div>
          </div>

          {/* Confirmation */}
          <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="text-sm">
              <p className="text-yellow-800 dark:text-yellow-200">
                {isRestore ? t('agent.restoreAgentConfirm') : t('agent.deleteAgentConfirm')}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              {t('ui.cancel')}
            </Button>
            <Button
              variant={isRestore ? "default" : "destructive"}
              onClick={handleAction}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isRestore ? (
                <RotateCcw className="w-4 h-4" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {loading 
                ? t('ui.loading') 
                : isRestore 
                  ? t('agent.restoreAgent') 
                  : t('agent.deleteAgent')
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
