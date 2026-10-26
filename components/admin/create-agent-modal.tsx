'use client';

import { useState, useEffect } from 'react';
import { Bot, Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  model_conf?: Record<string, unknown> | null;
  is_think: boolean;
  is_stream: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

interface AgentFormData {
  name: string;
  source: 'llm' | 'dify' | 'fastgpt' | 'coze' | 'custom';
  api_url: string;
  api_key: string;
  model_conf: string; // JSON string for editing
  is_think: boolean;
  is_stream: boolean;
}

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgentSaved: () => void;
  editingAgent?: Agent | null;
}

export default function CreateAgentModal({ 
  isOpen, 
  onClose, 
  onAgentSaved, 
  editingAgent 
}: CreateAgentModalProps) {
  const t = useTranslations();
  const isEditing = !!editingAgent;
  
  const [formData, setFormData] = useState<AgentFormData>({
    name: '',
    source: 'llm',
    api_url: '',
    api_key: '',
    model_conf: '',
    is_think: false,
    is_stream: true,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  
  // Validation states
  const [nameError, setNameError] = useState('');
  const [apiUrlError, setApiUrlError] = useState('');
  const [apiKeyError, setApiKeyError] = useState('');
  const [modelConfError, setModelConfError] = useState('');

  // Fetch full agent details when editing
  useEffect(() => {
    const fetchAgentDetails = async () => {
      if (editingAgent && isOpen) {
        try {
          setLoading(true);
          const fullAgent = await fetcher<Agent>(`/admin/agents/${editingAgent.id}`, { auth: true });
          
          if (fullAgent) {
            setFormData({
              name: fullAgent.name,
              source: fullAgent.source,
              api_url: fullAgent.api_url,
              api_key: fullAgent.api_key, // 从完整的 agent 数据中获取 API key
              model_conf: fullAgent.model_conf ? JSON.stringify(fullAgent.model_conf, null, 2) : '',
              is_think: fullAgent.is_think,
              is_stream: fullAgent.is_stream,
            });
          }
        } catch (err) {
          console.error('Failed to fetch agent details:', err);
          setError('Failed to load agent details');
        } finally {
          setLoading(false);
        }
      } else if (!editingAgent) {
        // Reset form for new agent
        setFormData({
          name: '',
          source: 'llm',
          api_url: '',
          api_key: '',
          model_conf: '',
          is_think: false,
          is_stream: true,
        });
      }
      
      // Clear errors when modal opens/closes
      setError(null);
      setNameError('');
      setApiUrlError('');
      setApiKeyError('');
      setModelConfError('');
    };

    fetchAgentDetails();
  }, [editingAgent, isOpen]);

  // Validation functions
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateForm = () => {
    let isValid = true;
    
    // Reset errors
    setNameError('');
    setApiUrlError('');
    setApiKeyError('');
    setModelConfError('');
    
    // Validate name
    if (!formData.name?.trim()) {
      setNameError(t('admin.agents.validation.agentNameRequired'));
      isValid = false;
    }
    
    // Validate API URL
    if (!formData.api_url?.trim()) {
      setApiUrlError(t('admin.agents.validation.apiUrlRequired'));
      isValid = false;
    } else if (!isValidUrl(formData.api_url)) {
      setApiUrlError('Please enter a valid URL');
      isValid = false;
    }
    
    // Validate API Key
    if (!formData.api_key?.trim()) {
      setApiKeyError(t('admin.agents.validation.apiKeyRequired'));
      isValid = false;
    }
    
    // Validate model config JSON
    if (formData.model_conf?.trim()) {
      try {
        JSON.parse(formData.model_conf);
      } catch {
        setModelConfError(t('admin.agents.validation.modelConfInvalid'));
        isValid = false;
      }
    }
    
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const url = isEditing 
        ? `/admin/agents/${editingAgent!.id}`
        : '/admin/agents';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      // Prepare data with parsed model_conf
      const submitData = {
        ...formData,
        model_conf: formData.model_conf?.trim() ? JSON.parse(formData.model_conf) : null,
      };
      
      await fetcher(url, {
        method,
        auth: true,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });
      
      onAgentSaved();
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        source: 'llm',
        api_url: '',
        api_key: '',
        model_conf: '',
        is_think: false,
        is_stream: true,
      });
    } catch (err: unknown) {
      console.error('Failed to save agent:', err);
      
      // 获取具体的错误信息
      let errorMessage = isEditing ? t('admin.agents.messages.updateAgentFailed') : t('admin.agents.messages.createAgentFailed');
      
      if (err instanceof Error) {
        // 优先使用后端返回的具体错误信息
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof AgentFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation errors when user starts typing
    if (field === 'name' && nameError) setNameError('');
    if (field === 'api_url' && apiUrlError) setApiUrlError('');
    if (field === 'api_key' && apiKeyError) setApiKeyError('');
    if (field === 'model_conf' && modelConfError) setModelConfError('');
  };

  const getSourcePresetUrls = (source: string) => {
    switch (source) {
      case 'llm':
        return 'https://api.openai.com/v1/chat/completions';
      case 'dify':
        return 'https://api.dify.ai/v1/chat-messages';
      case 'fastgpt':
        return 'https://api.fastgpt.ai/api/v1/chat/completions';
      case 'coze':
        return 'https://api.coze.com/open_api/v2/chat';
      case 'custom':
        return 'https://api.openai.com/v1/chat/completions';
      default:
        return '';
    }
  };

  const handleSourceChange = (source: 'llm' | 'dify' | 'fastgpt' | 'coze' | 'custom') => {
    const presetUrl = getSourcePresetUrls(source);
    setFormData(prev => ({
      ...prev,
      source,
      api_url: presetUrl || prev.api_url,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            {isEditing ? t('admin.agents.editAgent') : t('admin.agents.createAgent')}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? t('admin.agents.editAgentDescription') : t('admin.agents.createAgentDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-md">
              {error}
            </div>
          )}

          {/* Agent Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              {t('admin.agents.fields.agentName')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder={t('admin.agents.placeholders.agentNamePlaceholder')}
              className={nameError ? 'border-red-500' : ''}
            />
            {nameError && (
              <p className="text-sm text-red-600">{nameError}</p>
            )}
          </div>

          {/* Source */}
          <div className="space-y-2">
            <Label htmlFor="source">{t('admin.agents.fields.agentSource')}</Label>
            <select
              id="source"
              value={formData.source}
              onChange={(e) => handleSourceChange(e.target.value as 'llm' | 'dify' | 'fastgpt' | 'coze' | 'custom')}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
            >
              <option value="llm">{t('admin.agents.sources.llm')}</option>
              <option value="dify">{t('admin.agents.sources.dify')}</option>
              <option value="fastgpt">{t('admin.agents.sources.fastgpt')}</option>
              <option value="coze">{t('admin.agents.sources.coze')}</option>
              <option value="custom">{t('admin.agents.sources.custom')}</option>
            </select>
          </div>

          {/* API URL */}
          <div className="space-y-2">
            <Label htmlFor="api_url">
              {t('admin.agents.fields.apiUrl')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="api_url"
              value={formData.api_url}
              onChange={(e) => handleInputChange('api_url', e.target.value)}
              placeholder={t('agent.apiUrlPlaceholder')}
              className={apiUrlError ? 'border-red-500' : ''}
            />
            {apiUrlError && (
              <p className="text-sm text-red-600">{apiUrlError}</p>
            )}
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="api_key">
              {t('agent.apiKey')} <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="api_key"
                type={showApiKey ? 'text' : 'password'}
                value={formData.api_key}
                onChange={(e) => handleInputChange('api_key', e.target.value)}
                placeholder={t('agent.apiKeyPlaceholder')}
                className={`pr-10 ${apiKeyError ? 'border-red-500' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showApiKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {apiKeyError && (
              <p className="text-sm text-red-600">{apiKeyError}</p>
            )}
          </div>

          {/* Model Configuration */}
          <div className="space-y-2">
            <Label htmlFor="model_conf">{t('agent.modelConf')}</Label>
            <textarea
              id="model_conf"
              value={formData.model_conf}
              onChange={(e) => handleInputChange('model_conf', e.target.value)}
              placeholder={t('agent.modelConfPlaceholder')}
              className={`w-full p-2 border rounded-md min-h-[100px] font-mono text-xs ${
                modelConfError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-800`}
            />
            {modelConfError && (
              <p className="text-sm text-red-600">{modelConfError}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Optional: Enter model configuration as JSON. Leave empty to use defaults.
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                id="is_think"
                type="checkbox"
                checked={formData.is_think}
                onChange={(e) => handleInputChange('is_think', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="is_think" className="text-sm font-normal">
                {t('agent.showThinking')}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="is_stream"
                type="checkbox"
                checked={formData.is_stream}
                onChange={(e) => handleInputChange('is_stream', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="is_stream" className="text-sm font-normal">
                {t('agent.useStreaming')}
              </Label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              {t('ui.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? t('agent.creatingAgent') : (isEditing ? t('ui.save') : t('agent.createAgentButton'))}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
