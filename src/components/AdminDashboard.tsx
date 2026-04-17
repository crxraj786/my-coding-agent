'use client';

import { useState } from 'react';
import { KeyRound } from 'lucide-react';
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
        <section>
          <StatsCards />
        </section>

        {/* Key Management */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white/70">Licence Keys</h2>
              <p className="text-xs text-white/25 mt-0.5">Manage your licence keys</p>
            </div>
            <KeyGenerator onKeyGenerated={() => setRefreshKey((p) => p + 1)} />
          </div>
          <KeyTable key={`admin-keys-${refreshKey}`} role="admin" />
        </section>
      </div>
    </DashboardShell>
  );
}
