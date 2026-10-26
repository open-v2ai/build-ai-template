'use client'

// React 核心库
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

// 第三方库 - 图标
import { 
  Users,
  UserPlus,
  MessageSquare,  
  UserX, 
  UserCog,
  ShoppingCart, 
  DollarSign, 
  UserCheck, 
  Crown,
  CircleDollarSign,
  MessageSquarePlus,
  ShoppingBasket,
} from 'lucide-react'
import { toast } from 'sonner'

// 项目内部导入
import { fetcher } from '@/util/fetcher'
import type { DashboardStats } from '@/app/[locale]/admin/types'

/**
 * 统计卡片组件的 Props 接口
 */
interface StatCardProps {
  title: string        // 卡片标题
  value: number        // 统计数值
  icon: React.ReactNode // 图标组件
  color: string        // 背景颜色类名
  isCurrency?: boolean // 是否为货币格式
}

/**
 * 统计卡片组件
 * 
 * 功能:
 * - 显示统计数据的卡片
 * - 支持货币格式化
 * - 包含图标和数值展示
 * 
 * @param title - 卡片标题
 * @param value - 统计数值
 * @param icon - 图标组件
 * @param color - 背景颜色类名
 * @param isCurrency - 是否为货币格式，默认 false
 */
function StatCard({ title, value, icon, color, isCurrency = false }: StatCardProps) {
  /**
   * 格式化数值显示
   * 
   * @param val - 要格式化的数值
   * @returns 格式化后的字符串
   */
  const formatValue = (val: number): string => {
    if (isCurrency) {
      // 货币格式：$1,234.56
      return `$${val.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    }
    // 普通数字格式：1,234
    return val.toLocaleString()
  }

  return (
    <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{formatValue(value)}</p>
        </div>
        <div className={`p-3 rounded-full ${color} ml-4`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

/**
 * 管理后台仪表板页面组件
 * 
 * 功能:
 * - 显示系统各项统计数据
 * - 包含用户、对话、订单、收入等统计信息
 * - 支持加载状态和错误处理
 * - 响应式布局设计
 */
export default function DashboardPage() {
  // 国际化翻译
  const t = useTranslations()
  
  // 状态管理
  const [stats, setStats] = useState<DashboardStats | null>(null)  // 统计数据
  const [loading, setLoading] = useState(true)                     // 加载状态

  // 组件挂载时获取数据
  useEffect(() => {
    fetchDashboardStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * 获取仪表板统计数据
   * 
   * 功能:
   * - 调用后端 API 获取统计数据
   * - 处理加载状态和错误情况
   * - 显示用户友好的错误提示
   */
  const fetchDashboardStats = async (): Promise<void> => {
    try {
      setLoading(true)
      // 使用 fetcher 函数调用 API
      const data = await fetcher('/admin/dashboard', {
        method: 'GET',
        auth: true,
      })
      setStats(data as DashboardStats)
    } catch (error) {
      // 获取具体的错误信息
      let errorMessage = t('admin.dashboard.messages.failedToLoadDashboard');
      
      if (error instanceof Error) {
        // 优先使用后端返回的具体错误信息
        errorMessage = error.message || errorMessage;
      }
      
      // 显示错误提示
      toast.error(errorMessage);
    } finally {
      setLoading(false)
    }
  }

  // 加载状态 - 显示骨架屏
  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          {/* 页面标题骨架屏 */}
          <div className="h-8 bg-muted rounded w-64 mb-6"></div>
          
          {/* 今日统计骨架屏 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 m'b">
            {[...Array(4)].map((_, i) => (
              <div key={`today-${i}`} className="bg-card rounded-lg p-6 shadow-sm border border-border">
                <div className="h-4 bg-muted rounded w-20 mb-2"></div>
                <div className="h-8 bg-muted rounded w-16"></div>
              </div>
            ))}
          </div>
          
          {/* 收入统计骨架屏 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={`membership-${i}`} className="bg-card rounded-lg p-6 shadow-sm border border-border">
                <div className="h-4 bg-muted rounded w-20 mb-2"></div>
                <div className="h-8 bg-muted rounded w-16"></div>
              </div>
            ))}
          </div>
        
          {/* 用户统计骨架屏 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={`user-${i}`} className="bg-card rounded-lg p-6 shadow-sm border border-border">
                <div className="h-4 bg-muted rounded w-20 mb-2"></div>
                <div className="h-8 bg-muted rounded w-16"></div>
              </div>
            ))}
          </div>
          
          {/* 会员类型统计骨架屏 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={`membership-${i}`} className="bg-card rounded-lg p-6 shadow-sm border border-border">
                <div className="h-4 bg-muted rounded w-20 mb-2"></div>
                <div className="h-8 bg-muted rounded w-16"></div>
              </div>
            ))}
          </div>
          
          {/* 对话统计骨架屏 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={`chat-${i}`} className="bg-card rounded-lg p-6 shadow-sm border border-border">
                <div className="h-4 bg-muted rounded w-20 mb-2"></div>
                <div className="h-8 bg-muted rounded w-16"></div>
              </div>
            ))}
          </div>

          {/* 订单统计骨架屏 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={`order-${i}`} className="bg-card rounded-lg p-6 shadow-sm border border-border">
                <div className="h-4 bg-muted rounded w-20 mb-2"></div>
                <div className="h-8 bg-muted rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // 数据加载失败状态
  if (!stats) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('admin.dashboard.messages.failedToLoadDashboard')}</p>
        </div>
      </div>
    )
  }

  // 主要内容渲染
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 今日统计 - 第一行显示今日重要数据 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title={t('admin.dashboard.stats.todayRevenue')}
          value={stats.today_revenue}
          icon={<CircleDollarSign className="w-6 h-6 text-white" />}
          color="bg-orange-600"
          isCurrency={true}
        />
        <StatCard
          title={t('admin.dashboard.stats.todayNewUsers')}
          value={stats.today_new_users}
          icon={<UserPlus className="w-6 h-6 text-white" />}
          color="bg-purple-600"
        />
        <StatCard
          title={t('admin.dashboard.stats.todayNewChats')}
          value={stats.today_new_chats}
          icon={<MessageSquarePlus className="w-6 h-6 text-white" />}
          color="bg-rose-600"
        />
        <StatCard
          title={t('admin.dashboard.stats.todayOrders')}
          value={stats.today_orders}
          icon={<ShoppingBasket className="w-6 h-6 text-white" />}
          color="bg-emerald-600"
        />
      </div>

      {/* 收入统计 - 显示营收相关的统计数据 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <StatCard
          title={t('admin.dashboard.stats.totalRevenue')}
          value={stats.total_revenue}
          icon={<DollarSign className="w-6 h-6 text-white" />}
          color="bg-orange-600"
          isCurrency={true}
        />
        <StatCard
          title={t('admin.dashboard.stats.monthlyRevenue')}
          value={stats.monthly_revenue}
          icon={<DollarSign className="w-6 h-6 text-white" />}
          color="bg-orange-500"
          isCurrency={true}
        />
        <StatCard
          title={t('admin.dashboard.stats.sevenDaysRevenue')}
          value={stats.seven_days_revenue}
          icon={<DollarSign className="w-6 h-6 text-white" />}
          color="bg-orange-400"
          isCurrency={true}
        />
      </div>

      {/* 用户统计 - 显示用户相关的统计数据 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title={t('admin.dashboard.stats.totalUsers')}
          value={stats.total_users}
          icon={<Users className="w-6 h-6 text-white" />}
          color="bg-purple-500"
        />
        <StatCard
          title={t('admin.dashboard.stats.activeUsers')}
          value={stats.active_users}
          icon={<UserCheck className="w-6 h-6 text-white" />}
          color="bg-purple-700"
        />
        <StatCard
          title={t('admin.dashboard.stats.adminUsers')}
          value={stats.admin_users}
          icon={<UserCog className="w-6 h-6 text-white" />}
          color="bg-purple-500"
        />
        <StatCard
          title={t('admin.dashboard.stats.deletedUsers')}
          value={stats.deleted_users}
          icon={<UserX className="w-6 h-6 text-white" />}
          color="bg-gray-500"
        />
      </div>

      {/* 会员类型统计 - 按会员类型分类的用户数量 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard
            title={t('admin.dashboard.stats.yearlyUsers')}
            value={stats.yearly_users}
            icon={<Crown className="w-6 h-6 text-white" />}
            color="bg-blue-600"
          />
        <StatCard
          title={t('admin.dashboard.stats.monthlyUsers')}
          value={stats.monthly_users}
          icon={<Crown className="w-6 h-6 text-white" />}
          color="bg-blue-500"
        />
        <StatCard
          title={t('admin.dashboard.stats.freeUsers')}
          value={stats.free_users}
          icon={<Crown className="w-6 h-6 text-white" />}
          color="bg-blue-400"
        />
      </div>

      {/* 对话统计 - 显示聊天对话相关的统计数据 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <StatCard
          title={t('admin.dashboard.stats.totalChats')}
          value={stats.total_chats}
          icon={<MessageSquare className="w-6 h-6 text-white" />}
          color="bg-rose-600"
        />
        <StatCard
          title={t('admin.dashboard.stats.monthlyChats')}
          value={stats.monthly_chats}
          icon={<MessageSquare className="w-6 h-6 text-white" />}
          color="bg-rose-500"
        />
        <StatCard
          title={t('admin.dashboard.stats.sevenDaysChats')}
          value={stats.seven_days_chats}
          icon={<MessageSquare className="w-6 h-6 text-white" />}
          color="bg-rose-400"
        />
      </div>

      {/* 订单统计 - 显示订单和购买相关的统计数据 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <StatCard
          title={t('admin.dashboard.stats.totalOrders')}
          value={stats.total_orders}
          icon={<ShoppingCart className="w-6 h-6 text-white" />}
          color="bg-emerald-600"
        />
        <StatCard
          title={t('admin.dashboard.stats.monthlyOrders')}
          value={stats.monthly_orders}
          icon={<ShoppingCart className="w-6 h-6 text-white" />}
          color="bg-emerald-500"
        />
        <StatCard
          title={t('admin.dashboard.stats.sevenDaysOrders')}
          value={stats.seven_days_orders}
          icon={<ShoppingCart className="w-6 h-6 text-white" />}
          color="bg-emerald-400"
        />
      </div>


    </div>
  );
}
