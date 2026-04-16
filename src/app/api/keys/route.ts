import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth, requireOwner } from '@/lib/auth';

// GET /api/keys — List licence keys
export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const adminIdFilter = searchParams.get('adminId');
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('licence_keys')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by role
    if (user.role === 'admin') {
      query = query.eq('created_by', user.adminId);
    } else if (user.role === 'owner' && adminIdFilter) {
      query = query.eq('created_by', adminIdFilter);
    }

    // Filter by status
    if (status && ['active', 'blocked', 'expired', 'deleted'].includes(status)) {
      query = query.eq('status', status);
    }

    // Search by username or key
    if (search) {
      query = query.or(`username.ilike.%${search}%,key.ilike.%${search}%`);
    }

    const { data: keys, count, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch keys' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      keys: (keys || []).map((k) => ({
        id: k.id,
        key: k.key,
        username: k.username,
        createdBy: k.created_by,
        validityDays: k.validity_days,
        validityHours: k.validity_hours,
        devicesLimit: k.devices_limit,
        usedDevices: k.used_devices || [],
        status: k.status,
        createdAt: k.created_at,
        expiryAt: k.expiry_at,
      })),
      total: count || 0,
      page,
      limit,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/keys — Generate new licence key
export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      username,
      manualKey,
      validityType,
      validityValue,
      devicesLimit,
    } = body;

    if (!username || !validityType || !validityValue || !devicesLimit) {
      return NextResponse.json(
        {
          success: false,
          error: 'username, validityType, validityValue, and devicesLimit are required',
        },
        { status: 400 }
      );
    }

    if (validityType !== 'days' && validityType !== 'hours') {
      return NextResponse.json(
        { success: false, error: 'validityType must be days or hours' },
        { status: 400 }
      );
    }

    const numValidity = Number(validityValue);
    const numDevices = Number(devicesLimit);

    if (numValidity <= 0 || numDevices <= 0) {
      return NextResponse.json(
        { success: false, error: 'validityValue and devicesLimit must be positive' },
        { status: 400 }
      );
    }

    // Balance check for admin
    if (user.role === 'admin') {
      const { data: admin, error: adminError } = await supabaseAdmin
        .from('admins')
        .select('balance, admin_id')
        .eq('admin_id', user.adminId)
        .single();

      if (adminError || !admin) {
        return NextResponse.json(
          { success: false, error: 'Admin not found' },
          { status: 404 }
        );
      }

      const cost = numValidity * numDevices * 10;

      if (admin.balance < cost) {
        return NextResponse.json(
          { success: false, error: 'Not enough balance' },
          { status: 400 }
        );
      }

      // Deduct balance
      const newBalance = admin.balance - cost;

      const { error: updateError } = await supabaseAdmin
        .from('admins')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('admin_id', user.adminId);

      if (updateError) {
        return NextResponse.json(
          { success: false, error: 'Failed to deduct balance' },
          { status: 500 }
        );
      }

      // Log balance change
      await supabaseAdmin.from('balance_logs').insert({
        id: crypto.randomUUID(),
        admin_id: user.adminId as string,
        amount: cost,
        type: 'debit',
        description: `Licence key created for ${username}: ${validityType}=${numValidity}, devices=${numDevices}`,
        created_at: new Date().toISOString(),
      });
    }

    // Generate key
    const keyValue = manualKey || crypto.randomUUID();

    // Check if key already exists
    const { data: existingKey } = await supabaseAdmin
      .from('licence_keys')
      .select('id')
      .eq('key', keyValue)
      .single();

    if (existingKey) {
      return NextResponse.json(
        { success: false, error: 'Key already exists' },
        { status: 409 }
      );
    }

    // Calculate expiry
    const now = new Date();
    let expiryAt: Date;
    if (validityType === 'days') {
      expiryAt = new Date(now.getTime() + numValidity * 24 * 60 * 60 * 1000);
    } else {
      expiryAt = new Date(now.getTime() + numValidity * 60 * 60 * 1000);
    }

    const createdBy = user.role === 'owner' ? 'owner' : (user.adminId as string);

    const { data: newKey, error: insertError } = await supabaseAdmin
      .from('licence_keys')
      .insert({
        id: crypto.randomUUID(),
        key: keyValue,
        username,
        created_by: createdBy,
        validity_days: validityType === 'days' ? numValidity : 0,
        validity_hours: validityType === 'hours' ? numValidity : 0,
        devices_limit: numDevices,
        used_devices: [],
        status: 'active',
        created_at: now.toISOString(),
        expiry_at: expiryAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: 'Failed to create key' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      key: {
        id: newKey.id,
        key: newKey.key,
        username: newKey.username,
        createdBy: newKey.created_by,
        validityDays: newKey.validity_days,
        validityHours: newKey.validity_hours,
        devicesLimit: newKey.devices_limit,
        status: newKey.status,
        createdAt: newKey.created_at,
        expiryAt: newKey.expiry_at,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
