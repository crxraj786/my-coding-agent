'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KeyRound, Users } from 'lucide-react';
import DashboardShell from '@/components/DashboardShell';
import StatsCards from '@/components/StatsCards';
import KeyGenerator from '@/components/KeyGenerator';
import KeyTable from '@/components/KeyTable';
import AdminManager from '@/components/AdminManager';

export default function OwnerDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <DashboardShell title="LR OWNER PANEL" role="owner">
      <div className="space-y-6">
        {/* Statistics Overview */}
        <section>
          <StatsCards />
        </section>

        {/* Main Content Tabs */}
        <Tabs defaultValue="keys" className="w-full">
          <TabsList className="glass rounded-xl h-11 p-1">
            <TabsTrigger
              value="keys"
              className="rounded-lg text-sm font-medium transition-all duration-200 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/40 hover:text-white/60"
            >
              <KeyRound className="w-4 h-4 mr-1.5" />
              Licence Keys
            </TabsTrigger>
            <TabsTrigger
              value="admins"
              className="rounded-lg text-sm font-medium transition-all duration-200 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/40 hover:text-white/60"
            >
              <Users className="w-4 h-4 mr-1.5" />
              Manage Admins
            </TabsTrigger>
          </TabsList>

          {/* Keys Tab */}
          <TabsContent value="keys" className="space-y-4 mt-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white/70">Licence Keys</h2>
                <p className="text-xs text-white/25 mt-0.5">Manage all licence keys</p>
              </div>
              <KeyGenerator onKeyGenerated={() => setRefreshKey((p) => p + 1)} />
            </div>
            <KeyTable key={`owner-keys-${refreshKey}`} role="owner" />
          </TabsContent>

          {/* Admins Tab */}
          <TabsContent value="admins" className="mt-5">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-white/70">Manage Admins</h2>
              <p className="text-xs text-white/25 mt-0.5">Create and manage admin accounts</p>
            </div>
            <AdminManager />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}
