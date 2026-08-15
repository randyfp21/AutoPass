-- Migration 000004: Add receipt_photo_url column to service_records table
ALTER TABLE service_records ADD COLUMN IF NOT EXISTS receipt_photo_url TEXT NULL;
