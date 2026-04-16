'use client';

import { useEffect, useState } from 'react';
import {
  Key, CheckCircle, XCircle, Clock, Users, UserCheck,
  Wallet, CreditCard, Loader2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getStats } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

interface StatItem {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

export default function StatsCards() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getStats();
        setStats(data.stats || data);
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const isOwner = user?.role === 'owner';

  const ownerStats: StatItem[] = [
    { label: 'Total Keys', value: stats?.totalKeys || 0, icon: <Key className="w-4 h-4" />, color: '#09D1C7' },
    { label: 'Active', value: stats?.activeKeys || 0, icon: <CheckCircle className="w-4 h-4" />, color: '#80EE98' },
    { label: 'Blocked', value: stats?.blockedKeys || 0, icon: <XCircle className="w-4 h-4" />, color: '#ef4444' },
    { label: 'Expired', value: stats?.expiredKeys || 0, icon: <Clock className="w-4 h-4" />, color: '#f59e0b' },
    { label: 'Total Admins', value: stats?.totalAdmins || 0, icon: <Users className="w-4 h-4" />, color: '#8b5cf6' },
    { label: 'Active Admins', value: stats?.activeAdmins || 0, icon: <UserCheck className="w-4 h-4" />, color: '#80EE98' },
  ];

  const adminStats: StatItem[] = [
    { label: 'Total Keys', value: stats?.totalKeys || 0, icon: <Key className="w-4 h-4" />, color: '#09D1C7' },
    { label: 'Active', value: stats?.activeKeys || 0, icon: <CheckCircle className="w-4 h-4" />, color: '#80EE98' },
    { label: 'Blocked', value: stats?.blockedKeys || 0, icon: <XCircle className="w-4 h-4" />, color: '#ef4444' },
    { label: 'Expired', value: stats?.expiredKeys || 0, icon: <Clock className="w-4 h-4" />, color: '#f59e0b' },
    { label: 'Balance', value: stats?.currentBalance || 0, icon: <Wallet className="w-4 h-4" />, color: '#09D1C7' },
    { label: 'Used', value: stats?.usedBalance || 0, icon: <CreditCard className="w-4 h-4" />, color: '#f59e0b' },
  ];

  const displayStats = isOwner ? ownerStats : adminStats;

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="lr-card p-4">
            <Skeleton className="h-8 w-8 rounded-lg mb-3" />
            <Skeleton className="h-5 w-12 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {displayStats.map((stat) => (
        <div
          key={stat.label}
          className="lr-card p-4 transition-colors"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
            style={{ background: `${stat.color}15` }}
          >
            <span style={{ color: stat.color }}>{stat.icon}</span>
          </div>
          <div className="text-xl font-bold text-white">{stat.value}</div>
          <div className="text-xs text-slate-400 mt-0.5">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
