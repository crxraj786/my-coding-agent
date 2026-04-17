'use client';

import { useEffect, useState } from 'react';
import {
  Key, CheckCircle, XCircle, Clock, Users, UserCheck,
  Wallet, CreditCard,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getStats } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

interface StatItem {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
  bgAccent: string;
}

export default function StatsCards() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

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
    const t = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(t);
  }, []);

  const isOwner = user?.role === 'owner';

  const ownerStats: StatItem[] = [
    {
      label: 'Total Keys',
      value: stats?.totalKeys || 0,
      icon: <Key className="w-5 h-5" />,
      accent: '#09D1C7',
      bgAccent: 'rgba(9,209,199,0.1)',
    },
    {
      label: 'Active Keys',
      value: stats?.activeKeys || 0,
      icon: <CheckCircle className="w-5 h-5" />,
      accent: '#80EE98',
      bgAccent: 'rgba(128,238,152,0.1)',
    },
    {
      label: 'Blocked Keys',
      value: stats?.blockedKeys || 0,
      icon: <XCircle className="w-5 h-5" />,
      accent: '#ff6b6b',
      bgAccent: 'rgba(255,107,107,0.1)',
    },
    {
      label: 'Expired Keys',
      value: stats?.expiredKeys || 0,
      icon: <Clock className="w-5 h-5" />,
      accent: '#ffd93d',
      bgAccent: 'rgba(255,217,61,0.1)',
    },
    {
      label: 'Total Admins',
      value: stats?.totalAdmins || 0,
      icon: <Users className="w-5 h-5" />,
      accent: '#15919B',
      bgAccent: 'rgba(21,145,155,0.1)',
    },
    {
      label: 'Active Admins',
      value: stats?.activeAdmins || 0,
      icon: <UserCheck className="w-5 h-5" />,
      accent: '#46DFB1',
      bgAccent: 'rgba(70,223,177,0.1)',
    },
  ];

  const adminStats: StatItem[] = [
    {
      label: 'Total Keys',
      value: stats?.totalKeys || 0,
      icon: <Key className="w-5 h-5" />,
      accent: '#09D1C7',
      bgAccent: 'rgba(9,209,199,0.1)',
    },
    {
      label: 'Active Keys',
      value: stats?.activeKeys || 0,
      icon: <CheckCircle className="w-5 h-5" />,
      accent: '#80EE98',
      bgAccent: 'rgba(128,238,152,0.1)',
    },
    {
      label: 'Blocked Keys',
      value: stats?.blockedKeys || 0,
      icon: <XCircle className="w-5 h-5" />,
      accent: '#ff6b6b',
      bgAccent: 'rgba(255,107,107,0.1)',
    },
    {
      label: 'Expired Keys',
      value: stats?.expiredKeys || 0,
      icon: <Clock className="w-5 h-5" />,
      accent: '#ffd93d',
      bgAccent: 'rgba(255,217,61,0.1)',
    },
    {
      label: 'Current Balance',
      value: stats?.currentBalance || 0,
      icon: <Wallet className="w-5 h-5" />,
      accent: '#09D1C7',
      bgAccent: 'rgba(9,209,199,0.1)',
    },
    {
      label: 'Used Balance',
      value: stats?.usedBalance || 0,
      icon: <CreditCard className="w-5 h-5" />,
      accent: '#ffd93d',
      bgAccent: 'rgba(255,217,61,0.1)',
    },
  ];

  const displayStats = isOwner ? ownerStats : adminStats;

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="glass rounded-2xl p-4 sm:p-5"
          >
            <Skeleton className="h-10 w-10 rounded-xl mb-3 animate-shimmer" />
            <Skeleton className="h-7 w-16 mb-2 animate-shimmer" />
            <Skeleton className="h-3.5 w-20 animate-shimmer" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {displayStats.map((stat, i) => (
        <div
          key={stat.label}
          className="stat-card glass rounded-2xl p-4 sm:p-5"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(16px)',
            transition: `opacity 0.5s cubic-bezier(0.4,0,0.2,1) ${i * 70}ms, transform 0.5s cubic-bezier(0.4,0,0.2,1) ${i * 70}ms`,
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform duration-200"
            style={{ background: stat.bgAccent, color: stat.accent }}
          >
            {stat.icon}
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {stat.value.toLocaleString()}
          </div>
          <div className="text-xs text-white/35 mt-1 font-medium">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
