'use client';

import { useState } from 'react';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { fetcher } from '@/util/fetcher';
import type { UserCreateRequest } from '@/app/[locale]/admin/types';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

export default function CreateUserModal({ isOpen, onClose, onUserCreated }: CreateUserModalProps) {
  const t = useTranslations();
  const [formData, setFormData] = useState<UserCreateRequest>({
    email: '',
    username: '',
    password: '',
    user_type: 'normal',
    membership_type: 'free',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Validation states
  const [emailError, setEmailError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Validation functions
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidUsername = (username: string) => {
    if (!username || username.length < 4 || username.length > 12) {
      return false;
    }
    return /^[a-zA-Z0-9_]+$/.test(username);
  };

  const isValidPassword = (password: string) => {
    return password && password.length >= 6;
  };

  // Validation handlers
  const handleEmailBlur = () => {
    if (formData.email.trim() && !isValidEmail(formData.email)) {
      setEmailError(t('EMAIL_FORMAT_ERROR'));
    } else {
      setEmailError('');
    }
  };

  const handleUsernameBlur = () => {
    if (formData.username.trim() && !isValidUsername(formData.username)) {
      if (formData.username.length < 4 || formData.username.length > 12) {
        setUsernameError(t('USERNAME_LENGTH_ERROR'));
      } else {
        setUsernameError(t('USERNAME_FORMAT_ERROR'));
      }
    } else {
      setUsernameError('');
    }
  };

  const handlePasswordBlur = () => {
    if (formData.password.trim() && !isValidPassword(formData.password)) {
      setPasswordError(t('PASSWORD_LENGTH_ERROR'));
    } else {
      setPasswordError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    if (!formData.email) {
      setError(t('EMAIL_REQUIRED'));
      return;
    }
    if (!formData.username) {
      setError(t('USERNAME_REQUIRED'));
      return;
    }
    if (!formData.password) {
      setError(t('PASSWORD_REQUIRED'));
      return;
    }
    
    // Check validation errors
    if (!isValidEmail(formData.email)) {
      setError(t('EMAIL_FORMAT_ERROR'));
      return;
    }
    if (!isValidUsername(formData.username)) {
      setError(t('USERNAME_FORMAT_ERROR'));
      return;
    }
    if (!isValidPassword(formData.password)) {
      setError(t('PASSWORD_LENGTH_ERROR'));
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

      // Reset form
      setFormData({
        email: '',
        username: '',
        password: '',
        user_type: 'normal',
        membership_type: 'free',
      });
      
      onUserCreated();
      onClose();
    } catch (err: unknown) {
      console.error('创建用户失败:', err);
      setError(err instanceof Error ? err.message : t('CREATE_USER_FAILED'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      email: '',
      username: '',
      password: '',
      user_type: 'normal',
      membership_type: 'free',
    });
    setError(null);
    setEmailError('');
    setUsernameError('');
    setPasswordError('');
    setShowPassword(false);
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
            <div className="p-3 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-700">
              <p className="text-sm text-red-600 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* 邮箱 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('EMAIL_ADDRESS')} <span className="text-red-500">{t('REQUIRED')}</span>
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (emailError) setEmailError('');
                }}
                onBlur={handleEmailBlur}
                placeholder={t('EMAIL_PLACEHOLDER')}
                maxLength={40}
                required
                className={`w-full ${emailError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {emailError && (
                <p className="text-sm text-red-500 mt-1">{emailError}</p>
              )}
            </div>

            {/* 用户名 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('USERNAME')} <span className="text-red-500">{t('REQUIRED')}</span>
              </label>
              <Input
                type="text"
                value={formData.username}
                onChange={(e) => {
                  setFormData({ ...formData, username: e.target.value });
                  if (usernameError) setUsernameError('');
                }}
                onBlur={handleUsernameBlur}
                placeholder={t('USERNAME_PLACEHOLDER')}
                maxLength={12}
                required
                className={`w-full ${usernameError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {usernameError ? (
                <p className="text-sm text-red-500 mt-1">{usernameError}</p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  {t('USERNAME_LENGTH_ERROR')}
                </p>
              )}
            </div>

            {/* 密码 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('PASSWORD')} <span className="text-red-500">{t('REQUIRED')}</span>
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (passwordError) setPasswordError('');
                  }}
                  onBlur={handlePasswordBlur}
                  placeholder={t('PLEASE_ENTER_PASSWORD')}
                  required
                  className={`w-full pr-10 ${passwordError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {passwordError ? (
                <p className="text-sm text-red-500 mt-1">{passwordError}</p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  {t('PASSWORD_LENGTH_ERROR')}
                </p>
              )}
            </div>

            {/* 用户类型 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('USER_TYPE')}
              </label>
              <select
                value={formData.user_type}
                onChange={(e) => setFormData({ ...formData, user_type: e.target.value as 'normal' | 'premium' | 'admin' | 'super_admin' })}
                className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
              >
                <option value="normal">{t('NORMAL_USER')}</option>
                <option value="premium">{t('PREMIUM_USER')}</option>
                <option value="admin">{t('ADMIN_USER')}</option>
                <option value="super_admin">{t('SUPER_ADMIN_USER')}</option>
              </select>
            </div>

            {/* 会员类型 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('MEMBERSHIP_TYPE')}
              </label>
              <select
                value={formData.membership_type}
                onChange={(e) => setFormData({ ...formData, membership_type: e.target.value as 'free' | 'monthly' | 'yearly' | 'lifetime' })}
                className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
              >
                <option value="free">{t('FREE_MEMBERSHIP')}</option>
                <option value="monthly">{t('MONTHLY_MEMBERSHIP')}</option>
                <option value="yearly">{t('YEARLY_MEMBERSHIP')}</option>
                <option value="lifetime">{t('LIFETIME_MEMBERSHIP')}</option>
              </select>
            </div>

            {(formData.user_type === 'admin' || formData.user_type === 'super_admin') && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md dark:bg-yellow-900/20 dark:border-yellow-700">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
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
