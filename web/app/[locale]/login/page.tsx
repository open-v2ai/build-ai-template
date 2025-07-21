"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import Image from "next/image";
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import LangSwitchButton from '@/components/language-switch-button';
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

  // Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetcher('/auth/verify', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    }).then((data) => {
      const { access_token, refresh_token } = data as { access_token: string; refresh_token: string };
      // Store token
      if (access_token && refresh_token) {
        localStorage.setItem('email', email);
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);

        // Redirect to home page
        setTimeout(() => {
          router.push('/');
        }, 500);
        toast.success(t('LOGIN_SUCCESS'));
      } else {
        toast.error(t('LOGIN_FAILED'));
      }
    }).catch(err => {
      toast.error(err.message || t('LOGIN_FAILED'));
    });

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      {/* Login card */}
      <form
        onSubmit={handleLogin}
        className="relative w-full max-w-sm space-y-6 bg-white dark:bg-black/80 p-8 rounded-lg shadow-md border border-gray-100 dark:border-gray-800"
      >
        <div className="flex items-center justify-end mb-2">
          <LangSwitchButton />
        </div>
        <div className="flex items-center justify-center mt-0 mb-4">
          <Image src="/logo.svg" alt="Logo" width={88} height={88} />
        </div>
        <h1 className="text-2xl font-bold mb-4 text-center">{t('LOGIN')}</h1>
        <div className="space-y-2">
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
          />
        </div>
        <div className="space-y-2">
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
              className="flex-1"
            />
            <Button
              type="button"
              onClick={sendCode}
              disabled={sending || !email || !isValidEmail(email) || countdown > 0}
              variant="outline"
            >
              {sending
                ? t('SENDING')
                : countdown > 0
                  ? `${t('SEND_CODE')} (${countdown})`
                  : t('SEND_CODE')}
            </Button>
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={loading || !isValidEmail(email) || !isValidCode(code)}>
          {loading ? t('LOGGING_IN') : t('LOGIN')}
        </Button>
      </form>
    </div>
  );
} 