import { fetcher } from '@/util/fetcher'
import type { MembershipStatus, UsageLimitCheck, MembershipPlan } from '@/app/[locale]/admin/types'

// 订单相关类型定义
export interface StripeCheckoutRequest {
  membership_plan_id: number
  success_url: string
  cancel_url: string
  discount_code?: string | null
}

export interface StripeCheckoutResponse {
  checkout_url: string
  session_id: string
  order_id: number
}

export interface OrderResponse {
  id: number
  order_number: string
  user_id: number
  membership_plan_id: number
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded' | 'failed'
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

export interface UpgradeRequest {
  plan_id: string
}

export interface UserProfile {
  id: number
  username: string
  email: string
  user_type: string
  membership_type: string
  last_login_at: string | null
  created_at: string
}

export interface UpgradeResponse {
  success: boolean
  message: string
  user_profile: UserProfile | null
}

/**
 * 升级用户会员
 */
export async function upgradeUserMembership(planId: string): Promise<UpgradeResponse> {
  const response = await fetcher<UpgradeResponse>('/user/upgrade', {
    method: 'POST',
    auth: true,
    body: JSON.stringify({
      plan_id: planId
    })
  })
  
  return response as UpgradeResponse
}

/**
 * 获取当前用户会员状态
 */
export async function getUserMembershipStatus(): Promise<MembershipStatus> {
  try {
    const response = await fetcher('/membership/status', {
      method: 'GET',
      auth: true,
    })
    return response as MembershipStatus
  } catch (error) {
    console.error('Failed to fetch membership status:', error)
    throw error
  }
}

/**
 * 获取会员计划列表
 */
export async function getMembershipPlans(): Promise<{ items: MembershipPlan[], total: number }> {
  try {
    const response = await fetcher('/membership/plans', {
      method: 'GET',
      auth: true,
    })
    return response as { items: MembershipPlan[], total: number }
  } catch (error) {
    console.error('Failed to fetch membership plans:', error)
    throw error
  }
}

/**
 * 检查使用限制
 */
export async function checkUsageLimits(chatId: number): Promise<UsageLimitCheck> {
  try {
    const response = await fetcher(`/membership/check-limits/${chatId}`, {
      method: 'GET',
      auth: true,
    })
    return response as UsageLimitCheck
  } catch (error) {
    console.error('Failed to check usage limits:', error)
    throw error
  }
}

/**
 * 记录使用情况
 */
export async function recordUsage(chatId: number, messageCount: number = 1, tokenCount: number = 0): Promise<{ success: boolean, message: string }> {
  try {
    const response = await fetcher(`/membership/record-usage/${chatId}?message_count=${messageCount}&token_count=${tokenCount}`, {
      method: 'POST',
      auth: true,
    })
    return response as { success: boolean, message: string }
  } catch (error) {
    console.error('Failed to record usage:', error)
    throw error
  }
}

// ===== 订单相关 API =====

/**
 * 创建 Stripe 支付会话
 */
export async function createStripeCheckout(checkoutData: StripeCheckoutRequest): Promise<StripeCheckoutResponse> {
  try {
    const response = await fetcher('/orders/stripe/checkout', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(checkoutData)
    })
    return response as StripeCheckoutResponse
  } catch (error) {
    console.error('Failed to create stripe checkout:', error)
    throw error
  }
}

/**
 * 获取用户订单列表
 */
export async function getUserOrders(params?: {
  skip?: number
  limit?: number
  status?: string
}): Promise<OrderResponse[]> {
  try {
    const queryParams = new URLSearchParams()
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString())
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString())
    if (params?.status) queryParams.append('status', params.status)
    
    const url = `/orders${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    const response = await fetcher(url, {
      method: 'GET',
      auth: true,
    })
    return response as OrderResponse[]
  } catch (error) {
    console.error('Failed to fetch user orders:', error)
    throw error
  }
}

/**
 * 获取订单详情
 */
export async function getOrderDetail(orderId: number): Promise<OrderResponse> {
  try {
    const response = await fetcher(`/orders/${orderId}`, {
      method: 'GET',
      auth: true,
    })
    return response as OrderResponse
  } catch (error) {
    console.error('Failed to fetch order detail:', error)
    throw error
  }
}

/**
 * 通过Stripe Session ID获取订单详情
 */
export async function getOrderBySession(sessionId: string): Promise<OrderResponse> {
  try {
    const response = await fetcher(`/orders/session/${sessionId}`, {
      method: 'GET',
      auth: true,
    })
    return response as OrderResponse
  } catch (error) {
    console.error('Failed to fetch order by session:', error)
    throw error
  }
}

/**
 * 取消订单
 */
export async function cancelOrder(orderId: number, reason?: string): Promise<OrderResponse> {
  try {
    const response = await fetcher(`/orders/${orderId}/cancel`, {
      method: 'POST',
      auth: true,
      body: reason ? JSON.stringify({ reason }) : undefined
    })
    return response as OrderResponse
  } catch (error) {
    console.error('Failed to cancel order:', error)
    throw error
  }
}

/**
 * 为现有订单继续支付（创建新的支付会话）
 */
export async function continueOrderPayment(
  orderId: number, 
  successUrl: string, 
  cancelUrl: string
): Promise<StripeCheckoutResponse> {
  try {
    const response = await fetcher(`/orders/${orderId}/continue-payment`, {
      method: 'POST',
      auth: true,
      body: JSON.stringify({
        success_url: successUrl,
        cancel_url: cancelUrl
      })
    })
    return response as StripeCheckoutResponse
  } catch (error) {
    console.error('Failed to continue order payment:', error)
    throw error
  }
}
