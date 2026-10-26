'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle, XCircle, Loader2, Clock, Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fetcher } from '@/util/fetcher';

interface AvailabilityResult {
  status: 'success' | 'error';
  message: string;
  response_time?: number;
  details?: {
    model?: string;
    response_content?: string;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    } | null;
    error_type?: string;
    error_message?: string;
    agent_config?: {
      api_url: string;
      model: string;
    };
  };
}

interface AgentAvailabilityStatusProps {
  agentId: number;
  agentName: string;
}

export default function AgentAvailabilityStatus({ agentId, agentName }: AgentAvailabilityStatusProps) {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AvailabilityResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const testAvailability = async () => {
    setIsLoading(true);
    try {
      const response = await fetcher<AvailabilityResult>(`/chat/agents/${agentId}/test`, {
        method: 'POST',
        auth: true,
      });
      if (response) {
        setResult(response);
      }
    } catch (error) {
      console.error('Failed to test agent availability:', error);
      setResult({
        status: 'error',
        message: 'Test request failed',
        details: {
          error_type: 'NetworkError',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (isLoading) {
      return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    }
    
    if (!result) {
      return <div className="w-4 h-4 rounded-full bg-gray-300" />;
    }
    
    return result.status === 'success' 
      ? <CheckCircle className="w-4 h-4 text-green-500" />
      : <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusText = () => {
    if (isLoading) return t('agent.testing');
    if (!result) return t('agent.untested');
    return result.status === 'success' ? t('agent.available') : t('agent.unavailable');
  };

  const getStatusColor = () => {
    if (isLoading) return 'text-blue-600';
    if (!result) return 'text-gray-500';
    return result.status === 'success' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={testAvailability}
          disabled={isLoading}
          className="flex items-center space-x-1 p-1 h-auto"
          title={t('agent.testAvailability')}
        >
          {getStatusIcon()}
          <span className={`text-xs ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </Button>
        
        {result && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowDetails(true)}
            className="p-1 h-auto"
            title={t('agent.viewDetails')}
          >
            <Info className="w-3 h-3 text-gray-500" />
          </Button>
        )}
      </div>

      {/* 详情弹窗 */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {getStatusIcon()}
              <span>{t('agent.availabilityDetails')} - {agentName}</span>
            </DialogTitle>
          </DialogHeader>
          
          {result && (
            <div className="space-y-4">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('agent.status')}
                  </label>
                  <div className={`text-sm ${getStatusColor()} font-medium`}>
                    {result.status === 'success' ? t('agent.available') : t('agent.unavailable')}
                  </div>
                </div>
                
                {result.response_time && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('agent.responseTime')}
                    </label>
                    <div className="text-sm text-gray-900 dark:text-gray-100 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {result.response_time}ms
                    </div>
                  </div>
                )}
              </div>

              {/* 消息 */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('agent.message')}
                </label>
                <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  {result.message}
                </div>
              </div>

              {/* 成功时的详细信息 */}
              {result.status === 'success' && result.details && (
                <div className="space-y-3">
                  {result.details.model && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('agent.model')}
                      </label>
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {result.details.model}
                      </div>
                    </div>
                  )}
                  
                  {result.details.response_content && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('agent.responseContent')}
                      </label>
                      <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-2 rounded font-mono">
                        {result.details.response_content}
                      </div>
                    </div>
                  )}
                  
                  {result.details.usage && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('agent.tokenUsage')}
                      </label>
                      <div className="text-sm text-gray-900 dark:text-gray-100 grid grid-cols-3 gap-2">
                        <div>Prompt: {result.details.usage.prompt_tokens}</div>
                        <div>Completion: {result.details.usage.completion_tokens}</div>
                        <div>Total: {result.details.usage.total_tokens}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 错误时的详细信息 */}
              {result.status === 'error' && result.details && (
                <div className="space-y-3">
                  {result.details.error_type && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('agent.errorType')}
                      </label>
                      <div className="text-sm text-red-600 dark:text-red-400">
                        {result.details.error_type}
                      </div>
                    </div>
                  )}
                  
                  {result.details.error_message && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('agent.errorMessage')}
                      </label>
                      <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded font-mono">
                        {result.details.error_message}
                      </div>
                    </div>
                  )}
                  
                  {result.details.agent_config && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('agent.configuration')}
                      </label>
                      <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                        <div>API URL: {result.details.agent_config.api_url}</div>
                        <div>Model: {result.details.agent_config.model}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
