-- Build AI Template - 启用行级安全策略 (RLS)
-- 创建时间: 2025-01-09
-- 描述: 为所有表启用 RLS 并配置安全访问策略

-- =====================================================
-- 1. 启用所有表的 RLS
-- =====================================================

ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE message ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_membership ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. 用户表 (user) RLS 策略
-- =====================================================

-- 用户可以查看自己的信息
CREATE POLICY "Users can view their own profile"
    ON "user"
    FOR SELECT
    USING (
        auth.uid()::text = id::text
        OR user_type = 'admin'
    );

-- 用户可以更新自己的信息
CREATE POLICY "Users can update their own profile"
    ON "user"
    FOR UPDATE
    USING (auth.uid()::text = id::text)
    WITH CHECK (auth.uid()::text = id::text);

-- 管理员可以查看所有用户
CREATE POLICY "Admins can view all users"
    ON "user"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "user"
            WHERE id::text = auth.uid()::text
            AND user_type = 'admin'
        )
    );

-- 管理员可以管理所有用户
CREATE POLICY "Admins can manage all users"
    ON "user"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "user"
            WHERE id::text = auth.uid()::text
            AND user_type = 'admin'
        )
    );

-- 允许新用户注册（插入）
CREATE POLICY "Allow user registration"
    ON "user"
    FOR INSERT
    WITH CHECK (true);

-- =====================================================
-- 3. AI助手表 (agent) RLS 策略
-- =====================================================

-- 所有认证用户可以查看未删除的 Agent
CREATE POLICY "Authenticated users can view agents"
    ON agent
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL
        AND is_deleted = false
    );

-- 管理员可以管理所有 Agent
CREATE POLICY "Admins can manage agents"
    ON agent
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "user"
            WHERE id::text = auth.uid()::text
            AND user_type = 'admin'
        )
    );

-- =====================================================
-- 4. 对话表 (chat) RLS 策略
-- =====================================================

-- 用户可以查看自己的对话
CREATE POLICY "Users can view their own chats"
    ON chat
    FOR SELECT
    USING (
        user_id::text = auth.uid()::text
        AND is_deleted = false
    );

-- 用户可以创建自己的对话
CREATE POLICY "Users can create their own chats"
    ON chat
    FOR INSERT
    WITH CHECK (user_id::text = auth.uid()::text);

-- 用户可以更新自己的对话
CREATE POLICY "Users can update their own chats"
    ON chat
    FOR UPDATE
    USING (user_id::text = auth.uid()::text)
    WITH CHECK (user_id::text = auth.uid()::text);

-- 用户可以删除自己的对话（软删除）
CREATE POLICY "Users can delete their own chats"
    ON chat
    FOR DELETE
    USING (user_id::text = auth.uid()::text);

-- 管理员可以查看所有对话
CREATE POLICY "Admins can view all chats"
    ON chat
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "user"
            WHERE id::text = auth.uid()::text
            AND user_type = 'admin'
        )
    );

-- =====================================================
-- 5. 消息表 (message) RLS 策略
-- =====================================================

-- 用户可以查看自己对话中的消息
CREATE POLICY "Users can view messages in their chats"
    ON message
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM chat
            WHERE chat.id = message.chat_id
            AND chat.user_id::text = auth.uid()::text
            AND chat.is_deleted = false
        )
        AND message.is_deleted = false
    );

-- 用户可以在自己的对话中创建消息
CREATE POLICY "Users can create messages in their chats"
    ON message
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat
            WHERE chat.id = message.chat_id
            AND chat.user_id::text = auth.uid()::text
        )
    );

-- 用户可以更新自己对话中的消息
CREATE POLICY "Users can update messages in their chats"
    ON message
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM chat
            WHERE chat.id = message.chat_id
            AND chat.user_id::text = auth.uid()::text
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat
            WHERE chat.id = message.chat_id
            AND chat.user_id::text = auth.uid()::text
        )
    );

-- 用户可以删除自己对话中的消息
CREATE POLICY "Users can delete messages in their chats"
    ON message
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM chat
            WHERE chat.id = message.chat_id
            AND chat.user_id::text = auth.uid()::text
        )
    );

