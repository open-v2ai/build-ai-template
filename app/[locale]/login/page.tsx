"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useTranslations } from 'next-intl'

import { Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import LangSwitchButton from '@/components/language-switch-button'
import ThemeToggleButton from '@/components/theme-toggle-button'
import { useRouter } from '@/i18n/navigation'
import { cn } from "@/lib/utils"
import {
  getCurrentUser,
  cacheUserType,
  registerWithPassword,
  sendPasswordResetEmail
} from '@/util/supabase-auth'
import { createClient } from '@/lib/supabase/client'

type AuthMode = 'password-login' | 'register' | 'reset-password';

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();

  // State for current auth mode - 默认使用密码登录
  const [mode, setMode] = useState<AuthMode>('password-login');

  // Common form states
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // Registration states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

// Password visibility states
  const [showPassword, setShowPassword] = useState(false);

  // Validation error states
  const [emailError, setEmailError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // State for random illustration
  const [randomIllustration, setRandomIllustration] = useState<string>('');

  // Select a random illustration on component mount (client-side)
  useEffect(() => {
    const illustrations = [
      '/login_images/undraw_coffee-with-friends_ocg2.svg',
      '/login_images/undraw_shared-workspace_6y9d.svg',
      '/login_images/undraw_work-from-anywhere_tpk5.svg',
      '/login_images/undraw_working-from-anywhere_33m9.svg',
      '/login_images/undraw_team-collaboration_phnf.svg'
    ];
    const randomIndex = Math.floor(Math.random() * illustrations.length);
    setRandomIllustration(illustrations[randomIndex]);
  }, []);

  // validate email format
  function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // validate username
  function isValidUsername(username: string) {
    if (!username || username.length < 4 || username.length > 12) {
      return false;
    }
    return /^[a-zA-Z0-9_]+$/.test(username);
  }

  // validate password
  function isValidPassword(password: string) {
    return password && password.length >= 6;
  }

  // Handle email blur validation
  const handleEmailBlur = () => {
    if (email.trim() && !isValidEmail(email)) {
      setEmailError(t('common.validation.emailFormat'));
    } else {
      setEmailError("");
    }
  };

  // Handle username blur validation
  const handleUsernameBlur = () => {
    if (username.trim() && !isValidUsername(username)) {
      if (username.length < 4 || username.length > 12) {
        setUsernameError(t('common.validation.usernameLength'));
      } else {
        setUsernameError(t('common.validation.usernameFormat'));
      }
    } else {
      setUsernameError("");
    }
  };

  // Handle password blur validation
  const handlePasswordBlur = () => {
    if (password.trim() && !isValidPassword(password)) {
      setPasswordError(t('common.validation.passwordLength'));
    } else {
      setPasswordError("");
    }
  };

// Handle password login (使用 Supabase)
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();

      // 使用 Supabase 的密码登录
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error(t('auth.messages.loginFailed'));
      }

      // 获取用户信息
      const userProfile = await getCurrentUser();

      if (userProfile) {
        // 缓存用户类型
        await cacheUserType();

        toast.success(t('auth.messages.loginSuccess'));
        setTimeout(() => {
          if (userProfile.user_type === 'admin') {
            router.push('/admin');
          } else {
            router.push('/');
          }
        }, 1000);
      } else {
        throw new Error(t('auth.messages.loginFailed'));
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('auth.messages.loginFailed');
      toast.error(errorMessage);
    }
    setLoading(false);
  };

  // Handle user registration (使用 Supabase)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证所有字段
    if (!isValidEmail(email)) {
      setEmailError(t('common.validation.emailFormat'));
      return;
    }
    if (!isValidUsername(username)) {
      if (username.length < 4 || username.length > 12) {
        setUsernameError(t('common.validation.usernameLength'));
      } else {
        setUsernameError(t('common.validation.usernameFormat'));
      }
      return;
    }
    if (!isValidPassword(password)) {
      setPasswordError(t('common.validation.passwordLength'));
      return;
    }

    setLoading(true);

    try {
      // 调用注册函数
      await registerWithPassword(email, password, username);

      toast.success(t('auth.messages.registerSuccess'));

      // 注册成功后自动登录
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        // 如果自动登录失败，切换到登录模式
        setMode('password-login');
        toast.info(t('auth.messages.pleaseLogin'));
        return;
      }

      // 获取用户信息
      const userProfile = await getCurrentUser();

      if (userProfile) {
        await cacheUserType();

        setTimeout(() => {
          if (userProfile.user_type === 'admin') {
            router.push('/admin');
          } else {
            router.push('/');
          }
        }, 1000);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('auth.messages.registerFailed');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset request
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证邮箱
    if (!isValidEmail(email)) {
      setEmailError(t('common.validation.emailFormat'));
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(email);
      toast.success(t('auth.messages.resetSuccess'));
      toast.info(t('auth.messages.checkEmailForReset'));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('auth.messages.resetFailed');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get form title based on mode
  const getTitle = () => {
    switch (mode) {
      case 'register': return t('pages.login.register');
      case 'reset-password': return t('pages.login.resetPassword');
      case 'password-login': return t('pages.login.passwordLogin');
      default: return t('pages.login.login');
    }
  };

  // Get form description based on mode
  const getDescription = () => {
    switch (mode) {
      case 'register': return t('pages.login.registerFormDescription');
      case 'reset-password': return t('pages.login.resetFormDescription');
      case 'password-login': return t('pages.login.formDescription');
      default: return t('pages.login.formDescription');
    }
  };

  // Get submit handler based on mode
  const getSubmitHandler = () => {
    if (mode === 'password-login') {
      return handlePasswordLogin;
    }
    if (mode === 'register') {
      return handleRegister;
    }
    if (mode === 'reset-password') {
      return handleResetPassword;
    }
    return handlePasswordLogin;
  };

  // Check if form is valid based on mode
  const isFormValid = () => {
    const emailValid = isValidEmail(email);

    if (mode === 'password-login') {
      return emailValid && isValidPassword(password);
    }
    if (mode === 'register') {
      return emailValid && isValidUsername(username) && isValidPassword(password);
    }
    return emailValid;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {/* Main login card with two columns */}
      <div className="w-full max-w-4xl bg-white dark:bg-black/80 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden relative">
        {/* Language switch and theme toggle buttons positioned at top right of card */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <ThemeToggleButton />
          <LangSwitchButton />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
          {/* Left side - Illustration and Logo */}
          <div className="relative hidden lg:flex flex-col items-center justify-center gap-10 p-8 bg-gray-50 dark:bg-gray-900">
            {/* Logo and Slogan */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Image
                  src="/logo.svg"
                  alt="Logo"
                  width={100}
                  height={100}
                  className="drop-shadow-lg"
                />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  {t('app.fullName')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {t('app.slogan')}
                </p>
              </div>
            </div>

            {/* Illustration */}
            <div className="flex justify-center">
              {randomIllustration && (
                <Image
                  src={randomIllustration}
                  alt="Work from anywhere illustration"
                  width={340}
                  height={340}
                  priority
                />
              )}
            </div>
          </div>

          {/* Right side - Auth form */}
          <div className="flex items-center justify-center p-8 lg:p-12">
            <form
              onSubmit={getSubmitHandler()}
              className={cn("flex flex-col gap-6 w-full max-w-sm")}
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-3xl font-bold">{getTitle()}</h1>
                <p className="text-muted-foreground text-sm text-balance">
                  {getDescription()}
                </p>
              </div>

              <div className="grid gap-6">
                {/* Email field */}
                <div className="grid gap-3">
                  <Label htmlFor="email">{t('auth.fields.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('auth.placeholders.enterEmail')}
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError("");
                    }}
                    onBlur={handleEmailBlur}
                    maxLength={40}
                    required
                    autoFocus
                    className={`h-11 ${emailError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  />
                  {emailError && (
                    <p className="text-sm text-red-500">{emailError}</p>
                  )}
                </div>

                {/* Username field (for register only) */}
                {mode === 'register' && (
                  <div className="grid gap-3">
                    <Label htmlFor="username">{t('auth.fields.username')}</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder={t('auth.placeholders.enterUsername')}
                      value={username}
                      onChange={e => {
                        setUsername(e.target.value);
                        if (usernameError) setUsernameError("");
                      }}
                      onBlur={handleUsernameBlur}
                      minLength={4}
                      maxLength={12}
                      required
                      className={`h-11 ${usernameError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    />
                    {usernameError && (
                      <p className="text-sm text-red-500">{usernameError}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {t('common.validation.usernameRequirement')}
                    </p>
                  </div>
                )}

                {/* Password field (for password login and register) */}
                {(mode === 'password-login' || mode === 'register') && (
                  <div className="grid gap-3">
                    <Label htmlFor="password">{t('auth.fields.password')}</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={t('auth.placeholders.enterPassword')}
                        value={password}
                        onChange={e => {
                          setPassword(e.target.value);
                          if (passwordError) setPasswordError("");
                        }}
                        onBlur={handlePasswordBlur}
                        required
                        className={`h-11 pr-10 ${passwordError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-11 px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
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
                )}

                {/* Submit button */}
                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={loading || !isFormValid()}
                >
                  {loading ? (
                    mode === 'register' ? t('auth.actions.registering') :
                    mode === 'reset-password' ? t('auth.actions.resettingPassword') :
                    t('auth.actions.loggingIn')
                  ) : (
                    mode === 'register' ? t('pages.login.registerButton') :
                    mode === 'reset-password' ? t('pages.login.resetPasswordButton') :
                    t('pages.login.loginButton')
                  )}
                </Button>

                {/* Mode switcher links */}
                <div className="flex flex-col gap-2 text-center text-sm">
                  {mode === 'password-login' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setMode('reset-password')}
                        className="text-primary hover:underline"
                      >
                        {t('pages.login.forgotPassword')}
                      </button>
                      <div className="flex justify-center gap-1">
                        <span className="text-muted-foreground">{t('pages.login.dontHaveAccount')}</span>
                        <button
                          type="button"
                          onClick={() => setMode('register')}
                          className="text-primary hover:underline"
                        >
                          {t('pages.login.registerNow')}
                        </button>
                      </div>
                    </>
                  )}

                  {mode === 'register' && (
                    <div className="flex justify-center gap-1">
                      <span className="text-muted-foreground">{t('pages.login.alreadyHaveAccount')}</span>
                      <button
                        type="button"
                        onClick={() => setMode('password-login')}
                        className="text-primary hover:underline"
                      >
                        {t('pages.login.backToLogin')}
                      </button>
                    </div>
                  )}

                  {mode === 'reset-password' && (
                    <button
                      type="button"
                      onClick={() => setMode('password-login')}
                      className="text-primary hover:underline"
                    >
                      {t('pages.login.backToLoginFromReset')}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Source attribution */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 text-center">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{t('app.poweredBy')}</span>
          <a
            href="https://github.com/open-v2ai/build-ai-template"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:text-foreground transition-colors hover:underline"
          >
            {t('app.name')}
          </a>
        </div>
      </div>
    </div>
  );
}
