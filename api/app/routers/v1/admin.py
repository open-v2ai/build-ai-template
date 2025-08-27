from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlmodel import Session

from app.dependencies.db import SessionDep
from app.db.base import get_session
from app.dependencies.auth import verify_admin_user
from app.models.user import User, UserType, MembershipType
from app.schemas.admin import (
    AdminUserList, AdminChatList, AdminDashboard,
    UserSearchParams, ChatSearchParams, UserUpdateRequest,
    UserCreateRequest, UserActionRequest, UserListResponse
)
from app.crud.admin import (
    get_dashboard_stats, get_users_with_stats, get_users_with_pagination, get_chats_with_user_info,
    update_user, get_user_detail, get_chat_messages,
    create_user_by_admin, delete_or_restore_user, check_user_can_be_deleted
)
from app.core.i18n import get_message, create_response_message

admin_router = APIRouter(prefix="/admin")


@admin_router.get("/dashboard", response_model=AdminDashboard)
def get_admin_dashboard(
    session: Session = Depends(get_session),
    admin_user: User = Depends(verify_admin_user)
) -> AdminDashboard:
    """获取管理员仪表板数据"""
    return get_dashboard_stats(session)


@admin_router.get("/users", response_model=UserListResponse)
def get_users(
    *,
    session: SessionDep,
    email: Optional[str] = None,
    user_type: Optional[UserType] = None,
    membership_type: Optional[MembershipType] = None,
    is_deleted: Optional[bool] = None,
    limit: int = 10,
    offset: int = 0,
    sort_by: Optional[str] = "id",
    sort_order: Optional[str] = "asc",
    admin_user: User = Depends(verify_admin_user)
) -> UserListResponse:
    """获取用户列表（带分页信息）"""
    params = UserSearchParams(
        email=email,
        user_type=user_type,
        membership_type=membership_type,
        is_deleted=is_deleted,
        limit=limit,
        offset=offset,
        sort_by=sort_by,
        sort_order=sort_order
    )
    return get_users_with_pagination(session, params)


@admin_router.get("/chats", response_model=List[AdminChatList])
def get_chats(
    *,
    session: SessionDep,
    user_id: Optional[int] = None,
    user_email: Optional[str] = None,
    title: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    admin_user: User = Depends(verify_admin_user)
) -> List[AdminChatList]:
    """获取对话列表"""
    params = ChatSearchParams(
        user_id=user_id,
        user_email=user_email,
        title=title,
        limit=limit,
        offset=offset
    )
    return get_chats_with_user_info(session, params)


@admin_router.get("/users/{user_id}")
def get_user(
    user_id: int,
    *,
    session: SessionDep,
    lang: str = "zh",
    admin_user: User = Depends(verify_admin_user)
):
    """获取用户详细信息"""
    user = get_user_detail(session, user_id)
    if not user:
        error_msg = get_message("user_not_found", lang)
        raise HTTPException(status_code=404, detail=error_msg)
    return user


@admin_router.put("/users/{user_id}")
def update_user_info(
    user_id: int,
    update_data: UserUpdateRequest,
    *,
    session: SessionDep,
    admin_user: User = Depends(verify_admin_user)
):
    """更新用户信息"""
    user = update_user(session, user_id, update_data)
    if not user:
        error_msg = get_message("user_not_found", update_data.lang)
        raise HTTPException(status_code=404, detail=error_msg)
    return create_response_message("user_updated", update_data.lang, user=user)


@admin_router.get("/chats/{chat_id}/messages")
def get_chat_detail(
    chat_id: int,
    *,
    session: SessionDep,
    admin_user: User = Depends(verify_admin_user)
):
    """获取对话详细信息和消息列表"""
    messages = get_chat_messages(session, chat_id)
    return {"chat_id": chat_id, "messages": messages}


@admin_router.post("/users")
def create_user(
    user_data: UserCreateRequest,
    *,
    session: SessionDep,
    admin_user: User = Depends(verify_admin_user)
):
    """管理员创建新用户"""
    try:
        new_user = create_user_by_admin(session, user_data)
        return create_response_message("user_created", user_data.lang, user=new_user)
    except ValueError as e:
        error_msg = get_message("error", user_data.lang)
        raise HTTPException(status_code=400, detail=error_msg)


@admin_router.post("/users/{user_id}/actions")
def user_action(
    user_id: int,
    action_data: UserActionRequest,
    *,
    session: SessionDep,
    admin_user: User = Depends(verify_admin_user)
):
    """用户操作：删除或恢复"""
    # 防止管理员删除自己
    if user_id == admin_user.id and action_data.action == "delete":
        error_msg = get_message("cannot_delete_self", action_data.lang)
        raise HTTPException(status_code=400, detail=error_msg)
    
    try:
        updated_user = delete_or_restore_user(session, user_id, action_data)
        action_key = "user_deleted" if action_data.action == "delete" else "user_restored"
        return create_response_message(action_key, action_data.lang, user=updated_user)
    except ValueError as e:
        error_msg = get_message("error", action_data.lang)
        raise HTTPException(status_code=400, detail=error_msg)


@admin_router.get("/users/{user_id}/delete-check")
def check_user_deletion(
    user_id: int,
    *,
    session: SessionDep,
    lang: str = "zh",
    admin_user: User = Depends(verify_admin_user)
):
    """检查用户删除的影响"""
    try:
        return check_user_can_be_deleted(session, user_id)
    except ValueError as e:
        error_msg = get_message("user_not_found", lang)
        raise HTTPException(status_code=404, detail=error_msg)
