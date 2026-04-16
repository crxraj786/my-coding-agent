import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/keys/[id] — Update key status
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = requireAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || (status !== 'blocked' && status !== 'active')) {
      return NextResponse.json(
        { success: false, error: 'Only status block/unblock is allowed' },
        { status: 400 }
      );
    }

    // Get existing key
    const { data: existingKey, error: fetchError } = await supabaseAdmin
      .from('licence_keys')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingKey) {
      return NextResponse.json(
        { success: false, error: 'Key not found' },
        { status: 404 }
      );
    }

    // Check permission: admin can only modify their own keys
    if (user.role === 'admin' && existingKey.created_by !== user.adminId) {
      return NextResponse.json(
        { success: false, error: 'You can only modify your own keys' },
        { status: 403 }
      );
    }

    const { data: updatedKey, error: updateError } = await supabaseAdmin
      .from('licence_keys')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Failed to update key' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      key: {
        id: updatedKey.id,
        key: updatedKey.key,
        username: updatedKey.username,
        createdBy: updatedKey.created_by,
        validityDays: updatedKey.validity_days,
        validityHours: updatedKey.validity_hours,
        devicesLimit: updatedKey.devices_limit,
        usedDevices: updatedKey.used_devices || [],
        status: updatedKey.status,
        createdAt: updatedKey.created_at,
        expiryAt: updatedKey.expiry_at,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/keys/[id] — Soft delete key
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = requireAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get existing key
    const { data: existingKey, error: fetchError } = await supabaseAdmin
      .from('licence_keys')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingKey) {
      return NextResponse.json(
        { success: false, error: 'Key not found' },
        { status: 404 }
      );
    }

    // Check permission: admin can only delete their own keys
    if (user.role === 'admin' && existingKey.created_by !== user.adminId) {
      return NextResponse.json(
        { success: false, error: 'You can only delete your own keys' },
        { status: 403 }
      );
    }

    // Soft delete
    const { error: updateError } = await supabaseAdmin
      .from('licence_keys')
      .update({ status: 'deleted' })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete key' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Key deleted',
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
