# Admin Web Panel

这是 Build AI Template 的管理员后台界面，提供完整的用户管理、对话管理和系统监控功能。

## 🚀 功能特性

### 🔐 管理员权限控制
- 仅限管理员账户登录访问
- 基于 JWT Token 的身份验证
- 自动将首位登录用户设为管理员
- 细粒度权限控制和验证中间件

### 📊 智能仪表板
- **用户统计**：总用户数、活跃用户、管理员数量、已删除用户
- **对话统计**：总对话数、活跃对话、消息总数
- **今日数据**：新增用户数、新增对话数、实时增长趋势
- **数据可视化**：图表展示关键指标和趋势分析

### 👥 用户管理系统
- **用户列表**：分页查看所有用户信息，固定行高优化显示
- **高级搜索**：按邮箱、用户类型、会员类型、状态进行筛选
- **在线编辑**：实时修改用户名、用户类型、会员类型、账户状态
- **用户类型管理**：
  - 普通用户 (normal)
  - 高级用户 (premium) 
  - 管理员 (admin)
  - 超级管理员 (super_admin)
- **会员类型管理**：
  - 免费会员 (free)
  - 月度会员 (monthly)
  - 年度会员 (yearly)
  - 终身会员 (lifetime)
- **用户操作**：删除/恢复用户（简化流程，无需填写原因）
- **详细信息**：用户ID、邮箱、对话数量、最后登录时间、最后活跃时间、注册时间
- **响应式表格**：支持横向滚动，确保在小屏幕上的可用性

### 💬 对话管理系统
- **对话列表**：查看所有用户的对话记录
- **多维搜索**：按用户邮箱、用户ID、对话标题进行搜索
- **对话详情**：查看完整的对话消息记录和时间线
- **消息类型**：区分用户消息、AI回复、系统消息
- **时间追踪**：创建时间、最后更新时间完整显示

### 🌍 国际化支持
- 完整的中英文界面支持
- 动态语言切换，无需刷新页面
- 本地化时间格式和数字显示

### 🎨 现代化界面
- **主题切换**：支持明暗主题自动切换
- **响应式设计**：完美适配桌面、平板、手机
- **侧边栏导航**：可折叠的现代化导航界面
- **组件化UI**：基于 Shadcn UI 的统一设计语言

## 🛠 技术架构

### 前端技术栈
- **核心框架**：Next.js 15.3.1 + React 19
- **构建工具**：Turbopack（开发模式）
- **样式方案**：Tailwind CSS 4.1.5 + PostCSS
- **UI组件库**：Shadcn UI + Radix UI
- **图标库**：Lucide React 0.507.0
- **国际化**：next-intl 4.1.0
- **主题管理**：next-themes 0.4.6
- **状态管理**：React Hooks + Context
- **Markdown渲染**：react-markdown + remark-gfm
- **通知系统**：sonner 2.0.3
- **动画效果**：tw-animate-css

### 后端 API
- **框架**：FastAPI + SQLModel
- **数据库**：PostgreSQL + Redis
- **认证方式**：JWT Token
- **权限控制**：基于角色的访问控制 (RBAC)
- **API版本**：RESTful API v1

### 开发工具
- **类型检查**：TypeScript 5
- **代码规范**：ESLint + Next.js 配置
- **包管理器**：pnpm 10.15.0
- **容器化**：Docker + Docker Compose

## 🚀 快速开始

### 1. 环境要求
- **Node.js**：>= 18.19.0
- **pnpm**：>= 10.11.0
- **后端服务**：确保 API 服务正在运行
- **浏览器**：支持现代浏览器（Chrome 90+、Firefox 90+、Safari 14+）

### 2. 安装依赖
```bash
cd admin-web/
pnpm install
```

### 3. 环境配置
```bash
# 复制环境变量模板（如果存在）
cp .env.example .env.local

# 或手动配置以下环境变量
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

### 4. 开发模式
```bash
# 启动开发服务器（默认端口 3001）
pnpm dev

# 或指定端口
PORT=3000 pnpm dev
```

访问 `http://localhost:3001` 进入管理员面板。

### 5. 首次使用
系统采用零配置管理员设置：

