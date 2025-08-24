from fastapi import APIRouter
from sqlmodel import select, func

from app.dependencies.db import SessionDep
from app.models.user import User, UserType

system_router = APIRouter(prefix="/system")


@system_router.get("/status")
def get_system_status(session: SessionDep):
    """获取系统状态信息"""
    # 检查是否有用户
    user_count = session.exec(select(func.count(User.id))).first() or 0
    
    # 检查是否有管理员
    admin_count = session.exec(
        select(func.count(User.id)).where(
            (User.user_type == UserType.ADMIN) | (User.user_type == UserType.SUPER_ADMIN)
        )
    ).first() or 0
    
    return {
        "has_users": user_count > 0,
        "has_admin": admin_count > 0,
        "user_count": user_count,
        "admin_count": admin_count,
        "first_user_will_be_admin": user_count == 0
    }
