-- Build AI Template - 初始数据库迁移
-- 创建时间: 2025-01-09
-- 描述: 创建所有核心业务表，包括用户、AI助手、对话、消息、会员和订单管理

-- =====================================================
-- 1. 创建自定义类型 (Enums)
-- =====================================================

-- 用户类型枚举
CREATE TYPE user_type AS ENUM ('user', 'admin');

-- AI助手来源类型枚举
CREATE TYPE agent_source AS ENUM ('llm', 'dify', 'fastgpt', 'coze', 'custom');

-- 消息角色枚举
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');

-- 会员类型枚举
CREATE TYPE membership_type AS ENUM ('free', 'monthly', 'yearly');

-- 订单状态枚举
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'completed', 'cancelled', 'refunded', 'failed');

-- 支付方式枚举
CREATE TYPE payment_method AS ENUM ('stripe');

COMMENT ON TYPE user_type IS '用户类型：user=普通用户, admin=管理员';
COMMENT ON TYPE agent_source IS 'AI助手来源类型：llm=原生LLM, dify=Dify平台, fastgpt=FastGPT, coze=Coze, custom=自定义';
COMMENT ON TYPE message_role IS '消息角色：user=用户, assistant=AI助手, system=系统';
COMMENT ON TYPE membership_type IS '会员类型：free=免费, monthly=月费, yearly=年费';
COMMENT ON TYPE order_status IS '订单状态：pending=待支付, processing=处理中, completed=已完成, cancelled=已取消, refunded=已退款, failed=失败';
COMMENT ON TYPE payment_method IS '支付方式：stripe=Stripe支付';

-- =====================================================
-- 2. 用户表 (user)
-- =====================================================

CREATE TABLE "user" (
    -- 主键
    id SERIAL PRIMARY KEY,

    -- 基础信息
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    user_type user_type NOT NULL DEFAULT 'user',

    -- 时间戳
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    updated_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),

    -- 软删除
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP
);

-- 索引
CREATE INDEX idx_user_username ON "user" (username);
CREATE INDEX idx_user_email ON "user" (email);
CREATE INDEX idx_user_is_deleted ON "user" (is_deleted);

-- 注释
COMMENT ON TABLE "user" IS '用户表 - 存储用户账户信息，支持邮箱登录和权限管理';
COMMENT ON COLUMN "user".id IS '用户唯一标识符';
COMMENT ON COLUMN "user".username IS '用户名，唯一标识符';
COMMENT ON COLUMN "user".email IS '用户邮箱地址，用于登录和通知';
COMMENT ON COLUMN "user".password_hash IS '用户密码的哈希值';
COMMENT ON COLUMN "user".user_type IS '用户类型，区分普通用户和管理员';
COMMENT ON COLUMN "user".last_login_at IS '最后登录时间';
COMMENT ON COLUMN "user".created_at IS '账户创建时间';
COMMENT ON COLUMN "user".updated_at IS '最后更新时间';
COMMENT ON COLUMN "user".is_deleted IS '软删除标记，TRUE表示已删除';
COMMENT ON COLUMN "user".deleted_at IS '软删除时间戳';

-- =====================================================
-- 3. AI助手表 (agent)
-- =====================================================

CREATE TABLE agent (
    -- 主键
    id SERIAL PRIMARY KEY,

    -- 基础信息
    name VARCHAR(255) NOT NULL,
    source agent_source NOT NULL DEFAULT 'llm',
    api_url TEXT NOT NULL,
    api_key TEXT NOT NULL,
    model_conf JSONB,
    is_think BOOLEAN NOT NULL DEFAULT FALSE,
    is_stream BOOLEAN NOT NULL DEFAULT TRUE,

    -- 时间戳与软删除
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    updated_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    deleted_at TIMESTAMP
);

-- 索引
CREATE INDEX idx_agent_name ON agent (name);
CREATE INDEX idx_agent_source ON agent (source);
CREATE INDEX idx_agent_is_deleted ON agent (is_deleted);