1. **启动服务**：确保 API 服务和 admin-web 都在运行
2. **首位用户**：第一个通过邮箱验证登录的用户自动获得超级管理员权限
3. **后续管理**：之后的用户需要由管理员手动分配权限

## 📱 页面说明

### 登录页面 (`/login`)
- **邮箱验证码登录**：安全便捷的无密码登录方式
- **多语言界面**：支持中文/英文切换
- **权限验证**：自动检测管理员权限
- **响应式布局**：适配各种设备屏幕

### 仪表板页面 (`/`)
- **数据概览**：关键指标一目了然
- **实时统计**：用户、对话、消息数据
- **趋势分析**：今日新增数据监控
- **图表展示**：可视化数据分析

### 用户管理页面
- **用户列表**：分页展示，支持搜索筛选
- **批量操作**：高效的用户状态管理
- **详细编辑**：在线修改用户信息和权限
- **数据导出**：用户数据统计和分析

### 对话管理页面
- **对话记录**：完整的用户对话历史
- **内容搜索**：多维度查找功能
- **消息详情**：对话内容和时间线查看
- **数据分析**：对话质量和用户行为分析

## 🔌 API 接口

### 认证相关
```http
POST /api/v1/auth/email-login    # 邮箱验证码登录
POST /api/v1/auth/logout         # 用户登出
```

### 仪表板数据
```http
GET /api/v1/admin/dashboard      # 获取仪表板统计数据
```

### 用户管理
```http
GET /api/v1/admin/users          # 获取用户列表（支持分页、搜索）
PUT /api/v1/admin/users/{id}     # 更新用户信息
POST /api/v1/admin/users         # 创建新用户
POST /api/v1/admin/users/{id}/actions  # 用户操作（删除/恢复）
GET /api/v1/admin/users/{id}/delete-check  # 删除前数据检查
```

### 对话管理
```http
GET /api/v1/admin/chats          # 获取对话列表
GET /api/v1/admin/chats/{id}/messages  # 获取对话消息
```

### 系统管理
```http
GET /api/v1/system/info          # 获取系统信息
```

## 🚢 部署指南

### Docker 部署
```bash
# 构建镜像
docker build -t build-ai-template-admin .

# 运行容器
docker run -p 3001:3000 -e NEXT_PUBLIC_API_URL=http://your-api-host:8000 build-ai-template-admin
```

### 生产环境部署
```bash
# 构建生产版本
pnpm build

# 启动生产服务
pnpm start
```

### Docker Compose 部署
```yaml
version: '3.8'
services:
  admin-web:
    build: ./admin-web
    ports:
      - "3001:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://api:8000
    depends_on:
      - api
```

### 环境变量配置
```bash
# API 服务地址
NEXT_PUBLIC_API_URL=http://localhost:8000

# 应用端口（可选）
PORT=3001

# Node 环境
NODE_ENV=production
```

## 🔒 安全说明

### 权限控制
- **JWT Token 认证**：所有管理员 API 都需要有效的 JWT Token
- **角色权限验证**：必须具有管理员权限才能访问系统
- **前端权限检查**：页面级和组件级权限验证
- **会话管理**：自动处理 Token 刷新和过期

### 数据安全
- **HTTPS 传输**：生产环境强制使用 HTTPS
- **数据加密**：敏感数据传输加密
- **操作审计**：关键操作记录日志
- **定期备份**：重要数据定期备份

### 安全最佳实践
- **环境变量**：敏感配置使用环境变量
- **CORS 配置**：限制跨域请求来源
- **输入验证**：前后端双重数据验证
- **错误处理**：避免敏感信息泄露

## 🔧 开发指南

### 项目结构
```
admin-web/
├── app/                    # Next.js 应用路由
│   ├── [locale]/          # 国际化路由
│   ├── globals.css        # 全局样式
│   └── messages/          # 翻译文件
├── components/            # React 组件
│   ├── ui/               # 基础 UI 组件
│   ├── sidebar/          # 侧边栏组件
│   └── *.tsx             # 页面组件
├── hooks/                # 自定义 Hooks
├── lib/                  # 工具库
├── util/                 # 工具函数
└── public/              # 静态资源
```

