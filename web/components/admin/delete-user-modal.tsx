'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Trash2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { fetcher } from '@/util/fetcher';
import type { User, UserActionRequest, DeleteCheckResponse } from '@/app/[locale]/admin/types';

interface DeleteUserModalProps {
  user: User | null;
  onClose: () => void;
  onUserUpdated: () => void;
}

export default function DeleteUserModal({ user, onClose, onUserUpdated }: DeleteUserModalProps) {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteInfo, setDeleteInfo] = useState<DeleteCheckResponse | null>(null);


  const fetchDeleteInfo = useCallback(async () => {
    if (!user) return;
    
    try {
      const info = await fetcher(`/admin/users/${user.id}/delete-check`, {
        method: 'GET',
        auth: true,
      });
      setDeleteInfo(info as DeleteCheckResponse);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('GET_DELETE_INFO_FAILED'));
    }
  }, [user, t]);

  useEffect(() => {
    if (user && !user.is_deleted) {
      fetchDeleteInfo();
    }
  }, [user, fetchDeleteInfo]);

  const handleAction = async (action: 'delete' | 'restore') => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const requestData: UserActionRequest = {
        action,
      };

      await fetcher(`/admin/users/${user.id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
        auth: true,
      });

      onUserUpdated();
      onClose();
    } catch (err: unknown) {
      console.error(`${action === 'delete' ? '删除' : '恢复'}用户失败:`, err);
      setError((err instanceof Error ? err.message : null) || (action === 'delete' ? t('DELETE_USER_FAILED') : t('RESTORE_USER_FAILED')));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setDeleteInfo(null);
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleClose();
    }
  };

  if (!user) return null;

  const isDeleted = user.is_deleted;
  const actionIcon = isDeleted ? <RotateCcw className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />;
  const actionColor = isDeleted ? 'text-green-600' : 'text-red-600';

  return (
    <Dialog open={!!user} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className={`flex items-center gap-2 ${actionColor}`}>
            {actionIcon}
            <DialogTitle>{isDeleted ? t('RESTORE_USER_TITLE') : t('DELETE_USER_TITLE')}</DialogTitle>
          </div>
          <DialogDescription>
            {isDeleted 
              ? t('RESTORE_USER_DESCRIPTION')
              : t('DELETE_USER_DESCRIPTION')
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 用户信息 */}
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="font-medium">{user.name || t('NOT_SET')}</p>
            <p className="text-sm text-gray-600">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              {(user.user_type === 'admin' || user.user_type === 'super_admin') && (
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                  {t('ADMIN_USER')}
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded ${
                user.is_deleted 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {user.is_deleted ? t('DELETED') : t('NORMAL')}
              </span>
            </div>
          </div>

          {/* 删除信息 */}
          {!isDeleted && deleteInfo && (
            <div className="space-y-3">
              {deleteInfo.warning && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-yellow-800">{deleteInfo.warning}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-blue-50 p-2 rounded">
                  <p className="text-gray-600">{t('CHAT_COUNT')}</p>
                  <p className="font-medium">{deleteInfo.chat_count}</p>
                </div>
                <div className="bg-blue-50 p-2 rounded">
                  <p className="text-gray-600">{t('MESSAGE_COUNT')}</p>
                  <p className="font-medium">{deleteInfo.message_count}</p>
                </div>
              </div>
            </div>
          )}



          {/* 确认提示 */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
            <p className="text-sm text-gray-700">
              {isDeleted 
                ? t('RESTORE_CONFIRM')
                : t('DELETE_CONFIRM')
              }
            </p>
          </div>

          {/* 按钮 */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              {t('CANCEL')}
            </Button>
            <Button 
              onClick={() => handleAction(isDeleted ? 'restore' : 'delete')}
              disabled={loading}
              variant={isDeleted ? 'default' : 'destructive'}
            >
              {loading ? (isDeleted ? t('RESTORING') : t('DELETING')) : (isDeleted ? t('CONFIRM_RESTORE') : t('CONFIRM_DELETE'))}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
