'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Users, MessageSquare, Shield, UserX, TrendingUp, Calendar, Crown } from 'lucide-react';

import { fetcher } from '@/util/fetcher';
import type { DashboardStats } from '@/app/[locale]/admin/types';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const t = useTranslations();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const data = await fetcher('/admin/dashboard', {
        method: 'GET',
        auth: true,
      });
      setStats(data as DashboardStats);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg p-6 shadow-sm border border-border">
                <div className="h-4 bg-muted rounded w-20 mb-2"></div>
                <div className="h-8 bg-muted rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('FAILED_TO_LOAD_DASHBOARD')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 用户统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard
          title={t('TOTAL_USERS')}
          value={stats.total_users}
          icon={<Users className="w-6 h-6 text-white" />}
          color="bg-blue-500"
        />
        <StatCard
          title={t('ACTIVE_USERS')}
          value={stats.active_users}
          icon={<TrendingUp className="w-6 h-6 text-white" />}
          color="bg-green-500"
        />
        <StatCard
          title={t('ADMIN_USERS')}
          value={stats.admin_users}
          icon={<Shield className="w-6 h-6 text-white" />}
          color="bg-purple-500"
        />
        <StatCard
          title={t('SUPER_ADMIN_USERS')}
          value={stats.super_admin_users}
          icon={<Crown className="w-6 h-6 text-white" />}
          color="bg-red-500"
        />
        <StatCard
          title={t('DELETED_USERS')}
          value={stats.deleted_users}
          icon={<UserX className="w-6 h-6 text-white" />}
          color="bg-gray-500"
        />
      </div>

      {/* 对话统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title={t('TOTAL_CHATS')}
          value={stats.total_chats}
          icon={<MessageSquare className="w-6 h-6 text-white" />}
          color="bg-indigo-500"
        />
        <StatCard
          title={t('ACTIVE_CHATS')}
          value={stats.active_chats}
          icon={<MessageSquare className="w-6 h-6 text-white" />}
          color="bg-cyan-500"
        />
        <StatCard
          title={t('TOTAL_MESSAGES')}
          value={stats.total_messages}
          icon={<MessageSquare className="w-6 h-6 text-white" />}
          color="bg-orange-500"
        />
      </div>

      {/* 今日统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title={t('TODAY_NEW_USERS')}
          value={stats.today_new_users}
          icon={<Calendar className="w-6 h-6 text-white" />}
          color="bg-emerald-500"
        />
        <StatCard
          title={t('TODAY_NEW_CHATS')}
          value={stats.today_new_chats}
          icon={<Calendar className="w-6 h-6 text-white" />}
          color="bg-rose-500"
        />
      </div>
    </div>
  );
}
