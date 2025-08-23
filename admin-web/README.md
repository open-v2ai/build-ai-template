# Admin Web Panel

这是 Build AI Template 的管理员后台界面，用于管理用户和查看会话记录。

## 功能特性

### 🔐 管理员权限控制
- 仅限管理员账户登录访问
- 基于 JWT Token 的身份验证
- 管理员权限验证中间件

### 📊 管理员仪表板
- 用户统计：总用户数、活跃用户、管理员数量、已删除用户
- 对话统计：总对话数、活跃对话、消息总数
- 今日数据：新增用户数、新增对话数
- 实时数据更新

### 👥 用户管理
- **用户列表**：查看所有用户信息
- **搜索筛选**：按邮箱、用户类型、状态筛选
- **用户编辑**：修改用户名、管理员权限、账户状态
- **批量操作**：支持批量管理用户状态
- **详细信息**：用户ID、邮箱、对话数量、最后活跃时间、注册时间

### 💬 会话管理
- **会话列表**：查看所有用户的对话记录
- **高级搜索**：按用户邮箱、用户ID、对话标题搜索
- **会话详情**：查看完整的对话消息记录
- **消息展示**：区分用户消息、AI回复、系统消息
- **时间信息**：创建时间、最后更新时间

## 技术架构

### 前端技术栈
- **框架**：Next.js 15 + React 19
- **样式**：Tailwind CSS + Shadcn UI
- **图标**：Lucide React
- **国际化**：next-intl
- **状态管理**：React Hooks

### 后端 API
- **框架**：FastAPI + SQLModel
- **数据库**：PostgreSQL
- **认证**：JWT Token
- **权限控制**：基于角色的访问控制 (RBAC)

## 快速开始

### 1. 环境要求
- Node.js >= 18.19.0
- pnpm >= 10.11.0
- 后端 API 服务正在运行

### 2. 安装依赖
```bash
cd admin-web/
pnpm install
```

### 3. 配置环境变量
```bash
cp .env.example .env
# 修改 API 地址等配置
```

### 4. 开发模式运行
```bash
pnpm dev
```

访问 `http://localhost:3000` 进入管理员面板。

### 5. 自动管理员设置
系统会自动将第一个登录的用户设置为管理员，无需手动操作：

1. 启动API服务和admin-web
2. 第一个通过邮箱验证登录的用户自动获得管理员权限
3. 后续用户需要由管理员手动设置权限

## 页面说明

### 登录页面 (`/login`)
- 邮箱验证码登录
- 多语言支持（中文/英文）
- 管理员权限验证

### 仪表板 (`/`)
- 系统概览数据
- 用户和对话统计图表
- 今日新增数据监控

### 用户管理 (`/users`)
- 用户列表展示
- 搜索和筛选功能
- 在线编辑用户信息
- 用户状态管理

### 会话管理 (`/chats`)
- 对话记录查看
- 多维度搜索
- 对话详情弹窗
- 消息时间线展示

## API 接口

### 仪表板数据
```
GET /api/v1/admin/dashboard
```

### 用户管理
```
GET /api/v1/admin/users
PUT /api/v1/admin/users/{user_id}
```

### 会话管理
```
GET /api/v1/admin/chats
GET /api/v1/admin/chats/{chat_id}/messages
```

## 部署说明

### Docker 部署
```bash
# 构建镜像
docker build -t admin-web .

# 运行容器
docker run -p 3000:3000 admin-web
```

### 生产环境
```bash
# 构建
pnpm build

# 启动
pnpm start
```

## 安全说明

### 权限控制
- 所有管理员 API 都需要 JWT Token 认证
- 必须具有管理员权限才能访问
- 前端会验证登录状态和权限

### 数据安全
- 敏感操作记录审计日志
- 用户数据加密传输
- 定期备份重要数据

## 开发指南

### 添加新页面
1. 在 `components/` 目录创建页面组件
2. 在主页面 `app/[locale]/page.tsx` 中添加路由
3. 更新侧边栏导航 `components/sidebar/admin-sidebar.tsx`

### 添加新 API
1. 在后端 `api/app/routers/v1/admin.py` 添加路由
2. 在前端组件中调用 API
3. 使用 `fetcher` 工具进行请求

### 国际化
在 `app/messages/` 目录添加翻译文件：
- `zh.json` - 中文翻译
- `en.json` - 英文翻译

## 常见问题

### Q: 无法登录管理员面板
A: 确保用户账户的 `is_admin` 字段为 `true`，且账户未被删除。

### Q: API 请求失败
A: 检查后端服务是否正常运行，确认 API 地址配置正确。

### Q: 权限不足错误
A: 确认当前登录用户具有管理员权限。

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交代码
4. 创建 Pull Request

## 许可证

本项目采用 Apache License 2.0 许可证。