/**
 * 用户使用统计 API
 *
 * 功能说明:
 * - GET: 获取当前用户的使用统计信息
 * - 包含每日统计和总统计
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 获取用户数据
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 获取用户会员和使用统计
    const { data: membership, error } = await supabase
      .from('user_memberships')
      .select(`
        *,
        membership_plan:membership_plans(*)
      `)
      .eq('user_id', userData.id)
      .eq('is_active', true)
      .eq('is_deleted', false)
      .single()

    if (error || !membership) {
      return NextResponse.json(
        { error: 'No active membership found' },
        { status: 404 }
      )
    }

    const plan = membership.membership_plan

    return NextResponse.json({
      // 每日统计
      daily: {
        message_count: membership.daily_message_count,
        message_limit: plan.daily_message_limit,
        token_count: membership.daily_token_count,
        token_limit: plan.daily_token_limit,
        chat_count: membership.daily_chat_count,
      },
      // 总统计
      total: {
        message_count: membership.total_message_count,
        token_count: membership.total_token_count,
        chat_count: membership.total_chat_count,
      },
      // 会员信息
      membership: {
        type: plan.type,
        name: plan.name,
        start_date: membership.start_date,
        end_date: membership.end_date,
        is_active: membership.is_active,
      },
      // 使用百分比
      usage_percentage: {
        messages: Math.round(
          (membership.daily_message_count / plan.daily_message_limit) * 100
        ),
        tokens: Math.round(
          (membership.daily_token_count / plan.daily_token_limit) * 100
        ),
      },
    })
  } catch (error) {
    console.error('Get usage stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
