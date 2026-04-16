'use client';

import { useAuthStore } from '@/store/auth-store';
import LoginPage from '@/components/LoginPage';
import OwnerDashboard from '@/components/OwnerDashboard';
import AdminDashboard from '@/components/AdminDashboard';

export default function Home() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  if (user.role === 'owner') {
    return <OwnerDashboard />;
  }

  return <AdminDashboard />;
}
