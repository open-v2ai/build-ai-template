'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { 
  Package,
  CreditCard, 
  User,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  Copy,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { fetcher } from '@/util/fetcher'
import { formatCurrency as formatCurrencyUtil } from '@/util/currency'

// 订单详情接口
interface OrderDetail {
  id: number
  order_number: string
  user_id: number
  membership_plan_id: number
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed' | 'refunded'
  payment_method: 'stripe'
  original_price: number
  discount_amount: number
  final_price: number
  currency: string
  stripe_payment_intent_id?: string
  stripe_customer_id?: string
  stripe_session_id?: string
  paid_at?: string
  payment_confirmed_at?: string
  processed_at?: string
  completed_at?: string
  cancelled_at?: string
  refund_amount?: number
  refunded_at?: string
  refund_reason?: string
  notes?: string
  failure_reason?: string
  created_at: string
  updated_at: string
}

interface OrderDetailDialogProps {
  orderId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * 订单详情弹框组件
 * 
 * 功能:
 * - 显示订单的完整详细信息
 * - 支持复制订单号和Stripe ID
 * - 显示订单状态和时间线
 * - 显示价格明细和支付信息
 */
export default function OrderDetailDialog({ 
  orderId, 
  open, 
  onOpenChange 
}: OrderDetailDialogProps) {
  const t = useTranslations()
  
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // 获取订单详情
  const fetchOrderDetail = useCallback(async (id: number) => {
    try {
      setIsLoading(true)
      const response = await fetcher(`/orders/admin/${id}`, {
        method: 'GET',
        auth: true,
      })
      setOrderDetail(response as OrderDetail)
    } catch (error) {
      console.error('Fetch order detail failed:', error)
      toast.error(t('order.messages.fetchDetailFailed'))
    } finally {
      setIsLoading(false)
    }
  }, [t])

  // 当弹框打开且有订单ID时获取详情
  useEffect(() => {
    if (open && orderId) {
      fetchOrderDetail(orderId)
    }
  }, [open, orderId, fetchOrderDetail])

  // 当弹框关闭时清空数据
  useEffect(() => {
    if (!open) {
      setOrderDetail(null)
    }
  }, [open])

  // 获取订单状态配置
  const getStatusConfig = (status: string) => {
    const statusConfig = {
      pending: { 
        icon: Clock,
        variant: 'secondary' as const, 
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        text: t('order.status.pending')
      },
      processing: { 
        icon: RefreshCw,
        variant: 'secondary' as const,
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        text: t('order.status.processing')
      },
      completed: { 
        icon: CheckCircle,
        variant: 'secondary' as const,
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        text: t('order.status.completed')
      },
      cancelled: { 
        icon: XCircle,
        variant: 'secondary' as const,
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        text: t('order.status.cancelled')
      },
      failed: { 
        icon: AlertCircle,
        variant: 'destructive' as const,
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        text: t('order.status.failed')
      },
      refunded: { 
        icon: RefreshCw,
        variant: 'secondary' as const,
        className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        text: t('order.status.refunded')
      }
    }

    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
  }

  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return t('common.values.notSet')
    return new Date(dateString).toLocaleString()
  }

  // 格式化金额
  const formatCurrency = (amount: number, currency: string = 'CNY') => {
    return formatCurrencyUtil(amount, currency)
  }

