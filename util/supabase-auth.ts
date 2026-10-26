/**
 * Supabase 认证工具函数
 *
 * 功能说明:
 * - 提供与原认证系统兼容的 API
 * - 使用 Supabase Auth 管理认证状态
 * - 自动 token 刷新
 */

import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from './auth'

/**
 * 获取有效的 access token
 * 兼容原 getValidAccessToken 函数
 */
export async function getValidAccessToken(): Promise<string | null> {
  const supabase = createClient()
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session) {
    return null
  }

  // 检查 token 是否即将过期（提前 5 分钟刷新）
  const expiresAt = session.expires_at
  const now = Math.floor(Date.now() / 1000)

  if (expiresAt && expiresAt - now < 300) {
    // Token 即将过期，刷新
    const { data: { session: newSession }, error: refreshError } =
      await supabase.auth.refreshSession()

    if (refreshError || !newSession) {
      return null
    }

    return newSession.access_token
  }

  return session.access_token
}

/**
 * 检查用户是否已登录
 */
export async function isLoggedIn(): Promise<boolean> {
  const token = await getValidAccessToken()
  return token !== null
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  // 从数据库获取完整的用户信息
  const { data: userData, error: dbError } = await supabase
    .from('users')
    .select('*')
    .eq('email', user.email)
    .single()

  if (dbError || !userData) {
    return null
  }

  // 获取会员信息
  const { data: membership } = await supabase
    .from('user_memberships')
    .select(`
      *,
      membership_plan:membership_plans(*)
    `)
    .eq('user_id', userData.id)
    .eq('is_active', true)
    .single()

  return {
    id: userData.id,
    username: userData.username,
    email: userData.email,
    user_type: userData.user_type,
    membership_type: membership?.membership_plan?.type || 'free',
    last_login_at: userData.last_login_at,
    created_at: userData.created_at,
  }
}

/**
 * 登出
 */
export async function logout(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()

  // 清除本地缓存
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user_type')
    localStorage.removeItem('user_profile')
  }
}

/**
 * 用户注册（邮箱密码方式）
 *
 * @param email - 用户邮箱
 * @param password - 用户密码
 * @param username - 用户名
 */
export async function registerWithPassword(
  email: string,
  password: string,
  username: string
): Promise<void> {
  const supabase = createClient()

  // 1. 先检查邮箱是否已被注册
  const { data: existingEmailUser } = await supabase
    .from('users')
    .select('email')
    .eq('email', email)
    .single()

  if (existingEmailUser) {
    throw new Error('该邮箱已被注册')
  }

  // 2. 检查用户名是否已被使用
  const { data: existingUsernameUser } = await supabase
    .from('users')
    .select('username')
    .eq('username', username)
    .single()

  if (existingUsernameUser) {
    throw new Error('用户名已被使用')
  }

  // 3. 使用 Supabase Auth 创建用户
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username, // 将用户名存储在 user_metadata 中
      },
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  if (!data.user) {
    throw new Error('注册失败')
  }

  // 4. 在自定义 users 表中创建用户记录（使用触发器自动创建，但我们可以更新用户名）
  // 等待一小段时间让触发器执行
  await new Promise(resolve => setTimeout(resolve, 500))

  // 更新用户名（因为触发器生成的用户名可能不是用户想要的）
  const { error: updateError } = await supabase
    .from('users')
    .update({ username })
    .eq('email', email)

  if (updateError) {
    console.warn('更新用户名失败:', updateError)
    // 不抛出错误，因为用户已经创建成功
  }

  // 5. 为新用户创建免费会员
  const { data: freePlan } = await supabase
    .from('membership_plans')
    .select('*')
    .eq('type', 'free')
    .eq('is_active', true)
    .single()

  if (freePlan && data.user) {
    // 获取用户的数据库 ID
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (userData) {
      await supabase.from('user_memberships').insert({
        user_id: userData.id,
        membership_plan_id: freePlan.id,
        start_date: new Date().toISOString(),
        end_date: new Date(
          Date.now() + freePlan.duration_days * 24 * 60 * 60 * 1000
        ).toISOString(),
        is_active: true,
      })
    }
  }
}

/**
 * 发送密码重置链接
 *
 * @param email - 用户邮箱
 */
export async function sendPasswordResetEmail(email: string): Promise<void> {
  const supabase = createClient()

  // 获取当前域名和 locale 作为重定向 URL
  // 从当前 URL 路径中提取 locale（zh 或 en）
  let redirectTo: string | undefined
  if (typeof window !== 'undefined') {
    const pathSegments = window.location.pathname.split('/')
    const locale = pathSegments[1] || 'zh' // 默认中文
    redirectTo = `${window.location.origin}/${locale}/auth/reset-password`
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })

  if (error) {
    throw new Error(error.message)
  }
}

/**
 * 重置用户密码
 *
 * @param newPassword - 新密码
 */
export async function resetPassword(newPassword: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    throw new Error(error.message)
  }
}

/**
 * 处理用户登录后的数据初始化
 * 由回调页面调用
 */
export async function handleUserAfterAuth(email: string): Promise<UserProfile> {
  const supabase = createClient()

  // 获取或创建用户记录
  const { data: existingUser, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()
  let userData = existingUser

  // 如果用户不存在，创建新用户
  if (userError && userError.code === 'PGRST116') {
    const username = email.split('@')[0] + '_' + Date.now()
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email,
        username,
        user_type: 'user',
        last_login_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError) {
      throw new Error('创建用户失败')
    }

    userData = newUser

    // 为新用户创建免费会员
    const { data: freePlan } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('type', 'free')
      .eq('is_active', true)
      .single()

    if (freePlan) {
      await supabase.from('user_memberships').insert({
        user_id: userData.id,
        membership_plan_id: freePlan.id,
        start_date: new Date().toISOString(),
        end_date: new Date(
          Date.now() + freePlan.duration_days * 24 * 60 * 60 * 1000
        ).toISOString(),
        is_active: true,
      })
    }
  } else if (userError) {
    throw new Error('获取用户信息失败')
  }

  // 更新最后登录时间
  await supabase
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', userData.id)

  // 获取会员信息
  const { data: membership } = await supabase
    .from('user_memberships')
    .select(`
      *,
      membership_plan:membership_plans(*)
    `)
    .eq('user_id', userData.id)
    .eq('is_active', true)
    .single()

  return {
    id: userData.id,
    username: userData.username,
    email: userData.email,
    user_type: userData.user_type,
    membership_type: membership?.membership_plan?.type || 'free',
    last_login_at: userData.last_login_at,
    created_at: userData.created_at,
  }
}

/**
 * 检查是否为管理员
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.user_type === 'admin'
}

/**
 * 缓存用户类型到 localStorage
 */
export async function cacheUserType(): Promise<void> {
  const user = await getCurrentUser()
  if (user && typeof window !== 'undefined') {
    localStorage.setItem('user_type', user.user_type)
  }
}

/**
 * 从缓存获取用户类型（快速检查）
 */
export function getCachedUserType(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  return localStorage.getItem('user_type')
}

/**
 * 检查用户是否有访问管理后台的权限
 */
export async function checkAdminAccess(): Promise<{ hasAccess: boolean; reason?: string }> {
  try {
    const supabase = createClient()

    // 检查是否有有效的 session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return { hasAccess: false, reason: 'NO_SESSION' }
    }

    // 获取用户信息
    const userProfile = await getCurrentUser()

    if (!userProfile) {
      return { hasAccess: false, reason: 'NO_USER_PROFILE' }
    }

    // 检查用户类型
    if (userProfile.user_type !== 'admin') {
      return { hasAccess: false, reason: 'NOT_ADMIN' }
    }

    return { hasAccess: true }
  } catch (error) {
    console.error('Error checking admin access:', error)
    return { hasAccess: false, reason: 'CHECK_FAILED' }
  }
}
