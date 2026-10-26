/**
 * Supabase 客户端配置
 *
 * 功能说明:
 * - 提供浏览器端和服务端的 Supabase 客户端实例
 * - 封装认证和数据库操作
 * - 统一错误处理
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

/**
 * 获取浏览器端 Supabase 客户端
 *
 * 使用场景:
 * - 客户端组件中的数据查询
 * - 实时订阅
 * - 客户端认证操作
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