-- 注释
COMMENT ON TABLE agent IS 'AI助手表 - 存储AI助手配置信息，支持多种AI平台集成';
COMMENT ON COLUMN agent.id IS 'AI助手唯一标识符';
COMMENT ON COLUMN agent.name IS 'AI助手名称';
COMMENT ON COLUMN agent.source IS 'AI助手来源类型';
COMMENT ON COLUMN agent.api_url IS 'API接口地址';
COMMENT ON COLUMN agent.api_key IS 'API密钥';
COMMENT ON COLUMN agent.model_conf IS '模型配置参数JSON';
COMMENT ON COLUMN agent.is_think IS '是否显示思考过程';
COMMENT ON COLUMN agent.is_stream IS '是否使用流式响应';
COMMENT ON COLUMN agent.is_deleted IS '软删除标记';
COMMENT ON COLUMN agent.created_at IS '创建时间';
COMMENT ON COLUMN agent.updated_at IS '更新时间';
COMMENT ON COLUMN agent.deleted_at IS '软删除时间戳';

-- =====================================================
-- 4. 对话表 (chat)
-- =====================================================

CREATE TABLE chat (
    -- 主键
    id SERIAL PRIMARY KEY,

    -- 基础信息
    user_id INTEGER NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    agent_id INTEGER NOT NULL,
    others JSONB DEFAULT '{}'::jsonb,

    -- 时间戳与软删除
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    updated_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);

-- 索引
CREATE INDEX idx_chat_user_id ON chat (user_id);
CREATE INDEX idx_chat_agent_id ON chat (agent_id);
CREATE INDEX idx_chat_is_deleted ON chat (is_deleted);
CREATE INDEX idx_chat_created_at ON chat (created_at DESC);

-- 注释
COMMENT ON TABLE chat IS '对话表 - 存储用户与AI助手的对话会话';
COMMENT ON COLUMN chat.id IS '对话唯一标识符';
COMMENT ON COLUMN chat.user_id IS '用户ID，关联到user表';
COMMENT ON COLUMN chat.title IS '对话标题';
COMMENT ON COLUMN chat.content IS '对话内容摘要';
COMMENT ON COLUMN chat.agent_id IS '关联的AI助手ID';
COMMENT ON COLUMN chat.others IS '其他信息JSON字段';
COMMENT ON COLUMN chat.is_deleted IS '软删除标记';
COMMENT ON COLUMN chat.deleted_at IS '软删除时间戳';
COMMENT ON COLUMN chat.created_at IS '创建时间';
COMMENT ON COLUMN chat.updated_at IS '更新时间';

-- =====================================================
-- 5. 消息表 (message)
-- =====================================================

CREATE TABLE message (
    -- 主键
    id SERIAL PRIMARY KEY,

    -- 基础信息
    chat_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    model_conf JSONB DEFAULT '{}'::jsonb,
    role message_role NOT NULL,
    token_usage JSONB,

    -- 时间戳与软删除
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    updated_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);

-- 索引
CREATE INDEX idx_message_chat_id ON message (chat_id);
CREATE INDEX idx_message_role ON message (role);
CREATE INDEX idx_message_is_deleted ON message (is_deleted);
CREATE INDEX idx_message_created_at ON message (created_at DESC);

-- 注释
COMMENT ON TABLE message IS '消息表 - 存储对话中的所有消息内容';
COMMENT ON COLUMN message.id IS '消息唯一标识符';
COMMENT ON COLUMN message.chat_id IS '关联的对话ID';
COMMENT ON COLUMN message.content IS '消息内容';
COMMENT ON COLUMN message.model_conf IS '模型配置参数JSON';
COMMENT ON COLUMN message.role IS '消息角色：user/assistant/system';
COMMENT ON COLUMN message.token_usage IS 'Token使用统计信息（仅对assistant消息有效）';
COMMENT ON COLUMN message.is_deleted IS '软删除标记';
COMMENT ON COLUMN message.deleted_at IS '软删除时间戳';
COMMENT ON COLUMN message.created_at IS '创建时间';
COMMENT ON COLUMN message.updated_at IS '更新时间';

-- =====================================================
-- 6. 会员计划表 (membership_plan)
-- =====================================================

