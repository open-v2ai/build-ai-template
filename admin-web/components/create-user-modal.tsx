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
    user_type: 'normal',
    membership_type: 'free',
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
        user_type: 'normal',
        membership_type: 'free',
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
      user_type: 'normal',
      membership_type: 'free',
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

            {/* 用户类型 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('USER_TYPE')}
              </label>
              <select
                value={formData.user_type}
                onChange={(e) => setFormData({ ...formData, user_type: e.target.value as any })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900"
              >
                <option value="normal">{t('NORMAL_USER')}</option>
                <option value="premium">{t('PREMIUM_USER')}</option>
                <option value="admin">{t('ADMIN_USER')}</option>
                <option value="super_admin">{t('SUPER_ADMIN_USER')}</option>
              </select>
            </div>

            {/* 会员类型 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('MEMBERSHIP_TYPE')}
              </label>
              <select
                value={formData.membership_type}
                onChange={(e) => setFormData({ ...formData, membership_type: e.target.value as any })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900"
              >
                <option value="free">{t('FREE_MEMBERSHIP')}</option>
                <option value="monthly">{t('MONTHLY_MEMBERSHIP')}</option>
                <option value="yearly">{t('YEARLY_MEMBERSHIP')}</option>
                <option value="lifetime">{t('LIFETIME_MEMBERSHIP')}</option>
              </select>
            </div>

            {(formData.user_type === 'admin' || formData.user_type === 'super_admin') && (
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
