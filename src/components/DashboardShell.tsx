'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, LogOut, Menu, X, Wallet, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { ReactNode } from 'react';

interface DashboardShellProps {
  title: string;
  role: 'owner' | 'admin';
  children: ReactNode;
}

export default function DashboardShell({ title, role, children }: DashboardShellProps) {
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userInfo = role === 'owner'
    ? { label: 'Owner', value: user?.email || '' }
    : { label: 'Admin', value: user?.displayName || user?.adminId || '' };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full">
        <div className="glass-card border-b border-white/10 shadow-lg" style={{ backdropFilter: 'blur(20px)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            {/* Left: Logo + Title */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #09D1C7, #46DFB1)' }}>
                <Shield className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-wide hidden sm:block">
                {title}
              </h1>
            </div>

            {/* Right: Desktop Info */}
            <div className="hidden md:flex items-center gap-4">
              {/* User Info */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <User className="w-4 h-4" style={{ color: 'var(--lr-3)' }} />
                <div className="text-xs">
                  <span className="text-white/50">{userInfo.label}: </span>
                  <span className="text-white font-medium">{userInfo.value}</span>
                </div>
              </div>

              {/* Balance for Admin */}
              {role === 'admin' && user?.balance !== undefined && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(9, 209, 199, 0.08)', border: '1px solid rgba(9, 209, 199, 0.15)' }}>
                  <Wallet className="w-4 h-4" style={{ color: 'var(--lr-2)' }} />
                  <div className="text-xs">
                    <span className="text-white/50">Balance: </span>
                    <span className="font-bold" style={{ color: 'var(--lr-1)' }}>{user.balance}</span>
                    {user.initialBalance && (
                      <span className="text-white/40"> / {user.initialBalance}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Logout */}
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-white/60 hover:text-white hover:bg-white/10 transition-all"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>

            {/* Mobile: Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden glass-card border-b border-white/10 overflow-hidden"
            >
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <User className="w-4 h-4" style={{ color: 'var(--lr-3)' }} />
                  <div className="text-sm">
                    <span className="text-white/50">{userInfo.label}: </span>
                    <span className="text-white font-medium">{userInfo.value}</span>
                  </div>
                </div>

                {role === 'admin' && user?.balance !== undefined && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(9, 209, 199, 0.08)' }}>
                    <Wallet className="w-4 h-4" style={{ color: 'var(--lr-2)' }} />
                    <div className="text-sm">
                      <span className="text-white/50">Balance: </span>
                      <span className="font-bold" style={{ color: 'var(--lr-1)' }}>{user.balance}</span>
                    </div>
                  </div>
                )}

                <Button
                  variant="ghost"
                  className="w-full text-white/60 hover:text-white hover:bg-white/10 justify-start"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
