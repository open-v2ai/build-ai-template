"use client"

import { useTranslations } from 'next-intl'

import { 
  User, 
  Crown, 
  Shield, 
  MessageCircle, 
  MessageSquare,
  Zap, 
  Calendar,
  Mail,
  Clock,
  TrendingUp
} from "lucide-react"

import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { useMembershipStatus } from '@/hooks/use-global-user-data'
import { 
  getUserTypeText, 
  useUserStatus,
  formatTokenCount
} from '@/util/user-utils'

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: {
    name: string
    email: string
  }
}

export default function ProfileDialog({ 
  open, 
  onOpenChange, 
  user 
}: ProfileDialogProps) {
  const t = useTranslations()
  const { userType, isAdmin } = useUserStatus(user.email)
  const { membershipStatus } = useMembershipStatus()
  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // 获取会员类型显示文本
  const getMembershipTypeText = (type: string) => {
    switch (type) {
      case 'free':
        return t('membership.types.free')
      case 'monthly':
        return t('membership.types.monthly')
      case 'yearly':
        return t('membership.types.yearly')
      default:
        return t('membership.types.free')
    }
  }

  // 获取会员类型描述
  const getMembershipTypeDescription = (type: string) => {
    switch (type) {
      case 'free':
        return t('profile.membershipDetails.freeDescription')
      case 'monthly':
        return t('profile.membershipDetails.monthlyDescription')
      case 'yearly':
        return t('profile.membershipDetails.yearlyDescription')
      default:
        return t('profile.membershipDetails.freeDescription')
    }
  }

  // 获取会员类型颜色
  const getMembershipTypeColor = (type: string) => {
    switch (type) {
      case 'free':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      case 'monthly':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'yearly':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  // 计算剩余天数
  const calculateRemainingDays = () => {
    if (!membershipStatus?.end_date) {
      return null // 永久会员或免费用户
    }
    
    const endDate = new Date(membershipStatus.end_date)
    const now = new Date()
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  }

  // 获取剩余天数显示文本
  const getRemainingDaysText = () => {
    const remainingDays = calculateRemainingDays()
    
    if (remainingDays === null) {
      return t('profile.permanent')
    }
    
    if (remainingDays < 0) {
      return t('profile.expired')
    }
    
    if (remainingDays === 0) {
      return t('profile.expiringToday')
    }
    
    return t('profile.daysLeft', { days: remainingDays })
  }

  // 获取剩余天数颜色
  const getRemainingDaysColor = () => {
    const remainingDays = calculateRemainingDays()
    
    if (remainingDays === null) {
      return 'text-green-600 dark:text-green-400' // 永久
    }
    
    if (remainingDays < 0) {
      return 'text-red-600 dark:text-red-400' // 已过期
    }
    
    if (remainingDays <= 7) {
      return 'text-orange-600 dark:text-orange-400' // 即将过期
    }
    
    return 'text-green-600 dark:text-green-400' // 正常
  }

  // 计算使用率百分比
  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === 0) return 0
    return Math.round((used / limit) * 100)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>{t('profile.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 m-2 mt-6">
          {/* 用户基本信息 */}
          <Card>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 rounded-lg justify-center items-center">
                  <User className="h-8 w-8 text-foreground" />
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold">{user.name}</h3>
                    {membershipStatus && membershipStatus.membership_type !== 'free' && (
                      <Crown className="h-5 w-5 text-purple-500" />
                    )}
                    {isAdmin && (
                      <Shield className="h-5 w-5 text-purple-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={getMembershipTypeColor(membershipStatus?.membership_type || 'free')}>
                      <Crown className="h-3 w-3 mr-1" />
                      {getMembershipTypeText(membershipStatus?.membership_type || 'free')}
                    </Badge>
                    {isAdmin && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        <Shield className="h-3 w-3 mr-1" />
                        {getUserTypeText(userType, t)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 会员信息 */}
          {membershipStatus && (
            <Card>
              <CardContent className="space-y-4">
                {/* 会员类型和描述 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getMembershipTypeColor(membershipStatus.membership_type || 'free')}>
                        {getMembershipTypeText(membershipStatus.membership_type || 'free')}
                      </Badge>
                      {membershipStatus.membership_type !== 'free' && (
                        <Crown className="h-4 w-4 text-purple-500" />
                      )}
                    </div>
                    <div className={`text-sm font-medium ${getRemainingDaysColor()}`}>
                      {getRemainingDaysText()}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getMembershipTypeDescription(membershipStatus.membership_type || 'free')}
                  </p>
                </div>

                <Separator />

                {/* 会员时间信息 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {t('profile.membershipStartDate')}
                    </div>
                    <p className="font-medium">
                      {membershipStatus.start_date ? formatDate(membershipStatus.start_date) : t('profile.notSet')}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {t('profile.membershipEndDate')}
                    </div>
                    <p className="font-medium">
                      {membershipStatus.end_date ? formatDate(membershipStatus.end_date) : t('profile.permanent')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 使用情况统计 */}
          {membershipStatus && (
            <Card>
              <CardContent className="space-y-4">
                {/* 今日使用统计 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-sm">{t('profile.dailyStats')}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* 今日消息 */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <MessageCircle className={`h-3 w-3 ${
                            membershipStatus.daily_message_remaining <= 0 ? 'text-red-500' : 'text-blue-500'
                          }`} />
                          <span className="text-xs text-muted-foreground">{t('profile.todayMessages')}</span>
                        </div>
                        <span className={`text-xs font-medium ${
                          membershipStatus.daily_message_remaining <= 0 ? 'text-red-500' : ''
                        }`}>
                          {membershipStatus.daily_message_count} / {membershipStatus.daily_message_limit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            membershipStatus.daily_message_remaining <= 0 ? 'bg-red-500' : 'bg-blue-500'
                          }`}
                          style={{ 
                            width: `${getUsagePercentage(membershipStatus.daily_message_count, membershipStatus.daily_message_limit)}%` 
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* 今日Token */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Zap className={`h-3 w-3 ${
                            membershipStatus.daily_token_remaining <= 0 ? 'text-red-500' : 'text-purple-500'
                          }`} />
                          <span className="text-xs text-muted-foreground">{t('profile.todayTokens')}</span>
                        </div>
                        <span className={`text-xs font-medium ${
                          membershipStatus.daily_token_remaining <= 0 ? 'text-red-500' : ''
                        }`}>
                          {formatTokenCount(membershipStatus.daily_token_count)} / {formatTokenCount(membershipStatus.daily_token_limit)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            membershipStatus.daily_token_remaining <= 0 ? 'bg-red-500' : 'bg-purple-500'
                          }`}
                          style={{ 
                            width: `${getUsagePercentage(membershipStatus.daily_token_count, membershipStatus.daily_token_limit)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* 重置时间提示 */}
                <div className="bg-blue-50 dark:bg-blue-950 p-2 rounded-lg">
                  <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {t('profile.resetTime')}
                  </p>
                </div>
                <Separator />

                {/* 历史总统计 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-sm">{t('profile.overallStats')}</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    {/* 总消息数 */}
                    <div className="text-center space-y-1">
                      <div className="flex items-center justify-center">
                        <MessageCircle className="h-4 w-4 text-blue-500 mr-1" />
                      </div>
                      <div className="text-lg font-semibold">{membershipStatus.total_message_count?.toLocaleString() || '0'}</div>
                      <div className="text-xs text-muted-foreground">{t('profile.totalMessages')}</div>
                    </div>

                    {/* 总Token数 */}
                    <div className="text-center space-y-1">
                      <div className="flex items-center justify-center">
                        <Zap className="h-4 w-4 text-purple-500 mr-1" />
                      </div>
                      <div className="text-lg font-semibold">{formatTokenCount(membershipStatus.total_token_count || 0)}</div>
                      <div className="text-xs text-muted-foreground">{t('profile.totalTokens')}</div>
                    </div>

                    {/* 总对话数 */}
                    <div className="text-center space-y-1">
                      <div className="flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-green-500 mr-1" />
                      </div>
                      <div className="text-lg font-semibold">{membershipStatus.total_chat_count?.toLocaleString() || '0'}</div>
                      <div className="text-xs text-muted-foreground">{t('profile.totalChats')}</div>
                    </div>

                  </div>
                </div>

              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
