/**
 * Agent 管理 API
 *
 * 功能说明:
 * - GET: 获取所有活跃的 Agent（供用户选择）
 * - POST: 创建新 Agent（仅管理员）
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/agent - 获取活跃的 Agent 列表
export async function GET() {
  try {
    const supabase = await createClient()

    // 获取当前用户（需要认证）
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 获取所有活跃的 agents
    const { data: agents, error } = await supabase
      .from('agents')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get agents error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch agents' },
        { status: 500 }
      )
    }

    return NextResponse.json(agents || [])
  } catch (error) {
    console.error('Get agents error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/agent - 创建新 Agent（仅管理员）
export async function POST(request: NextRequest) {
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

    // 检查是否为管理员
    const { data: userData } = await supabase
      .from('users')
      .select('user_type')
      .eq('email', user.email)
      .single()

    if (!userData || userData.user_type !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { name, source, api_url, api_key, model_conf, is_think, is_stream } =
      await request.json()

    if (!name || !source || !api_url || !api_key) {
      return NextResponse.json(
        { error: 'name, source, api_url, and api_key are required' },
        { status: 400 }
      )
    }

    // 创建 Agent
    const { data: agent, error } = await supabase
      .from('agents')
      .insert({
        name,
        source,
        api_url,
        api_key,
        model_conf: model_conf || {},
        is_think: is_think || false,
        is_stream: is_stream !== undefined ? is_stream : true,
      })
      .select()
      .single()

    if (error) {
      console.error('Create agent error:', error)
      return NextResponse.json(
        { error: 'Failed to create agent' },
        { status: 500 }
      )
    }

    return NextResponse.json(agent)
  } catch (error) {
    console.error('Create agent error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