CREATE TABLE membership_plan (
    -- 主键
    id SERIAL PRIMARY KEY,

    -- 基础信息
    name VARCHAR(50) NOT NULL,
    type membership_type NOT NULL,

    -- 使用限制
    daily_message_limit INTEGER NOT NULL,
    daily_token_limit INTEGER NOT NULL,
    conversation_turn_limit INTEGER NOT NULL,

    -- 价格信息
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.0,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    duration_days INTEGER NOT NULL,

    -- 其他配置
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    description TEXT,

    -- 时间戳与软删除
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    updated_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    deleted_at TIMESTAMP
);

-- 索引
CREATE INDEX idx_membership_plan_type ON membership_plan (type);
CREATE INDEX idx_membership_plan_is_active ON membership_plan (is_active);
CREATE INDEX idx_membership_plan_is_deleted ON membership_plan (is_deleted);

-- 注释
COMMENT ON TABLE membership_plan IS '会员计划表 - 定义不同会员等级的权限和价格';
COMMENT ON COLUMN membership_plan.id IS '会员计划唯一标识符';
COMMENT ON COLUMN membership_plan.name IS '计划名称';
COMMENT ON COLUMN membership_plan.type IS '会员类型';
COMMENT ON COLUMN membership_plan.daily_message_limit IS '每日消息限制';
COMMENT ON COLUMN membership_plan.daily_token_limit IS '每日Token限制';
COMMENT ON COLUMN membership_plan.conversation_turn_limit IS '单个对话轮次限制';
COMMENT ON COLUMN membership_plan.price IS '价格（元）';
COMMENT ON COLUMN membership_plan.currency IS '货币类型';
COMMENT ON COLUMN membership_plan.duration_days IS '有效期天数';
COMMENT ON COLUMN membership_plan.is_active IS '是否激活';
COMMENT ON COLUMN membership_plan.description IS '计划描述';
COMMENT ON COLUMN membership_plan.is_deleted IS '软删除标记';
COMMENT ON COLUMN membership_plan.created_at IS '创建时间';
COMMENT ON COLUMN membership_plan.updated_at IS '更新时间';
COMMENT ON COLUMN membership_plan.deleted_at IS '软删除时间戳';

-- =====================================================
-- 7. 用户会员关系表 (user_membership)
-- =====================================================

CREATE TABLE user_membership (
    -- 主键
    id SERIAL PRIMARY KEY,

    -- 基础信息
    user_id INTEGER NOT NULL,
    membership_plan_id INTEGER NOT NULL,

    -- 会员状态
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- 每日使用统计
    daily_message_count INTEGER NOT NULL DEFAULT 0,
    daily_token_count INTEGER NOT NULL DEFAULT 0,
    daily_chat_count INTEGER NOT NULL DEFAULT 0,

    -- 总使用统计
    total_message_count INTEGER NOT NULL DEFAULT 0,
    total_token_count INTEGER NOT NULL DEFAULT 0,
    total_chat_count INTEGER NOT NULL DEFAULT 0,

    -- 时间戳与软删除
    last_reset_date TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    updated_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    deleted_at TIMESTAMP
);

-- 索引
CREATE INDEX idx_user_membership_user_id ON user_membership (user_id);
CREATE INDEX idx_user_membership_plan_id ON user_membership (membership_plan_id);
CREATE INDEX idx_user_membership_is_active ON user_membership (is_active);
CREATE INDEX idx_user_membership_is_deleted ON user_membership (is_deleted);
CREATE INDEX idx_user_membership_end_date ON user_membership (end_date);

