# Supabase 数据库迁移指南

本目录包含 Build AI Template 项目的所有数据库迁移文件。

## 📋 迁移文件列表

### 1. `20250109000000_initial_schema.sql`

**初始数据库架构**

创建所有核心业务表：

- ✅ `user` - 用户表
- ✅ `agent` - AI助手表
- ✅ `chat` - 对话表
- ✅ `message` - 消息表
- ✅ `membership_plan` - 会员计划表
- ✅ `user_membership` - 用户会员关系表
- ✅ `order` - 订单表

包含功能：

- 自定义 Enum 类型
- 完整的索引设计
- 详细的中文注释
- `updated_at` 自动更新触发器
- 默认会员计划数据（免费版、月度、年度）
- 活跃会员视图

### 2. `20250109000001_enable_rls.sql`

**行级安全策略 (RLS)**

为所有表启用 RLS 并配置安全策略：

- ✅ 用户只能访问自己的数据
- ✅ 管理员可以访问所有数据
- ✅ 新用户自动分配免费会员
- ✅ 支持每日使用限制检查

包含辅助函数：

- `is_admin()` - 检查是否为管理员
- `current_user_id()` - 获取当前用户ID
- `check_daily_limit()` - 检查每日使用限制
- `assign_free_membership()` - 自动分配免费会员

### 3. `20250109000002_auth_integration.sql`

**Supabase Auth 集成**

集成 Supabase Auth 系统：

- ✅ Auth 用户自动同步到 `user` 表
- ✅ 用户信息自动更新
- ✅ 登录时间记录
- ✅ 权限检查系统
- ✅ 使用统计自动管理

包含功能函数：

- `handle_new_auth_user()` - 新用户同步
- `handle_auth_user_updated()` - 用户更新同步
- `get_user_by_auth_uid()` - 获取用户信息
- `record_user_login()` - 记录登录
- `has_permission()` - 权限检查
- `update_user_usage()` - 更新使用统计
- `soft_delete_user_account()` - 软删除账户

## 🚀 应用迁移

### 本地开发环境

```bash
# 1. 启动本地 Supabase
supabase start

# 2. 应用所有迁移
supabase db reset

# 3. 查看数据库状态
supabase db diff
```

### 远程 Supabase 项目

```bash
# 1. 链接到远程项目
supabase link --project-ref your-project-ref

# 2. 推送迁移到远程
supabase db push

# 3. 验证迁移状态
supabase db remote commit
```

## ⚠️ 重要：手动配置 Auth 触发器

由于 `auth.users` 表在不同的 schema 中，需要在 **Supabase Dashboard** 的 SQL Editor 中手动执行以下 SQL：

```sql
-- 新用户注册时自动同步
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_auth_user();

-- 用户信息更新时自动同步
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_auth_user_updated();
```

**执行步骤**：

1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 选择你的项目
3. 进入 **SQL Editor**
4. 复制上面的 SQL 代码并执行

## 🔍 验证迁移

### 检查表是否创建成功

```sql
-- 查看所有表
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- 检查 RLS 是否启用
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### 测试 RLS 策略

```sql
-- 查看当前用户
SELECT auth.uid();

-- 查看自己的用户信息
SELECT * FROM "user" WHERE id::text = auth.uid()::text;

-- 查看会员计划（所有认证用户可见）
SELECT * FROM membership_plan WHERE is_active = true;
```

### 测试辅助函数

```sql
-- 检查是否为管理员
SELECT is_admin();

-- 获取当前用户信息
SELECT * FROM get_user_by_auth_uid();

-- 检查权限
SELECT has_permission('user');
SELECT has_permission('admin');

