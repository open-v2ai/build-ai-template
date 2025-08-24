from typing import List, Optional
from datetime import datetime, timedelta
from sqlmodel import Session, select, func, and_

from app.models.user import User, UserType
from app.models.chat import Chat
from app.models.message import Message
from app.schemas.admin import (
    AdminUserList, AdminChatList, AdminDashboard, 
    UserSearchParams, ChatSearchParams, UserUpdateRequest,
    UserCreateRequest, UserActionRequest, UserListResponse
)


def get_dashboard_stats(session: Session) -> AdminDashboard:
    """获取管理员仪表板统计数据"""
    today = datetime.utcnow().date()
    
    # 用户统计
    total_users = session.exec(select(func.count(User.id))).first() or 0
    active_users = session.exec(
        select(func.count(User.id)).where(User.is_deleted == False)
    ).first() or 0
    admin_users = session.exec(
        select(func.count(User.id)).where(
            and_(User.user_type == UserType.ADMIN, User.is_deleted == False)
        )
    ).first() or 0
    super_admin_users = session.exec(
        select(func.count(User.id)).where(
            and_(User.user_type == UserType.SUPER_ADMIN, User.is_deleted == False)
        )
    ).first() or 0
    deleted_users = session.exec(
        select(func.count(User.id)).where(User.is_deleted == True)
    ).first() or 0
    
    # 今日新用户
    today_new_users = session.exec(
        select(func.count(User.id)).where(
            func.date(User.created_at) == today
        )
    ).first() or 0
    
    # 对话统计
    total_chats = session.exec(select(func.count(Chat.id))).first() or 0
    active_chats = session.exec(
        select(func.count(Chat.id)).where(Chat.is_deleted == False)
    ).first() or 0
    
    # 今日新对话
    today_new_chats = session.exec(
        select(func.count(Chat.id)).where(
            func.date(Chat.created_at) == today
        )
    ).first() or 0
    
    # 消息统计
    total_messages = session.exec(select(func.count(Message.id))).first() or 0
    
    return AdminDashboard(
        total_users=total_users,
        active_users=active_users,
        admin_users=admin_users,
        super_admin_users=super_admin_users,
        deleted_users=deleted_users,
        total_chats=total_chats,
        active_chats=active_chats,
        total_messages=total_messages,
        today_new_users=today_new_users,
        today_new_chats=today_new_chats
    )


def get_users_with_stats(session: Session, params: UserSearchParams) -> List[AdminUserList]:
    """获取用户列表和统计信息"""
    query = select(
        User.id,
        User.name,
        User.email,
        User.user_type,
        User.membership_type,
        User.is_deleted,
        User.created_at,
        User.last_login_at,
        func.count(Chat.id).label('chat_count'),
        func.max(Chat.updated_at).label('last_active')
    ).outerjoin(Chat, User.id == Chat.user_id)
    
    # 应用筛选条件
    if params.email:
        query = query.where(User.email.contains(params.email))
    if params.user_type is not None:
        query = query.where(User.user_type == params.user_type)
    if params.membership_type is not None:
        query = query.where(User.membership_type == params.membership_type)
    if params.is_deleted is not None:
        query = query.where(User.is_deleted == params.is_deleted)
    
    # GROUP BY 和排序
    query = query.group_by(User.id)
    
    # 应用排序
    if hasattr(User, params.sort_by):
        sort_column = getattr(User, params.sort_by)
    else:
        sort_column = User.id
        
    if params.sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    
    query = query.offset(params.offset).limit(params.limit)
    
    results = session.exec(query).all()
    
    return [
        AdminUserList(
            id=row.id,
            name=row.name,
            email=row.email,
            user_type=row.user_type,
            membership_type=row.membership_type,
            is_deleted=row.is_deleted,
            created_at=row.created_at,
            last_login_at=row.last_login_at,
            chat_count=row.chat_count or 0,
            last_active=row.last_active
        )
        for row in results
    ]


