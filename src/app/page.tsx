'use client';

import { useAuthStore } from '@/store/auth-store';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import LoginPage from '@/components/LoginPage';
import OwnerDashboard from '@/components/OwnerDashboard';
import AdminDashboard from '@/components/AdminDashboard';
import SetupPage from '@/components/SetupPage';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="gradient-spinner" />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-white/40"
      >
        Loading system...
      </motion.p>
    </div>
  );
}

export default function Home() {
  const { isAuthenticated, user } = useAuthStore();
  const [isSetup, setIsSetup] = useState<boolean | null>(null);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    fetch('/api/setup')
      .then((res) => res.json())
      .then((data) => {
        setIsSetup(data.setup);
        if (!data.setup) setShowSetup(true);
      })
      .catch(() => {
        // If setup endpoint doesn't exist, assume setup needed
        setIsSetup(false);
        setShowSetup(true);
      });
  }, []);

  if (isSetup === null) {
    return <LoadingScreen />;
  }

  if (showSetup && !isSetup) {
    return <SetupPage onSetupComplete={() => setShowSetup(false)} />;
  }

  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  if (user.role === 'owner') {
    return <OwnerDashboard />;
  }

  return <AdminDashboard />;
}
