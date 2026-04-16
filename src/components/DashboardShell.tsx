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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userInfo = role === 'owner'
    ? { label: 'Owner', value: user?.email || '' }
    : { label: 'Admin', value: user?.displayName || user?.adminId || '' };

  return (
    <div className="min-h-screen flex flex-col bg-[#0f172a]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Left */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#09D1C7]/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-[#09D1C7]" />
            </div>
            <h1 className="text-sm font-semibold text-white">{title}</h1>
          </div>

          {/* Right - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            {role === 'admin' && user?.balance !== undefined && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <Wallet className="w-4 h-4 text-[#09D1C7]" />
                <span className="text-xs text-slate-400">Balance:</span>
                <span className="text-sm font-semibold text-white">{user.balance}</span>
                {user.initialBalance && (
                  <span className="text-xs text-slate-500">/ {user.initialBalance}</span>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <span className="text-xs text-slate-400">{userInfo.label}:</span>
              <span className="text-sm text-white font-medium">{userInfo.value}</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Logout
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-[#0f172a] px-4 py-3 space-y-2">
            <div className="text-sm text-slate-300">
              {userInfo.label}: <span className="font-medium text-white">{userInfo.value}</span>
            </div>
            {role === 'admin' && user?.balance !== undefined && (
              <div className="text-sm text-slate-300">
                Balance: <span className="font-medium text-white">{user.balance}</span>
              </div>
            )}
            <Button
              variant="ghost"
              className="w-full text-slate-400 hover:text-white justify-start"
              onClick={() => { logout(); setMobileMenuOpen(false); }}
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
