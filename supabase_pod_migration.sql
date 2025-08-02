-- Migration to add POD (Proof of Delivery) fields to orders table
-- Run this in your Supabase SQL Editor

ALTER TABLE orders 
ADD COLUMN pod_image TEXT,
ADD COLUMN delivery_notes TEXT;

-- Add comments to document the columns
COMMENT ON COLUMN orders.pod_image IS 'Proof of delivery image stored as data URL or file path';
COMMENT ON COLUMN orders.delivery_notes IS 'Additional delivery notes from delivery agent';