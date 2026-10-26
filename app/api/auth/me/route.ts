/**
 * 获取当前用户信息 API
 *
 * 功能说明:
 * - 获取当前登录用户的详细信息
 * - 包含会员信息
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // 获取当前用户
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 获取用户数据
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email)
      .eq('is_deleted', false)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 获取用户会员信息
    const { data: membershipData } = await supabase
      .from('user_memberships')
      .select(`
        *,
        membership_plan:membership_plans(*)
      `)
      .eq('user_id', userData.id)
      .eq('is_active', true)
      .eq('is_deleted', false)
      .order('end_date', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      id: userData.id,
      username: userData.username,
      email: userData.email,
      user_type: userData.user_type,
      membership_type: membershipData?.membership_plan?.type || 'free',
      last_login_at: userData.last_login_at,
      created_at: userData.created_at,
    })
  } catch (error) {
    console.error('Get user profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
