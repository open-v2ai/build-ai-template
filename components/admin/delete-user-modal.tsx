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
      setError(err instanceof Error ? err.message : t('admin.users.messages.getDeleteInfoFailed'));
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
        auth: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      onUserUpdated();
      onClose();
    } catch (err: unknown) {
      console.error(`${action === 'delete' ? 'Delete' : 'Restore'} user failed:`, err);
      setError((err instanceof Error ? err.message : null) || (action === 'delete' ? t('admin.users.messages.deleteUserFailed') : t('admin.users.messages.restoreUserFailed')));
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
            <DialogTitle>{isDeleted ? t('admin.users.restoreUserTitle') : t('admin.users.deleteUserTitle')}</DialogTitle>
          </div>
          <DialogDescription>
            {isDeleted 
              ? t('admin.users.restoreUserDescription')
              : t('admin.users.deleteUserDescription')
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* 用户信息 */}
          <div className="p-3 bg-muted rounded-md">
            <p className="font-medium text-foreground">{user.username || t('common.values.notSet')}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              {user.user_type === 'admin' && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                  {t('admin.users.filters.admin')}
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded ${
                user.is_deleted 
                  ? 'bg-destructive/10 text-destructive' 
                  : 'bg-green-500/10 text-green-600 dark:text-green-400'
              }`}>
                {user.is_deleted ? t('common.status.deleted') : t('common.status.normal')}
              </span>
            </div>
          </div>

          {/* 删除信息 */}
          {!isDeleted && deleteInfo && (
            <div className="space-y-3">
              {deleteInfo.warning && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">{deleteInfo.warning}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-secondary p-2 rounded">
                  <p className="text-muted-foreground">{t('admin.users.table.chatCount')}</p>
                  <p className="font-medium text-foreground">{deleteInfo.chat_count}</p>
                </div>
                <div className="bg-secondary p-2 rounded">
                  <p className="text-muted-foreground">{t('admin.chats.table.messageCount')}</p>
                  <p className="font-medium text-foreground">{deleteInfo.message_count}</p>
                </div>
              </div>
            </div>
          )}

          {/* 确认提示 */}
          <div className="p-3 bg-muted border border-border rounded-md">
            <p className="text-sm text-muted-foreground">
              {isDeleted 
                ? t('admin.users.confirmations.restoreConfirm')
                : t('admin.users.confirmations.deleteConfirm')
              }
            </p>
          </div>

          {/* 按钮 */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              {t('common.actions.cancel')}
            </Button>
            <Button 
              onClick={() => handleAction(isDeleted ? 'restore' : 'delete')}
              disabled={loading}
              variant={isDeleted ? 'default' : 'destructive'}
            >
              {loading ? (isDeleted ? t('admin.users.confirmations.restoring') : t('admin.users.confirmations.deleting')) : (isDeleted ? t('admin.users.confirmations.confirmRestore') : t('admin.users.confirmations.confirmDelete'))}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
