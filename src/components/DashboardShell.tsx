'use client';

import { useState } from 'react';
import { Shield, LogOut, Menu, X, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { ReactNode } from 'react';

interface Props {
  title: string;
  role: 'owner' | 'admin';
  children: ReactNode;
}

export default function DashboardShell({ title, role, children }: Props) {
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const info = role === 'owner'
    ? { label: 'Owner', value: user?.email || '' }
    : { label: 'Admin', value: user?.displayName || user?.adminId || '' };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50">
        <div className="glass-strong border-b border-white/[0.06] shadow-lg">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            {/* Left */}
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #09D1C7, #46DFB1)' }}
              >
                <Shield className="w-4.5 h-4.5 text-white" />
              </div>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-wide">
                {title}
              </h1>
            </div>

            {/* Right - Desktop */}
            <div className="hidden md:flex items-center gap-3">
              {role === 'admin' && user?.balance !== undefined && (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl glass">
                  <Wallet className="w-4 h-4" style={{ color: '#09D1C7' }} />
                  <span className="text-xs text-white/50">Balance:</span>
                  <span className="text-sm font-bold text-gradient">{user.balance}</span>
                  {user.initialBalance !== undefined && (
                    <span className="text-xs text-white/30">/ {user.initialBalance}</span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl glass">
                <span className="text-xs text-white/40">{info.label}:</span>
                <span className="text-sm text-white font-medium">{info.value}</span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-white/50 hover:text-white hover:bg-white/10 transition-colors rounded-xl h-9 px-3"
              >
                <LogOut className="w-4 h-4 mr-1.5" />
                Logout
              </Button>
            </div>

            {/* Mobile toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-white/60 hover:text-white hover:bg-white/10"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden glass-strong border-b border-white/[0.06] px-4 py-4 space-y-3 animate-fade-up">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl glass">
              <span className="text-xs text-white/40">{info.label}:</span>
              <span className="text-sm text-white font-medium">{info.value}</span>
            </div>
            {role === 'admin' && user?.balance !== undefined && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl glass">
                <Wallet className="w-4 h-4" style={{ color: '#09D1C7' }} />
                <span className="text-xs text-white/40">Balance:</span>
                <span className="text-sm font-bold text-gradient">{user.balance}</span>
              </div>
            )}
            <Button
              variant="ghost"
              className="w-full text-white/50 hover:text-white hover:bg-white/10 justify-start rounded-xl"
              onClick={() => { logout(); setMobileOpen(false); }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </header>

      {/* Main */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
}