-- 查看用户完整信息
SELECT * FROM user_profile;
```

## 📊 默认数据

迁移会自动插入 3 个会员计划：

| 名称     | 类型    | 消息限制 | Token限制 | 价格   | 有效期 |
| -------- | ------- | -------- | --------- | ------ | ------ |
| 免费版   | free    | 10/天    | 10,000    | $0.00  | 365天  |
| 月度会员 | monthly | 1000/天  | 1,000,000 | $9.99  | 30天   |
| 年度会员 | yearly  | 1000/天  | 1,000,000 | $99.99 | 365天  |

## 🔐 RLS 策略概览

### 用户表 (user)

- ✅ 用户可以查看和更新自己的信息
- ✅ 管理员可以查看和管理所有用户
- ✅ 允许新用户注册（自动创建）

### AI助手表 (agent)

- ✅ 所有认证用户可以查看 Agent
- ✅ 管理员可以创建和管理 Agent

### 对话表 (chat)

- ✅ 用户只能查看和管理自己的对话
- ✅ 管理员可以查看所有对话

### 消息表 (message)

- ✅ 用户只能查看和管理自己对话中的消息
- ✅ 管理员可以查看所有消息

### 会员计划表 (membership_plan)

- ✅ 所有认证用户可以查看活跃的计划
- ✅ 管理员可以创建和管理计划

### 用户会员表 (user_membership)

- ✅ 用户可以查看自己的会员信息
- ✅ 系统可以自动创建会员关系
- ✅ 管理员可以管理所有会员

### 订单表 (order)

- ✅ 用户可以查看和创建自己的订单
- ✅ 用户可以更新待处理的订单
- ✅ 系统可以更新订单状态（webhook）
- ✅ 管理员可以管理所有订单

## 🛠️ 常用操作

### 创建管理员用户

```sql
-- 将现有用户提升为管理员
UPDATE "user"
SET user_type = 'admin'
WHERE email = 'your-email@example.com';
```

### 手动分配会员

```sql
-- 为用户分配月度会员
INSERT INTO user_membership (
    user_id,
    membership_plan_id,
    start_date,
    end_date,
    is_active
) VALUES (
    1,  -- 用户ID
    2,  -- 月度会员计划ID
    NOW(),
    NOW() + INTERVAL '30 days',
    true
);
```

### 查看用户使用情况

```sql
-- 查看用户今日使用统计
SELECT
    u.username,
    u.email,
    um.daily_message_count,
    um.daily_token_count,
    mp.daily_message_limit,
    mp.daily_token_limit
FROM "user" u
JOIN user_membership um ON u.id = um.user_id
JOIN membership_plan mp ON um.membership_plan_id = mp.id
WHERE um.is_active = true
AND um.is_deleted = false;
```

### 重置每日使用统计

```sql
-- 系统会自动重置，也可以手动触发
UPDATE user_membership
SET
    daily_message_count = 0,
    daily_token_count = 0,
    daily_chat_count = 0,
    last_reset_date = NOW()
WHERE is_active = true;
```

## 🐛 故障排除

### 问题：表显示 "unrestricted"

**原因**：RLS 未启用或策略配置不正确

**解决**：

```bash
# 重新应用 RLS 迁移
supabase db push
```

### 问题：无法访问自己的数据

**原因**：RLS 策略与 Auth UID 不匹配

**检查**：

```sql
-- 验证 Auth UID 和 user.id 是否一致
SELECT auth.uid(), id FROM "user" WHERE id::text = auth.uid()::text;
```

### 问题：Auth 用户未自动同步

**原因**：Auth 触发器未创建

**解决**：在 Supabase Dashboard SQL Editor 中执行 Auth 触发器 SQL（见上文）

### 问题：迁移冲突

**原因**：本地和远程迁移不一致

**解决**：

```bash
# 查看差异
supabase db diff

# 重置本地数据库
supabase db reset

# 或从远程拉取
supabase db pull
```

## 📚 相关文档

- [Supabase 数据库文档](https://supabase.com/docs/guides/database)
- [PostgreSQL RLS 文档](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Auth 文档](https://supabase.com/docs/guides/auth)
- [项目 API 文档](../../api/README.md)

## 📝 维护说明

### 创建新迁移

```bash
# 创建新的迁移文件
supabase migration new your_migration_name

# 编辑生成的文件
# supabase/migrations/YYYYMMDDHHMMSS_your_migration_name.sql
```

### 回滚迁移

```bash
# 回滚到指定版本
supabase db reset --version YYYYMMDDHHMMSS

# 或手动执行回滚 SQL
```

### 迁移最佳实践

1. ✅ 每个迁移文件只做一件事
2. ✅ 使用有意义的迁移文件名
3. ✅ 添加详细的注释说明
4. ✅ 在本地测试后再推送到生产环境
5. ✅ 保留旧迁移文件，不要修改已应用的迁移
6. ✅ 使用事务保证原子性（PostgreSQL 默认支持）

## 🎯 下一步

1. ✅ 应用所有迁移文件
2. ✅ 在 Supabase Dashboard 创建 Auth 触发器
3. ✅ 验证 RLS 策略是否生效
4. ✅ 创建第一个管理员账户
5. ✅ 测试用户注册和登录流程
6. ✅ 集成前端和后端代码

---

**需要帮助？** 查看项目根目录的 README.md 或提交 Issue。
