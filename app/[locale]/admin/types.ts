export interface Message {
  id: number;
  role: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Chat {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
  user_email?: string;
  user_id?: number;
  username?: string;
  message_count?: number;
}

export interface ChatSearchParams {
  user_email?: string;
  user_id?: number;
  username?: string;
  title?: string;
  page?: number;
  page_size?: number;
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface ChatListResponse {
  chats: Chat[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export type UserType = 'user' | 'admin';
export type MembershipType = 'free' | 'monthly' | 'yearly';

export interface User {
  id: number;
  username: string;
  email: string;
  user_type: UserType;
  membership_type: MembershipType | null;
  is_deleted: boolean;
  last_login_at?: string;
  last_active?: string;
  created_at: string;
  updated_at: string;
  chat_count?: number;
  // 会员使用统计
  daily_message_count?: number;
  daily_token_count?: number;
  daily_chat_count?: number;
  daily_message_limit?: number;
  daily_token_limit?: number;
  membership_end_date?: string;
}

export interface UserSearchParams {
  email?: string;
  username?: string;
  user_type?: UserType | 'all';
  membership_type?: MembershipType | 'all';
  status?: 'normal' | 'deleted' | 'all';
  is_deleted?: boolean;
  page?: number;
  page_size?: number;
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface UserCreateRequest {
  email: string;
  username: string;
  password: string;
  user_type: UserType;
  membership_type: MembershipType;
}

export interface UserUpdateRequest {
  user_type?: UserType;
  membership_type?: MembershipType | null;
  username?: string;
  is_deleted?: boolean;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  current_page: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface AdminDashboard {
  // 用户统计
  total_users: number;
  active_users: number;
  admin_users: number;
  deleted_users: number;
  today_new_users: number;
  
  // 会员类型统计
  free_users: number;
  monthly_users: number;
  yearly_users: number;
  
  // 对话统计
  total_chats: number;
  active_chats: number;
  total_messages: number;
  today_new_chats: number;
  monthly_chats: number;
  seven_days_chats: number;
  
  // 订单数量统计
  total_orders: number;
  today_orders: number;
  seven_days_orders: number;
  monthly_orders: number;
  
  // 收入统计
  today_revenue: number;
  seven_days_revenue: number;
  monthly_revenue: number;
  total_revenue: number;
}

export type DashboardStats = AdminDashboard;

export interface UserActionRequest {
  action: 'delete' | 'restore';
}

export interface DeleteCheckResponse {
  user: User;
  chat_count: number;
  message_count: number;
  warning?: string;
}

// 会员计划接口
export interface MembershipPlan {
  id: number;
  name: string;
  type: MembershipType;
  daily_message_limit: number;
  daily_token_limit: number;
  conversation_turn_limit: number;
  price: number;
  currency: string;
  duration_days: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 用户会员状态接口
export interface MembershipStatus {
  has_membership: boolean;
  membership_type?: MembershipType;
  plan_name?: string;
  
  // 限制信息
  daily_message_limit: number;
  daily_token_limit: number;
  conversation_turn_limit: number;
  
  // 使用情况
  daily_message_count: number;
  daily_token_count: number;
  daily_chat_count: number;
  
  // 剩余额度
  daily_message_remaining: number;
  daily_token_remaining: number;
  
  // 总使用统计
  total_message_count: number;
  total_token_count: number;
  total_chat_count: number;
  
  // 会员时间信息
  start_date?: string;
  end_date?: string;
  days_remaining?: number;
}

// 使用限制检查结果
export interface UsageLimitCheck {
  can_send_message: boolean;
  can_use_tokens: boolean;
  can_continue_conversation: boolean;
  
  // 限制原因
  message_limit_reached: boolean;
  token_limit_reached: boolean;
  conversation_limit_reached: boolean;
  
  // 剩余额度
  remaining_messages: number;
  remaining_tokens: number;
  remaining_turns: number;
}

