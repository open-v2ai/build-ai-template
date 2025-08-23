# 管理员面板使用指南

## 概述

admin-web 是 Build AI Template 的管理员后台系统，为管理员提供用户管理和会话监控功能。

## 功能列表

### 🔐 权限控制
- 管理员专用登录界面
- JWT Token 身份验证
- 权限验证中间件

### 📊 仪表板
管理员仪表板提供系统整体运行状况：

**用户统计**
- 总用户数
- 活跃用户数
- 管理员数量
- 已删除用户数

**对话统计**
- 总对话数
- 活跃对话数
- 消息总数

**今日数据**
- 今日新增用户
- 今日新增对话

### 👥 用户管理
完整的用户管理功能：

**用户列表**
- 查看所有用户信息
- 显示用户ID、姓名、邮箱
- 用户类型标识（普通用户/管理员）
- 账户状态（正常/已删除）
- 对话数量统计
- 最后活跃时间
- 注册时间

**搜索筛选**
- 按邮箱搜索用户
- 按用户类型筛选（普通用户/管理员）
- 按账户状态筛选（正常/已删除）

**用户编辑**
- 修改用户姓名
- 设置/取消管理员权限
- 启用/禁用用户账户
- 实时保存更改

**分页浏览**
- 支持大量用户数据分页显示
- 可配置每页显示数量

### 💬 会话管理
全面的对话记录管理：

**会话列表**
- 显示所有用户的对话记录
- 会话ID、用户信息、对话标题
- 消息数量统计
- 创建时间和最后更新时间

**高级搜索**
- 按用户邮箱搜索
- 按用户ID精确查找
- 按对话标题关键词搜索

**会话详情**
- 弹窗显示完整对话内容
- 区分用户消息、AI回复、系统消息
- 显示每条消息的时间戳
- 支持长对话滚动查看

**批量操作**
- 分页浏览大量对话记录
- 快速定位特定会话

## 快速开始

### 1. 自动管理员设置

系统采用"首次用户自动成为管理员"的机制：

1. **第一个用户自动成为管理员**：当系统中没有任何用户时，第一个通过邮箱验证登录的用户将自动获得管理员权限
2. **无需手动设置**：不需要执行额外的脚本或数据库操作
3. **安全启动**：确保系统启动时有管理员账户可以管理

### 2. 启动服务

开发环境：
```bash
# 启动API服务
cd api/
python -m app.main

# 启动管理员面板
cd admin-web/
pnpm dev --port 3001
```

访问 `http://localhost:3001` 进入管理员面板。

### 3. 生产部署

使用 Docker Compose：
```bash
cd deploy/
docker-compose -f admin-compose.yaml up -d
```

## API 接口说明

### 认证接口
- `POST /api/v1/auth/send_code` - 发送验证码
- `POST /api/v1/auth/verify` - 验证登录
- `POST /api/v1/auth/refresh_token` - 刷新Token

### 管理员接口
所有管理员接口都需要管理员权限：

**仪表板**
- `GET /api/v1/admin/dashboard` - 获取仪表板统计数据

**用户管理**
- `GET /api/v1/admin/users` - 获取用户列表
- `GET /api/v1/admin/users/{user_id}` - 获取用户详情
- `PUT /api/v1/admin/users/{user_id}` - 更新用户信息

**会话管理**
- `GET /api/v1/admin/chats` - 获取对话列表
- `GET /api/v1/admin/chats/{chat_id}/messages` - 获取对话详情

## 安全注意事项

### 访问控制
1. 只有 `is_admin = true` 的用户才能访问管理员面板
2. 所有API请求都需要有效的JWT Token
3. 前端会自动验证用户权限

### 数据保护
1. 敏感用户信息加密传输
2. 管理员操作记录审计日志
3. 定期备份重要数据

### 权限管理
1. 谨慎设置管理员权限
2. 定期审查管理员账户
3. 及时删除不需要的管理员权限

## 故障排除

### 常见问题

**Q: 无法访问管理员面板**
- 检查用户是否设置了管理员权限
- 确认JWT Token是否有效
- 验证API服务是否正常运行

**Q: 数据显示不正确**
- 检查数据库连接
- 确认API接口返回正常
- 查看浏览器控制台错误信息

**Q: 权限验证失败**
- 确认登录用户具有管理员权限
- 检查Token是否过期
- 验证用户账户是否被禁用

### 调试技巧

1. **检查API响应**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:8000/api/v1/admin/dashboard
   ```

2. **查看日志**
   - 前端：浏览器开发者工具控制台
   - 后端：API服务器日志

3. **数据库查询**
   ```sql
   -- 查看管理员用户
   SELECT id, email, is_admin, is_deleted FROM "user" WHERE is_admin = true;
   
   -- 查看用户统计
   SELECT 
     COUNT(*) as total_users,
     COUNT(*) FILTER (WHERE NOT is_deleted) as active_users,
     COUNT(*) FILTER (WHERE is_admin) as admin_users
   FROM "user";
   
   -- 手动设置管理员（仅在特殊情况下使用）
   UPDATE "user" SET is_admin = true WHERE email = 'admin@example.com';
   ```

## 扩展开发

### 添加新的管理功能

1. **后端API**
   ```python
   # 在 app/routers/v1/admin.py 添加新路由
   @admin_router.get("/new-feature")
   def get_new_feature(admin_user: User = Depends(verify_admin_user)):
       # 实现逻辑
       pass
   ```

2. **前端页面**
   ```tsx
   // 在 admin-web/components/ 创建新组件
   export default function NewFeaturePage() {
       // 实现UI逻辑
   }
   ```

3. **导航菜单**
   ```tsx
   // 更新 components/sidebar/admin-sidebar.tsx
   const navigationItems = [
       // ... 现有项目
       {
           id: 'new-feature',
           label: '新功能',
           icon: <Icon className="w-4 h-4" />,
       },
   ];
   ```

### 自定义样式

管理员面板使用 Tailwind CSS，可以通过修改组件样式进行自定义：

```tsx
// 自定义主题色
<div className="bg-blue-500 text-white">
  管理员面板
</div>
```

## 贡献指南

欢迎为管理员面板贡献代码：

1. Fork 项目仓库
2. 创建功能分支
3. 实现新功能或修复bug
4. 添加测试用例
5. 提交Pull Request

## 许可证

本项目采用 Apache License 2.0 许可证。
