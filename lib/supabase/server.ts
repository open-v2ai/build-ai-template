import 'server-only'
/**
 * Supabase 服务端客户端配置
 *
 * 功能说明:
 * - 为 Next.js 服务端组件和 API Routes 提供 Supabase 客户端
 * - 自动处理 Cookie 认证
 * - 支持 SSR 和 Server Actions
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

/**
 * 创建服务端 Supabase 客户端
 *
 * 使用场景:
 * - Server Components
 * - Server Actions
 * - Route Handlers
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // 在 Server Components 中可能无法设置 cookie
            // 这是正常的，忽略错误
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // 忽略错误
          }
        },
      },
    }
  )
}

/**
 * 获取当前用户
 *
 * 返回:
 * - User 对象（如果已认证）
 * - null（如果未认证）
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

/**
 * 检查用户是否为管理员
 *
 * 返回:
 * - true（如果是管理员）
 * - false（如果不是管理员或未认证）
 */
export async function isAdmin() {
  const user = await getCurrentUser()
  if (!user) return false

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .select('user_type')
    .eq('id', user.id)
    .single()

  if (error || !data) return false

  return data.user_type === 'admin'
}
