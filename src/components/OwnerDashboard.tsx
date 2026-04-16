'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
        <StatsCards />
        <Tabs defaultValue="keys" className="w-full">
          <TabsList className="glass rounded-xl h-10 p-1">
            <TabsTrigger value="keys" className="rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white">
              Licence Keys
            </TabsTrigger>
            <TabsTrigger value="admins" className="rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white">
              Manage Admins
            </TabsTrigger>
          </TabsList>

          <TabsContent value="keys" className="space-y-4 mt-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/40">Manage all licence keys</span>
              <KeyGenerator onKeyGenerated={() => setRefreshKey(p => p + 1)} />
            </div>
            <KeyTable key={`keys-${refreshKey}`} role="owner" />
          </TabsContent>

          <TabsContent value="admins" className="mt-5">
            <AdminManager />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}
