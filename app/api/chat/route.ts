/**
 * 聊天会话管理 API
 *
 * 功能说明:
 * - GET: 获取用户的所有聊天列表
 * - POST: 创建新的聊天会话
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/chat - 获取聊天列表
export async function GET(request: NextRequest) {
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

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const includeMessages = searchParams.get('include_messages') === 'true'

    // 构建查询
    const query = supabase
      .from('chats')
      .select(
        includeMessages
          ? `
          *,
          agent:agents(*),
          messages(*)
        `
          : `
          *,
          agent:agents(*)
        `
      )
      .eq('user_id', userData.id)
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: chats, error } = await query

    if (error) {
      console.error('Get chats error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch chats' },
        { status: 500 }
      )
    }

    return NextResponse.json(chats || [])
  } catch (error) {
    console.error('Get chats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/chat - 创建新聊天
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

    // 获取用户数据
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { title, agent_id, content } = await request.json()

    if (!title || !agent_id) {
      return NextResponse.json(
        { error: 'Title and agent_id are required' },
        { status: 400 }
      )
    }

    // 验证 agent 是否存在
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agent_id)
      .eq('is_deleted', false)
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found or inactive' },
        { status: 404 }
      )
    }

    // 创建聊天
    const { data: chat, error: createError } = await supabase
      .from('chats')
      .insert({
        user_id: userData.id,
        agent_id,
        title,
        content: content || null,
      })
      .select(`
        *,
        agent:agents(*)
      `)
      .single()

    if (createError) {
      console.error('Create chat error:', createError)
      return NextResponse.json(
        { error: 'Failed to create chat' },
        { status: 500 }
      )
    }

    // 记录使用情况（新建聊天）
    const { data: membership } = await supabase
      .from('user_memberships')
      .select('*')
      .eq('user_id', userData.id)
      .eq('is_active', true)
      .single()

    if (membership) {
      await supabase
        .from('user_memberships')
        .update({
          daily_chat_count: membership.daily_chat_count + 1,
          total_chat_count: membership.total_chat_count + 1,
        })
        .eq('id', membership.id)
    }

    return NextResponse.json(chat)
  } catch (error) {
    console.error('Create chat error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
