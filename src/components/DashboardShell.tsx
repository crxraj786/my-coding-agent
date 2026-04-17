'use client';

import { useState, useCallback } from 'react';
import {
  Shield,
  KeyRound,
  Users,
  LayoutDashboard,
  LogOut,
  Wallet,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { ReactNode } from 'react';

interface DashboardShellProps {
  title: string;
  role: 'owner' | 'admin';
  children: ReactNode;
}

interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
}

export default function DashboardShell({ title, role, children }: DashboardShellProps) {
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('Dashboard');

  const navItems: NavItem[] =
    role === 'owner'
      ? [
          { id: 'Dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
          { id: 'Licence Keys', label: 'Licence Keys', icon: <KeyRound className="w-5 h-5" /> },
          { id: 'Manage Admins', label: 'Manage Admins', icon: <Users className="w-5 h-5" /> },
        ]
      : [
          { id: 'Dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
          { id: 'Licence Keys', label: 'Licence Keys', icon: <KeyRound className="w-5 h-5" /> },
        ];

  const displayName =
    role === 'owner'
      ? user?.email || 'Owner'
      : user?.displayName || user?.adminId || 'Admin';

  const initials = displayName
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  const handleNavClick = useCallback((id: string) => {
    setActiveNav(id);
    setMobileOpen(false);
    // Scroll to section after a small delay for mobile menu close
    setTimeout(() => {
      const sectionId = id === 'Dashboard'
        ? 'section-dashboard'
        : id === 'Licence Keys'
          ? 'section-keys'
          : 'section-admins';
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setMobileOpen(false);
  }, [logout]);

  /* ─── Sidebar Navigation (shared between desktop & mobile) ─── */
  const renderNav = () => (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const isActive = activeNav === item.id;
        return (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={`
              w-full flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium
              transition-all duration-200 cursor-pointer select-none
              ${
                isActive
                  ? 'bg-[#09D1C7]/10 text-[#09D1C7] border border-[#09D1C7]/20 shadow-[0_0_20px_rgba(9,209,199,0.08)]'
                  : 'text-white/40 hover:bg-white/5 hover:text-white/80 border border-transparent'
              }
            `}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );

  /* ─── User info + logout (shared) ─── */
  const renderUserSection = () => (
    <div className="space-y-2">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
          style={{ background: 'linear-gradient(135deg, #09D1C7, #46DFB1)', color: '#213A58' }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white truncate">{displayName}</p>
          <p className="text-[11px] text-white/30 capitalize">{role}</p>
        </div>
      </div>
      {role === 'admin' && user?.balance !== undefined && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl glass">
          <Wallet className="w-4 h-4 shrink-0" style={{ color: '#09D1C7' }} />
          <div className="min-w-0">
            <p className="text-[11px] text-white/30">Balance</p>
            <p className="text-sm font-bold text-gradient">
              {user.balance}
              {user.initialBalance !== undefined && (
                <span className="text-xs text-white/25 font-normal"> / {user.initialBalance}</span>
              )}
            </p>
          </div>
        </div>
      )}
      <Button
        variant="ghost"
        onClick={handleLogout}
        className="w-full flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer h-auto"
      >
        <LogOut className="w-5 h-5" />
        <span>Logout</span>
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* ═══════════════════════════════════════════════════════════
          MOBILE HEADER (visible below md)
          ═══════════════════════════════════════════════════════════ */}
      <header className="md:hidden sticky top-0 z-50">
        <div className="glass-strong border-b border-white/[0.06]">
          <div className="flex items-center justify-between px-4 h-14">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #09D1C7, #46DFB1)' }}
              >
                <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-bold tracking-wide text-white">LR LICENCE</span>
            </div>

            {/* Title + hamburger */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-white/40 hidden sm:inline">{title}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="text-white/50 hover:text-white hover:bg-white/10 transition-colors h-9 w-9 p-0 rounded-lg cursor-pointer"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile slide-down menu */}
        <div
          className={`
            md:hidden overflow-hidden transition-all duration-300 ease-in-out
            glass-strong border-b border-white/[0.06]
            ${mobileOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 border-b-0'}
          `}
          style={{ pointerEvents: mobileOpen ? 'auto' : 'none' }}
        >
          <div className="px-4 py-4 space-y-4">
            {/* Nav items */}
            {renderNav()}

            {/* Divider */}
            <div className="h-px bg-white/[0.06]" />

            {/* User section */}
            {renderUserSection()}
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════
          DESKTOP LAYOUT (md+)
          ═══════════════════════════════════════════════════════════ */}
      <div className="hidden md:flex min-h-screen flex-1">
        {/* ─── Sidebar ─── */}
        <aside
          className="relative w-64 shrink-0 flex flex-col border-r border-white/[0.06] overflow-hidden"
          style={{ background: 'rgba(12, 100, 120, 0.25)' }}
        >
          {/* Sidebar glass overlay */}
          <div className="absolute inset-y-0 left-0 w-64 pointer-events-none" style={{
            background: 'linear-gradient(180deg, rgba(9,209,199,0.04) 0%, transparent 40%)',
          }} />

          <div className="relative z-10 flex flex-col h-full">
            {/* Logo */}
            <div className="px-5 pt-6 pb-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #09D1C7, #46DFB1)',
                    boxShadow: '0 4px 16px rgba(9, 209, 199, 0.3)',
                  }}
                >
                  <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h1 className="text-sm font-bold tracking-wider text-white">LR LICENCE</h1>
                  <p className="text-[10px] font-medium text-white/25 tracking-wide uppercase mt-0.5">
                    Verification System
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/[0.06] mx-4" />

            {/* Navigation */}
            <div className="flex-1 px-3 pt-5 overflow-y-auto custom-scrollbar">
              <p className="text-[10px] font-semibold text-white/20 uppercase tracking-widest px-4 mb-3">
                Navigation
              </p>
              {renderNav()}
            </div>

            {/* Divider */}
            <div className="h-px bg-white/[0.06] mx-4" />

            {/* User section at bottom */}
            <div className="px-3 pt-4 pb-5">
              {renderUserSection()}
            </div>
          </div>
        </aside>

        {/* ─── Main content area ─── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top header bar */}
          <header className="sticky top-0 z-40 glass-strong border-b border-white/[0.06]">
            <div className="flex items-center justify-between px-6 lg:px-8 h-14">
              {/* Page title */}
              <h2 className="text-sm font-semibold text-white/70 tracking-wide">{title}</h2>

              {/* Right side: balance + avatar */}
              <div className="flex items-center gap-3">
                {role === 'admin' && user?.balance !== undefined && (
                  <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-xl glass transition-colors hover:border-white/[0.15]">
                    <Wallet className="w-4 h-4" style={{ color: '#09D1C7' }} />
                    <span className="text-xs text-white/30">Balance:</span>
                    <span className="text-sm font-bold text-gradient">{user.balance}</span>
                    {user.initialBalance !== undefined && (
                      <span className="text-xs text-white/20">/ {user.initialBalance}</span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-colors hover:bg-white/5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold"
                    style={{ background: 'linear-gradient(135deg, #09D1C7, #46DFB1)', color: '#213A58' }}
                  >
                    {initials}
                  </div>
                  <div className="hidden xl:block min-w-0">
                    <p className="text-xs font-medium text-white truncate max-w-32">{displayName}</p>
                    <p className="text-[10px] text-white/30 capitalize">{role}</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 px-6 lg:px-8 py-6">
            {children}
          </main>

          {/* Footer */}
          <footer className="mt-auto px-6 lg:px-8 py-4 border-t border-white/[0.04]">
            <p className="text-[11px] text-white/15 font-medium text-center">
              &copy; {new Date().getFullYear()} LR Licence Verification System. All rights reserved.
            </p>
          </footer>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MOBILE CONTENT (visible below md, separate from desktop layout)
          ═══════════════════════════════════════════════════════════ */}
      <div className="md:hidden flex-1 flex flex-col">
        {/* Mobile inner header with balance */}
        {!mobileOpen && (
          <div className="px-4 py-3 flex items-center justify-between border-b border-white/[0.04]">
            <h2 className="text-sm font-semibold text-white/60">{title}</h2>
            {role === 'admin' && user?.balance !== undefined && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg glass">
                <Wallet className="w-3.5 h-3.5" style={{ color: '#09D1C7' }} />
                <span className="text-xs font-bold text-gradient">{user.balance}</span>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <main className="flex-1 px-4 py-5">
          {children}
        </main>

        {/* Footer */}
        <footer className="mt-auto py-4 text-center">
          <p className="text-[10px] text-white/15 font-medium">
            &copy; {new Date().getFullYear()} LR Licence Verification System. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
