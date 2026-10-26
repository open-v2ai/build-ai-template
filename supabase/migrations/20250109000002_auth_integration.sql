-- Build AI Template - Supabase Auth 集成
-- 创建时间: 2025-01-09
-- 描述: 集成 Supabase Auth 系统，支持用户认证和自动同步

-- =====================================================
-- 1. 创建触发器 - 同步 Supabase Auth 用户到自定义 user 表
-- =====================================================

CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    v_username TEXT;
BEGIN
    -- 从 email 生成默认用户名（取 @ 前面的部分）
    v_username := split_part(NEW.email, '@', 1);

    -- 如果用户名已存在，添加随机后缀
    IF EXISTS (SELECT 1 FROM "user" WHERE username = v_username) THEN
        v_username := v_username || '_' || substring(NEW.id::text, 1, 8);
    END IF;

    -- 插入到自定义 user 表
    INSERT INTO "user" (
        id,
        username,
        email,
        password_hash,
        user_type,
        created_at,
        updated_at,
        is_deleted
    ) VALUES (
        (NEW.id::text)::integer,  -- 使用 Auth.uid 作为 user.id
        v_username,
        NEW.email,
        NULL,  -- 密码由 Supabase Auth 管理
        'user',
        NOW() AT TIME ZONE 'utc',
        NOW() AT TIME ZONE 'utc',
        false
    )
    ON CONFLICT (id) DO NOTHING;  -- 如果已存在则跳过

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 注意：需要在 Supabase Dashboard 中手动创建此触发器
-- 因为 auth.users 表在不同的 schema 中
-- 在 Supabase Dashboard 的 SQL Editor 中执行：
/*
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_auth_user();
*/

COMMENT ON FUNCTION handle_new_auth_user() IS 'Supabase Auth 用户创建时自动同步到 user 表';

-- =====================================================
-- 2. 创建触发器 - 同步用户邮箱更新
-- =====================================================

CREATE OR REPLACE FUNCTION handle_auth_user_updated()
RETURNS TRIGGER AS $$
BEGIN
    -- 更新 user 表中的邮箱
    UPDATE "user"
    SET
        email = NEW.email,
        updated_at = NOW() AT TIME ZONE 'utc',
        last_login_at = CASE
            WHEN NEW.last_sign_in_at IS NOT NULL AND NEW.last_sign_in_at > OLD.last_sign_in_at
            THEN NEW.last_sign_in_at
            ELSE last_login_at
        END
    WHERE id::text = NEW.id::text;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 注意：同样需要在 Supabase Dashboard 中创建触发器
/*
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_auth_user_updated();
*/

COMMENT ON FUNCTION handle_auth_user_updated() IS 'Supabase Auth 用户更新时同步到 user 表';

