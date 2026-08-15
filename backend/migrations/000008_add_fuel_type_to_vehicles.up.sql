-- Migration 000008: Add fuel_type column to vehicles table
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(20) NOT NULL DEFAULT 'bensin';
