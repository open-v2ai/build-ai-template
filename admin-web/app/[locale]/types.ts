export interface User {
  id: number;
  name?: string;
  email: string;
  is_admin: boolean;
  is_deleted: boolean;
  created_at: string;
  last_login_at?: string;
  chat_count: number;
  last_active?: string;
}

export interface Chat {
  id: number;
  user_id: number;
  user_email: string;
  title: string;
  content: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  chat_id: number;
  content: string;
  role: string;
  model_conf?: any;
  created_at: string;
}

export interface DashboardStats {
  total_users: number;
  active_users: number;
  admin_users: number;
  deleted_users: number;
  total_chats: number;
  active_chats: number;
  total_messages: number;
  today_new_users: number;
  today_new_chats: number;
}

export interface UserSearchParams {
  email?: string;
  is_admin?: boolean;
  is_deleted?: boolean;
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface ChatSearchParams {
  user_id?: number;
  user_email?: string;
  title?: string;
  limit?: number;
  offset?: number;
}

export interface UserCreateRequest {
  email: string;
  name?: string;
  is_admin: boolean;
}

export interface UserUpdateRequest {
  is_admin?: boolean;
  is_deleted?: boolean;
  name?: string;
}

export interface UserActionRequest {
  action: 'delete' | 'restore';
  reason?: string;
}

export interface DeleteCheckResponse {
  can_delete: boolean;
  chat_count: number;
  message_count: number;
  is_admin: boolean;
  warning?: string;
}

export interface UserListResponse {
  users: User[];
  total: number;
  limit: number;
  offset: number;
  has_next: boolean;
  has_prev: boolean;
  total_pages: number;
  current_page: number;
}