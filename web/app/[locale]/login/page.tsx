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
import { Eye, EyeOff } from "lucide-react";

type AuthMode = 'code-login' | 'password-login' | 'register' | 'reset-password';

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const lang = useLocale();
  
  // State for current auth mode
  const [mode, setMode] = useState<AuthMode>('code-login');
  
  // Common form states
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  // Registration states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  // Reset password states
  const [newPassword, setNewPassword] = useState("");
  
  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Validation error states
  const [emailError, setEmailError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [codeError, setCodeError] = useState("");

  // validate email format
  function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // validate verification code
  function isValidCode(code: string) {
    return code.trim().length === 6;
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
      setEmailError(t('EMAIL_FORMAT_ERROR'));
    } else {
      setEmailError("");
    }
  };

  // Handle username blur validation
  const handleUsernameBlur = () => {
    if (username.trim() && !isValidUsername(username)) {
      if (username.length < 4 || username.length > 12) {
        setUsernameError(t('USERNAME_LENGTH_ERROR'));
      } else {
        setUsernameError(t('USERNAME_FORMAT_ERROR'));
      }
    } else {
      setUsernameError("");
    }
  };

  // Handle password blur validation
  const handlePasswordBlur = () => {
    if (password.trim() && !isValidPassword(password)) {
      setPasswordError(t('PASSWORD_LENGTH_ERROR'));
    } else {
      setPasswordError("");
    }
  };



  // Handle new password blur validation
  const handleNewPasswordBlur = () => {
    if (newPassword.trim() && !isValidPassword(newPassword)) {
      setNewPasswordError(t('PASSWORD_LENGTH_ERROR'));
    } else {
      setNewPasswordError("");
    }
  };

  // Handle verification code blur validation
  const handleCodeBlur = () => {
    if (code.trim() && !isValidCode(code)) {
      setCodeError(t('CODE_LENGTH_ERROR'));
    } else {
      setCodeError("");
    }
  };

  // Send verification code
  const sendCode = async () => {
    setSending(true);
    try {
      await fetcher('/auth/send_code', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, lang }),
      }).then(() => {
        toast.success(
          mode === 'register' ? t('VERIFICATION_CODE_FOR_REGISTER') : 
          mode === 'reset-password' ? t('VERIFICATION_CODE_FOR_RESET') : 
          t('VERIFICATION_CODE_SENT')
        );
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

  // Handle user registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      const userData = await fetcher('/auth/register', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          code, 
          username, 
          password,
          lang 
        }),
      });

      if (userData) {
        const { access_token, refresh_token } = userData as { 
          access_token: string; 
          refresh_token: string; 
        };
        
        if (access_token && refresh_token) {
          localStorage.setItem('email', email);
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);
          
          // Get user details
          try {
            const userProfile = await fetcher('/auth/me', {
              method: "GET",
              headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${access_token}`
              },
            });
            
            if (userProfile) {
              const actualUserType = (userProfile as { user_type: string }).user_type;
              localStorage.setItem('user_type', actualUserType);
              window.dispatchEvent(new CustomEvent('user-type-changed'));
              
              toast.success(t('REGISTER_SUCCESS'));
              setTimeout(() => {
                if (actualUserType === 'admin' || actualUserType === 'super_admin') {
                  router.push('/admin');
                } else {
                  router.push('/');
                }
              }, 1000);
            }
          } catch (profileError) {
            console.error('Failed to get user profile:', profileError);
            localStorage.setItem('user_type', 'user');
            window.dispatchEvent(new CustomEvent('user-type-changed'));
            toast.success(t('REGISTER_SUCCESS'));
            setTimeout(() => {
              router.push('/');
            }, 1000);
          }
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('REGISTER_FAILED');
      toast.error(errorMessage);
    }
    setLoading(false);
  };

  // Handle password login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const userData = await fetcher('/auth/login', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, lang }),
      });

      if (userData) {
        const { access_token, refresh_token } = userData as { 
          access_token: string; 
          refresh_token: string; 
        };
        
        if (access_token && refresh_token) {
          localStorage.setItem('email', email);
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);
          
          // Get user details
          try {
            const userProfile = await fetcher('/auth/me', {
              method: "GET",
              headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${access_token}`
              },
            });
            
            if (userProfile) {
              const actualUserType = (userProfile as { user_type: string }).user_type;
              localStorage.setItem('user_type', actualUserType);
              window.dispatchEvent(new CustomEvent('user-type-changed'));
              
              toast.success(t('LOGIN_SUCCESS'));
              setTimeout(() => {
                if (actualUserType === 'admin' || actualUserType === 'super_admin') {
                  router.push('/admin');
                } else {
                  router.push('/');
                }
              }, 1000);
            }
          } catch (profileError) {
            console.error('Failed to get user profile:', profileError);
            localStorage.setItem('user_type', 'user');
            window.dispatchEvent(new CustomEvent('user-type-changed'));
            toast.success(t('LOGIN_SUCCESS'));
            setTimeout(() => {
              router.push('/');
            }, 1000);
          }
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('LOGIN_FAILED');
      toast.error(errorMessage);
    }
    setLoading(false);
  };

  // Handle reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await fetcher('/auth/reset_password', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          code, 
          new_password: newPassword,
          lang 
        }),
      });

      toast.success(t('RESET_PASSWORD_SUCCESS'));
      setTimeout(() => {
        setMode('password-login');
        setCode('');
        setNewPassword('');
      }, 1000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('RESET_PASSWORD_FAILED');
      toast.error(errorMessage);
    }
    setLoading(false);
  };

  // Login with fallback to admin check (for code login)
  const handleCodeLogin = async (e: React.FormEvent) => {
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
          body: JSON.stringify({ email, code, lang }),
        });
      } catch (regularError) {
        // If regular login fails, try admin login
        try {
          userData = await fetcher('/auth/admin/verify', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, code, lang }),
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
          
          // Get user details to determine actual user type
          try {
            const userProfile = await fetcher('/auth/me', {
              method: "GET",
              headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${access_token}`
              },
            });
            
            if (userProfile) {
              // Set localStorage based on actual user type returned from backend
              const actualUserType = (userProfile as { user_type: string }).user_type;
              localStorage.setItem('user_type', actualUserType);
              
              // Trigger custom event to notify components to update state
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
            // If getting user info fails, fallback to endpoint-based judgment
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

  // Get form title based on mode
  const getTitle = () => {
    switch (mode) {
      case 'register': return t('REGISTER');
      case 'reset-password': return t('RESET_PASSWORD');
      case 'password-login': return t('PASSWORD_LOGIN');
      default: return t('LOGIN');
    }
  };

  // Get form description based on mode
  const getDescription = () => {
    switch (mode) {
      case 'register': return t('REGISTER_FORM_DESCRIPTION');
      case 'reset-password': return t('RESET_PASSWORD_FORM_DESCRIPTION');
      default: return t('LOGIN_FORM_DESCRIPTION');
    }
  };

  // Get submit handler based on mode
  const getSubmitHandler = () => {
    switch (mode) {
      case 'register': return handleRegister;
      case 'reset-password': return handleResetPassword;
      case 'password-login': return handlePasswordLogin;
      default: return handleCodeLogin;
    }
  };

  // Check if form is valid based on mode
  const isFormValid = () => {
    const emailValid = isValidEmail(email);
    
    switch (mode) {
      case 'register':
        return emailValid && 
               isValidCode(code) && 
               isValidUsername(username) && 
               isValidPassword(password);
      case 'reset-password':
        return emailValid && isValidCode(code) && isValidPassword(newPassword);
      case 'password-login':
        return emailValid && isValidPassword(password);
      default:
        return emailValid && isValidCode(code);
    }
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
                  <Label htmlFor="email">{t('EMAIL')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('PLEASE_ENTER_YOUR_EMAIL')}
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

                {/* Username field (only for register) */}
                {mode === 'register' && (
                  <div className="grid gap-3">
                    <Label htmlFor="username">{t('USERNAME')}</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder={t('USERNAME_PLACEHOLDER')}
                      value={username}
                      onChange={e => {
                        setUsername(e.target.value);
                        if (usernameError) setUsernameError("");
                      }}
                      onBlur={handleUsernameBlur}
                      maxLength={12}
                      required
                      className={`h-11 ${usernameError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    />
                    {usernameError ? (
                      <p className="text-sm text-red-500">{usernameError}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {t('USERNAME_LENGTH_ERROR')}
                      </p>
                    )}
                  </div>
                )}

                {/* Password field (for password login and register) */}
                {(mode === 'password-login' || mode === 'register') && (
                  <div className="grid gap-3">
                    <Label htmlFor="password">{t('PASSWORD')}</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={t('PLEASE_ENTER_PASSWORD')}
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



                {/* New password field (only for reset password) */}
                {mode === 'reset-password' && (
                  <div className="grid gap-3">
                    <Label htmlFor="newPassword">{t('NEW_PASSWORD')}</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        placeholder={t('PLEASE_ENTER_NEW_PASSWORD')}
                        value={newPassword}
                        onChange={e => {
                          setNewPassword(e.target.value);
                          if (newPasswordError) setNewPasswordError("");
                        }}
                        onBlur={handleNewPasswordBlur}
                        required
                        className={`h-11 pr-10 ${newPasswordError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
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
                    {newPasswordError && (
                      <p className="text-sm text-red-500">{newPasswordError}</p>
                    )}
                  </div>
                )}

                {/* Verification code field (for code login, register, and reset password) */}
                {(mode === 'code-login' || mode === 'register' || mode === 'reset-password') && (
                  <div className="grid gap-3">
                    <Label htmlFor="code">{t('CODE')}</Label>
                    <div className="flex gap-2">
                      <Input
                        id="code"
                        type="text"
                        placeholder={t('PLEASE_ENTER_THE_CODE')}
                        value={code}
                        onChange={e => {
                          setCode(e.target.value);
                          if (codeError) setCodeError("");
                        }}
                        onBlur={handleCodeBlur}
                        maxLength={6}
                        required
                        className={`flex-1 h-11 ${codeError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
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
                    {codeError && (
                      <p className="text-sm text-red-500">{codeError}</p>
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
                    mode === 'register' ? t('REGISTERING') :
                    mode === 'reset-password' ? t('RESETTING_PASSWORD') :
                    t('LOGGING_IN')
                  ) : (
                    mode === 'register' ? t('REGISTER_BUTTON') :
                    mode === 'reset-password' ? t('RESET_PASSWORD_BUTTON') :
                    t('LOGIN_BUTTON')
                  )}
                </Button>

                {/* Mode switcher links */}
                <div className="flex flex-col gap-2 text-center text-sm">
                  {mode === 'code-login' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setMode('password-login')}
                        className="text-primary hover:underline"
                      >
                        {t('LOGIN_WITH_PASSWORD')}
                      </button>
                      <div className="flex justify-center gap-1">
                        <span className="text-muted-foreground">{t('DONT_HAVE_ACCOUNT')}</span>
                        <button
                          type="button"
                          onClick={() => setMode('register')}
                          className="text-primary hover:underline"
                        >
                          {t('REGISTER_NOW')}
                        </button>
                      </div>
                    </>
                  )}

                  {mode === 'password-login' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setMode('code-login')}
                        className="text-primary hover:underline"
                      >
                        {t('LOGIN_WITH_CODE')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode('reset-password')}
                        className="text-primary hover:underline"
                      >
                        {t('FORGOT_PASSWORD')}
                      </button>
                      <div className="flex justify-center gap-1">
                        <span className="text-muted-foreground">{t('DONT_HAVE_ACCOUNT')}</span>
                        <button
                          type="button"
                          onClick={() => setMode('register')}
                          className="text-primary hover:underline"
                        >
                          {t('REGISTER_NOW')}
                        </button>
                      </div>
                    </>
                  )}

                  {mode === 'register' && (
                    <div className="flex justify-center gap-1">
                      <span className="text-muted-foreground">{t('ALREADY_HAVE_ACCOUNT')}</span>
                      <button
                        type="button"
                        onClick={() => setMode('code-login')}
                        className="text-primary hover:underline"
                      >
                        {t('BACK_TO_LOGIN')}
                      </button>
                    </div>
                  )}

                  {mode === 'reset-password' && (
                    <button
                      type="button"
                      onClick={() => setMode('password-login')}
                      className="text-primary hover:underline"
                    >
                      {t('BACK_TO_LOGIN_FROM_RESET')}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}