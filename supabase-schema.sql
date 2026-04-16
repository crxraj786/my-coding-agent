-- LR Licence Verification System - Database Schema
-- Run this SQL in your Supabase SQL Editor
-- https://supabase.com/dashboard/project/qunfqnmvvtspuoaopkvn/sql

-- 1. Create admins table
CREATE TABLE IF NOT EXISTS admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    display_name TEXT,
    balance INTEGER DEFAULT 1000,
    initial_balance INTEGER DEFAULT 1000,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create licence_keys table
CREATE TABLE IF NOT EXISTS licence_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    created_by TEXT NOT NULL,
    validity_days INTEGER DEFAULT 0,
    validity_hours INTEGER DEFAULT 0,
    devices_limit INTEGER DEFAULT 1,
    used_devices JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'expired', 'deleted')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expiry_at TIMESTAMPTZ
);

-- 3. Create balance_logs table
CREATE TABLE IF NOT EXISTS balance_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admins_admin_id ON admins(admin_id);
CREATE INDEX IF NOT EXISTS idx_admins_status ON admins(status);
CREATE INDEX IF NOT EXISTS idx_licence_keys_key ON licence_keys(key);
CREATE INDEX IF NOT EXISTS idx_licence_keys_created_by ON licence_keys(created_by);
CREATE INDEX IF NOT EXISTS idx_licence_keys_status ON licence_keys(status);
CREATE INDEX IF NOT EXISTS idx_balance_logs_admin_id ON balance_logs(admin_id);

-- 5. Enable RLS (Row Level Security)
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE licence_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_logs ENABLE ROW LEVEL SECURITY;

-- 6. Create policies (allow all access via service_role)
DO $$ BEGIN
  DROP POLICY IF EXISTS "service_role_all_admins" ON admins;
  DROP POLICY IF EXISTS "service_role_all_licence_keys" ON licence_keys;
  DROP POLICY IF EXISTS "service_role_all_balance_logs" ON balance_logs;
  DROP POLICY IF EXISTS "anon_read_licence_keys" ON licence_keys;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "service_role_all_admins" ON admins
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_role_all_licence_keys" ON licence_keys
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_role_all_balance_logs" ON balance_logs
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "anon_read_licence_keys" ON licence_keys
  FOR SELECT USING (true);
