-- Migration 000007: Add parent_id column to thread_comments table for nested comment replies
ALTER TABLE thread_comments ADD COLUMN IF NOT EXISTS parent_id UUID NULL REFERENCES thread_comments(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_thread_comments_parent_id ON thread_comments(parent_id);
