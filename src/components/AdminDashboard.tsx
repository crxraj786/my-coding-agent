'use client';

import { useState } from 'react';
import DashboardShell from '@/components/DashboardShell';
import StatsCards from '@/components/StatsCards';
import KeyGenerator from '@/components/KeyGenerator';
import KeyTable from '@/components/KeyTable';

export default function AdminDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <DashboardShell title="LR ADMIN PANEL" role="admin">
      <div className="space-y-6">
        {/* Statistics Overview */}
        <StatsCards />

        {/* Key Management */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/40">Manage your licence keys</span>
            <KeyGenerator onKeyGenerated={() => setRefreshKey((p) => p + 1)} />
          </div>
          <KeyTable key={`admin-keys-${refreshKey}`} role="admin" />
        </div>
      </div>
    </DashboardShell>
  );
}
