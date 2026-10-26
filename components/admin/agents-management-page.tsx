'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'

import { Search, Bot, Edit2, Plus, Trash2, RotateCcw, Eye, EyeOff, Zap, ZapOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import AgentAvailabilityStatus from '@/components/admin/agent-availability-status'
import CreateAgentModal from '@/components/admin/create-agent-modal'
import DeleteAgentModal from '@/components/admin/delete-agent-modal'
import { fetcher } from '@/util/fetcher'
import { formatDateTime } from '@/util/dateFormat'

// Types for Agent Management
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

interface AgentSearchParams {
  name?: string;
  source?: string;
  is_deleted?: boolean;
  limit: number;
  offset: number;
  sort_by?: string;
  sort_order?: string;
}

interface AgentUpdateRequest {
  name: string;
  source: 'llm' | 'dify' | 'fastgpt' | 'coze' | 'custom';
  api_url: string;
  api_key: string;
  model_conf?: Record<string, unknown> | null;
  is_think: boolean;
  is_stream: boolean;
}

interface AgentListResponse {
  agents: Agent[];
  total: number;
  limit: number;
  offset: number;
  has_next: boolean;
  has_prev: boolean;
  total_pages: number;
  current_page: number;
}

interface AgentRowProps {
  agent: Agent;
  onUpdate: (agentId: number, updates: AgentUpdateRequest) => void;
  onDelete: (agent: Agent) => void;
  onEdit: (agent: Agent) => void;
  onCreate?: () => void;
  showCreateButton?: boolean;
}

function AgentRow({ agent, onUpdate, onDelete, onEdit, onCreate, showCreateButton }: AgentRowProps) {
  const t = useTranslations();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<AgentUpdateRequest>({
    name: agent.name,
    source: agent.source,
    api_url: agent.api_url,
    api_key: agent.api_key,
    model_conf: agent.model_conf,
    is_think: agent.is_think,
    is_stream: agent.is_stream,
  });

  const handleSave = () => {
    onUpdate(agent.id, editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      name: agent.name,
      source: agent.source,
      api_url: agent.api_url,
      api_key: agent.api_key,
      model_conf: agent.model_conf,
      is_think: agent.is_think,
      is_stream: agent.is_stream,
    });
    setIsEditing(false);
  };

  const getSourceIcon = () => {
    return <Bot className="w-3 h-3 mr-1" />;
  };

  const getSourceText = (source: string) => {
    switch (source) {
      case 'llm':
        return t('admin.agents.sources.llm');
      case 'dify':
        return t('admin.agents.sources.dify');
      case 'fastgpt':
        return t('admin.agents.sources.fastgpt');
      case 'coze':
        return t('admin.agents.sources.coze');
      case 'custom':
        return t('admin.agents.sources.custom');
      default:
        return source;
    }
  };

  const maskApiKey = (apiKey: string | null | undefined) => {
    if (!apiKey || apiKey.length <= 8) return '***';
    return apiKey.slice(0, 4) + '***' + apiKey.slice(-4);
  };

  return (
    <TableRow className="hover:bg-muted/50 h-16">
      {/* ID */}
      <TableCell className="text-sm text-foreground">{agent.id}</TableCell>

      {/* Agent Name */}
      <TableCell className="text-sm text-foreground">
        {isEditing ? (
          <Input
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            className="w-full text-sm"
            placeholder={t('agent.namePlaceholder')}
          />
        ) : (
          <div className="flex items-center">
            <Bot className="w-4 h-4 mr-2 text-blue-500" />
            <span className="text-sm text-foreground">{agent.name}</span>
          </div>
        )}
      </TableCell>

      {/* Source */}
      <TableCell className="text-sm text-foreground">
        {isEditing ? (
          <select
            value={editData.source}
            onChange={(e) => setEditData({ ...editData, source: e.target.value as 'llm' | 'dify' | 'fastgpt' | 'coze' | 'custom' })}
            className="w-full text-sm border border-border rounded px-2 py-1 bg-background"
          >
            <option value="llm">{t('source.llm')}</option>
            <option value="dify">{t('source.dify')}</option>
            <option value="fastgpt">{t('source.fastgpt')}</option>
            <option value="coze">{t('source.coze')}</option>
            <option value="custom">{t('source.custom')}</option>
          </select>
        ) : (
          <div className="flex items-center">
            {getSourceIcon()}
            <span className="text-sm text-foreground">{getSourceText(agent.source)}</span>
          </div>
        )}
      </TableCell>

      {/* API URL */}
      <TableCell className="text-sm text-foreground">
        {isEditing ? (
          <Input
            value={editData.api_url}
            onChange={(e) => setEditData({ ...editData, api_url: e.target.value })}
            className="w-full text-sm"
            placeholder={t('agent.apiUrlPlaceholder')}
          />
        ) : (
          <span className="text-sm text-muted-foreground truncate max-w-xs" title={agent.api_url}>
            {agent.api_url}
          </span>
        )}
      </TableCell>

      {/* API Key */}
      <TableCell className="text-sm text-foreground">
        {isEditing ? (
          <Input
            type="password"
            value={editData.api_key}
            onChange={(e) => setEditData({ ...editData, api_key: e.target.value })}
            className="w-full text-sm"
            placeholder={t('agent.apiKeyPlaceholder')}
          />
        ) : (
          <span className="text-sm text-muted-foreground font-mono">
            {maskApiKey(agent.api_key)}
          </span>
        )}
      </TableCell>

      {/* Model Config */}
      <TableCell className="text-sm text-foreground">
        {isEditing ? (
          <textarea
            value={editData.model_conf ? JSON.stringify(editData.model_conf, null, 2) : ''}
            onChange={(e) => {
              try {
                const parsed = e.target.value ? JSON.parse(e.target.value) : null;
                setEditData({ ...editData, model_conf: parsed });
              } catch {
                // Invalid JSON, keep as null to allow continued editing
                // The textarea value will still show the user's input
                setEditData({ ...editData, model_conf: null });
              }
            }}
            className="w-full text-xs border border-border rounded px-2 py-1 bg-background font-mono h-16 resize-none"
            placeholder={t('agent.modelConfPlaceholder')}
          />
        ) : (
          <div className="text-xs text-muted-foreground">
            {agent.model_conf ? (
              <div className="font-mono max-w-xs">
                <details className="cursor-pointer">
                  <summary className="text-blue-600 dark:text-blue-400 hover:underline">
                    View Config
                  </summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                    {JSON.stringify(agent.model_conf, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <span className="text-gray-400">No config</span>
            )}
          </div>
        )}
      </TableCell>

      {/* Thinking Mode */}
      <TableCell className="text-sm text-foreground">
        {isEditing ? (
          <input
            type="checkbox"
            checked={editData.is_think}
            onChange={(e) => setEditData({ ...editData, is_think: e.target.checked })}
            className="rounded"
          />
        ) : (
          <div className="flex items-center">
            {agent.is_think ? (
              <Eye className="w-4 h-4 text-green-500" />
            ) : (
              <EyeOff className="w-4 h-4 text-gray-400" />
            )}
            <span className="ml-1 text-sm text-gray-700 dark:text-gray-300">
              {agent.is_think ? t('ui.enabled') : t('ui.disabled')}
            </span>
          </div>
        )}
      </TableCell>

      {/* Stream Mode */}
      <TableCell className="text-sm text-foreground">
        {isEditing ? (
          <input
            type="checkbox"
            checked={editData.is_stream}
            onChange={(e) => setEditData({ ...editData, is_stream: e.target.checked })}
            className="rounded"
          />
        ) : (
          <div className="flex items-center">
            {agent.is_stream ? (
              <Zap className="w-4 h-4 text-blue-500" />
            ) : (
              <ZapOff className="w-4 h-4 text-gray-400" />
            )}
            <span className="ml-1 text-sm text-gray-700 dark:text-gray-300">
              {agent.is_stream ? t('ui.enabled') : t('ui.disabled')}
            </span>
          </div>
        )}
      </TableCell>

      {/* Status */}
      <TableCell className="text-sm text-foreground">
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${agent.is_deleted ? 'bg-red-500' : 'bg-green-500'}`}></div>
          <span className={`text-sm ${agent.is_deleted ? 'text-red-600' : 'text-green-600'}`}>
            {agent.is_deleted ? t('ui.deleted') : t('ui.normal')}
          </span>
        </div>
      </TableCell>

      {/* Availability */}
      <TableCell className="text-sm text-foreground">
        <AgentAvailabilityStatus agentId={agent.id} agentName={agent.name} />
      </TableCell>

      {/* Created Time */}
      <TableCell className="text-sm text-muted-foreground">
        {formatDateTime(agent.created_at)}
      </TableCell>

      {/* Actions */}
      <TableCell className="text-sm text-foreground">
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <Button size="sm" onClick={handleSave}>
                {t('ui.save')}
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                {t('ui.cancel')}
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(agent)}
                title={t('agent.editAgent')}
              >
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant={agent.is_deleted ? "outline" : "destructive"}
                onClick={() => onDelete(agent)}
                title={agent.is_deleted ? t('agent.restoreAgent') : t('agent.deleteAgent')}
              >
                {agent.is_deleted ? (
                  <RotateCcw className="w-3 h-3" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
              </Button>
              {showCreateButton && onCreate && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onCreate}
                  title={t('agent.createAgent')}
                  className="ml-1"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              )}
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function AgentsManagementPage() {
  const t = useTranslations();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paginationInfo, setPaginationInfo] = useState({
    total: 0,
    total_pages: 0,
    current_page: 1,
    has_next: false,
    has_prev: false,
  });
  const [searchParams, setSearchParams] = useState<AgentSearchParams>({
    limit: 10,
    offset: 0,
    sort_by: 'id',
    sort_order: 'asc',
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [deletingAgent, setDeletingAgent] = useState<Agent | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const url = `/admin/agents?${queryParams.toString()}`;
      const response = await fetcher<AgentListResponse>(url, { auth: true });

      if (response) {
        setAgents(response.agents || []);
        setPaginationInfo({
          total: response.total || 0,
          total_pages: response.total_pages || 0,
          current_page: response.current_page || 1,
          has_next: response.has_next || false,
          has_prev: response.has_prev || false,
        });
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err);
      setError('Failed to load agent data');
      setAgents([]);
      setPaginationInfo({
        total: 0,
        total_pages: 0,
        current_page: 1,
        has_next: false,
        has_prev: false,
      });
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handlePageChange = (page: number) => {
    const newOffset = (page - 1) * searchParams.limit;
    setSearchParams(prev => ({
      ...prev,
      offset: newOffset,
    }));
  };

  const handleUpdateAgent = async (agentId: number, updates: AgentUpdateRequest) => {
    try {
      await fetcher(`/admin/agents/${agentId}`, {
        method: 'PUT',
        auth: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      fetchAgents();
    } catch (err) {
      console.error('Failed to update agent:', err);
      setError('Failed to update agent');
    }
  };

  const handleDeleteAgent = (agent: Agent) => {
    setDeletingAgent(agent);
  };

  const handleCreateAgent = () => {
    setShowCreateModal(true);
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
  };

  const startRecord = searchParams.offset + 1;
  const endRecord = Math.min(searchParams.offset + searchParams.limit, paginationInfo.total);

  return (
    <div className="p-6 max-w-full mx-auto overflow-x-hidden">
      {/* 搜索和筛选 */}
      <div className="bg-card rounded-lg p-6 shadow-sm border border-border mb-6">
        <form onSubmit={(e) => {
          e.preventDefault();
          fetchAgents();
        }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('agent.agentSearch')}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={t('agent.namePlaceholder')}
                  className="pl-10"
                  value={searchParams.name || ''}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, name: e.target.value || undefined }))}
                />
              </div>
            </div>

            {/* Source Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('agent.source')}</label>
              <select
                value={searchParams.source || ''}
                onChange={(e) => {
                  setSearchParams(prev => ({ ...prev, source: e.target.value || undefined, offset: 0 }));
                }}
                className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
              >
                <option value="">{t('ui.all')}</option>
                <option value="llm">{t('source.llm')}</option>
                <option value="dify">{t('source.dify')}</option>
                <option value="fastgpt">{t('source.fastgpt')}</option>
                <option value="coze">{t('source.coze')}</option>
                <option value="custom">{t('source.custom')}</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('table.status')}</label>
              <select
                value={searchParams.is_deleted === undefined ? '' : searchParams.is_deleted.toString()}
                onChange={(e) => {
                  setSearchParams(prev => ({
                    ...prev,
                    is_deleted: e.target.value === '' ? undefined : e.target.value === 'true',
                    offset: 0
                  }));
                }}
                className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
              >
                <option value="">{t('ui.all')}</option>
                <option value="false">{t('ui.normal')}</option>
                <option value="true">{t('ui.deleted')}</option>
              </select>
            </div>

            {/* Sort By Field */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('admin.agents.sort.sortBy')}</label>
              <select
                value={searchParams.sort_by || 'id'}
                onChange={(e) => {
                  setSearchParams(prev => ({ ...prev, sort_by: e.target.value, offset: 0 }));
                }}
                className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
              >
                <option value="id">{t('admin.agents.sort.fields.id')}</option>
                <option value="name">{t('admin.agents.sort.fields.name')}</option>
                <option value="source">{t('admin.agents.sort.fields.source')}</option>
                <option value="created_at">{t('admin.agents.sort.fields.created_at')}</option>
                <option value="updated_at">{t('admin.agents.sort.fields.updated_at')}</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('admin.agents.sort.sortOrder')}</label>
              <select
                value={searchParams.sort_order || 'asc'}
                onChange={(e) => {
                  setSearchParams(prev => ({ ...prev, sort_order: e.target.value, offset: 0 }));
                }}
                className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
              >
                <option value="asc">{t('admin.agents.sort.directions.asc')}</option>
                <option value="desc">{t('admin.agents.sort.directions.desc')}</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button type="submit" className="w-full">{t('ui.search')}</Button>
            </div>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-purple-500/10 via-violet-500/5 to-purple-500/10 backdrop-blur-sm border-b border-purple-500/20">
                <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[60px]">
                  {t('table.id')}
                </TableHead>
                <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[120px]">
                  {t('agent.name')}
                </TableHead>
                <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[80px]">
                  {t('agent.source')}
                </TableHead>
                <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[150px]">
                  {t('agent.apiUrl')}
                </TableHead>
                <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[100px]">
                  {t('agent.apiKey')}
                </TableHead>
                <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[100px]">
                  {t('agent.modelConf')}
                </TableHead>
                <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[100px]">
                  {t('agent.thinkingMode')}
                </TableHead>
                <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[100px]">
                  {t('agent.streamMode')}
                </TableHead>
                <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[80px]">
                  {t('table.status')}
                </TableHead>
                <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[100px]">
                  {t('agent.availability')}
                </TableHead>
                <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[140px]">
                  {t('table.createdTime')}
                </TableHead>
                <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[80px]">
                  {t('table.actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={12} className="py-8 text-center text-muted-foreground">
                    {t('ui.loading')}
                  </TableCell>
                </TableRow>
              ) : agents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="py-8 text-center text-muted-foreground">
                    {t('agent.noAgentData')}
                  </TableCell>
                </TableRow>
              ) : (
                agents.map((agent) => (
                  <AgentRow
                    key={agent.id}
                    agent={agent}
                    onUpdate={handleUpdateAgent}
                    onDelete={handleDeleteAgent}
                    onEdit={handleEditAgent}
                    onCreate={handleCreateAgent}
                    showCreateButton={true}
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
              onClick={() => handlePageChange(paginationInfo.current_page - 1)}
              disabled={!paginationInfo.has_prev}
            >
              {t('pagination.previousPage')}
            </Button>
            <div className="text-sm text-muted-foreground flex items-center">
              {t('common.pagination.pageInfo', { current: paginationInfo.current_page, total: paginationInfo.total_pages })}
            </div>
            <Button
              variant="outline"
              onClick={() => handlePageChange(paginationInfo.current_page + 1)}
              disabled={!paginationInfo.has_next}
            >
              {t('pagination.nextPage')}
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('common.pagination.showRecordsWithTotal', {
                  start: startRecord,
                  end: endRecord,
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
                  onClick={() => handlePageChange(paginationInfo.current_page - 1)}
                  disabled={!paginationInfo.has_prev}
                >
                  {t('pagination.previousPage')}
                </Button>
                <Button
                  className="shadow-sm"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(paginationInfo.current_page + 1)}
                  disabled={!paginationInfo.has_next}
                >
                  {t('pagination.nextPage')}
                </Button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateAgentModal
        isOpen={showCreateModal || !!editingAgent}
        onClose={() => {
          setShowCreateModal(false);
          setEditingAgent(null);
        }}
        onAgentSaved={fetchAgents}
        editingAgent={editingAgent}
      />

      <DeleteAgentModal
        agent={deletingAgent}
        onClose={() => setDeletingAgent(null)}
        onAgentUpdated={fetchAgents}
      />
    </div>
  );
}
