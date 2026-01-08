-- Add pharmacy_ids column to data_user table
ALTER TABLE data_user ADD COLUMN IF NOT EXISTS pharmacy_ids TEXT;

-- Migration: Copy existing pharmacy_id to pharmacy_ids for backward compatibility
UPDATE data_user SET pharmacy_ids = pharmacy_id::text WHERE pharmacy_id IS NOT NULL;
