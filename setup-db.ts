/**
 * Supabase Database Schema Setup Script
 * 
 * This script attempts to create the database tables for the LR Licence Verification System.
 * It tries multiple approaches to execute SQL on the Supabase database.
 * 
 * Usage:
 *   bun run setup-db.ts                    # Try all automatic approaches
 *   bun run setup-db.ts --password <pw>    # Use specific database password
 *   bun run setup-db.ts --db-url <url>     # Use specific database connection URL
 *   bun run setup-db.ts --token <token>    # Use Supabase Management API access token
 */

import { Client } from 'pg';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

// ─── Configuration ───────────────────────────────────────────────────────────────

const PROJECT_REF = 'qunfqnmvvtspuoaopkvn';
const PROJECT_URL = `https://${PROJECT_REF}.supabase.co`;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1bmZxbm12dnRzcHVvYW9wa3ZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTkwMTIxMCwiZXhwIjoyMDkxNDc3MjEwfQ.Ti_ayVRxpMbZv6LOC072HpRqgn4QeiKyKdyVVgvdl7g';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Parse CLI arguments
const args = process.argv.slice(2);
let DB_PASSWORD = '';
let DB_URL = '';
let ACCESS_TOKEN = '';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--password' && args[i + 1]) DB_PASSWORD = args[++i];
  if (args[i] === '--db-url' && args[i + 1]) DB_URL = args[++i];
  if (args[i] === '--token' && args[i + 1]) ACCESS_TOKEN = args[++i];
}

// Load SQL from migration file
const SQL_SCHEMA = readFileSync(
  join(import.meta.dir, 'supabase', 'migrations', '20260416000000_create_schema.sql'),
  'utf-8'
);

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║     Supabase Database Schema Setup                      ║');
console.log('║     Project: ' + PROJECT_REF + '                   ║');
console.log('╚══════════════════════════════════════════════════════════╝');
console.log();

// ─── Step 1: Check if tables already exist via REST API ─────────────────────────

async function checkTablesViaREST(): Promise<boolean> {
  console.log('📋 Step 1: Checking if tables exist via REST API...');
  
  try {
    const res = await fetch(`${PROJECT_URL}/rest/v1/admins?select=id&limit=1`, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log('   ✅ admins table EXISTS (' + (Array.isArray(data) ? data.length : 0) + ' rows)');
      return true;
    }
    
    const data = await res.json();
    if (data.code === 'PGRST205') {
      console.log('   ❌ Tables do NOT exist yet (need to create them)');
      return false;
    }
    
    console.log('   ⚠️  Unexpected response:', JSON.stringify(data));
    return false;
  } catch (e) {
    console.log('   ⚠️  REST API check failed:', e);
    return false;
  }
}

// ─── Step 2: Try Supabase pg/query endpoint ─────────────────────────────────────

async function tryPgQueryEndpoint(): Promise<boolean> {
  console.log('\n📋 Step 2: Trying /pg/query endpoint...');
  
  try {
    const res = await fetch(`${PROJECT_URL}/pg/query`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: 'SELECT 1' }),
    });
    
    if (res.ok) {
      console.log('   ✅ /pg/query endpoint is available!');
      // Execute the full schema
      const schemaRes = await fetch(`${PROJECT_URL}/pg/query`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: SQL_SCHEMA }),
      });
      if (schemaRes.ok) {
        console.log('   ✅ Schema executed via /pg/query!');
        return true;
      }
      console.log('   ❌ Schema execution failed:', await schemaRes.text());
      return false;
    }
    
    console.log('   ❌ /pg/query returned ' + res.status + ' ' + (await res.text()).substring(0, 100));
    return false;
  } catch (e) {
    console.log('   ❌ /pg/query failed:', e);
    return false;
  }
}

// ─── Step 3: Try Management API with access token ────────────────────────────────

