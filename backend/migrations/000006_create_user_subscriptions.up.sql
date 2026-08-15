-- Migration 000006: Create user_subscriptions table for profile subscribe feature
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscriber_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_subscriber_target UNIQUE (subscriber_id, target_user_id)
);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_subscriber ON user_subscriptions(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_target ON user_subscriptions(target_user_id);
