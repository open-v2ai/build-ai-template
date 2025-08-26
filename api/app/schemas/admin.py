from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.models.user import UserType, MembershipType


class AdminUserList(BaseModel):
    id: int
    name: Optional[str] = None
    email: str
    user_type: UserType
    membership_type: MembershipType
    is_deleted: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None
    chat_count: int
    last_active: Optional[datetime] = None


class AdminChatList(BaseModel):
    id: int
    user_id: int
    user_email: str
    title: str
    message_count: int
    created_at: datetime
    updated_at: datetime


class AdminDashboard(BaseModel):
    total_users: int
    active_users: int
    admin_users: int
    super_admin_users: int
    deleted_users: int
    total_chats: int
    active_chats: int
    total_messages: int
    today_new_users: int
    today_new_chats: int


class UserCreateRequest(BaseModel):
    email: str
    name: Optional[str] = None
    user_type: UserType = UserType.NORMAL
    membership_type: MembershipType = MembershipType.FREE


class UserUpdateRequest(BaseModel):
    user_type: Optional[UserType] = None
    membership_type: Optional[MembershipType] = None
    is_deleted: Optional[bool] = None
    name: Optional[str] = None


class UserActionRequest(BaseModel):
    action: str  # "delete" 或 "restore"
    reason: Optional[str] = None  # 操作原因


class ChatSearchParams(BaseModel):
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    title: Optional[str] = None
    limit: int = 20
    offset: int = 0


class UserSearchParams(BaseModel):
    email: Optional[str] = None
    user_type: Optional[UserType] = None
    membership_type: Optional[MembershipType] = None
    is_deleted: Optional[bool] = None
    limit: int = 10
    offset: int = 0
    sort_by: Optional[str] = "id"
    sort_order: Optional[str] = "asc"


class UserListResponse(BaseModel):
    users: List[AdminUserList]
    total: int
    limit: int
    offset: int
    has_next: bool
    has_prev: bool
    total_pages: int
    current_page: int
