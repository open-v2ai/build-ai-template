'use client';

import { useState, useEffect } from 'react';
import { Crown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetcher } from '@/util/fetcher';
import { useTranslations } from 'next-intl';

interface SystemStatus {
  is_initialized: boolean;
}

export default function FirstAdminNotice() {
  const [showNotice, setShowNotice] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const t = useTranslations();

  useEffect(() => {
    // Check system status
    const checkSystemStatus = async () => {
      try {
        const status = await fetcher('/system/status', {
          method: 'GET',
        });
        setSystemStatus(status as SystemStatus);
        
        // Only show notice when system is not initialized
        const hasShownNotice = localStorage.getItem('first-admin-notice-shown');
        if (!hasShownNotice && !(status as SystemStatus).is_initialized) {
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

  if (!showNotice || systemStatus?.is_initialized) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
      <div className="flex items-start gap-3">
        <Crown className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">{t('setup.firstSetupTitle')}</h3>
          <p className="text-xs opacity-90 leading-relaxed">
            {t('setup.firstSetupDescription')}
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
