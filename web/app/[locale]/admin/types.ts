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
  message_count?: number;
}

export interface ChatSearchParams {
  user_email?: string;
  user_id?: number;
  title?: string;
  page?: number;
  page_size?: number;
  limit?: number;
  offset?: number;
}

export interface ChatListResponse {
  chats: Chat[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export type UserType = 'normal' | 'premium' | 'admin' | 'super_admin';
export type MembershipType = 'free' | 'monthly' | 'yearly' | 'lifetime';

export interface User {
  id: number;
  name?: string;
  email: string;
  user_type: UserType;
  membership_type: MembershipType;
  is_deleted: boolean;
  last_login_at?: string;
  last_active?: string;
  created_at: string;
  updated_at: string;
  chat_count?: number;
}

export interface UserSearchParams {
  email?: string;
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
  name?: string;
  user_type: UserType;
  membership_type: MembershipType;
}

export interface UserUpdateRequest {
  user_type?: UserType;
  membership_type?: MembershipType;
  name?: string;
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
  total_users: number;
  active_users: number;
  admin_users: number;
  super_admin_users: number;
  deleted_users: number;
  total_chats: number;
  active_chats: number;
  total_messages: number;
  today_new_users: number;
  today_new_chats: number;
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
