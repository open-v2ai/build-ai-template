'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

import { UserPlus, Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { fetcher } from '@/util/fetcher'
import type { UserCreateRequest } from '@/app/[locale]/admin/types'

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
    user_type: 'user',
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
      setEmailError(t('common.validation.emailFormat'));
    } else {
      setEmailError('');
    }
  };

  const handleUsernameBlur = () => {
    if (formData.username.trim() && !isValidUsername(formData.username)) {
      if (formData.username.length < 4 || formData.username.length > 12) {
        setUsernameError(t('common.validation.usernameLength'));
      } else {
        setUsernameError(t('common.validation.usernameFormat'));
      }
    } else {
      setUsernameError('');
    }
  };

  const handlePasswordBlur = () => {
    if (formData.password.trim() && !isValidPassword(formData.password)) {
      setPasswordError(t('common.validation.passwordLength'));
    } else {
      setPasswordError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    if (!formData.email) {
      setError(t('common.validation.emailRequired'));
      return;
    }
    if (!formData.username) {
      setError(t('common.validation.usernameRequired'));
      return;
    }
    if (!formData.password) {
      setError(t('common.validation.passwordRequired'));
      return;
    }
    
    // Check validation errors
    if (!isValidEmail(formData.email)) {
      setError(t('common.validation.emailFormat'));
      return;
    }
    if (!isValidUsername(formData.username)) {
      setError(t('common.validation.usernameFormat'));
      return;
    }
    if (!isValidPassword(formData.password)) {
      setError(t('common.validation.passwordLength'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await fetcher('/admin/users', {
        method: 'POST',
        auth: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      // Reset form
      setFormData({
        email: '',
        username: '',
        password: '',
        user_type: 'user',
        membership_type: 'free',
      });
      
      onUserCreated();
      onClose();
    } catch (err: unknown) {
      console.error('Create user failed:', err);
      setError(err instanceof Error ? err.message : t('admin.users.messages.createUserFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      email: '',
      username: '',
      password: '',
      user_type: 'user',
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
            <DialogTitle>{t('admin.users.createNewUser')}</DialogTitle>
          </div>
          <DialogDescription>
            {t('admin.users.createUserDescription')}
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
                {t('admin.users.table.emailAddress')} <span className="text-red-500">{t('common.validation.required')}</span>
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (emailError) setEmailError('');
                }}
                onBlur={handleEmailBlur}
                placeholder={t('common.placeholders.email')}
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
                {t('auth.fields.username')} <span className="text-red-500">{t('common.validation.required')}</span>
              </label>
              <Input
                type="text"
                value={formData.username}
                onChange={(e) => {
                  setFormData({ ...formData, username: e.target.value });
                  if (usernameError) setUsernameError('');
                }}
                onBlur={handleUsernameBlur}
                placeholder={t('common.placeholders.username')}
                maxLength={12}
                required
                className={`w-full ${usernameError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {usernameError ? (
                <p className="text-sm text-red-500 mt-1">{usernameError}</p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  {t('common.validation.usernameLength')}
                </p>
              )}
            </div>

            {/* 密码 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('auth.fields.password')} <span className="text-red-500">{t('common.validation.required')}</span>
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
                  placeholder={t('auth.placeholders.enterPassword')}
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
                  {t('common.validation.passwordLength')}
                </p>
              )}
            </div>

            {/* 用户类型 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('admin.users.filters.userType')}
              </label>
              <select
                value={formData.user_type}
                onChange={(e) => setFormData({ ...formData, user_type: e.target.value as 'user' | 'admin' })}
                className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
              >
                <option value="user">{t('admin.users.filters.user')}</option>
                <option value="admin">{t('admin.users.filters.admin')}</option>
              </select>
            </div>

            {/* 会员类型 - 固定为免费会员 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('admin.users.filters.membershipType')}
              </label>
              <div className="w-full border border-border rounded-md px-3 py-2 bg-muted text-muted-foreground">
                {t('admin.users.filters.freeMembership')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('admin.users.createUserMembershipNote')}
              </p>
            </div>

            {formData.user_type === 'admin' && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md dark:bg-yellow-900/20 dark:border-yellow-700">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  {t('auth.options.adminWarning')}
                </p>
              </div>
            )}
          </div>

          {/* 按钮 */}
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={handleClose}>
              {t('common.actions.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('auth.actions.creating') : t('common.actions.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