### 添加新功能页面
1. **创建组件**：在 `components/` 目录创建页面组件
2. **添加路由**：在主页面 `app/[locale]/page.tsx` 中添加路由逻辑
3. **更新导航**：在 `components/sidebar/admin-sidebar.tsx` 中添加导航项
4. **添加翻译**：在 `app/messages/` 目录添加相应的翻译文本

### 添加新 API 集成
1. **后端路由**：在 `api/app/routers/v1/admin.py` 添加新的 API 路由
2. **前端调用**：在组件中使用 `fetcher` 工具进行 API 调用
3. **类型定义**：在 `app/[locale]/types.ts` 添加相应的 TypeScript 类型
4. **错误处理**：添加适当的错误处理和用户提示

### 国际化开发
在 `app/messages/` 目录维护翻译文件：
- `zh.json` - 中文翻译
- `en.json` - 英文翻译

使用示例：
```tsx
import { useTranslations } from 'next-intl';

function MyComponent() {
  const t = useTranslations();
  return <div>{t('MY_TEXT_KEY')}</div>;
}
```

### 样式开发规范
- **使用 Tailwind CSS**：优先使用 Tailwind 类名
- **组件复用**：使用 Shadcn UI 组件库
- **响应式设计**：确保移动端适配
- **主题支持**：支持明暗主题切换

## ❓ 常见问题

### 登录和权限问题

**Q: 无法登录管理员面板**
A: 
- 确保用户账户的 `user_type` 为 `admin` 或 `super_admin`
- 检查账户状态，确认未被删除（`is_deleted` 为 `false`）
- 验证邮箱验证码是否正确

**Q: 权限不足错误**
A:
- 确认当前登录用户具有管理员权限
- 检查 JWT Token 是否有效且未过期
- 确保后端 API 权限验证正常

### 技术问题

**Q: API 请求失败**
A:
- 检查后端服务是否正常运行
- 确认 `NEXT_PUBLIC_API_URL` 环境变量配置正确
- 检查网络连接和防火墙设置
- 查看浏览器开发者工具的网络请求

**Q: 页面显示异常**
A:
- 清除浏览器缓存和 Cookie
- 检查控制台是否有 JavaScript 错误
- 确认所有依赖包正确安装
- 重启开发服务器

**Q: 国际化不生效**
A:
- 检查翻译文件是否正确配置
- 确认语言切换功能正常
- 验证 next-intl 中间件配置

### 部署问题

**Q: Docker 构建失败**
A:
- 检查 Dockerfile 配置
- 确认 Node.js 版本兼容性
- 查看构建日志中的错误信息

**Q: 生产环境性能问题**
A:
- 确保启用了生产模式构建
- 检查静态资源压缩和缓存配置
- 考虑使用 CDN 加速静态资源

## 🤝 贡献指南

我们欢迎社区贡献！请遵循以下步骤：

### 贡献流程
1. **Fork 项目**：Fork 本仓库到您的 GitHub 账户
2. **创建分支**：基于 `main` 分支创建功能分支
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **开发功能**：完成功能开发并确保代码质量
4. **测试验证**：运行测试并确保功能正常
5. **提交代码**：提交代码并编写清晰的提交信息
6. **创建 PR**：创建 Pull Request 并详细描述变更

### 代码规范
- **TypeScript**：严格使用 TypeScript 类型检查
- **ESLint**：遵循项目的 ESLint 配置
- **代码格式**：保持一致的代码格式和风格
- **注释文档**：为复杂逻辑添加适当注释

### 提交规范
使用语义化提交信息：
- `feat:` 新功能
- `fix:` 错误修复
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建或工具变更

## 📄 许可证

本项目采用 [Apache License 2.0](../LICENSE) 许可证。

---

## 🔗 相关链接

- [项目主页](https://github.com/open-v2ai/build-ai-template)
- [API 文档](../api/README.md)
- [用户端界面](../web/README.md)
- [部署指南](../deploy/README.md)
- [PRD 文档](../PRD.md)

## 💬 支持与反馈

如果您在使用过程中遇到问题或有改进建议，请通过以下方式联系我们：

- 🐛 [提交 Issue](https://github.com/open-v2ai/build-ai-template/issues)
- 💡 [功能建议](https://github.com/open-v2ai/build-ai-template/discussions)
- 📧 邮件联系：contact@open-v2ai.com

感谢您使用 Build AI Template 管理员后台！🎉