def get_users_with_pagination(session: Session, params: UserSearchParams) -> UserListResponse:
    """获取带分页信息的用户列表"""
    # 构建基础查询
    base_query = select(User).outerjoin(Chat, User.id == Chat.user_id)
    
    # 应用筛选条件
    filters = []
    if params.email:
        filters.append(User.email.contains(params.email))
    if params.user_type is not None:
        filters.append(User.user_type == params.user_type)
    if params.membership_type is not None:
        filters.append(User.membership_type == params.membership_type)
    if params.is_deleted is not None:
        filters.append(User.is_deleted == params.is_deleted)
    
    if filters:
        base_query = base_query.where(and_(*filters))
    
    # 获取总数 - 注意需要根据用户ID去重
    count_query = select(func.count(func.distinct(User.id)))
    if filters:
        count_query = count_query.select_from(User).where(and_(*filters))
    else:
        count_query = count_query.select_from(User)
    
    total = session.exec(count_query).first() or 0
    
    # 获取用户列表和统计信息
    query = select(
        User.id,
        User.name,
        User.email,
        User.user_type,
        User.membership_type,
        User.is_deleted,
        User.created_at,
        User.last_login_at,
        func.count(Chat.id).label('chat_count'),
        func.max(Chat.updated_at).label('last_active')
    ).outerjoin(Chat, User.id == Chat.user_id)
    
    # 应用筛选条件
    if filters:
        query = query.where(and_(*filters))
    
    # GROUP BY 和排序
    query = query.group_by(User.id)
    
    # 应用排序
    if hasattr(User, params.sort_by):
        sort_column = getattr(User, params.sort_by)
    else:
        sort_column = User.id
        
    if params.sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    
    query = query.offset(params.offset).limit(params.limit)
    
    results = session.exec(query).all()
    
    users = [
        AdminUserList(
            id=row.id,
            name=row.name,
            email=row.email,
            user_type=row.user_type,
            membership_type=row.membership_type,
            is_deleted=row.is_deleted,
            created_at=row.created_at,
            last_login_at=row.last_login_at,
            chat_count=row.chat_count or 0,
            last_active=row.last_active
        )
        for row in results
    ]
    
    # 计算分页信息
    total_pages = (total + params.limit - 1) // params.limit if params.limit > 0 else 1
    current_page = (params.offset // params.limit) + 1 if params.limit > 0 else 1
    has_next = params.offset + params.limit < total
    has_prev = params.offset > 0
    
    return UserListResponse(
        users=users,
        total=total,
        limit=params.limit,
        offset=params.offset,
        has_next=has_next,
        has_prev=has_prev,
        total_pages=total_pages,
        current_page=current_page
    )


def get_chats_with_user_info(session: Session, params: ChatSearchParams) -> List[AdminChatList]:
    """获取对话列表和用户信息"""
    query = select(
        Chat.id,
        Chat.user_id,
        Chat.title,
        Chat.created_at,
        Chat.updated_at,
        User.email.label('user_email'),
        func.count(Message.id).label('message_count')
    ).join(User, Chat.user_id == User.id).outerjoin(
        Message, Chat.id == Message.chat_id
    ).group_by(Chat.id, User.email)
    
    # 应用筛选条件
    if params.user_id:
        query = query.where(Chat.user_id == params.user_id)
    if params.user_email:
        query = query.where(User.email.contains(params.user_email))
    if params.title:
        query = query.where(Chat.title.contains(params.title))
    
    query = query.where(Chat.is_deleted == False)
    query = query.order_by(Chat.updated_at.desc())
    query = query.offset(params.offset).limit(params.limit)
    
    results = session.exec(query).all()
    
    return [
        AdminChatList(
            id=row.id,
            user_id=row.user_id,
            user_email=row.user_email,
            title=row.title,
            message_count=row.message_count or 0,
            created_at=row.created_at,
            updated_at=row.updated_at
        )
        for row in results
    ]


def update_user(session: Session, user_id: int, update_data: UserUpdateRequest) -> Optional[User]:
    """更新用户信息"""
    user = session.get(User, user_id)
    if not user:
        return None
    
    if update_data.user_type is not None:
        user.user_type = update_data.user_type
    if update_data.membership_type is not None:
        user.membership_type = update_data.membership_type
    if update_data.is_deleted is not None:
        user.is_deleted = update_data.is_deleted
    if update_data.name is not None:
        user.name = update_data.name
    
    user.updated_at = datetime.utcnow()
    session.add(user)
    session.commit()
    session.refresh(user)
    
    return user


def get_user_detail(session: Session, user_id: int) -> Optional[User]:
    """获取用户详细信息"""
    return session.get(User, user_id)


def get_chat_messages(session: Session, chat_id: int) -> List[Message]:
    """获取对话的所有消息"""
    return session.exec(
        select(Message).where(Message.chat_id == chat_id).order_by(Message.created_at)
    ).all()


def create_user_by_admin(session: Session, user_data: UserCreateRequest) -> User:
    """管理员创建新用户"""
    # 检查邮箱是否已存在
    existing_user = session.exec(
        select(User).where(User.email == user_data.email)
    ).first()
    
    if existing_user:
        raise ValueError(f"邮箱 {user_data.email} 已存在")
    
    # 创建新用户
    new_user = User(
        email=user_data.email,
        name=user_data.name,
        user_type=user_data.user_type,
        membership_type=user_data.membership_type,
        is_deleted=False,
        last_login_at=None  # 管理员创建的用户初始没有登录时间
    )
    
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    
    return new_user


def delete_or_restore_user(session: Session, user_id: int, action_data: UserActionRequest) -> User:
    """删除或恢复用户"""
    user = session.get(User, user_id)
    if not user:
        raise ValueError("用户不存在")
    
    if action_data.action == "delete":
        if user.is_deleted:
            raise ValueError("用户已被删除")
        user.is_deleted = True
    elif action_data.action == "restore":
        if not user.is_deleted:
            raise ValueError("用户未被删除，无需恢复")
        user.is_deleted = False
    else:
        raise ValueError("无效的操作类型")
    
    user.updated_at = datetime.utcnow()
    session.add(user)
    session.commit()
    session.refresh(user)
    
    return user


def check_user_can_be_deleted(session: Session, user_id: int) -> dict:
    """检查用户是否可以安全删除"""
    user = session.get(User, user_id)
    if not user:
        raise ValueError("用户不存在")
    
    # 统计用户的对话数量
    chat_count = session.exec(
        select(func.count(Chat.id)).where(
            and_(Chat.user_id == user_id, Chat.is_deleted == False)
        )
    ).first() or 0
    
    # 统计用户的消息数量
    message_count = session.exec(
        select(func.count(Message.id)).where(
            Message.chat_id.in_(
                select(Chat.id).where(Chat.user_id == user_id)
            )
        )
    ).first() or 0
    
    return {
        "can_delete": True,  # 总是可以删除（软删除）
        "chat_count": chat_count,
        "message_count": message_count,
        "user_type": user.user_type,
        "warning": "删除用户将保留其数据，但用户无法登录" if chat_count > 0 or message_count > 0 else None
    }
