/**
 * Supabase 认证回调处理（已废弃）
 *
 * 功能说明:
 * - 此路由已不再使用，因为项目已完全移除 Magic Link 功能
 * - 密码重置功能已迁移到专用的 /auth/reset-password 页面
 * - 保留此文件仅为兼容性考虑，避免旧链接报错
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  // 获取当前 locale
  const { locale } = await params

  const requestUrl = new URL(request.url)

  // 重定向到登录页
  return NextResponse.redirect(
    new URL(`/${locale}/login?info=deprecated_callback`, requestUrl.origin)
  )
}
