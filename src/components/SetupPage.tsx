'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Copy, Check, RefreshCw, ExternalLink, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { copyToClipboard } from '@/lib/utils-date';
import { useToast } from '@/hooks/use-toast';
import { checkSetup } from '@/lib/api';

const SETUP_SQL = `-- LR Licence Verification System - Database Schema
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
  FOR SELECT USING (true);`;

interface SetupPageProps {
  onSetupComplete: () => void;
}

export default function SetupPage({ onSetupComplete }: SetupPageProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(SETUP_SQL);
    if (ok) {
      setCopied(true);
      toast({ title: 'Copied!', description: 'SQL schema copied to clipboard.' });
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleCheckSetup = async () => {
    setChecking(true);
    try {
      const data = await checkSetup();
      if (data.setup) {
        toast({ title: 'Setup Complete!', description: 'Database tables are ready.' });
        onSetupComplete();
      } else {
        toast({ title: 'Not Ready', description: 'Database tables still need to be created.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Could not verify setup. Please try again.', variant: 'destructive' });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #09D1C7, transparent)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #46DFB1, transparent)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-2xl relative z-10"
      >
        <div className="glass-card rounded-2xl p-6 sm:p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
              style={{ background: 'linear-gradient(135deg, rgba(255,217,61,0.2), rgba(255,107,107,0.1))' }}>
              <AlertTriangle className="w-7 h-7 text-[#ffd93d]" />
            </div>
            <h1 className="text-xl font-bold text-white">Database Setup Required</h1>
            <p className="text-sm text-white/50 mt-2 max-w-md mx-auto">
              The required database tables have not been created yet. Please run the following SQL in your Supabase SQL Editor.
            </p>
          </div>

          {/* SQL Code Block */}
          <div className="rounded-xl bg-black/30 border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8 bg-black/20">
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Database className="w-3.5 h-3.5" />
                <span>schema.sql</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                className="h-7 px-2.5 text-xs text-white/50 hover:text-white hover:bg-white/10"
              >
                {copied ? (
                  <><Check className="w-3.5 h-3.5 mr-1.5 text-[#80EE98]" /> Copied!</>
                ) : (
                  <><Copy className="w-3.5 h-3.5 mr-1.5" /> Copy SQL</>
                )}
              </Button>
            </div>
            <pre className="p-4 text-xs text-white/60 font-mono overflow-x-auto custom-scrollbar max-h-80 leading-relaxed">
              <code>{SETUP_SQL}</code>
            </pre>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              onClick={handleCheckSetup}
              disabled={checking}
              className="flex-1 h-11 btn-gradient rounded-xl"
            >
              {checking ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Checking...
                </span>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Check Setup
                </>
              )}
            </Button>
            <Button
              asChild
              className="flex-1 h-11 bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white rounded-xl"
            >
              <a href="https://supabase.com/dashboard/project/qunfqnmvvtspuoaopkvn/sql" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Supabase Editor
              </a>
            </Button>
          </div>

          {/* Steps */}
          <div className="mt-6 p-4 rounded-xl bg-white/[0.03] border border-white/6">
            <h3 className="text-sm font-medium text-white/60 mb-2">Setup Steps:</h3>
            <ol className="text-xs text-white/40 space-y-1.5 list-decimal list-inside">
              <li>Copy the SQL above using the &quot;Copy SQL&quot; button</li>
              <li>Open Supabase SQL Editor using the button or link</li>
              <li>Paste and run the SQL to create the required tables</li>
              <li>Update the owner password hash in the INSERT statement</li>
              <li>Click &quot;Check Setup&quot; to verify everything is ready</li>
            </ol>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
