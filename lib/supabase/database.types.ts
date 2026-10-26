/**
 * Supabase 数据库类型定义
 *
 * 此文件由 Supabase CLI 自动生成
 * 运行命令: npx supabase gen types typescript --project-id <project-id> > lib/supabase/database.types.ts
 *
 * 手动维护时需要与数据库 schema 保持一致
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agents: {
        Row: {
          id: number
          name: string
          source: 'llm' | 'dify' | 'fastgpt' | 'coze' | 'custom'
          api_url: string
          api_key: string
          model_conf: Json | null
          is_think: boolean
          is_stream: boolean
          is_deleted: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: number
          name: string
          source?: 'llm' | 'dify' | 'fastgpt' | 'coze' | 'custom'
          api_url: string
          api_key: string
          model_conf?: Json | null
          is_think?: boolean
          is_stream?: boolean
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: number
          name?: string
          source?: 'llm' | 'dify' | 'fastgpt' | 'coze' | 'custom'
          api_url?: string
          api_key?: string
          model_conf?: Json | null
          is_think?: boolean
          is_stream?: boolean
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      chats: {
        Row: {
          id: number
          user_id: number
          agent_id: number
          title: string
          content: string | null
          others: Json | null
          is_deleted: boolean
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: number
          agent_id: number
          title: string
          content?: string | null
          others?: Json | null
          is_deleted?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: number
          agent_id?: number
          title?: string
          content?: string | null
          others?: Json | null
          is_deleted?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      membership_plans: {
        Row: {
          id: number
          name: string
          type: 'free' | 'monthly' | 'yearly'
          daily_message_limit: number
          daily_token_limit: number
          conversation_turn_limit: number
          price: number
          currency: string
          duration_days: number
          is_active: boolean
          description: string | null
          is_deleted: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: number
          name: string
          type: 'free' | 'monthly' | 'yearly'
          daily_message_limit: number
          daily_token_limit: number
          conversation_turn_limit: number
          price?: number
          currency?: string
          duration_days: number
          is_active?: boolean
          description?: string | null
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: number
          name?: string
          type?: 'free' | 'monthly' | 'yearly'
          daily_message_limit?: number
          daily_token_limit?: number
          conversation_turn_limit?: number
          price?: number
          currency?: string
          duration_days?: number
          is_active?: boolean
          description?: string | null
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      messages: {
        Row: {
          id: number
          chat_id: number
          content: string
          model_conf: Json | null
          role: 'user' | 'assistant' | 'system'
          token_usage: Json | null
          is_deleted: boolean
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          chat_id: number
          content: string
          model_conf?: Json | null
          role: 'user' | 'assistant' | 'system'
          token_usage?: Json | null
          is_deleted?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          chat_id?: number
          content?: string
          model_conf?: Json | null
          role?: 'user' | 'assistant' | 'system'
          token_usage?: Json | null
          is_deleted?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
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
          stripe_payment_intent_id: string | null
          stripe_customer_id: string | null
          stripe_session_id: string | null
          paid_at: string | null
          payment_confirmed_at: string | null
          processed_at: string | null
          completed_at: string | null
          cancelled_at: string | null
          refund_amount: number | null
          refunded_at: string | null
          refund_reason: string | null
          notes: string | null
          failure_reason: string | null
          created_at: string
          updated_at: string
          is_deleted: boolean
          deleted_at: string | null
        }
        Insert: {
          id?: number
          order_number: string
          user_id: number
          membership_plan_id: number
          status?: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded' | 'failed'
          payment_method?: 'stripe'
          original_price: number
          discount_amount?: number
          final_price: number
          currency?: string
          stripe_payment_intent_id?: string | null
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          paid_at?: string | null
          payment_confirmed_at?: string | null
          processed_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          refund_amount?: number | null
          refunded_at?: string | null
          refund_reason?: string | null
          notes?: string | null
          failure_reason?: string | null
          created_at?: string
          updated_at?: string
          is_deleted?: boolean
          deleted_at?: string | null
        }
        Update: {
          id?: number
          order_number?: string
          user_id?: number
          membership_plan_id?: number
          status?: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded' | 'failed'
          payment_method?: 'stripe'
          original_price?: number
          discount_amount?: number
          final_price?: number
          currency?: string
          stripe_payment_intent_id?: string | null
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          paid_at?: string | null
          payment_confirmed_at?: string | null
          processed_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          refund_amount?: number | null
          refunded_at?: string | null
          refund_reason?: string | null
          notes?: string | null
          failure_reason?: string | null
          created_at?: string
          updated_at?: string
          is_deleted?: boolean
          deleted_at?: string | null
        }
      }
      user_memberships: {
        Row: {
          id: number
          user_id: number
          membership_plan_id: number
          start_date: string
          end_date: string
          is_active: boolean
          daily_message_count: number
          daily_token_count: number
          daily_chat_count: number
          total_message_count: number
          total_token_count: number
          total_chat_count: number
          last_reset_date: string
          is_deleted: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: number
          user_id: number
          membership_plan_id: number
          start_date: string
          end_date: string
          is_active?: boolean
          daily_message_count?: number
          daily_token_count?: number
          daily_chat_count?: number
          total_message_count?: number
          total_token_count?: number
          total_chat_count?: number
          last_reset_date?: string
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: number
          user_id?: number
          membership_plan_id?: number
          start_date?: string
          end_date?: string
          is_active?: boolean
          daily_message_count?: number
          daily_token_count?: number
          daily_chat_count?: number
          total_message_count?: number
          total_token_count?: number
          total_chat_count?: number
          last_reset_date?: string
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      users: {
        Row: {
          id: number
          username: string
          email: string
          password_hash: string | null
          user_type: 'user' | 'admin'
          last_login_at: string | null
          created_at: string
          updated_at: string
          is_deleted: boolean
          deleted_at: string | null
        }
        Insert: {
          id?: number
          username: string
          email: string
          password_hash?: string | null
          user_type?: 'user' | 'admin'
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
          is_deleted?: boolean
          deleted_at?: string | null
        }
        Update: {
          id?: number
          username?: string
          email?: string
          password_hash?: string | null
          user_type?: 'user' | 'admin'
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
          is_deleted?: boolean
          deleted_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: {
          user_uuid: string
        }
        Returns: boolean
      }
    }
    Enums: {
      agent_source: 'llm' | 'dify' | 'fastgpt' | 'coze' | 'custom'
      message_role: 'user' | 'assistant' | 'system'
      membership_type: 'free' | 'monthly' | 'yearly'
      order_status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded' | 'failed'
      payment_method: 'stripe'
      user_type: 'user' | 'admin'
    }
  }
}