-- 注释
COMMENT ON TABLE user_membership IS '用户会员关系表 - 记录用户的会员订阅和使用情况';
COMMENT ON COLUMN user_membership.id IS '关系记录唯一标识符';
COMMENT ON COLUMN user_membership.user_id IS '用户ID';
COMMENT ON COLUMN user_membership.membership_plan_id IS '会员计划ID';
COMMENT ON COLUMN user_membership.start_date IS '会员开始时间';
COMMENT ON COLUMN user_membership.end_date IS '会员结束时间';
COMMENT ON COLUMN user_membership.is_active IS '是否激活';
COMMENT ON COLUMN user_membership.daily_message_count IS '今日已使用消息数';
COMMENT ON COLUMN user_membership.daily_token_count IS '今日已使用Token数';
COMMENT ON COLUMN user_membership.daily_chat_count IS '今日对话次数';
COMMENT ON COLUMN user_membership.total_message_count IS '历史总消息数';
COMMENT ON COLUMN user_membership.total_token_count IS '历史总Token数';
COMMENT ON COLUMN user_membership.total_chat_count IS '历史总对话次数';
COMMENT ON COLUMN user_membership.last_reset_date IS '上次使用的重置日期';
COMMENT ON COLUMN user_membership.is_deleted IS '软删除标记';
COMMENT ON COLUMN user_membership.created_at IS '创建时间';
COMMENT ON COLUMN user_membership.updated_at IS '更新时间';
COMMENT ON COLUMN user_membership.deleted_at IS '软删除时间戳';

-- =====================================================
-- 8. 订单表 (order)
-- =====================================================

CREATE TABLE "order" (
    -- 主键
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(255) NOT NULL UNIQUE,

    -- 关联字段
    user_id INTEGER NOT NULL,
    membership_plan_id INTEGER NOT NULL,

    -- 订单基本信息
    status order_status NOT NULL DEFAULT 'pending',
    payment_method payment_method NOT NULL DEFAULT 'stripe',

    -- 价格信息
    original_price DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.0,
    final_price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'CNY',

    -- Stripe 相关字段
    stripe_payment_intent_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    stripe_session_id VARCHAR(255),

    -- 支付信息
    paid_at TIMESTAMP,
    payment_confirmed_at TIMESTAMP,

    -- 订单处理信息
    processed_at TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,

    -- 退款信息
    refund_amount DECIMAL(10, 2),
    refunded_at TIMESTAMP,
    refund_reason TEXT,

    -- 备注信息
    notes TEXT,
    failure_reason TEXT,

    -- 时间戳与软删除
    created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    updated_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP
);

-- 索引
CREATE UNIQUE INDEX idx_order_number ON "order" (order_number);
CREATE INDEX idx_order_user_id ON "order" (user_id);
CREATE INDEX idx_order_membership_plan_id ON "order" (membership_plan_id);
CREATE INDEX idx_order_status ON "order" (status);
CREATE INDEX idx_order_is_deleted ON "order" (is_deleted);
CREATE INDEX idx_order_created_at ON "order" (created_at DESC);
CREATE INDEX idx_order_stripe_payment_intent_id ON "order" (stripe_payment_intent_id);
CREATE INDEX idx_order_stripe_session_id ON "order" (stripe_session_id);

-- 注释
COMMENT ON TABLE "order" IS '订单表 - 记录用户购买会员计划的订单信息';
COMMENT ON COLUMN "order".id IS '订单唯一标识符';
COMMENT ON COLUMN "order".order_number IS '订单号，全局唯一';
COMMENT ON COLUMN "order".user_id IS '用户ID';
COMMENT ON COLUMN "order".membership_plan_id IS '会员计划ID';
COMMENT ON COLUMN "order".status IS '订单状态';
COMMENT ON COLUMN "order".payment_method IS '支付方式';
COMMENT ON COLUMN "order".original_price IS '原价（元）';
COMMENT ON COLUMN "order".discount_amount IS '折扣金额（元）';
COMMENT ON COLUMN "order".final_price IS '最终价格（元）';
COMMENT ON COLUMN "order".currency IS '货币类型';
COMMENT ON COLUMN "order".stripe_payment_intent_id IS 'Stripe PaymentIntent ID';
COMMENT ON COLUMN "order".stripe_customer_id IS 'Stripe Customer ID';
COMMENT ON COLUMN "order".stripe_session_id IS 'Stripe Checkout Session ID';
COMMENT ON COLUMN "order".paid_at IS '支付时间';
COMMENT ON COLUMN "order".payment_confirmed_at IS '支付确认时间';
COMMENT ON COLUMN "order".processed_at IS '订单处理时间';
COMMENT ON COLUMN "order".completed_at IS '订单完成时间';
COMMENT ON COLUMN "order".cancelled_at IS '订单取消时间';
COMMENT ON COLUMN "order".refund_amount IS '退款金额（元）';
COMMENT ON COLUMN "order".refunded_at IS '退款时间';
COMMENT ON COLUMN "order".refund_reason IS '退款原因';
COMMENT ON COLUMN "order".notes IS '订单备注';
COMMENT ON COLUMN "order".failure_reason IS '失败原因';
COMMENT ON COLUMN "order".created_at IS '创建时间';
COMMENT ON COLUMN "order".updated_at IS '更新时间';
COMMENT ON COLUMN "order".is_deleted IS '软删除标记';
COMMENT ON COLUMN "order".deleted_at IS '软删除时间戳';