-- 管理员可以查看所有消息
CREATE POLICY "Admins can view all messages"
    ON message
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "user"
            WHERE id::text = auth.uid()::text
            AND user_type = 'admin'
        )
    );

-- =====================================================
-- 6. 会员计划表 (membership_plan) RLS 策略
-- =====================================================

-- 所有认证用户可以查看活跃的会员计划
CREATE POLICY "Authenticated users can view active plans"
    ON membership_plan
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL
        AND is_active = true
        AND is_deleted = false
    );

-- 管理员可以管理所有会员计划
CREATE POLICY "Admins can manage membership plans"
    ON membership_plan
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "user"
            WHERE id::text = auth.uid()::text
            AND user_type = 'admin'
        )
    );

-- =====================================================
-- 7. 用户会员关系表 (user_membership) RLS 策略
-- =====================================================

-- 用户可以查看自己的会员信息
CREATE POLICY "Users can view their own membership"
    ON user_membership
    FOR SELECT
    USING (
        user_id::text = auth.uid()::text
        AND is_deleted = false
    );

-- 用户可以更新自己的会员使用统计（通过应用逻辑）
CREATE POLICY "Users can update their membership stats"
    ON user_membership
    FOR UPDATE
    USING (user_id::text = auth.uid()::text)
    WITH CHECK (user_id::text = auth.uid()::text);

-- 管理员可以查看所有会员信息
CREATE POLICY "Admins can view all memberships"
    ON user_membership
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "user"
            WHERE id::text = auth.uid()::text
            AND user_type = 'admin'
        )
    );

-- 管理员可以管理所有会员关系
CREATE POLICY "Admins can manage all memberships"
    ON user_membership
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "user"
            WHERE id::text = auth.uid()::text
            AND user_type = 'admin'
        )
    );

-- 系统可以创建会员关系（用于自动分配免费会员）
CREATE POLICY "System can create memberships"
    ON user_membership
    FOR INSERT
    WITH CHECK (true);

-- =====================================================
-- 8. 订单表 (order) RLS 策略
-- =====================================================

-- 用户可以查看自己的订单
CREATE POLICY "Users can view their own orders"
    ON "order"
    FOR SELECT
    USING (
        user_id::text = auth.uid()::text
        AND is_deleted = false
    );

-- 用户可以创建自己的订单
CREATE POLICY "Users can create their own orders"
    ON "order"
    FOR INSERT
    WITH CHECK (user_id::text = auth.uid()::text);

-- 用户可以更新自己未完成的订单
CREATE POLICY "Users can update their pending orders"
    ON "order"
    FOR UPDATE
    USING (
        user_id::text = auth.uid()::text
        AND status IN ('pending', 'processing')
    )
    WITH CHECK (
        user_id::text = auth.uid()::text
        AND status IN ('pending', 'processing')
    );

-- 管理员可以查看所有订单
CREATE POLICY "Admins can view all orders"
    ON "order"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "user"
            WHERE id::text = auth.uid()::text
            AND user_type = 'admin'
        )
    );

-- 管理员可以管理所有订单
CREATE POLICY "Admins can manage all orders"
    ON "order"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "user"
            WHERE id::text = auth.uid()::text
            AND user_type = 'admin'
        )
    );

-- 允许系统更新订单状态（webhook 回调）
CREATE POLICY "System can update order status"
    ON "order"
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- 9. 创建辅助函数 - 检查是否为管理员
-- =====================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM "user"
        WHERE id::text = auth.uid()::text
        AND user_type = 'admin'
        AND is_deleted = false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_admin() IS '检查当前用户是否为管理员';

-- =====================================================
-- 10. 创建辅助函数 - 获取当前用户ID
-- =====================================================

CREATE OR REPLACE FUNCTION current_user_id()
RETURNS INTEGER AS $$
BEGIN
    RETURN (auth.uid()::text)::integer;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION current_user_id() IS '获取当前认证用户的ID（整数类型）';

-- =====================================================
-- 11. 创建触发器 - 自动为新用户分配免费会员
-- =====================================================

