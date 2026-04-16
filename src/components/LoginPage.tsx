'use client';

import { useState, useEffect } from 'react';
import { Shield, KeyRound, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/auth-store';
import { loginOwner, loginAdmin } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

/* ─── Splash Screen (1.5s) ─── */
function SplashScreen({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    const t = setTimeout(onFinish, 1500);
    return () => clearTimeout(t);
  }, [onFinish]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      <div className="orb w-72 h-72 -top-20 -left-20" style={{ background: 'rgba(9,209,199,0.15)' }} />
      <div className="orb w-64 h-64 -bottom-16 -right-16" style={{ background: 'rgba(70,223,177,0.12)' }} />
      <div className="orb w-48 h-48 top-1/3 right-1/4" style={{ background: 'rgba(128,238,152,0.08)' }} />

      <div className="relative z-10 flex flex-col items-center opacity-0 animate-fade-up">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 glow-teal"
          style={{ background: 'linear-gradient(135deg, #09D1C7, #46DFB1)' }}
        >
          <Shield className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-wide">
          LR LICENCE
        </h1>
        <p className="text-sm mt-1" style={{ color: '#09D1C7' }}>
          Verification System
        </p>
        <div className="flex items-center gap-1.5 mt-10">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: '#09D1C7',
                animation: `pulseGlow 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Login Page ─── */
export default function LoginPage() {
  const [showSplash, setShowSplash] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('owner');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showOwnerPw, setShowOwnerPw] = useState(false);
  const [showAdminPw, setShowAdminPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuthStore();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const clearError = () => setError('');

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
      login({ role: 'owner', token: data.token, email: ownerEmail });
      toast({ title: 'Welcome, Owner!' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
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
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="orb w-80 h-80 -top-32 -right-32" style={{ background: 'rgba(9,209,199,0.12)' }} />
      <div className="orb w-72 h-72 -bottom-24 -left-24" style={{ background: 'rgba(70,223,177,0.10)' }} />
      <div className="orb w-40 h-40 top-1/4 left-1/3" style={{ background: 'rgba(128,238,152,0.06)' }} />

      {/* Login Card */}
      <div
        className={`w-full max-w-md relative z-10 transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="glass rounded-3xl p-8 sm:p-10 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 glow-teal"
              style={{ background: 'linear-gradient(135deg, #09D1C7, #46DFB1)' }}
            >
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              LR LICENCE VERIFICATION
            </h1>
            <p className="text-sm mt-1" style={{ color: '#15919B' }}>
              Secure Key Management System
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); clearError(); }} className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-6 h-11 glass-strong rounded-xl p-1">
              <TabsTrigger
                value="owner"
                className="rounded-lg text-sm font-medium transition-all duration-200 data-[state=active]:bg-[#09D1C7] data-[state=active]:text-[#213A58] data-[state=active]:shadow-lg text-white/60 hover:text-white/80"
              >
                <Shield className="w-4 h-4 mr-1.5" />
                Owner Login
              </TabsTrigger>
              <TabsTrigger
                value="admin"
                className="rounded-lg text-sm font-medium transition-all duration-200 data-[state=active]:bg-[#09D1C7] data-[state=active]:text-[#213A58] data-[state=active]:shadow-lg text-white/60 hover:text-white/80"
              >
                <KeyRound className="w-4 h-4 mr-1.5" />
                Admin Login
              </TabsTrigger>
            </TabsList>

            {/* Owner Form */}
            <TabsContent value="owner">
              <form onSubmit={handleOwnerLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm text-white/70">Email Address</Label>
                  <Input
                    type="email"
                    placeholder="owner@example.com"
                    value={ownerEmail}
                    onChange={(e) => { setOwnerEmail(e.target.value); clearError(); }}
                    className="h-12 rounded-xl glass-strong text-white placeholder:text-white/30 focus:border-[#09D1C7]/50"
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-white/70">Password</Label>
                  <div className="relative">
                    <Input
                      type={showOwnerPw ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={ownerPassword}
                      onChange={(e) => { setOwnerPassword(e.target.value); clearError(); }}
                      className="h-12 rounded-xl pr-11 glass-strong text-white placeholder:text-white/30 focus:border-[#09D1C7]/50"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOwnerPw(!showOwnerPw)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showOwnerPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-up">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl btn-gradient text-sm flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Sign In as Owner
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Admin Form */}
            <TabsContent value="admin">
              <form onSubmit={handleAdminLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm text-white/70">Admin ID</Label>
                  <Input
                    type="text"
                    placeholder="Enter your admin ID"
                    value={adminId}
                    onChange={(e) => { setAdminId(e.target.value); clearError(); }}
                    className="h-12 rounded-xl glass-strong text-white placeholder:text-white/30 focus:border-[#09D1C7]/50"
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-white/70">Password</Label>
                  <div className="relative">
                    <Input
                      type={showAdminPw ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={adminPassword}
                      onChange={(e) => { setAdminPassword(e.target.value); clearError(); }}
                      className="h-12 rounded-xl pr-11 glass-strong text-white placeholder:text-white/30 focus:border-[#09D1C7]/50"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPw(!showAdminPw)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showAdminPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-up">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl btn-gradient text-sm flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Sign In as Admin
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-5 text-white/25">
          LR Licence Verification System &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
