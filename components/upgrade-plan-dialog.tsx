'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

import { Crown, Check, Sparkles, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import OrdersDialog from '@/components/orders-dialog'
import { useGlobalUserData } from '@/hooks/use-global-user-data'
import { createStripeCheckout } from '@/util/user-api'
import { formatTokenCount } from '@/util/user-utils'
import { formatCurrency } from '@/util/currency'
// import type { MembershipPlan } from '@/app/[locale]/admin/types'

interface PlanFeature {
  text: string
  included: boolean
}

interface PlanOption {
  id: string
  name: string
  price: string
  originalPrice?: string
  period: string
  popular?: boolean
  features: PlanFeature[]
  buttonText: string
  buttonVariant: 'outline' | 'default' | 'secondary'
}

interface UpgradePlanDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function UpgradePlanDialog({ open: externalOpen, onOpenChange }: UpgradePlanDialogProps = {}) {
  const t = useTranslations()
  const {
    userProfile,
    userProfileLoading,
    membershipPlans,
    membershipPlansLoading,
    pendingOrders,
    userOrdersLoading,
    refreshUserOrders
  } = useGlobalUserData()
  
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null)
  const [internalOpen, setInternalOpen] = useState(false)
  const [ordersDialogOpen, setOrdersDialogOpen] = useState(false)
  
  // 使用外部控制的 open 状态，如果没有提供则使用内部状态
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  
  // 计算加载状态和待支付订单状态
  const isLoading = userProfileLoading || membershipPlansLoading
  const hasPendingOrder = pendingOrders.length > 0
  const isRefreshingOrders = userOrdersLoading

  // 如果是外部控制模式，总是渲染弹框（即使在加载中）
  const isExternallyControlled = externalOpen !== undefined
  
  
  // 默认显示升级按钮，只有在确认用户是付费会员时才隐藏
  // 这样可以确保免费用户、未登录用户、加载中都能看到升级按钮
  // 只有当 membership_type 明确为 'monthly' 或 'yearly' 时才隐藏升级按钮
  if (!isExternallyControlled && userProfile && 
      userProfile.membership_type && 
      (userProfile.membership_type === 'monthly' || userProfile.membership_type === 'yearly')) {
    return null
  }

  // 获取用户当前的会员类型
  const currentMembershipType = userProfile?.membership_type || 'free'
  
  // 月度计划永远显示"最受欢迎"，除非用户已经是月度会员
  const shouldShowPopularBadge = (planId: string) => {
    return planId === 'monthly' && currentMembershipType !== 'monthly'
  }

  // 生成计划选项，使用后端数据或静态数据作为回退
  const generatePlanOptions = (): PlanOption[] => {
    // 如果没有后端计划数据，使用静态的计划选项
    if (!membershipPlans.length) {
      return [
        {
          id: 'free',
          name: t('upgrade.plans.free.name'),
          price: t('upgrade.plans.free.price'),
          period: '',
          features: [
            { text: t('upgrade.features.basicChat'), included: true },
            { text: t('upgrade.features.dailyMessagesWithCount', { count: 100 }), included: true },
            { text: t('upgrade.features.dailyTokensWithCount', { count: '1M' }), included: true },
            { text: t('upgrade.features.conversationTurnsWithCount', { count: 10 }), included: true },
            { text: t('upgrade.features.advancedSettings'), included: false },
            { text: t('upgrade.features.prioritySupport'), included: false },
          ],
          buttonText: currentMembershipType === 'free' ? t('upgrade.currentPlan') : t('upgrade.plans.free.buttonText'),
          buttonVariant: 'outline',
        },
        {
          id: 'monthly',
          name: t('upgrade.plans.monthly.name'),
          price: t('upgrade.plans.monthly.price'),
          period: t('upgrade.plans.monthly.period'),
          popular: shouldShowPopularBadge('monthly'),
          features: [
            { text: t('upgrade.features.basicChat'), included: true },
            { text: t('upgrade.features.dailyMessagesWithCount', { count: 800 }), included: true },
            { text: t('upgrade.features.dailyTokensWithCount', { count: '8M' }), included: true },
            { text: t('upgrade.features.conversationTurnsWithCount', { count: 30 }), included: true },
            { text: t('upgrade.features.advancedSettings'), included: true },
            { text: t('upgrade.features.prioritySupport'), included: true },
          ],
          buttonText: currentMembershipType === 'monthly' ? t('upgrade.currentPlan') : t('upgrade.plans.monthly.buttonText'),
          buttonVariant: currentMembershipType === 'monthly' ? 'outline' : 'default',
        },
        {
          id: 'yearly',
          name: t('upgrade.plans.yearly.name'),
          price: t('upgrade.plans.yearly.price'),
          originalPrice: t('upgrade.plans.yearly.originalPrice'),
          period: t('upgrade.plans.yearly.period'),
          popular: false,
          features: [
            { text: t('upgrade.features.basicChat'), included: true },
            { text: t('upgrade.features.dailyMessagesWithCount', { count: 1000 }), included: true },
            { text: t('upgrade.features.dailyTokensWithCount', { count: '10M' }), included: true },
            { text: t('upgrade.features.conversationTurnsWithCount', { count: 50 }), included: true },
            { text: t('upgrade.features.advancedSettings'), included: true },
            { text: t('upgrade.features.prioritySupport'), included: true },
          ],
          buttonText: currentMembershipType === 'yearly' ? t('upgrade.currentPlan') : t('upgrade.plans.yearly.buttonText'),
          buttonVariant: currentMembershipType === 'yearly' ? 'outline' : 'default',
        },
      ]
    }

    // 定义计划顺序
    const planOrder = ['free', 'monthly', 'yearly']
    
    // 按照指定顺序重新排列计划
    const sortedPlans = planOrder
      .map(type => membershipPlans.find(plan => plan.type === type))
      .filter(Boolean) as typeof membershipPlans
    
    const backendPlans: PlanOption[] = sortedPlans
      .map(plan => {
        const isCurrentPlan = currentMembershipType === plan.type
        const isPopular = plan.type === 'monthly' && currentMembershipType !== 'monthly'
        
        return {
          id: plan.type,
          name: plan.name,
          price: plan.type === 'free' ? t('upgrade.plans.free.price') : formatCurrency(plan.price, 'currency' in plan ? plan.currency : 'USD'),
          originalPrice: plan.type === 'yearly' ? formatCurrency((plan.price * 12 / 10), 'currency' in plan ? plan.currency : 'USD') : undefined,
          period: plan.type === 'monthly' ? t('upgrade.plans.monthly.period') : 
                  plan.type === 'yearly' ? t('upgrade.plans.yearly.period') : '',
          popular: isPopular,
          features: [
            { text: t('upgrade.features.basicChat'), included: true },
            { text: t('upgrade.features.dailyMessagesWithCount', { count: plan.daily_message_limit }), included: true },
            { text: t('upgrade.features.dailyTokensWithCount', { count: formatTokenCount(plan.daily_token_limit) }), included: true },
            { text: t('upgrade.features.conversationTurnsWithCount', { count: plan.conversation_turn_limit }), included: true },
            { text: t('upgrade.features.advancedSettings'), included: plan.type !== 'free' },
            { text: t('upgrade.features.prioritySupport'), included: plan.type === 'yearly' },
          ],
          buttonText: isCurrentPlan ? t('upgrade.currentPlan') : t(`upgrade.plans.${plan.type}.buttonText`),
          buttonVariant: isCurrentPlan ? 'outline' : (plan.type === 'free' ? 'outline' : 'default'),
        }
      })

    // 如果后端有数据，直接使用后端数据（包含免费会员）
    return backendPlans
  }

  const planOptions = generatePlanOptions()

  /**
   * 检查是否可以升级到指定的会员类型
   * 月度会员期间不能开通年付会员，年付会员期间不能开通月度会员
   */
  const canUpgradeToType = (targetType: string): boolean => {
    // 免费用户可以升级到任何类型
    if (currentMembershipType === 'free') return true
    
    // 不能升级到相同类型
    if (targetType === currentMembershipType) return false
    
    // 月度会员期间不能开通年付会员
    if (currentMembershipType === 'monthly' && targetType === 'yearly') return false
    
    // 年付会员期间不能开通月度会员
    if (currentMembershipType === 'yearly' && targetType === 'monthly') return false
    
    return true
  }

  /**
   * 获取不能升级的原因提示
   */
  const getUpgradeRestrictionMessage = (targetType: string): string | null => {
    if (currentMembershipType === 'monthly' && targetType === 'yearly') {
      return t('membership.upgrade.cannotUpgradeMonthlyToYearly')
    }
    if (currentMembershipType === 'yearly' && targetType === 'monthly') {
      return t('membership.upgrade.cannotUpgradeYearlyToMonthly')
    }
    return null
  }

  /**
   * 刷新待支付订单状态
   */
  const handleRefreshPendingOrders = async () => {
    try {
      await refreshUserOrders('pending')
      
      if (pendingOrders.length === 0) {
        toast.success(t('order.messages.noPendingOrders'))
      } else {
        toast.success(t('order.messages.refreshSuccess'))
      }
    } catch (error) {
      console.error('Refresh pending orders failed:', error)
      toast.error(t('order.messages.refreshFailed'))
    }
  }

  const handleUpgrade = async (planId: string) => {
    // 如果点击的是当前计划或免费会员，不执行升级
    if (planId === 'free' || planId === currentMembershipType) return
    
    // 检查是否有待支付订单
    if (hasPendingOrder) {
      toast.error(t('order.messages.hasPendingOrder'))
      return
    }
    
    // 检查会员类型限制
    if (!canUpgradeToType(planId)) {
      const message = getUpgradeRestrictionMessage(planId)
      if (message) {
        toast.error(message)
      }
      return
    }
    
    setIsUpgrading(true)
    setUpgradingPlan(planId)
    
    try {
      // 找到对应的会员计划
      const selectedPlan = membershipPlans.find(plan => plan.type === planId)
      if (!selectedPlan) {
        toast.error(t('upgrade.messages.planNotFound'))
        return
      }

      // 创建 Stripe 支付会话
      const checkoutData = {
        membership_plan_id: selectedPlan.id,
        success_url: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/payment/cancel`,
        discount_code: null // 暂时不支持折扣码
      }

      const response = await createStripeCheckout(checkoutData)
      
      if (response.checkout_url) {
        // 跳转到 Stripe 支付页面
        window.location.href = response.checkout_url
      } else {
        toast.error(t('upgrade.messages.paymentFailed'))
      }
    } catch (error) {
      
      // 检查是否是待支付订单错误
      if (error instanceof Error && error.message.includes('pending order')) {
        toast.error(t('order.messages.hasPendingOrder'))
        // 重新检查待支付订单状态
        try {
          await refreshUserOrders('pending')
        } catch {
          // 忽略获取订单失败的错误
        }
      } else {
        toast.error(t('upgrade.messages.paymentFailed'))
      }
    } finally {
      setIsUpgrading(false)
      setUpgradingPlan(null)
    }
  }

  // 渲染对话框内容的通用组件
  const renderDialogContent = () => (
    <DialogContent 
      className="max-w-[920px] w-[95vw] max-h-[95vh] overflow-y-auto p-12 sm:p-10"
      onInteractOutside={(e) => e.preventDefault()}
    >
      <DialogHeader className="space-y-4 pb-4">
        <DialogTitle className="text-3xl font-bold text-center flex items-center justify-center gap-3">
          <Sparkles className="h-8 w-8 text-purple-600" />
          {t('upgrade.title')}
        </DialogTitle>
        
        <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto">
          {t('upgrade.description')}
        </p>

        {/* 待支付订单警告 */}
        {hasPendingOrder && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mx-auto max-w-2xl">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  {t('order.messages.pendingOrderTitle')}
                </h3>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                  {t('order.messages.pendingOrderDescription')}
                </p>
                <div className="mt-3 flex space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-yellow-800 border-yellow-300 hover:bg-yellow-100 dark:text-yellow-200 dark:border-yellow-600 dark:hover:bg-yellow-800/20"
                    onClick={() => {
                      // 打开订单弹框
                      setOrdersDialogOpen(true)
                    }}
                  >
                    {t('order.messages.viewPendingOrders')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-yellow-800 border-yellow-300 hover:bg-yellow-100 dark:text-yellow-200 dark:border-yellow-600 dark:hover:bg-yellow-800/20"
                    onClick={handleRefreshPendingOrders}
                    disabled={isRefreshingOrders}
                  >
                    {isRefreshingOrders ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                  {pendingOrders.length > 0 && pendingOrders[0].stripe_session_id && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-yellow-800 border-yellow-300 hover:bg-yellow-100 dark:text-yellow-200 dark:border-yellow-600 dark:hover:bg-yellow-800/20"
                      onClick={() => {
                        // 继续支付最新的待支付订单
                        const latestOrder = pendingOrders[0]
                        if (latestOrder.stripe_session_id) {
                          // 这里需要重新创建支付会话，因为原来的可能已过期
                          toast.info(t('payment.processing.message'))
                          // TODO: 实现重新创建支付会话的逻辑
                        }
                      }}
                    >
                      {t('order.messages.continuePay')}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogHeader>
      
      {/* 如果正在加载用户资料，显示加载状态 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <span className="ml-2 text-muted-foreground">{t('common.actions.loading')}</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-4 justify-items-center">
        {planOptions.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative transition-all duration-300 min-h-[360px] w-full max-w-[220px] flex flex-col ${
              plan.popular 
                ? 'border-purple-500 shadow-purple-100 dark:shadow-purple-900/20 ring-2 ring-purple-200 dark:ring-purple-800 hover:shadow-xl hover:scale-105' 
                : 'hover:border-purple-300 hover:shadow-xl hover:scale-105'
            }`}
          >
            {plan.popular && !plan.originalPrice && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 text-sm font-medium">
                  {t('upgrade.popular')}
                </Badge>
              </div>
            )}
            {plan.id === 'yearly' && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  {t('upgrade.savePercent', { percent: '20%' })}
                </Badge>
              </div>
            )}
            {plan.popular && plan.originalPrice && (
              <div className="absolute -top-4 right-4 z-10">
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 text-xs font-medium">
                  {t('upgrade.popular')}
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-4 pt-6">
              <CardTitle className="text-lg font-bold mb-3">
                {plan.name}
              </CardTitle>
              <div className="space-y-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold text-primary">{plan.price}</span>
                    {plan.period && (
                      <span className="text-muted-foreground text-base">/{plan.period}</span>
                    )}
                  </div>
                  {/* 设置固定高度 */}
                  <span className="text-sm text-muted-foreground line-through h-2">
                    {plan.originalPrice ?? ""}
                  </span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col justify-between px-5 pb-3">
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check 
                      className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                        feature.included 
                          ? 'text-green-500' 
                          : 'text-muted-foreground opacity-50'
                      }`}
                    />
                    <span 
                      className={`text-xs leading-relaxed ${
                        feature.included 
                          ? 'text-foreground' 
                          : 'text-muted-foreground opacity-70'
                      }`}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
              
              <Button
                className={`w-full h-10 text-sm font-medium mt-6 ${
                  plan.popular 
                    ? 'bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 hover:from-purple-700 hover:via-pink-600 hover:to-orange-600 text-white shadow-xl shadow-purple-500/25 border-0' 
                    : ''
                }`}
                variant={plan.buttonVariant}
                onClick={() => handleUpgrade(plan.id)}
                disabled={plan.id === 'free' || plan.id === currentMembershipType || isUpgrading}
              >
                {isUpgrading && upgradingPlan === plan.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('upgrade.upgrading')}
                  </>
                ) : (
                  plan.buttonText
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      
          <div className="mt-8 pt-6 border-t border-border">
            <div className="text-center space-y-3">
              <p className="text-base text-muted-foreground font-medium">
                {t('upgrade.footer.securePayment')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('upgrade.footer.cancelAnytime')}
              </p>
            </div>
          </div>
        </>
      )}
    </DialogContent>
  )

  // 如果是外部控制，只返回 Dialog 内容
  if (isExternallyControlled) {
    return (
      <>
        <Dialog open={open} onOpenChange={setOpen} modal={true}>
          {renderDialogContent()}
        </Dialog>
        
        {/* 订单弹框 */}
        <OrdersDialog 
          open={ordersDialogOpen} 
          onOpenChange={setOrdersDialogOpen}
        />
      </>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen} modal={true}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 mr-4 bg-gradient-to-r from-purple-600/20 via-pink-500/20 to-orange-500/20 border-purple-300 hover:from-purple-600/30 hover:via-pink-500/30 hover:to-orange-500/30 hover:border-purple-400 dark:border-purple-700 dark:hover:border-purple-600 shadow-md hover:shadow-lg transition-all duration-300"
          >
            <Crown className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            {t('upgrade.buttonText')}
          </Button>
        </DialogTrigger>
        {renderDialogContent()}
      </Dialog>
      
      {/* 订单弹框 */}
      <OrdersDialog 
        open={ordersDialogOpen} 
        onOpenChange={setOrdersDialogOpen}
      />
    </>
  )
}
