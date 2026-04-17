import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
import { signJWT } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, adminId } = body;

    // Owner login
    if (email && password) {
      if (
        email === process.env.OWNER_EMAIL &&
        password === process.env.OWNER_PASSWORD
      ) {
        const token = signJWT({ role: 'owner', email });
        return NextResponse.json({
          success: true,
          role: 'owner',
          token,
          data: { email },
        });
      }
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Admin login
    if (adminId && password) {
      const { data: admin, error } = await supabaseAdmin
        .from('admins')
        .select('*')
        .eq('admin_id', adminId)
        .single();

      if (error || !admin) {
        return NextResponse.json(
          { success: false, error: 'Not registered' },
          { status: 401 }
        );
      }

      if (admin.status === 'blocked') {
        return NextResponse.json(
          { success: false, error: 'You are blocked' },
          { status: 403 }
        );
      }

      const isValid = await bcrypt.compare(password, admin.password);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      const token = signJWT({
        role: 'admin',
        adminId: admin.admin_id,
        displayName: admin.display_name,
      });

      return NextResponse.json({
        success: true,
        role: 'admin',
        token,
        data: {
          adminId: admin.admin_id,
          displayName: admin.display_name,
          balance: admin.balance,
          initialBalance: admin.initial_balance,
          status: admin.status,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Provide email/password for owner or adminId/password for admin' },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
