-- ⚠️ 重要：此文件需要在 Supabase Dashboard 的 SQL Editor 中手动执行
--
-- 原因：auth.users 表位于 auth schema 中，无法通过常规迁移直接访问
--
-- 执行步骤：
-- 1. 登录 https://app.supabase.com/
-- 2. 选择你的项目
-- 3. 进入左侧菜单 "SQL Editor"
-- 4. 点击 "New query"
-- 5. 复制下面的 SQL 代码并执行
-- 6. 验证触发器是否创建成功

-- =====================================================
-- Auth 触发器 - 在 Supabase Dashboard 中执行
-- =====================================================

-- 触发器 1: 新用户注册时自动同步到 user 表
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_auth_user();

-- 触发器 2: 用户信息更新时自动同步
CREATE OR REPLACE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_auth_user_updated();

-- =====================================================
-- 验证触发器是否创建成功
-- =====================================================

-- 查看 auth.users 表的触发器
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
AND event_object_table = 'users';

-- 预期结果应该显示：
-- trigger_name              | event_manipulation | event_object_table | action_statement
-- --------------------------|--------------------|-------------------|------------------
-- on_auth_user_created      | INSERT             | users             | EXECUTE FUNCTION public.handle_new_auth_user()
-- on_auth_user_updated      | UPDATE             | users             | EXECUTE FUNCTION public.handle_auth_user_updated()

-- =====================================================
-- 测试触发器（可选）
-- =====================================================

-- 注意：正常情况下通过 Supabase Auth API 注册用户会自动触发
-- 如果需要手动测试，可以创建一个测试用户（需要管理员权限）

-- 查看现有用户
SELECT id, email, created_at FROM auth.users LIMIT 5;

-- 查看同步的用户
SELECT id, username, email, created_at FROM public."user" LIMIT 5;

-- =====================================================
-- 完成提示
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Auth 触发器创建成功！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '新用户注册时将自动：';
    RAISE NOTICE '  1. 在 public.user 表中创建对应记录';
    RAISE NOTICE '  2. 自动生成用户名';
    RAISE NOTICE '  3. 触发免费会员分配';
    RAISE NOTICE '========================================';
    RAISE NOTICE '用户信息更新时将自动：';
    RAISE NOTICE '  1. 同步邮箱地址';
    RAISE NOTICE '  2. 更新最后登录时间';
    RAISE NOTICE '========================================';
END $$;
