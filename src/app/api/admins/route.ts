import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
import { requireOwner } from '@/lib/auth';

// GET /api/admins — List all admins (owner only)
export async function GET(request: NextRequest) {
  try {
    const owner = requireOwner(request);
    if (!owner) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('admins')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && (status === 'active' || status === 'blocked')) {
      query = query.eq('status', status);
    }

    const { data: admins, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch admins' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      admins: admins.map((a) => ({
        id: a.id,
        adminId: a.admin_id,
        displayName: a.display_name,
        balance: a.balance,
        initialBalance: a.initial_balance,
        status: a.status,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
      })),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admins — Create new admin (owner only)
export async function POST(request: NextRequest) {
  try {
    const owner = requireOwner(request);
    if (!owner) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { adminId, password, displayName } = await request.json();

    if (!adminId || !password || !displayName) {
      return NextResponse.json(
        { success: false, error: 'adminId, password, and displayName are required' },
        { status: 400 }
      );
    }

    // Check if adminId already exists
    const { data: existing } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('admin_id', adminId)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Admin ID already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .insert({
        admin_id: adminId,
        password: hashedPassword,
        display_name: displayName,
        balance: 1000,
        initial_balance: 1000,
        status: 'active',
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to create admin' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        adminId: admin.admin_id,
        displayName: admin.display_name,
        balance: admin.balance,
        initialBalance: admin.initial_balance,
        status: admin.status,
        createdAt: admin.created_at,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
