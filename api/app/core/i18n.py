"""
多语言配置文件
支持中文（zh）和英文（en）
"""

from enum import Enum
from typing import Dict, Any

class Language(str, Enum):
    """支持的语言"""
    ZH = "zh"
    EN = "en"

# Multi-language message configuration
MESSAGES: Dict[str, Dict[str, str]] = {
    "zh": {
        # General messages
        "success": "操作成功",
        "error": "操作失败",
        "not_found": "未找到",
        "invalid_params": "参数无效",
        "unauthorized": "未授权",
        "forbidden": "禁止访问",
        "internal_error": "内部服务器错误",
        
        # User related
        "user_not_found": "用户不存在",
        "user_exists": "用户已存在",
        "user_created": "用户创建成功",
        "user_updated": "用户更新成功",
        "user_deleted": "用户删除成功",
        "user_restored": "用户恢复成功",
        "username_required": "用户名不能为空",
        "username_length_error": "用户名长度必须在2-20字符之间",
        "username_format_error": "用户名只能包含字母、数字、下划线和中文字符",
        "password_required": "密码不能为空",
        "password_length_error": "密码长度至少6位",
        "password_invalid": "密码错误",
        "email_required": "邮箱不能为空",
        "email_invalid": "邮箱格式不正确",
        "field_required": "必填字段不能为空",
        "cannot_delete_self": "不能删除自己的账户",
        
        # Verification code related
        "verification_code_sent": "验证码已发送",
        "verification_code_invalid": "验证码无效",
        "verification_code_expired": "验证码已过期",
        "verification_code_error": "验证码错误",
        
        # Authentication related
        "login_success": "登录成功",
        "login_failed": "登录失败",
        "logout_success": "退出成功",
        "register_success": "注册成功",
        "register_failed": "注册失败",
        "token_invalid": "令牌无效",
        "token_expired": "令牌已过期",
        "password_reset_success": "密码重置成功",
        "password_reset_failed": "密码重置失败",
        
        # Chat related
        "chat_not_found": "对话不存在",
        "chat_created": "对话创建成功",
        "chat_updated": "对话更新成功",
        "chat_deleted": "对话删除成功",
        "message_created": "消息创建成功",
        "message_not_found": "消息不存在",
        
        # Admin related
        "admin_required": "需要管理员权限",
        "not_admin": "非管理员用户",
        "admin_dashboard_data": "管理员仪表板数据",
        "user_list_retrieved": "用户列表获取成功",
        "chat_list_retrieved": "对话列表获取成功",
        
        # File related
        "file_not_found": "文件不存在",
        "file_upload_success": "文件上传成功",
        "file_upload_failed": "文件上传失败",
        "file_delete_success": "文件删除成功",
        
        # System related
        "system_status": "系统状态",
        "database_error": "数据库错误",
        "network_error": "网络错误",
        "service_unavailable": "服务不可用",
    },
    
    "en": {
        # General messages
        "success": "Operation successful",
        "error": "Operation failed",
        "not_found": "Not found",
        "invalid_params": "Invalid parameters",
        "unauthorized": "Unauthorized",
        "forbidden": "Forbidden",
        "internal_error": "Internal server error",
        
        # User related
        "user_not_found": "User not found",
        "user_exists": "User already exists",
        "user_created": "User created successfully",
        "user_updated": "User updated successfully",
        "user_deleted": "User deleted successfully",
        "user_restored": "User restored successfully",
        "username_required": "Username is required",
        "username_length_error": "Username length must be between 2-20 characters",
        "username_format_error": "Username can only contain letters, numbers, underscores and Chinese characters",
        "password_required": "Password is required",
        "password_length_error": "Password must be at least 6 characters",
        "password_invalid": "Invalid password",
        "email_required": "Email is required",
        "email_invalid": "Invalid email format",
        "field_required": "Required field cannot be empty",
        "cannot_delete_self": "Cannot delete your own account",
        
        # Verification code related
        "verification_code_sent": "Verification code sent",
        "verification_code_invalid": "Invalid verification code",
        "verification_code_expired": "Verification code expired",
        "verification_code_error": "Verification code error",
        
        # Authentication related
        "login_success": "Login successful",
        "login_failed": "Login failed",
        "logout_success": "Logout successful",
        "register_success": "Registration successful",
        "register_failed": "Registration failed",
        "token_invalid": "Invalid token",
        "token_expired": "Token expired",
        "password_reset_success": "Password reset successful",
        "password_reset_failed": "Password reset failed",
        
        # Chat related
        "chat_not_found": "Chat not found",
        "chat_created": "Chat created successfully",
        "chat_updated": "Chat updated successfully",
        "chat_deleted": "Chat deleted successfully",
        "message_created": "Message created successfully",
        "message_not_found": "Message not found",
        
        # Admin related
        "admin_required": "Admin privileges required",
        "not_admin": "Not an admin user",
        "admin_dashboard_data": "Admin dashboard data",
        "user_list_retrieved": "User list retrieved successfully",
        "chat_list_retrieved": "Chat list retrieved successfully",
        
        # File related
        "file_not_found": "File not found",
        "file_upload_success": "File uploaded successfully",
        "file_upload_failed": "File upload failed",
        "file_delete_success": "File deleted successfully",
        
        # System related
        "system_status": "System status",
        "database_error": "Database error",
        "network_error": "Network error",
        "service_unavailable": "Service unavailable",
    }
}

def get_message(key: str, lang: str = "zh") -> str:
    """
    Get multi-language message
    
    Args:
        key: Message key
        lang: Language code, default is Chinese
        
    Returns:
        Message text in corresponding language
    """
    # Ensure language code is valid
    if lang not in MESSAGES:
        lang = "zh"  # Default to Chinese
    
    # Get message, if not exists return key itself
    return MESSAGES[lang].get(key, key)

def get_error_message(key: str, lang: str = "zh") -> str:
    """
    Get error message (wrapper function)
    
    Args:
        key: Message key
        lang: Language code, default is Chinese
        
    Returns:
        Error message text
    """
    return get_message(key, lang)

def create_response_message(key: str, lang: str = "zh", **kwargs) -> Dict[str, Any]:
    """
    Create standardized response message
    
    Args:
        key: Message key
        lang: Language code
        **kwargs: Other data to include in response
        
    Returns:
        Dictionary containing message and data
    """
    message = get_message(key, lang)
    response = {"message": message}
    response.update(kwargs)
    return response
