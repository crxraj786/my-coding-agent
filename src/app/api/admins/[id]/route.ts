import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireOwner } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/admins/[id] — Update admin (owner only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const owner = requireOwner(request);
    if (!owner) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, balance, displayName } = body;

    // Build update object
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (displayName !== undefined) {
      updateData.display_name = displayName;
    }

    if (balance !== undefined) {
      const numBalance = Number(balance);
      if (isNaN(numBalance) || numBalance < 0 || numBalance > 100000) {
        return NextResponse.json(
          { success: false, error: 'Balance must be between 0 and 100000' },
          { status: 400 }
        );
      }
      updateData.balance = numBalance;
    }

    if (status !== undefined) {
      if (status !== 'active' && status !== 'blocked') {
        return NextResponse.json(
          { success: false, error: 'Status must be active or blocked' },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    // Get existing admin
    const { data: existingAdmin, error: fetchError } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('admin_id', id)
      .single();

    if (fetchError || !existingAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Log balance changes
    if (balance !== undefined) {
      const difference = Number(balance) - existingAdmin.balance;
      const logType = difference > 0 ? 'credit' : 'debit';
      const logAmount = Math.abs(difference);

      await supabaseAdmin.from('balance_logs').insert({
        id: crypto.randomUUID(),
        admin_id: id,
        amount: logAmount,
        type: logType,
        description: `Balance updated by owner: ${logType} ${logAmount}`,
        created_at: new Date().toISOString(),
      });
    }

    // Block/unblock associated licence keys
    if (status === 'blocked') {
      await supabaseAdmin
        .from('licence_keys')
        .update({ status: 'blocked' })
        .eq('created_by', id)
        .in('status', ['active']);
    }

    const { data: updatedAdmin, error: updateError } = await supabaseAdmin
      .from('admins')
      .update(updateData)
      .eq('admin_id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Failed to update admin' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      admin: {
        id: updatedAdmin.id,
        adminId: updatedAdmin.admin_id,
        displayName: updatedAdmin.display_name,
        balance: updatedAdmin.balance,
        initialBalance: updatedAdmin.initial_balance,
        status: updatedAdmin.status,
        createdAt: updatedAdmin.created_at,
        updatedAt: updatedAdmin.updated_at,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admins/[id] — Delete admin (owner only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const owner = requireOwner(request);
    if (!owner) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check admin exists
    const { data: existingAdmin, error: fetchError } = await supabaseAdmin
      .from('admins')
      .select('admin_id')
      .eq('admin_id', id)
      .single();

    if (fetchError || !existingAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Delete balance logs
    await supabaseAdmin.from('balance_logs').delete().eq('admin_id', id);

    // Delete licence keys
    await supabaseAdmin.from('licence_keys').delete().eq('created_by', id);

    // Delete admin
    const { error: deleteError } = await supabaseAdmin
      .from('admins')
      .delete()
      .eq('admin_id', id);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete admin' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Admin and all associated data deleted',
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
