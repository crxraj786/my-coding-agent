import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/keys/verify — Public endpoint to verify a licence key
export async function POST(request: NextRequest) {
  try {
    const { key, deviceId } = await request.json();

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Key is required' },
        { status: 400 }
      );
    }

    if (!deviceId) {
      return NextResponse.json(
        { success: false, error: 'Device ID is required' },
        { status: 400 }
      );
    }

    // Find the key
    const { data: licenceKey, error } = await supabaseAdmin
      .from('licence_keys')
      .select('*')
      .eq('key', key)
      .single();

    if (error || !licenceKey) {
      return NextResponse.json(
        { success: false, error: 'Invalid key' },
        { status: 404 }
      );
    }

    // Check if key is active
    if (licenceKey.status !== 'active') {
      return NextResponse.json(
        { success: false, error: `Key is ${licenceKey.status}` },
        { status: 403 }
      );
    }

    // Check expiry
    const now = new Date();
    const expiryAt = new Date(licenceKey.expiry_at);

    if (now > expiryAt) {
      // Auto-expire the key
      await supabaseAdmin
        .from('licence_keys')
        .update({ status: 'expired' })
        .eq('id', licenceKey.id);

      return NextResponse.json(
        { success: false, error: 'Key has expired' },
        { status: 403 }
      );
    }

    // Check device limit
    const usedDevices: string[] = Array.isArray(licenceKey.used_devices)
      ? licenceKey.used_devices
      : [];

    if (!usedDevices.includes(deviceId)) {
      if (usedDevices.length >= licenceKey.devices_limit) {
        return NextResponse.json(
          { success: false, error: 'Max device limit reached' },
          { status: 403 }
        );
      }

      // Add new device
      usedDevices.push(deviceId);

      await supabaseAdmin
        .from('licence_keys')
        .update({ used_devices: usedDevices })
        .eq('id', licenceKey.id);
    }

    const devicesRemaining =
      licenceKey.devices_limit - usedDevices.length;

    return NextResponse.json({
      success: true,
      key: licenceKey.key,
      username: licenceKey.username,
      expiryAt: licenceKey.expiry_at,
      devicesRemaining,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