  // 复制到剪贴板
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(t('common.messages.copySuccess', { item: label }))
    } catch (error) {
      console.error('Copy failed:', error)
      toast.error(t('common.messages.copyFailed'))
    }
  }

  // 获取订单时间线
  const getOrderTimeline = (order: OrderDetail) => {
    const timeline = [
      {
        label: t('order.timeline.created'),
        time: order.created_at,
        completed: true
      },
      {
        label: t('order.timeline.paid'),
        time: order.paid_at,
        completed: !!order.paid_at
      },
      {
        label: t('order.timeline.confirmed'),
        time: order.payment_confirmed_at,
        completed: !!order.payment_confirmed_at
      },
      {
        label: t('order.timeline.processed'),
        time: order.processed_at,
        completed: !!order.processed_at
      },
      {
        label: t('order.timeline.completed'),
        time: order.completed_at,
        completed: !!order.completed_at
      }
    ]

    // 如果订单被取消或失败，添加相应的时间线项
    if (order.cancelled_at) {
      timeline.push({
        label: t('order.timeline.cancelled'),
        time: order.cancelled_at,
        completed: true
      })
    }

    if (order.refunded_at) {
      timeline.push({
        label: t('order.timeline.refunded'),
        time: order.refunded_at,
        completed: true
      })
    }

    return timeline.filter(item => item.time || item.completed)
  }

  if (!orderDetail && !isLoading) {
    return null
  }

  const statusConfig = orderDetail ? getStatusConfig(orderDetail.status) : null
  const StatusIcon = statusConfig?.icon || Clock

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t('order.detail.title')}
          </DialogTitle>
          <DialogDescription>
            {orderDetail ? 
              t('order.detail.description', { orderNumber: orderDetail.order_number }) :
              t('order.detail.loading')
            }
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <span className="text-muted-foreground">{t('common.actions.loading')}</span>
          </div>
        ) : orderDetail ? (
          <div className="space-y-6">
            {/* 基本信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {t('order.detail.basicInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('order.table.orderNumber')}
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                        {orderDetail.order_number}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(orderDetail.order_number, t('order.table.orderNumber'))}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('order.table.status')}
                    </label>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusConfig?.variant} className={statusConfig?.className}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig?.text}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('admin.orders.table.userId')}
                    </label>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <Badge variant="outline">{orderDetail.user_id}</Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('order.detail.membershipPlan')}
                    </label>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <Badge variant="outline">{orderDetail.membership_plan_id}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 价格信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {t('order.detail.priceInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('order.detail.originalPrice')}
                    </label>
                    <div className="text-lg font-semibold">
                      {formatCurrency(orderDetail.original_price, orderDetail.currency)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('order.detail.discountAmount')}
                    </label>
                    <div className="text-lg font-semibold text-green-600">
                      -{formatCurrency(orderDetail.discount_amount, orderDetail.currency)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('order.table.amount')}
                    </label>
                    <div className="text-xl font-bold text-primary">
                      {formatCurrency(orderDetail.final_price, orderDetail.currency)}
                    </div>
                  </div>
                </div>

                {orderDetail.refund_amount && orderDetail.refund_amount > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        {t('order.detail.refundAmount')}
                      </label>
                      <div className="text-lg font-semibold text-red-600">
                        {formatCurrency(orderDetail.refund_amount, orderDetail.currency)}
                      </div>
                      {orderDetail.refund_reason && (
                        <div className="text-sm text-muted-foreground">
                          {t('order.detail.refundReason')}: {orderDetail.refund_reason}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* 支付信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  {t('order.detail.paymentInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('order.table.paymentMethod')}
                    </label>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span>Stripe</span>
                    </div>
                  </div>

                  {orderDetail.stripe_session_id && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Stripe Session ID
                      </label>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono truncate max-w-48">
                          {orderDetail.stripe_session_id}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(orderDetail.stripe_session_id!, 'Session ID')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {orderDetail.stripe_payment_intent_id && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Stripe Payment Intent ID
                      </label>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono truncate max-w-48">
                          {orderDetail.stripe_payment_intent_id}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(orderDetail.stripe_payment_intent_id!, 'Payment Intent ID')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {orderDetail.stripe_customer_id && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Stripe Customer ID
                      </label>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono truncate max-w-48">
                          {orderDetail.stripe_customer_id}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(orderDetail.stripe_customer_id!, 'Customer ID')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 时间线 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t('order.detail.timeline')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getOrderTimeline(orderDetail).map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        item.completed ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                      <div className="flex-1">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(item.time)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 备注和失败原因 */}
            {(orderDetail.notes || orderDetail.failure_reason) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {t('order.detail.additionalInfo')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {orderDetail.notes && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        {t('order.detail.notes')}
                      </label>
                      <div className="bg-muted p-3 rounded text-sm">
                        {orderDetail.notes}
                      </div>
                    </div>
                  )}

                  {orderDetail.failure_reason && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        {t('order.detail.failureReason')}
                      </label>
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded text-sm text-red-800 dark:text-red-200">
                        {orderDetail.failure_reason}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 操作按钮 */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.actions.close')}
              </Button>
              {orderDetail.stripe_session_id && (
                <Button
                  variant="outline"
                  onClick={() => window.open(`https://dashboard.stripe.com/payments/${orderDetail.stripe_payment_intent_id}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t('order.detail.viewInStripe')}
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
