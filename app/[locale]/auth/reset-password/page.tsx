"use client"

import { useState, useEffect } from "react"
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { resetPassword } from '@/util/supabase-auth'

/**
 * 密码重置页面组件
 *
 * 功能说明:
 * - 用户通过邮件链接访问此页面
 * - 输入新密码完成重置
 * - 重置成功后跳转到登录页
 */
export default function ResetPasswordPage() {
  const t = useTranslations();
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [isValidatingToken, setIsValidatingToken] = useState(true); // 验证 token 状态

  // 检查是否有有效的重置 token
  useEffect(() => {
    const checkResetToken = async () => {
      // 延迟检查，给 Supabase 时间处理 URL hash
      await new Promise(resolve => setTimeout(resolve, 500));

      // Supabase 会自动处理 token，我们只需要检查 URL hash
      const hash = window.location.hash;

      // 调试日志：查看实际的 hash 内容
      console.log('Current URL hash:', hash);

      if (!hash || !hash.includes('type=recovery')) {
        console.warn('Missing recovery token in URL hash');
        toast.error(t('auth.messages.invalidResetLink'));

        // 延迟跳转，让用户看到错误提示
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        // Token 有效，显示表单
        setIsValidatingToken(false);
      }
    };

    checkResetToken();
  }, [router, t]);

  // 验证密码
  function isValidPassword(password: string) {
    return password && password.length >= 6;
  }

  // 处理新密码输入失去焦点
  const handleNewPasswordBlur = () => {
    if (newPassword.trim() && !isValidPassword(newPassword)) {
      setPasswordError(t('common.validation.passwordLength'));
    } else {
      setPasswordError("");
    }
  };

  // 处理确认密码输入失去焦点
  const handleConfirmPasswordBlur = () => {
    if (confirmPassword.trim() && confirmPassword !== newPassword) {
      setConfirmError(t('common.validation.passwordMismatch'));
    } else {
      setConfirmError("");
    }
  };

  // 处理密码重置提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证密码
    if (!isValidPassword(newPassword)) {
      setPasswordError(t('common.validation.passwordLength'));
      return;
    }

    // 验证密码确认
    if (newPassword !== confirmPassword) {
      setConfirmError(t('common.validation.passwordMismatch'));
      return;
    }

    setLoading(true);

    try {
      await resetPassword(newPassword);
      toast.success(t('auth.messages.passwordResetSuccess'));

      // 延迟跳转到登录页
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('auth.messages.passwordResetFailed');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 显示加载状态
  if (isValidatingToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md bg-white dark:bg-black/80 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">{t('auth.messages.validatingResetLink')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-white dark:bg-black/80 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-3xl font-bold">{t('pages.login.resetPassword')}</h1>
            <p className="text-muted-foreground text-sm">
              {t('pages.login.enterNewPassword')}
            </p>
          </div>

          <div className="grid gap-6">
            {/* 新密码输入 */}
            <div className="grid gap-3">
              <Label htmlFor="newPassword">{t('auth.fields.newPassword')}</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder={t('auth.placeholders.enterNewPassword')}
                  value={newPassword}
                  onChange={e => {
                    setNewPassword(e.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                  onBlur={handleNewPasswordBlur}
                  required
                  autoFocus
                  className={`h-11 pr-10 ${passwordError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-11 px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {passwordError && (
                <p className="text-sm text-red-500">{passwordError}</p>
              )}
            </div>

            {/* 确认密码输入 */}
            <div className="grid gap-3">
              <Label htmlFor="confirmPassword">{t('auth.fields.confirmPassword')}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={t('auth.placeholders.enterConfirmPassword')}
                  value={confirmPassword}
                  onChange={e => {
                    setConfirmPassword(e.target.value);
                    if (confirmError) setConfirmError("");
                  }}
                  onBlur={handleConfirmPasswordBlur}
                  required
                  className={`h-11 pr-10 ${confirmError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-11 px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {confirmError && (
                <p className="text-sm text-red-500">{confirmError}</p>
              )}
            </div>

            {/* 提交按钮 */}
            <Button
              type="submit"
              className="w-full h-11"
              disabled={loading || !newPassword || !confirmPassword}
            >
              {loading ? t('auth.actions.resetting') : t('pages.login.resetPasswordButton')}
            </Button>

            {/* 返回登录 */}
            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="text-primary hover:underline"
              >
                {t('pages.login.backToLogin')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
