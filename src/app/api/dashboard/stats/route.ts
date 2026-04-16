import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth, requireOwner } from '@/lib/auth';

// GET /api/dashboard/stats — Dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (user.role === 'owner') {
      // Owner stats
      const [keysResult, adminsResult] = await Promise.all([
        supabaseAdmin.from('licence_keys').select('status'),
        supabaseAdmin.from('admins').select('status'),
      ]);

      if (keysResult.error || adminsResult.error) {
        return NextResponse.json(
          { success: false, error: 'Failed to fetch stats' },
          { status: 500 }
        );
      }

      const keys = keysResult.data || [];
      const admins = adminsResult.data || [];

      const totalKeys = keys.length;
      const activeKeys = keys.filter((k) => k.status === 'active').length;
      const blockedKeys = keys.filter((k) => k.status === 'blocked').length;
      const expiredKeys = keys.filter((k) => k.status === 'expired').length;
      const totalAdmins = admins.length;
      const activeAdmins = admins.filter((a) => a.status === 'active').length;
      const blockedAdmins = admins.filter((a) => a.status === 'blocked').length;

      return NextResponse.json({
        success: true,
        stats: {
          totalKeys,
          activeKeys,
          blockedKeys,
          expiredKeys,
          totalAdmins,
          activeAdmins,
          blockedAdmins,
        },
      });
    }

    // Admin stats
    const [keysResult, adminResult] = await Promise.all([
      supabaseAdmin.from('licence_keys').select('status').eq('created_by', user.adminId),
      supabaseAdmin
        .from('admins')
        .select('balance, initial_balance')
        .eq('admin_id', user.adminId)
        .single(),
    ]);

    if (keysResult.error || adminResult.error || !adminResult.data) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch stats' },
        { status: 500 }
      );
    }

    const keys = keysResult.data || [];
    const admin = adminResult.data;

    const totalKeys = keys.length;
    const activeKeys = keys.filter((k) => k.status === 'active').length;
    const blockedKeys = keys.filter((k) => k.status === 'blocked').length;
    const expiredKeys = keys.filter((k) => k.status === 'expired').length;
    const currentBalance = admin.balance;
    const usedBalance = admin.initial_balance - admin.balance;

    return NextResponse.json({
      success: true,
      stats: {
        totalKeys,
        activeKeys,
        blockedKeys,
        expiredKeys,
        currentBalance,
        usedBalance,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
