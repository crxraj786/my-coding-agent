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
          <TabsList className="bg-slate-800/50 border border-slate-700/50 h-9">
            <TabsTrigger value="keys" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white rounded-md text-xs">
              Licence Keys
            </TabsTrigger>
            <TabsTrigger value="admins" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white rounded-md text-xs">
              Manage Admins
            </TabsTrigger>
          </TabsList>

          <TabsContent value="keys" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Manage all licence keys</span>
              <KeyGenerator onKeyGenerated={() => setRefreshKey(p => p + 1)} />
            </div>
            <KeyTable key={`keys-${refreshKey}`} role="owner" />
          </TabsContent>

          <TabsContent value="admins" className="mt-4">
            <AdminManager />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}
