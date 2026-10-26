'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, useRef } from 'react'
import { getCurrentUser } from '@/util/supabase-auth'
import { getMembershipPlans, getUserOrders, getUserMembershipStatus } from '@/util/user-api'
import type { UserProfile } from '@/util/auth'
import type { MembershipPlan, MembershipStatus } from '@/app/[locale]/admin/types'
import type { OrderResponse } from '@/util/user-api'

/**
 * 全局用户数据接口
 */
interface GlobalUserData {
  // 用户资料
  userProfile: UserProfile | null
  userProfileLoading: boolean
  
  // 会员状态
  membershipStatus: MembershipStatus | null
  membershipStatusLoading: boolean
  
  // 会员计划
  membershipPlans: MembershipPlan[]
  membershipPlansLoading: boolean
  
  // 用户订单
  userOrders: OrderResponse[]
  userOrdersLoading: boolean
  pendingOrders: OrderResponse[]
  
  // 方法
  refreshUserProfile: () => Promise<void>
  refreshMembershipStatus: () => Promise<void>
  refreshMembershipPlans: () => Promise<void>
  refreshUserOrders: (status?: string) => Promise<void>
  refreshAllData: () => Promise<void>
}

/**
 * 全局用户数据 Context
 */
const GlobalUserDataContext = createContext<GlobalUserData | undefined>(undefined)

/**
 * 全局用户数据 Provider 组件
 * 
 * 功能:
 * - 统一管理所有用户相关数据
 * - 避免重复的 API 调用
 * - 提供数据缓存和刷新机制
 * 
 * @param children - 子组件
 */
