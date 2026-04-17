'use client';

import { useState } from 'react';
import { Shield, LogOut, Menu, X, Wallet } from 'lucide-react';
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const info =
    role === 'owner'
      ? { label: 'Owner', value: user?.email || '' }
      : { label: 'Admin', value: user?.displayName || user?.adminId || '' };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── Sticky Header ─── */}
      <header className="sticky top-0 z-50">
        <div
          className="glass-strong border-b border-white/[0.06] shadow-lg"
          style={{ boxShadow: '0 4px 30px rgba(0, 0, 0, 0.15)' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            {/* Left — Logo & Title */}
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #09D1C7, #46DFB1)' }}
              >
                <Shield className="w-[18px] h-[18px] text-white" strokeWidth={2} />
              </div>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-wide">
                {title}
              </h1>
            </div>

            {/* Right — Desktop */}
            <div className="hidden md:flex items-center gap-3">
              {role === 'admin' && user?.balance !== undefined && (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl glass transition-colors hover:border-white/15">
                  <Wallet className="w-4 h-4" style={{ color: '#09D1C7' }} />
                  <span className="text-xs text-white/40">Balance:</span>
                  <span className="text-sm font-bold text-gradient">{user.balance}</span>
                  {user.initialBalance !== undefined && (
                    <span className="text-xs text-white/25">/ {user.initialBalance}</span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl glass transition-colors hover:border-white/15">
                <span className="text-xs text-white/35">{info.label}:</span>
                <span className="text-sm text-white font-medium truncate max-w-36">
                  {info.value}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-white/40 hover:text-white hover:bg-white/10 transition-all duration-200 rounded-xl h-9 px-3.5"
              >
                <LogOut className="w-4 h-4 mr-1.5" />
                Logout
              </Button>
            </div>

            {/* Mobile toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile dropdown panel */}
        {mobileOpen && (
          <div className="md:hidden glass-strong border-b border-white/[0.06] px-4 py-4 space-y-3 animate-fade-up">
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl glass">
              <span className="text-xs text-white/35">{info.label}:</span>
              <span className="text-sm text-white font-medium">{info.value}</span>
            </div>
            {role === 'admin' && user?.balance !== undefined && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl glass">
                <Wallet className="w-4 h-4" style={{ color: '#09D1C7' }} />
                <span className="text-xs text-white/35">Balance:</span>
                <span className="text-sm font-bold text-gradient">{user.balance}</span>
                {user.initialBalance !== undefined && (
                  <span className="text-xs text-white/25">/ {user.initialBalance}</span>
                )}
              </div>
            )}
            <Button
              variant="ghost"
              className="w-full text-white/40 hover:text-white hover:bg-white/10 justify-start rounded-xl transition-colors h-11"
              onClick={() => {
                logout();
                setMobileOpen(false);
              }}
            >
              <LogOut className="w-4 h-4 mr-2.5" />
              Logout
            </Button>
          </div>
        )}
      </header>

      {/* ─── Main Content ─── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>

      {/* ─── Footer ─── */}
      <footer className="mt-auto py-5 text-center">
        <p className="text-xs text-white/15 font-medium">
          &copy; {new Date().getFullYear()} LR Licence Verification System. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
