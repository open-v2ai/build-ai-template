"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import LangSwitchButton from '@/components/language-switch-button';
import ThemeToggleButton from '@/components/theme-toggle-button';
import { toast } from "sonner";
import { fetcher } from '@/util/fetcher';


export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const lang = useLocale();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // validate email format
  function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // validate verification code (simple non-empty)
  function isValidCode(code: string) {
    return code.trim().length === 6;
  }

  // Send verification code
  const sendCode = async () => {
    setSending(true);
    try {
      await fetcher('/auth/send_code', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, lang }),
      }).then(() => {
        toast.success(t('VERIFICATION_CODE_SENT'));
        console.log('setCountdown to 60');
        setCountdown(60);
      }).catch(err => {
        toast.error(err.message || t('LOGIN_FAILED'));
      });
    } catch {
      toast.error(t('NETWORK_ERROR'));
    }
    setSending(false);
  };

  // Countdown side effect
  useEffect(() => {
    if (countdown === 0) return;
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 500);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Login with fallback to admin check
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Try regular user login first
      let userData = null;
      let isAdmin = false;
      
      try {
        userData = await fetcher('/auth/verify', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code }),
        });
      } catch (regularError) {
        // If regular login fails, try admin login
        try {
          userData = await fetcher('/auth/admin/verify', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, code }),
          });
          isAdmin = true;
        } catch {
          throw regularError; // Use the original error
        }
      }

      if (userData) {
        const { access_token, refresh_token } = userData as { 
          access_token: string; 
          refresh_token: string; 
        };
        
        if (access_token && refresh_token) {
          localStorage.setItem('email', email);
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);
          
          // 获取用户详细信息来确定实际的用户类型
          try {
            const userProfile = await fetcher('/auth/me', {
              method: "GET",
              headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${access_token}`
              },
            });
            
            if (userProfile) {
              // 基于后端返回的实际用户类型设置 localStorage
              const actualUserType = (userProfile as { user_type: string }).user_type;
              localStorage.setItem('user_type', actualUserType);
              
              // 触发自定义事件通知组件更新状态
              window.dispatchEvent(new CustomEvent('user-type-changed'));
              
              if (actualUserType === 'admin' || actualUserType === 'super_admin') {
                toast.success(t('ADMIN_LOGIN_SUCCESS'));
                setTimeout(() => {
                  router.push('/admin');
                }, 1000);
              } else {
                toast.success(t('USER_LOGIN_SUCCESS'));
                setTimeout(() => {
                  router.push('/');
                }, 1000);
              }
            } else {
              throw new Error('Failed to get user profile');
            }
          } catch (profileError) {
            console.error('Failed to get user profile:', profileError);
            // 如果获取用户信息失败，回退到基于登录端点的判断
            if (isAdmin) {
              localStorage.setItem('user_type', 'admin');
              window.dispatchEvent(new CustomEvent('user-type-changed'));
              toast.success(t('ADMIN_LOGIN_SUCCESS'));
              setTimeout(() => {
                router.push('/admin');
              }, 1000);
            } else {
              localStorage.setItem('user_type', 'user');
              window.dispatchEvent(new CustomEvent('user-type-changed'));
              toast.success(t('USER_LOGIN_SUCCESS'));
              setTimeout(() => {
                router.push('/');
              }, 1000);
            }
          }
        } else {
          toast.error(t('LOGIN_FAILED'));
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('LOGIN_FAILED');
      toast.error(errorMessage);
    }

    setLoading(false);
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
          {/* Left side - Image */}
          <div className="relative bg-gray-200 dark:bg-gray-800 flex items-center justify-center p-8">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <Image 
                  src="/logo.svg" 
                  alt="Logo" 
                  width={120} 
                  height={120}
                  className="drop-shadow-lg"
                />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  {t('FULL_NAME')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {t('SLOGAN')}
                </p>
              </div>
            </div>
          </div>
          
          {/* Right side - Login form */}
          <div className="flex items-center justify-center p-8 lg:p-12">
            <form
              onSubmit={handleLogin}
              className={cn("flex flex-col gap-6 w-full max-w-sm")}
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-3xl font-bold">{t('LOGIN')}</h1>
                <p className="text-muted-foreground text-sm text-balance">
                  {t('LOGIN_FORM_DESCRIPTION')}
                </p>
              </div>
              
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="email">{t('EMAIL')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('PLEASE_ENTER_YOUR_EMAIL')}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    maxLength={40}
                    required
                    autoFocus
                    className="h-11"
                  />
                </div>
                
                <div className="grid gap-3">
                  <Label htmlFor="code">{t('CODE')}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      type="text"
                      placeholder={t('PLEASE_ENTER_THE_CODE')}
                      value={code}
                      onChange={e => setCode(e.target.value)}
                      maxLength={6}
                      required
                      className="flex-1 h-11"
                    />
                    <Button
                      type="button"
                      onClick={sendCode}
                      disabled={sending || !email || !isValidEmail(email) || countdown > 0}
                      variant="outline"
                      className="whitespace-nowrap h-11 px-4"
                    >
                      {sending
                        ? t('SENDING')
                        : countdown > 0
                          ? `${t('SEND_CODE')} (${countdown})`
                          : t('SEND_CODE')}
                    </Button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-11" 
                  disabled={loading || !isValidEmail(email) || !isValidCode(code)}
                >
                  {loading ? t('LOGGING_IN') : t('LOGIN_BUTTON')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 