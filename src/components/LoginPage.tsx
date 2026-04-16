'use client';

import { useState } from 'react';
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
      toast({ title: 'Welcome, Owner!' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
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
      toast({ title: `Welcome, ${data.data?.displayName || adminId}!` });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="lr-card p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 bg-[#09D1C7]/10">
              <Shield className="w-7 h-7 text-[#09D1C7]" />
            </div>
            <h1 className="text-xl font-bold text-white">
              LR Licence Verification
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Secure Key Management System
            </p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="owner" className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-6 bg-slate-800/50 border border-slate-700/50 h-10">
              <TabsTrigger
                value="owner"
                className="data-[state=active]:bg-[#09D1C7] data-[state=active]:text-slate-900 data-[state=active]:font-semibold rounded-md text-sm transition-all"
              >
                <User className="w-4 h-4 mr-1.5" />
                Owner
              </TabsTrigger>
              <TabsTrigger
                value="admin"
                className="data-[state=active]:bg-[#09D1C7] data-[state=active]:text-slate-900 data-[state=active]:font-semibold rounded-md text-sm transition-all"
              >
                <KeyRound className="w-4 h-4 mr-1.5" />
                Admin
              </TabsTrigger>
            </TabsList>

            {/* Owner Login */}
            <TabsContent value="owner">
              <form onSubmit={handleOwnerLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm text-slate-300">Email Address</Label>
                  <Input
                    type="email"
                    placeholder="owner@example.com"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    className="h-11 bg-slate-800/50 border-slate-700/50 focus:border-[#09D1C7] focus:ring-[#09D1C7]/20"
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-300">Password</Label>
                  <div className="relative">
                    <Input
                      type={showOwnerPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={ownerPassword}
                      onChange={(e) => setOwnerPassword(e.target.value)}
                      className="h-11 pr-10 bg-slate-800/50 border-slate-700/50 focus:border-[#09D1C7] focus:ring-[#09D1C7]/20"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showOwnerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 text-sm btn-primary rounded-xl"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Sign In as Owner'
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Admin Login */}
            <TabsContent value="admin">
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm text-slate-300">Admin ID</Label>
                  <Input
                    type="text"
                    placeholder="Enter your admin ID"
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value)}
                    className="h-11 bg-slate-800/50 border-slate-700/50 focus:border-[#09D1C7] focus:ring-[#09D1C7]/20"
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-300">Password</Label>
                  <div className="relative">
                    <Input
                      type={showAdminPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="h-11 pr-10 bg-slate-800/50 border-slate-700/50 focus:border-[#09D1C7] focus:ring-[#09D1C7]/20"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 text-sm btn-primary rounded-xl"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Sign In as Admin'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <p className="text-center text-xs mt-4 text-slate-600">
          LR Licence Verification System &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
