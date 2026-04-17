import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireOwner } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ adminId: string }>;
}

// GET /api/balance/[adminId] — Get balance logs for an admin (owner only)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const owner = requireOwner(request);
    if (!owner) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { adminId } = await params;

    // Get admin balance info
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('balance, initial_balance, admin_id, display_name, status')
      .eq('admin_id', adminId)
      .single();

    if (adminError || !admin) {
      return NextResponse.json(
        { success: false, error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Get balance logs
    const { data: logs, error: logsError } = await supabaseAdmin
      .from('balance_logs')
      .select('*')
      .eq('admin_id', adminId)
      .order('created_at', { ascending: false });

    if (logsError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch balance logs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      balance: admin.balance,
      initialBalance: admin.initial_balance,
      admin: {
        adminId: admin.admin_id,
        displayName: admin.display_name,
        status: admin.status,
      },
      logs: (logs || []).map((log) => ({
        id: log.id,
        amount: log.amount,
        type: log.type,
        description: log.description,
        createdAt: log.created_at,
      })),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/balance/[adminId] — Update balance (owner only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const owner = requireOwner(request);
    if (!owner) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { adminId } = await params;
    const { amount, type } = await request.json();

    if (
      !amount ||
      !type ||
      (type !== 'credit' && type !== 'debit') ||
      Number(amount) <= 0
    ) {
      return NextResponse.json(
        { success: false, error: 'Valid amount and type (credit/debit) are required' },
        { status: 400 }
      );
    }

    const numAmount = Number(amount);

    // Get admin
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('balance, admin_id')
      .eq('admin_id', adminId)
      .single();

    if (adminError || !admin) {
      return NextResponse.json(
        { success: false, error: 'Admin not found' },
        { status: 404 }
      );
    }

    let newBalance: number;

    if (type === 'credit') {
      newBalance = admin.balance + numAmount;
    } else {
      newBalance = admin.balance - numAmount;
    }

    // Enforce limits
    if (newBalance < 0) {
      return NextResponse.json(
        { success: false, error: 'Balance cannot go below 0' },
        { status: 400 }
      );
    }

    if (newBalance > 100000) {
      return NextResponse.json(
        { success: false, error: 'Balance cannot exceed 100000' },
        { status: 400 }
      );
    }

    // Update balance
    const { error: updateError } = await supabaseAdmin
      .from('admins')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('admin_id', adminId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Failed to update balance' },
        { status: 500 }
      );
    }

    // Create balance log
    const { error: logError } = await supabaseAdmin.from('balance_logs').insert({
      id: crypto.randomUUID(),
      admin_id: adminId,
      amount: numAmount,
      type,
      description: `Balance ${type} of ${numAmount} by owner`,
      created_at: new Date().toISOString(),
    });

    if (logError) {
      return NextResponse.json(
        { success: false, error: 'Balance updated but failed to create log' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      balance: newBalance,
      previousBalance: admin.balance,
      amount: numAmount,
      type,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