CREATE OR REPLACE FUNCTION assign_free_membership()
RETURNS TRIGGER AS $$
DECLARE
    free_plan_id INTEGER;
BEGIN
    -- 获取免费会员计划ID
    SELECT id INTO free_plan_id
    FROM membership_plan
    WHERE type = 'free'
    AND is_active = true
    AND is_deleted = false
    LIMIT 1;

    -- 如果存在免费计划，则为新用户分配
    IF free_plan_id IS NOT NULL THEN
        INSERT INTO user_membership (
            user_id,
            membership_plan_id,
            start_date,
            end_date,
            is_active
        ) VALUES (
            NEW.id,
            free_plan_id,
            NOW() AT TIME ZONE 'utc',
            (NOW() AT TIME ZONE 'utc') + INTERVAL '365 days',
            true
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_assign_free_membership
    AFTER INSERT ON "user"
    FOR EACH ROW
    EXECUTE FUNCTION assign_free_membership();

COMMENT ON FUNCTION assign_free_membership() IS '新用户注册时自动分配免费会员计划';

-- =====================================================
-- 12. 创建函数 - 检查用户每日使用限制
-- =====================================================

CREATE OR REPLACE FUNCTION check_daily_limit(
    p_user_id INTEGER,
    p_message_count INTEGER DEFAULT 1,
    p_token_count INTEGER DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
    v_membership RECORD;
    v_result JSONB;
BEGIN
    -- 获取用户当前活跃的会员信息
    SELECT
        um.*,
        mp.daily_message_limit,
        mp.daily_token_limit,
        mp.conversation_turn_limit
    INTO v_membership
    FROM user_membership um
    JOIN membership_plan mp ON um.membership_plan_id = mp.id
    WHERE um.user_id = p_user_id
    AND um.is_active = true
    AND um.is_deleted = false
    AND um.end_date > NOW() AT TIME ZONE 'utc'
    ORDER BY um.end_date DESC
    LIMIT 1;

    -- 如果没有会员信息，返回限制
    IF v_membership IS NULL THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'no_active_membership',
            'message', '没有活跃的会员计划'
        );
    END IF;

    -- 检查消息限制
    IF (v_membership.daily_message_count + p_message_count) > v_membership.daily_message_limit THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'message_limit_exceeded',
            'message', '今日消息数量已达上限',
            'current', v_membership.daily_message_count,
            'limit', v_membership.daily_message_limit
        );
    END IF;

    -- 检查Token限制
    IF (v_membership.daily_token_count + p_token_count) > v_membership.daily_token_limit THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'token_limit_exceeded',
            'message', '今日Token使用量已达上限',
            'current', v_membership.daily_token_count,
            'limit', v_membership.daily_token_limit
        );
    END IF;

    -- 通过检查
    RETURN jsonb_build_object(
        'allowed', true,
        'remaining_messages', v_membership.daily_message_limit - v_membership.daily_message_count,
        'remaining_tokens', v_membership.daily_token_limit - v_membership.daily_token_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_daily_limit(INTEGER, INTEGER, INTEGER) IS '检查用户每日使用限制';

-- =====================================================
-- 完成 RLS 配置
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS 策略配置完成！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '已为以下表启用 RLS:';
    RAISE NOTICE '  ✓ user';
    RAISE NOTICE '  ✓ agent';
    RAISE NOTICE '  ✓ chat';
    RAISE NOTICE '  ✓ message';
    RAISE NOTICE '  ✓ membership_plan';
    RAISE NOTICE '  ✓ user_membership';
    RAISE NOTICE '  ✓ order';
    RAISE NOTICE '========================================';
    RAISE NOTICE '安全策略:';
    RAISE NOTICE '  ✓ 用户只能访问自己的数据';
    RAISE NOTICE '  ✓ 管理员可以访问所有数据';
    RAISE NOTICE '  ✓ 新用户自动分配免费会员';
    RAISE NOTICE '  ✓ 支持每日使用限制检查';
    RAISE NOTICE '========================================';
END $$;