async function tryManagementAPI(): Promise<boolean> {
  if (!ACCESS_TOKEN) {
    console.log('\n📋 Step 3: Management API (skipped - no --token provided)');
    return false;
  }
  
  console.log('\n📋 Step 3: Trying Management API...');
  
  try {
    const res = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: SQL_SCHEMA }),
      }
    );
    
    if (res.ok) {
      console.log('   ✅ Schema executed via Management API!');
      return true;
    }
    
    console.log('   ❌ Management API returned ' + res.status + ':', await res.text());
    return false;
  } catch (e) {
    console.log('   ❌ Management API failed:', e);
    return false;
  }
}

// ─── Step 4: Try direct PostgreSQL connection ────────────────────────────────────

async function tryDirectPgConnection(): Promise<boolean> {
  if (!DB_URL && !DB_PASSWORD) {
    console.log('\n📋 Step 4: Direct PostgreSQL (skipped - no --password or --db-url provided)');
    return false;
  }
  
  console.log('\n📋 Step 4: Trying direct PostgreSQL connection...');
  
  const connStr = DB_URL || 
    `postgresql://postgres.${PROJECT_REF}:${encodeURIComponent(DB_PASSWORD)}@db.${PROJECT_REF}.supabase.co:5432/postgres`;
  
  console.log('   Connecting to: ' + connStr.replace(/:[^@]+@/, ':****@'));
  
  const client = new Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
    statement_timeout: 60000,
  });
  
  try {
    await client.connect();
    console.log('   ✅ Connected successfully!');
    
    console.log('   Executing SQL schema...');
    await client.query(SQL_SCHEMA);
    console.log('   ✅ Schema executed successfully!');
    
    // Verify
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('admins', 'licence_keys', 'balance_logs')
      ORDER BY table_name;
    `);
    console.log('   📊 Created/verified tables:', result.rows.map(r => r.table_name).join(', '));
    
    await client.end();
    return true;
  } catch (e: any) {
    console.log('   ❌ Failed:', e.message);
    try { await client.end(); } catch {}
    return false;
  }
}

// ─── Step 5: Try Supabase CLI ───────────────────────────────────────────────────

async function trySupabaseCLI(): Promise<boolean> {
  if (!DB_PASSWORD && !DB_URL) {
    console.log('\n📋 Step 5: Supabase CLI (skipped - no --password or --db-url provided)');
    return false;
  }
  
  console.log('\n📋 Step 5: Trying Supabase CLI...');
  
  try {
    const dbUrl = DB_URL || 
      `postgresql://postgres.${PROJECT_REF}:${encodeURIComponent(DB_PASSWORD)}@db.${PROJECT_REF}.supabase.co:5432/postgres`;
    
    const migrationFile = join(import.meta.dir, 'supabase', 'migrations', '20260416000000_create_schema.sql');
    
    console.log('   Running: supabase db query...');
    const output = execSync(
      `npx supabase db query --db-url "${dbUrl}" -f "${migrationFile}" 2>&1`,
      { timeout: 60000, encoding: 'utf8', cwd: import.meta.dir }
    );
    
    console.log('   ✅ Schema executed via CLI!');
    console.log('   Output:', output.substring(0, 200));
    return true;
  } catch (e: any) {
    console.log('   ❌ CLI failed:', (e.message || e).substring(0, 200));
    return false;
  }
}

// ─── Step 6: Try pooler connection across regions ────────────────────────────────

async function tryPoolerConnection(): Promise<boolean> {
  if (!DB_PASSWORD) {
    console.log('\n📋 Step 6: Pooler connection (skipped - no --password provided)');
    return false;
  }
  
  console.log('\n📋 Step 6: Trying Supabase connection pooler...');
  
  const regions = [
    'us-east-1', 'us-west-1', 'eu-west-1', 'eu-central-1',
    'ap-south-1', 'ap-southeast-1', 'ap-northeast-1',
    'sa-east-1', 'ca-central-1', 'ap-east-1',
  ];
  
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    const connStr = `postgresql://postgres.${PROJECT_REF}:${encodeURIComponent(DB_PASSWORD)}@${host}:6543/postgres`;
    
    const client = new Client({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000,
      statement_timeout: 60000,
    });
    
    try {
      await client.connect();
      console.log(`   ✅ Connected via pooler (${region})!`);
      
      await client.query(SQL_SCHEMA);
      console.log('   ✅ Schema executed successfully!');
      
      await client.end();
      return true;
    } catch (e: any) {
      if (!e.message?.includes('self signed')) {
        console.log(`   ❌ ${region}: ${e.message?.substring(0, 60)}`);
      }
      try { await client.end(); } catch {}
    }
  }
  
  return false;
}

