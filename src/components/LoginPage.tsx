'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, KeyRound, Eye, EyeOff, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/auth-store';
import { loginOwner, loginAdmin } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuthStore();
  const { toast } = useToast();

  const handleOwnerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!ownerEmail.trim() || !ownerPassword.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const data = await loginOwner(ownerEmail, ownerPassword);
      login({
        role: 'owner',
        token: data.token,
        email: ownerEmail,
      });
      toast({ title: 'Welcome back, Owner!', description: 'Successfully logged in.' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!adminId.trim() || !adminPassword.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const data = await loginAdmin(adminId, adminPassword);
      login({
        role: 'admin',
        token: data.token,
        adminId: data.data?.adminId || adminId,
        displayName: data.data?.displayName,
        balance: data.data?.balance,
        initialBalance: data.data?.initialBalance,
      });
      toast({ title: 'Welcome back!', description: `Logged in as ${data.data?.displayName || adminId}` });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #09D1C7, transparent)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #46DFB1, transparent)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card rounded-2xl p-8 shadow-2xl">
          {/* Logo / Title */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{ background: 'linear-gradient(135deg, #09D1C7, #46DFB1)' }}>
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">
              LR LICENCE VERIFICATION
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--lr-4)' }}>
              Secure Key Management System
            </p>
          </motion.div>

          {/* Tabs */}
          <Tabs defaultValue="owner" className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-6"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
              <TabsTrigger
                value="owner"
                className="data-[state=active]:text-[#213A58] data-[state=active]:font-semibold transition-all rounded-lg"
                style={{
                  '--tw-bg-opacity': 1,
                } as React.CSSProperties}
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>Owner Login</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="admin"
                className="data-[state=active]:text-[#213A58] data-[state=active]:font-semibold transition-all rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4" />
                  <span>Admin Login</span>
                </div>
              </TabsTrigger>
            </TabsList>

            {/* Owner Login Form */}
            <TabsContent value="owner">
              <form onSubmit={handleOwnerLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="owner-email" className="text-white/80 text-sm">
                    Email Address
                  </Label>
                  <Input
                    id="owner-email"
                    type="email"
                    placeholder="owner@example.com"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    className="h-11"
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="owner-password" className="text-white/80 text-sm">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="owner-password"
                      type={showOwnerPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={ownerPassword}
                      onChange={(e) => setOwnerPassword(e.target.value)}
                      className="h-11 pr-10"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                    >
                      {showOwnerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 text-base btn-gradient rounded-xl"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    'Sign In as Owner'
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Admin Login Form */}
            <TabsContent value="admin">
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-id" className="text-white/80 text-sm">
                    Admin ID
                  </Label>
                  <Input
                    id="admin-id"
                    type="text"
                    placeholder="Enter your admin ID"
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value)}
                    className="h-11"
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password" className="text-white/80 text-sm">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="admin-password"
                      type={showAdminPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="h-11 pr-10"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                    >
                      {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 text-base btn-gradient rounded-xl"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    'Sign In as Admin'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-xs mt-4 text-white/30"
        >
          LR Licence Verification System &copy; {new Date().getFullYear()}
        </motion.p>
      </motion.div>
    </div>
  );
}
