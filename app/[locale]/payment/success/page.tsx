'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

import { CheckCircle, Loader2, Crown, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getOrderDetail, getOrderBySession } from '@/util/user-api'
import { useGlobalUserData, GlobalUserDataProvider } from '@/hooks/use-global-user-data'
import type { OrderResponse } from '@/util/user-api'
import { formatCurrency } from '@/util/currency'

/**
 * 支付成功页面内容组件
 * 
 * 功能:
 * - 显示支付成功状态
 * - 展示订单详情
 * - 更新用户会员状态
 * - 提供导航链接
 */
function PaymentSuccessContent() {
  const t = useTranslations()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userProfile, refreshUserProfile, refreshMembershipStatus } = useGlobalUserData()
  
  const [isLoading, setIsLoading] = useState(true)
  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPaymentResult = async () => {
      try {
        // 从 URL 参数获取订单信息
        const sessionId = searchParams.get('session_id')
        const orderId = searchParams.get('order_id')
        
        
        if (!sessionId && !orderId) {
          setError(t('payment.error.missingParams'))
          return
        }

        // 刷新用户资料和会员状态以确认支付状态
        await refreshUserProfile()
        await refreshMembershipStatus()

        // 如果有订单ID，获取订单详情
        if (orderId) {
          const orderDetail = await getOrderDetail(parseInt(orderId))
          setOrder(orderDetail)
          
          // 检查订单状态
          if (orderDetail.status === 'completed') {
            toast.success(t('payment.success.message'))
            
            // 触发全局状态更新
            window.dispatchEvent(new CustomEvent('user-type-changed'))
          } else if (orderDetail.status === 'processing') {
            toast.info(t('payment.processing.message'))
          } else {
          }
        } else if (sessionId) {
          // 如果只有session_id，尝试通过session_id获取订单信息
          const orderDetail = await getOrderBySession(sessionId)
          setOrder(orderDetail)
          
          // 检查订单状态
          if (orderDetail.status === 'completed') {
            toast.success(t('payment.success.message'))
            
            // 触发全局状态更新
            window.dispatchEvent(new CustomEvent('user-type-changed'))
          } else if (orderDetail.status === 'processing') {
            toast.info(t('payment.processing.message'))
          } else {
          }
        }

      } catch (error) {
        
        // 根据错误类型设置不同的错误信息
        if (error instanceof Error) {
          if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            setError(t('common.messages.loginRequired'))
            toast.error(t('common.messages.loginRequired'))
          } else if (error.message.includes('404') || error.message.includes('not found')) {
            setError(t('order.error.notFound'))
            toast.error(t('order.error.notFound'))
          } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
            setError(t('common.messages.accessDenied'))
            toast.error(t('common.messages.accessDenied'))
          } else {
            setError(t('payment.error.fetchFailed'))
            toast.error(t('payment.error.fetchFailed'))
          }
        } else {
          setError(t('payment.error.fetchFailed'))
          toast.error(t('payment.error.fetchFailed'))
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchPaymentResult()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, t])

  // 获取会员类型显示名称
  const getMembershipTypeName = (type: string) => {
    switch (type) {
      case 'monthly':
        return t('upgrade.plans.monthly.name')
      case 'yearly':
        return t('upgrade.plans.yearly.name')
      default:
        return t('upgrade.plans.free.name')
    }
  }

  // 获取订单状态显示
  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{t('order.status.completed')}</Badge>
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{t('order.status.processing')}</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">{t('order.status.pending')}</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">{t('payment.loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">{t('payment.error.title')}</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => router.back()}>
                {t('common.actions.back')}
              </Button>
              <Button asChild>
                <Link href="/">{t('common.actions.home')}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* 成功状态卡片 */}
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-400">
              {t('payment.success.title')}
            </CardTitle>
            <p className="text-muted-foreground">
              {t('payment.success.description')}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* 用户会员状态 */}
            {userProfile && (
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Crown className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-semibold text-purple-800 dark:text-purple-200">
                    {t('payment.success.membershipActivated')}
                  </h3>
                </div>
                <p className="text-purple-700 dark:text-purple-300">
                  {t('payment.success.welcomeMember', { 
                    membershipType: getMembershipTypeName(userProfile.membership_type) 
                  })}
                </p>
              </div>
            )}

            {/* 订单详情 */}
            {order && (
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  {t('order.detail.title')}
                  {getOrderStatusBadge(order.status)}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t('order.detail.orderNumber')}:</span>
                    <span className="ml-2 font-mono">{order.order_number}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('order.detail.finalPrice')}:</span>
                      <span className="ml-2 font-semibold">{formatCurrency(order.final_price, order.currency)}</span>
                      {order.discount_amount > 0 && (
                        <span className="text-sm text-muted-foreground ml-1">
                          ({t('order.detail.originalPrice')} {formatCurrency(order.original_price, order.currency)})
                        </span>
                      )}
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('order.detail.paymentMethod')}:</span>
                    <span className="ml-2">Stripe</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('order.detail.paymentTime')}:</span>
                    <span className="ml-2">
                      {order.paid_at ? new Date(order.paid_at).toLocaleString() : t('common.status.pending')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 下一步操作 */}
            <div className="pt-4">
              <Button asChild size="lg" className="w-full h-12">
                <Link href="/">
                  {t('payment.success.startChatting')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>

            {/* 帮助信息 */}
            <div className="text-center text-sm text-muted-foreground pt-4 border-t">
              <p>{t('payment.success.helpText')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * 支付成功页面
 * 
 * 使用 Suspense 包装以支持 useSearchParams
 */
export default function PaymentSuccessPage() {
  const t = useTranslations()
  
  return (
    <GlobalUserDataProvider>
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950 dark:via-emerald-950 dark:to-teal-950 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <Card className="border-green-200 dark:border-green-800 shadow-xl">
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-muted-foreground">{t('common.actions.loading')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      }>
        <PaymentSuccessContent />
      </Suspense>
    </GlobalUserDataProvider>
  )
}
