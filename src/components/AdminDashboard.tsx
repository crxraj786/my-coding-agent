'use client';

import { useState } from 'react';
import { KeyRound, LayoutDashboard } from 'lucide-react';
import DashboardShell from '@/components/DashboardShell';
import StatsCards from '@/components/StatsCards';
import KeyGenerator from '@/components/KeyGenerator';
import KeyTable from '@/components/KeyTable';

export default function AdminDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <DashboardShell title="Admin Panel" role="admin">
      <div className="space-y-8">
        {/* ─── Dashboard / Statistics Overview ─── */}
        <section id="section-dashboard">
          <div className="flex items-center gap-2.5 mb-5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(9, 209, 199, 0.12)' }}
            >
              <LayoutDashboard className="w-4 h-4" style={{ color: '#09D1C7' }} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white/80">Dashboard Overview</h2>
              <p className="text-xs text-white/25 mt-0.5">Your activity at a glance</p>
            </div>
          </div>
          <StatsCards />
        </section>

        {/* ─── Licence Keys ─── */}
        <section id="section-keys" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(70, 223, 177, 0.12)' }}
              >
                <KeyRound className="w-4 h-4" style={{ color: '#46DFB1' }} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white/80">Licence Keys</h2>
                <p className="text-xs text-white/25 mt-0.5">Manage your licence keys</p>
              </div>
            </div>
            <KeyGenerator onKeyGenerated={() => setRefreshKey((p) => p + 1)} />
          </div>
          <KeyTable key={`admin-keys-${refreshKey}`} role="admin" />
        </section>
      </div>
    </DashboardShell>
  );
}