// ─── Main ────────────────────────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now();
  
  // Step 1: Check if tables exist
  const tablesExist = await checkTablesViaREST();
  if (tablesExist) {
    console.log('\n✅ Tables already exist. No action needed.');
    return;
  }
  
  // Step 2: Try pg/query endpoint
  if (await tryPgQueryEndpoint()) {
    console.log('\n🎉 SUCCESS! Schema created via /pg/query endpoint.');
    return;
  }
  
  // Step 3: Try Management API
  if (await tryManagementAPI()) {
    console.log('\n🎉 SUCCESS! Schema created via Management API.');
    return;
  }
  
  // Step 4: Try direct PostgreSQL
  if (await tryDirectPgConnection()) {
    console.log('\n🎉 SUCCESS! Schema created via direct PostgreSQL connection.');
    return;
  }
  
  // Step 5: Try Supabase CLI
  if (await trySupabaseCLI()) {
    console.log('\n🎉 SUCCESS! Schema created via Supabase CLI.');
    return;
  }
  
  // Step 6: Try pooler connection
  if (await tryPoolerConnection()) {
    console.log('\n🎉 SUCCESS! Schema created via Supabase pooler.');
    return;
  }
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  
  // All automatic approaches failed
  console.log('\n' + '═'.repeat(60));
  console.log('❌ All automatic approaches failed.');
  console.log('═'.repeat(60));
  console.log(`   Time elapsed: ${elapsed}s`);
  console.log();
  console.log('📌 To set up the schema, you need ONE of:');
  console.log();
  console.log('   Option A: Database Password (recommended)');
  console.log('   ─────────────────────────────────────');
  console.log('   1. Go to https://supabase.com/dashboard/project/' + PROJECT_REF);
  console.log('   2. Navigate to Settings → Database');
  console.log('   3. Copy the "Database password" (or reset it)');
  console.log('   4. Run this script with:');
  console.log('      bun run setup-db.ts --password <YOUR_DB_PASSWORD>');
  console.log();
  console.log('   Option B: Management API Access Token');
  console.log('   ─────────────────────────────────────');
  console.log('   1. Go to https://supabase.com/dashboard/account/tokens');
  console.log('   2. Generate a new access token');
  console.log('   3. Run this script with:');
  console.log('      bun run setup-db.ts --token <YOUR_ACCESS_TOKEN>');
  console.log();
  console.log('   Option C: Full Database URL');
  console.log('   ──────────────────────────────────');
  console.log('   1. Go to https://supabase.com/dashboard/project/' + PROJECT_REF);
  console.log('   2. Navigate to Settings → Database → Connection string');
  console.log('   3. Copy the "URI" connection string');
  console.log('   4. Run this script with:');
  console.log('      bun run setup-db.ts --db-url <FULL_CONNECTION_STRING>');
  console.log();
  console.log('   Option D: SQL Editor (manual, no CLI needed)');
  console.log('   ──────────────────────────────────────────────');
  console.log('   1. Go to https://supabase.com/dashboard/project/' + PROJECT_REF + '/sql');
  console.log('   2. Paste the contents of:');
  console.log('      supabase/migrations/20260416000000_create_schema.sql');
  console.log('   3. Click "Run" or press Ctrl+Enter');
  console.log();
  console.log('   Option E: Supabase CLI (requires login)');
  console.log('   ──────────────────────────────────────');
  console.log('   1. Log in: npx supabase login');
  console.log('   2. Link: npx supabase link --project-ref ' + PROJECT_REF);
  console.log('   3. Push: npx supabase db push');
  console.log();
  
  process.exit(1);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