export function GlobalUserDataProvider({ children }: { children: ReactNode }) {
  // 用户资料状态
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userProfileLoading, setUserProfileLoading] = useState(false)
  const isFetchingUserProfile = useRef(false)
  
  // 会员状态
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus | null>(null)
  const [membershipStatusLoading, setMembershipStatusLoading] = useState(false)
  const isFetchingMembershipStatus = useRef(false)
  
  // 会员计划
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([])
  const [membershipPlansLoading, setMembershipPlansLoading] = useState(false)
  const isFetchingMembershipPlans = useRef(false)
  
  // 用户订单
  const [userOrders, setUserOrders] = useState<OrderResponse[]>([])
  const [userOrdersLoading, setUserOrdersLoading] = useState(false)
  const isFetchingUserOrders = useRef(false)
  
  // 待支付订单（从 userOrders 中筛选）
  const pendingOrders = userOrders.filter(order => order.status === 'pending')

  /**
   * 刷新用户资料（使用 Supabase）
   */
  const refreshUserProfile = useCallback(async () => {
    if (isFetchingUserProfile.current) return // 防止重复请求
    
    isFetchingUserProfile.current = true
    setUserProfileLoading(true)
    try {
      const profile = await getCurrentUser()
      setUserProfile(profile)
      
      // 同步更新 localStorage
      if (profile) {
        localStorage.setItem('user_type', profile.user_type)
        window.dispatchEvent(new CustomEvent('user-type-changed'))
      }
    } catch {
      // 设置默认的免费用户资料
      setUserProfile({
        id: 0,
        username: 'User',
        email: 'user@example.com',
        user_type: 'user',
        membership_type: 'free',
        last_login_at: null,
        created_at: new Date().toISOString()
      })
    } finally {
      isFetchingUserProfile.current = false
      setUserProfileLoading(false)
    }
  }, [])

  /**
   * 刷新会员状态
   */
  const refreshMembershipStatus = useCallback(async () => {
    if (isFetchingMembershipStatus.current) return // 防止重复请求
    
    isFetchingMembershipStatus.current = true
    setMembershipStatusLoading(true)
    try {
      const status = await getUserMembershipStatus()
      setMembershipStatus(status)
    } catch (error) {
      console.error('Refresh membership status failed:', error)
      // 设置默认状态
      const defaultStatus: MembershipStatus = {
        has_membership: false,
        membership_type: 'free',
        plan_name: '免费会员',
        daily_message_limit: 100,
        daily_token_limit: 1000000,
        conversation_turn_limit: 10,
        daily_message_count: 0,
        daily_token_count: 0,
        daily_chat_count: 0,
        daily_message_remaining: 100,
        daily_token_remaining: 1000000,
        total_message_count: 0,
        total_token_count: 0,
        total_chat_count: 0,
      }
      setMembershipStatus(defaultStatus)
    } finally {
      isFetchingMembershipStatus.current = false
      setMembershipStatusLoading(false)
    }
  }, [])

  /**
   * 刷新会员计划
   */
  const refreshMembershipPlans = useCallback(async () => {
    if (isFetchingMembershipPlans.current) return // 防止重复请求
    
    isFetchingMembershipPlans.current = true
    setMembershipPlansLoading(true)
    try {
      const plansData = await getMembershipPlans()
      setMembershipPlans(plansData.items)
    } catch (error) {
      console.error('Refresh membership plans failed:', error)
      setMembershipPlans([])
    } finally {
      isFetchingMembershipPlans.current = false
      setMembershipPlansLoading(false)
    }
  }, [])

  /**
   * 刷新用户订单
   */
  const refreshUserOrders = useCallback(async (status?: string) => {
    if (isFetchingUserOrders.current) return // 防止重复请求
    
    isFetchingUserOrders.current = true
    setUserOrdersLoading(true)
    try {
      const params = status && status !== 'all' ? { status } : undefined
      const orders = await getUserOrders(params)
      setUserOrders(orders)
    } catch (error) {
      console.error('Refresh user orders failed:', error)
      setUserOrders([])
    } finally {
      isFetchingUserOrders.current = false
      setUserOrdersLoading(false)
    }
  }, [])

  /**
   * 刷新所有数据
   */
  const refreshAllData = useCallback(async () => {
    await Promise.all([
      refreshUserProfile(),
      refreshMembershipStatus(),
      refreshMembershipPlans(),
      refreshUserOrders()
    ])
  }, [refreshUserProfile, refreshMembershipStatus, refreshMembershipPlans, refreshUserOrders])

  // 初始化时加载数据 - 添加防重复调用机制
  useEffect(() => {
    // 检查是否已经有数据，避免重复加载
    const hasUserData = userProfile !== null
    const hasMembershipData = membershipStatus !== null
    const hasPlansData = membershipPlans.length > 0
    const hasOrdersData = userOrders.length > 0
    
    // 如果所有数据都已存在，跳过初始化
    if (hasUserData && hasMembershipData && hasPlansData && hasOrdersData) {
      return
    }
    
    refreshAllData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 只在组件挂载时执行一次

  const value: GlobalUserData = {
    userProfile,
    userProfileLoading,
    membershipStatus,
    membershipStatusLoading,
    membershipPlans,
    membershipPlansLoading,
    userOrders,
    userOrdersLoading,
    pendingOrders,
    refreshUserProfile,
    refreshMembershipStatus,
    refreshMembershipPlans,
    refreshUserOrders,
    refreshAllData
  }

  return (
    <GlobalUserDataContext.Provider value={value}>
      {children}
    </GlobalUserDataContext.Provider>
  )
}

/**
 * 使用全局用户数据的 Hook
 * 
 * @returns 全局用户数据对象
 * @throws 如果在 Provider 外部使用会抛出错误
 */
export function useGlobalUserData(): GlobalUserData {
  const context = useContext(GlobalUserDataContext)
  
  if (context === undefined) {
    throw new Error('useGlobalUserData must be used within a GlobalUserDataProvider')
  }
  
  return context
}

/**
 * 兼容性 Hook - 替代原来的 useMembershipStatus
 */
export function useMembershipStatus() {
  const { membershipStatus, membershipStatusLoading, refreshMembershipStatus } = useGlobalUserData()
  
  return {
    membershipStatus,
    isLoading: membershipStatusLoading,
    refresh: refreshMembershipStatus
  }
}

/**
 * 全局刷新会员状态函数 - 兼容性
 */
export async function refreshMembershipStatusGlobally() {
  // 这个函数现在通过 useGlobalUserData 来实现
  // 在组件外部调用时，我们需要通过事件来触发刷新
  window.dispatchEvent(new CustomEvent('refresh-membership-status'))
}