-- =====================================================
-- 3. 创建辅助函数 - 通过 Auth UID 获取用户信息
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_by_auth_uid()
RETURNS TABLE (
    id INTEGER,
    username VARCHAR(255),
    email VARCHAR(255),
    user_type user_type,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        u.username,
        u.email,
        u.user_type,
        u.last_login_at,
        u.created_at
    FROM "user" u
    WHERE u.id::text = auth.uid()::text
    AND u.is_deleted = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_by_auth_uid() IS '通过当前 Auth UID 获取用户信息';

-- =====================================================
-- 4. 创建视图 - 用户完整信息（包含会员状态）
-- =====================================================

CREATE OR REPLACE VIEW user_profile AS
SELECT
    u.id,
    u.username,
    u.email,
    u.user_type,
    u.last_login_at,
    u.created_at,
    -- 会员信息
    mp.name AS membership_name,
    mp.type AS membership_type,
    um.end_date AS membership_end_date,
    um.is_active AS membership_active,
    -- 使用统计
    um.daily_message_count,
    um.daily_token_count,
    mp.daily_message_limit,
    mp.daily_token_limit,
    -- 剩余额度
    (mp.daily_message_limit - um.daily_message_count) AS remaining_messages,
    (mp.daily_token_limit - um.daily_token_count) AS remaining_tokens
FROM "user" u
LEFT JOIN user_membership um ON u.id = um.user_id
    AND um.is_active = true
    AND um.is_deleted = false
    AND um.end_date > NOW() AT TIME ZONE 'utc'
LEFT JOIN membership_plan mp ON um.membership_plan_id = mp.id
WHERE u.is_deleted = false;

COMMENT ON VIEW user_profile IS '用户完整信息视图，包含会员状态和使用统计';

-- 为视图添加 RLS 策略
ALTER VIEW user_profile SET (security_invoker = on);

-- =====================================================
-- 5. 创建函数 - 用户登录记录
-- =====================================================

CREATE OR REPLACE FUNCTION record_user_login()
RETURNS VOID AS $$
BEGIN
    UPDATE "user"
    SET last_login_at = NOW() AT TIME ZONE 'utc'
    WHERE id::text = auth.uid()::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION record_user_login() IS '记录用户登录时间';

-- =====================================================
-- 6. 创建函数 - 检查用户权限
-- =====================================================

CREATE OR REPLACE FUNCTION has_permission(
    p_permission TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_type user_type;
BEGIN
    -- 获取当前用户类型
    SELECT user_type INTO v_user_type
    FROM "user"
    WHERE id::text = auth.uid()::text
    AND is_deleted = false;

    -- 如果用户不存在，返回 false
    IF v_user_type IS NULL THEN
        RETURN false;
    END IF;

    -- 管理员拥有所有权限
    IF v_user_type = 'admin' THEN
        RETURN true;
    END IF;

    -- 根据权限类型判断
    CASE p_permission
        WHEN 'admin' THEN
            RETURN v_user_type = 'admin';
        WHEN 'user' THEN
            RETURN v_user_type IN ('user', 'admin');
        ELSE
            RETURN false;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION has_permission(TEXT) IS '检查当前用户是否有指定权限';

-- =====================================================
-- 7. 创建函数 - 更新用户使用统计
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_usage(
    p_message_count INTEGER DEFAULT 0,
    p_token_count INTEGER DEFAULT 0,
    p_chat_count INTEGER DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
    v_user_id INTEGER;
    v_membership_id INTEGER;
    v_current_date DATE;
BEGIN
    -- 获取当前用户ID
    v_user_id := (auth.uid()::text)::integer;
    v_current_date := (NOW() AT TIME ZONE 'utc')::date;

    -- 获取活跃的会员ID
    SELECT id INTO v_membership_id
    FROM user_membership
    WHERE user_id = v_user_id
    AND is_active = true
    AND is_deleted = false
    AND end_date > NOW() AT TIME ZONE 'utc'
    ORDER BY end_date DESC
    LIMIT 1;

    IF v_membership_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'no_active_membership'
        );
    END IF;

    -- 检查是否需要重置每日统计
    UPDATE user_membership
    SET
        daily_message_count = CASE
            WHEN (last_reset_date::date) < v_current_date THEN 0
            ELSE daily_message_count
        END,
        daily_token_count = CASE
            WHEN (last_reset_date::date) < v_current_date THEN 0
            ELSE daily_token_count
        END,
        daily_chat_count = CASE
            WHEN (last_reset_date::date) < v_current_date THEN 0
            ELSE daily_chat_count
        END,
        last_reset_date = CASE
            WHEN (last_reset_date::date) < v_current_date
            THEN NOW() AT TIME ZONE 'utc'
            ELSE last_reset_date
        END
    WHERE id = v_membership_id
    AND (last_reset_date::date) < v_current_date;

    -- 更新使用统计
    UPDATE user_membership
    SET
        daily_message_count = daily_message_count + p_message_count,
        daily_token_count = daily_token_count + p_token_count,
        daily_chat_count = daily_chat_count + p_chat_count,
        total_message_count = total_message_count + p_message_count,
        total_token_count = total_token_count + p_token_count,
        total_chat_count = total_chat_count + p_chat_count,
        updated_at = NOW() AT TIME ZONE 'utc'
    WHERE id = v_membership_id;

    RETURN jsonb_build_object(
        'success', true,
        'membership_id', v_membership_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_user_usage(INTEGER, INTEGER, INTEGER) IS '更新用户使用统计（自动处理每日重置）';

-- =====================================================
-- 8. 创建函数 - 软删除用户账户
-- =====================================================

CREATE OR REPLACE FUNCTION soft_delete_user_account()
RETURNS VOID AS $$
DECLARE
    v_user_id INTEGER;
BEGIN
    v_user_id := (auth.uid()::text)::integer;

    -- 软删除用户
    UPDATE "user"
    SET
        is_deleted = true,
        deleted_at = NOW() AT TIME ZONE 'utc',
        updated_at = NOW() AT TIME ZONE 'utc'
    WHERE id = v_user_id;

    -- 软删除用户的所有对话
    UPDATE chat
    SET
        is_deleted = true,
        deleted_at = NOW() AT TIME ZONE 'utc'
    WHERE user_id = v_user_id;

    -- 软删除用户的所有会员关系
    UPDATE user_membership
    SET
        is_deleted = true,
        is_active = false,
        deleted_at = NOW() AT TIME ZONE 'utc'
    WHERE user_id = v_user_id;

    -- 软删除用户的所有订单
    UPDATE "order"
    SET
        is_deleted = true,
        deleted_at = NOW() AT TIME ZONE 'utc'
    WHERE user_id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION soft_delete_user_account() IS '软删除用户账户及其所有相关数据';

-- =====================================================
-- 9. 授予必要的权限
-- =====================================================

-- 允许认证用户调用这些函数
GRANT EXECUTE ON FUNCTION get_user_by_auth_uid() TO authenticated;
GRANT EXECUTE ON FUNCTION record_user_login() TO authenticated;
GRANT EXECUTE ON FUNCTION has_permission(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_usage(INTEGER, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION check_daily_limit(INTEGER, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION soft_delete_user_account() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION current_user_id() TO authenticated;

-- 允许认证用户查询视图
GRANT SELECT ON user_profile TO authenticated;

-- =====================================================
-- 10. 创建索引优化查询性能
-- =====================================================

-- 优化 Auth UID 查询
CREATE INDEX IF NOT EXISTS idx_user_id_text ON "user" ((id::text));
CREATE INDEX IF NOT EXISTS idx_user_membership_user_id_active ON user_membership (user_id, is_active, end_date) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_chat_user_id_created ON chat (user_id, created_at DESC) WHERE is_deleted = false;

-- =====================================================
-- 完成 Auth 集成
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Supabase Auth 集成完成！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '已创建功能:';
    RAISE NOTICE '  ✓ 用户自动同步函数';
    RAISE NOTICE '  ✓ 登录记录函数';
    RAISE NOTICE '  ✓ 权限检查函数';
    RAISE NOTICE '  ✓ 使用统计更新函数';
    RAISE NOTICE '  ✓ 每日限制检查函数';
    RAISE NOTICE '  ✓ 软删除账户函数';
    RAISE NOTICE '  ✓ 用户信息视图';
    RAISE NOTICE '========================================';
    RAISE NOTICE '⚠️  重要提醒:';
    RAISE NOTICE '请在 Supabase Dashboard 的 SQL Editor 中执行:';
    RAISE NOTICE '';
    RAISE NOTICE 'CREATE TRIGGER on_auth_user_created';
    RAISE NOTICE '    AFTER INSERT ON auth.users';
    RAISE NOTICE '    FOR EACH ROW';
    RAISE NOTICE '    EXECUTE FUNCTION handle_new_auth_user();';
    RAISE NOTICE '';
    RAISE NOTICE 'CREATE TRIGGER on_auth_user_updated';
    RAISE NOTICE '    AFTER UPDATE ON auth.users';
    RAISE NOTICE '    FOR EACH ROW';
    RAISE NOTICE '    EXECUTE FUNCTION handle_auth_user_updated();';
    RAISE NOTICE '========================================';
END $$;