-- =====================================================
-- 9. 创建触发器函数 - 自动更新 updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW() AT TIME ZONE 'utc';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS '自动更新表的 updated_at 字段为当前UTC时间';

-- =====================================================
-- 10. 为所有表添加 updated_at 触发器
-- =====================================================

CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "user"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_updated_at BEFORE UPDATE ON agent
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_updated_at BEFORE UPDATE ON chat
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_updated_at BEFORE UPDATE ON message
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_membership_plan_updated_at BEFORE UPDATE ON membership_plan
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_membership_updated_at BEFORE UPDATE ON user_membership
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_updated_at BEFORE UPDATE ON "order"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 11. 插入默认数据
-- =====================================================

-- 插入默认会员计划
INSERT INTO membership_plan (name, type, daily_message_limit, daily_token_limit, conversation_turn_limit, price, currency, duration_days, description, is_active) VALUES
    ('免费版', 'free', 10, 10000, 20, 0.00, 'USD', 365, '免费用户，每日10条消息，10000 tokens', true),
    ('月度会员', 'monthly', 1000, 1000000, 1000, 9.99, 'USD', 30, '月度会员，每日1000条消息，1000000 tokens', true),
    ('年度会员', 'yearly', 1000, 1000000, 1000, 99.99, 'USD', 365, '年度会员，每日1000条消息，1000000 tokens', true);

COMMENT ON TABLE membership_plan IS '会员计划表已插入默认数据：免费版、月度会员、年度会员';

-- =====================================================
-- 12. 创建视图（可选）- 便于查询活跃用户会员信息
-- =====================================================

CREATE OR REPLACE VIEW active_user_memberships AS
SELECT
    um.id,
    um.user_id,
    u.username,
    u.email,
    mp.name AS plan_name,
    mp.type AS plan_type,
    um.start_date,
    um.end_date,
    um.daily_message_count,
    um.daily_token_count,
    um.daily_chat_count,
    um.total_message_count,
    um.total_token_count,
    um.total_chat_count,
    mp.daily_message_limit,
    mp.daily_token_limit,
    mp.conversation_turn_limit
FROM user_membership um
JOIN "user" u ON um.user_id = u.id
JOIN membership_plan mp ON um.membership_plan_id = mp.id
WHERE um.is_active = TRUE
  AND um.is_deleted = FALSE
  AND u.is_deleted = FALSE
  AND um.end_date > NOW() AT TIME ZONE 'utc';

COMMENT ON VIEW active_user_memberships IS '活跃用户会员视图 - 显示所有未过期的会员信息';

-- =====================================================
-- 完成迁移
-- =====================================================

-- 输出迁移完成信息
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Build AI Template 数据库迁移完成！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '已创建以下表:';
    RAISE NOTICE '  1. user - 用户表';
    RAISE NOTICE '  2. agent - AI助手表';
    RAISE NOTICE '  3. chat - 对话表';
    RAISE NOTICE '  4. message - 消息表';
    RAISE NOTICE '  5. membership_plan - 会员计划表';
    RAISE NOTICE '  6. user_membership - 用户会员关系表';
    RAISE NOTICE '  7. order - 订单表';
    RAISE NOTICE '========================================';
    RAISE NOTICE '已创建触发器: 自动更新 updated_at 字段';
    RAISE NOTICE '已插入默认数据: 3个会员计划';
    RAISE NOTICE '已创建视图: active_user_memberships';
    RAISE NOTICE '========================================';
END $$;
