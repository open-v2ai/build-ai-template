'use client';

import { useState, useEffect } from 'react';
import { Crown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetcher } from '@/util/fetcher';

interface SystemStatus {
  has_users: boolean;
  has_admin: boolean;
  user_count: number;
  admin_count: number;
  first_user_will_be_admin: boolean;
}

export default function FirstAdminNotice() {
  const [showNotice, setShowNotice] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);

  useEffect(() => {
    // 检查系统状态
    const checkSystemStatus = async () => {
      try {
        const status = await fetcher('/system/status', {
          method: 'GET',
        });
        setSystemStatus(status as SystemStatus);
        
        // 只有在没有用户或没有管理员时才显示通知
        const hasShownNotice = localStorage.getItem('first-admin-notice-shown');
        if (!hasShownNotice && (status as SystemStatus).first_user_will_be_admin) {
          setShowNotice(true);
        }
      } catch (error) {
        console.error('Failed to check system status:', error);
      }
    };

    checkSystemStatus();
  }, []);

  const handleDismiss = () => {
    setShowNotice(false);
    localStorage.setItem('first-admin-notice-shown', 'true');
  };

  if (!showNotice || !systemStatus?.first_user_will_be_admin) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
      <div className="flex items-start gap-3">
        <Crown className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">🎉 首次设置</h3>
          <p className="text-xs opacity-90 leading-relaxed">
            这是全新的系统！您将是第一个用户，登录后将自动获得管理员权限。
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-white hover:bg-white/20 p-1 h-auto"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
