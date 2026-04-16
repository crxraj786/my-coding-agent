import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/setup — Check if tables exist (PUBLIC endpoint)
export async function GET() {
  try {
    const tables = ['admins', 'licence_keys', 'balance_logs'];
    const results: Record<string, boolean> = {};

    for (const table of tables) {
      const { error } = await supabaseAdmin.from(table).select('id').limit(1);
      results[table] = !error;
    }

    const setup = Object.values(results).every((v) => v);

    return NextResponse.json({
      setup,
      tables: results,
    });
  } catch {
    // If tables don't exist, setup is needed
    return NextResponse.json({
      setup: false,
      tables: { admins: false, licence_keys: false, balance_logs: false },
    });
  }
}

// POST /api/setup — Execute SQL to create tables
export async function POST(request: NextRequest) {
  try {
    const { sql } = await request.json();

    if (!sql || typeof sql !== 'string') {
      return NextResponse.json(
        { success: false, error: 'SQL is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.rpc('exec_sql', { sql_string: sql });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Could not execute SQL via RPC. Please run the SQL manually in Supabase SQL Editor.',
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'SQL executed successfully',
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
