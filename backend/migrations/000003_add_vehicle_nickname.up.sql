-- Migration 000003: Add nickname column to vehicles table
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS nickname VARCHAR(100) NULL;
