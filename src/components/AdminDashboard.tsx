'use client';

import { useState } from 'react';
import DashboardShell from '@/components/DashboardShell';
import StatsCards from '@/components/StatsCards';
import KeyGenerator from '@/components/KeyGenerator';
import KeyTable from '@/components/KeyTable';

export default function AdminDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleKeyGenerated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <DashboardShell title="LR ADMIN PANEL" role="admin">
      <div className="space-y-6">
        {/* Stats */}
        <StatsCards role="admin" />

        {/* Key Management */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/40">
              Manage your licence keys
            </div>
            <KeyGenerator onKeyGenerated={handleKeyGenerated} />
          </div>

          {/* Key Table */}
          <KeyTable key={`keys-${refreshKey}`} role="admin" />
        </div>
      </div>
    </DashboardShell>
  );
}
