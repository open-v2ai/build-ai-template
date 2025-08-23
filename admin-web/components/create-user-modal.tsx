'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { fetcher } from '@/util/fetcher';
import type { UserCreateRequest } from '@/app/[locale]/types';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

export default function CreateUserModal({ isOpen, onClose, onUserCreated }: CreateUserModalProps) {
  const t = useTranslations();
  const [formData, setFormData] = useState<UserCreateRequest>({
    email: '',
    name: '',
    is_admin: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      setError(t('EMAIL_REQUIRED'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await fetcher('/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        auth: true,
      });

      // 重置表单
      setFormData({
        email: '',
        name: '',
        is_admin: false,
      });
      
      onUserCreated();
      onClose();
    } catch (err: any) {
      console.error('创建用户失败:', err);
      setError(err.message || t('CREATE_USER_FAILED'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      email: '',
      name: '',
      is_admin: false,
    });
    setError(null);
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <DialogTitle>{t('CREATE_NEW_USER')}</DialogTitle>
          </div>
          <DialogDescription>
            {t('CREATE_USER_DESCRIPTION')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* 邮箱 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('EMAIL_ADDRESS')} <span className="text-red-500">{t('REQUIRED')}</span>
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={t('EMAIL_PLACEHOLDER')}
                required
                className="w-full"
              />
            </div>

            {/* 用户名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('USERNAME_OPTIONAL')}
              </label>
              <Input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('USERNAME_PLACEHOLDER')}
                className="w-full"
              />
            </div>

            {/* 管理员权限 */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_admin"
                checked={formData.is_admin}
                onChange={(e) => setFormData({ ...formData, is_admin: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="is_admin" className="text-sm font-medium text-gray-700">
                {t('SET_AS_ADMIN')}
              </label>
            </div>

            {formData.is_admin && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  {t('ADMIN_WARNING')}
                </p>
              </div>
            )}
          </div>

          {/* 按钮 */}
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={handleClose}>
              {t('CANCEL')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('CREATING') : t('CREATE')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
