"""
自定义异常处理器
用于提供友好的错误消息，特别是处理验证错误
"""

from typing import Union
from fastapi import Request, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.core.i18n import get_message


async def get_lang_from_request(request: Request) -> str:
    """从请求中获取语言设置"""
    # 尝试从查询参数获取
    lang = request.query_params.get("lang")
    if lang:
        return lang
    
    # 尝试从请求体获取 (如果是JSON)
    try:
        # 获取请求体内容
        body = await request.body()
        if body:
            import json
            data = json.loads(body)
            if isinstance(data, dict) and 'lang' in data:
                return data['lang']
    except:
        pass
    
    # 默认返回中文
    return "zh"


def create_validation_error_response(
    errors: list, 
    lang: str = "zh"
) -> dict:
    """创建友好的验证错误响应"""
    
    # 如果只有一个错误，返回具体的错误消息
    if len(errors) == 1:
        error = errors[0]
        error_type = error.get("type", "")
        loc = error.get("loc", [])
        msg = error.get("msg", "")
        
        # 处理缺少必填字段
        if error_type == "missing" and len(loc) >= 2:
            field = loc[1]  # 获取字段名
            if field == "email":
                return {"detail": get_message("email_required", lang)}
            elif field == "password":
                return {"detail": get_message("password_required", lang)}
            elif field == "username":
                return {"detail": get_message("username_required", lang)}
            else:
                return {"detail": get_message("field_required", lang)}
        
        # 处理邮箱格式错误
        elif error_type == "value_error" and "email" in msg.lower():
            return {"detail": get_message("email_invalid", lang)}
        
        # 处理其他验证错误
        else:
            return {"detail": msg}
    
    # 如果有多个错误，返回第一个重要的错误
    for error in errors:
        error_type = error.get("type", "")
        loc = error.get("loc", [])
        
        # 优先处理必填字段错误
        if error_type == "missing" and len(loc) >= 2:
            field = loc[1]
            if field == "email":
                return {"detail": get_message("email_required", lang)}
            elif field == "password":
                return {"detail": get_message("password_required", lang)}
            elif field == "username":
                return {"detail": get_message("username_required", lang)}
    
    # 如果没有找到重要错误，返回第一个错误
    first_error = errors[0]
    msg = first_error.get("msg", "Validation error")
    return {"detail": msg}


async def validation_exception_handler(
    request: Request, 
    exc: Union[RequestValidationError, ValidationError]
) -> JSONResponse:
    """处理验证错误异常"""
    
    # 获取语言设置
    lang = await get_lang_from_request(request)
    
    # 获取错误详情
    errors = exc.errors() if hasattr(exc, 'errors') else []
    
    # 创建友好的错误响应
    error_response = create_validation_error_response(errors, lang)
    
    return JSONResponse(
        status_code=422,
        content=error_response
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """处理HTTP异常"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )
