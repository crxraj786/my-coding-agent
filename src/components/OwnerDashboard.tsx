'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardShell from '@/components/DashboardShell';
import StatsCards from '@/components/StatsCards';
import KeyGenerator from '@/components/KeyGenerator';
import KeyTable from '@/components/KeyTable';
import AdminManager from '@/components/AdminManager';

export default function OwnerDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleKeyGenerated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <DashboardShell title="LR OWNER PANEL" role="owner">
      <div className="space-y-6">
        {/* Stats */}
        <StatsCards role="owner" />

        {/* Main Tabs */}
        <Tabs defaultValue="keys" className="w-full">
          <TabsList className="glass-card border-white/10 mb-4">
            <TabsTrigger
              value="keys"
              className="data-[state=active]:bg-[#09D1C7]/20 data-[state=active]:text-[#80EE98] rounded-lg transition-all"
            >
              Licence Keys
            </TabsTrigger>
            <TabsTrigger
              value="admins"
              className="data-[state=active]:bg-[#09D1C7]/20 data-[state=active]:text-[#80EE98] rounded-lg transition-all"
            >
              Manage Admins
            </TabsTrigger>
          </TabsList>

          <TabsContent value="keys" className="space-y-4">
            {/* Generate Key Button */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-white/40">
                Manage all licence keys across the system
              </div>
              <KeyGenerator onKeyGenerated={handleKeyGenerated} />
            </div>

            {/* Key Table */}
            <KeyTable key={`keys-${refreshKey}`} role="owner" />
          </TabsContent>

          <TabsContent value="admins">
            <AdminManager />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}
