'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Key, CheckCircle, XCircle, Clock, Users, UserCheck,
  Wallet, CreditCard, Loader2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getStats } from '@/lib/api';

interface StatItem {
  label: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
}

export default function StatsCards({ role }: { role: 'owner' | 'admin' }) {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getStats();
        setStats(data.stats || data);
      } catch {
        // If API fails, show zeros
        setStats({
          total_keys: 0,
          active_keys: 0,
          blocked_keys: 0,
          expired_keys: 0,
          total_admins: 0,
          active_admins: 0,
          current_balance: 0,
          used_balance: 0,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Animated counter effect
  useEffect(() => {
    if (!stats) return;
    const entries = Object.entries(stats);
    entries.forEach(([key, target]) => {
      let current = 0;
      const increment = Math.max(1, Math.ceil(target / 20));
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        setAnimatedValues((prev) => ({ ...prev, [key]: current }));
      }, 30);
      return () => clearInterval(timer);
    });
  }, [stats]);

  const ownerStats: StatItem[] = [
    {
      label: 'Total Keys',
      value: animatedValues.totalKeys || 0,
      icon: <Key className="w-5 h-5" />,
      gradient: 'linear-gradient(135deg, rgba(9,209,199,0.15), rgba(70,223,177,0.05))',
    },
    {
      label: 'Active Keys',
      value: animatedValues.activeKeys || 0,
      icon: <CheckCircle className="w-5 h-5" />,
      gradient: 'linear-gradient(135deg, rgba(128,238,152,0.15), rgba(70,223,177,0.05))',
    },
    {
      label: 'Blocked Keys',
      value: animatedValues.blockedKeys || 0,
      icon: <XCircle className="w-5 h-5" />,
      gradient: 'linear-gradient(135deg, rgba(255,107,107,0.15), rgba(255,107,107,0.05))',
    },
    {
      label: 'Expired Keys',
      value: animatedValues.expiredKeys || 0,
      icon: <Clock className="w-5 h-5" />,
      gradient: 'linear-gradient(135deg, rgba(255,217,61,0.15), rgba(255,217,61,0.05))',
    },
    {
      label: 'Total Admins',
      value: animatedValues.totalAdmins || 0,
      icon: <Users className="w-5 h-5" />,
      gradient: 'linear-gradient(135deg, rgba(21,145,155,0.15), rgba(12,100,120,0.05))',
    },
    {
      label: 'Active Admins',
      value: animatedValues.activeAdmins || 0,
      icon: <UserCheck className="w-5 h-5" />,
      gradient: 'linear-gradient(135deg, rgba(128,238,152,0.15), rgba(70,223,177,0.05))',
    },
  ];

  const adminStats: StatItem[] = [
    {
      label: 'Total Keys',
      value: animatedValues.totalKeys || 0,
      icon: <Key className="w-5 h-5" />,
      gradient: 'linear-gradient(135deg, rgba(9,209,199,0.15), rgba(70,223,177,0.05))',
    },
    {
      label: 'Active Keys',
      value: animatedValues.activeKeys || 0,
      icon: <CheckCircle className="w-5 h-5" />,
      gradient: 'linear-gradient(135deg, rgba(128,238,152,0.15), rgba(70,223,177,0.05))',
    },
    {
      label: 'Blocked Keys',
      value: animatedValues.blockedKeys || 0,
      icon: <XCircle className="w-5 h-5" />,
      gradient: 'linear-gradient(135deg, rgba(255,107,107,0.15), rgba(255,107,107,0.05))',
    },
    {
      label: 'Expired Keys',
      value: animatedValues.expiredKeys || 0,
      icon: <Clock className="w-5 h-5" />,
      gradient: 'linear-gradient(135deg, rgba(255,217,61,0.15), rgba(255,217,61,0.05))',
    },
    {
      label: 'Current Balance',
      value: animatedValues.currentBalance || 0,
      icon: <Wallet className="w-5 h-5" />,
      gradient: 'linear-gradient(135deg, rgba(128,238,152,0.15), rgba(70,223,177,0.05))',
    },
    {
      label: 'Used Balance',
      value: animatedValues.usedBalance || 0,
      icon: <CreditCard className="w-5 h-5" />,
      gradient: 'linear-gradient(135deg, rgba(255,107,107,0.15), rgba(255,107,107,0.05))',
    },
  ];

  const displayStats = role === 'owner' ? ownerStats : adminStats;

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-4">
            <Skeleton className="h-10 w-10 rounded-lg mb-3" />
            <Skeleton className="h-6 w-16 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {displayStats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.06 }}
          className="glass-card glass-card-hover rounded-2xl p-4 transition-all duration-200 cursor-default"
          style={{ background: stat.gradient }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg" style={{ background: 'rgba(9,209,199,0.1)' }}>
              <span style={{ color: 'var(--lr-3)' }}>{stat.icon}</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{stat.value}</div>
          <div className="text-xs text-white/50 mt-0.5">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  );
}
