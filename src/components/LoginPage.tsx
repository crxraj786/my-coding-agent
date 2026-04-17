'use client';

import { useState, useEffect } from 'react';
import { Shield, KeyRound, Eye, EyeOff, Loader2, ArrowRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/auth-store';
import { loginOwner, loginAdmin } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

/* ──────────────────────────────────────────────────────
   Splash Screen  (1.5 s)
   Animated shield icon, gradient glow, pulsing dots,
   blurred orbs using all 6 PRD colours
   ────────────────────────────────────────────────────── */
function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 80);
    const t2 = setTimeout(() => setPhase(2), 300);
    const t3 = setTimeout(() => setPhase(3), 550);
    const t4 = setTimeout(onFinish, 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onFinish]);

  const phaseStyle = (active: boolean): React.CSSProperties => ({
    opacity: active ? 1 : 0,
    transform: active
      ? 'translateY(0) scale(1)'
      : 'translateY(24px) scale(0.92)',
    transition: 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
  });

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background:
          'linear-gradient(160deg, #213A58 0%, #0C6478 40%, #15919B 100%)',
      }}
    >
      {/* Background orbs - all 6 PRD colours */}
      <div
        className="orb w-[440px] h-[440px]"
        style={{ top: '-10%', left: '-8%', background: 'rgba(9,209,199,0.14)' }}
      />
      <div
        className="orb w-[380px] h-[380px]"
        style={{
          bottom: '-8%',
          right: '-6%',
          background: 'rgba(70,223,177,0.12)',
        }}
      />
      <div
        className="orb w-[210px] h-[210px]"
        style={{
          top: '36%',
          left: '52%',
          background: 'rgba(128,238,152,0.07)',
        }}
      />
      <div
        className="orb w-[170px] h-[170px]"
        style={{
          top: '16%',
          right: '18%',
          background: 'rgba(21,145,155,0.10)',
        }}
      />
      <div
        className="orb w-[150px] h-[150px]"
        style={{
          bottom: '26%',
          left: '16%',
          background: 'rgba(12,100,120,0.12)',
        }}
      />

      {/* Central content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Shield icon - float animation + gradient glow */}
        <div style={phaseStyle(phase >= 1)} className="mb-10">
          <div
            className="w-28 h-28 rounded-3xl flex items-center justify-center animate-float glow-teal-strong"
            style={{
              background: 'linear-gradient(135deg, #09D1C7, #46DFB1)',
            }}
          >
            <Shield className="w-14 h-14 text-white" strokeWidth={1.5} />
          </div>
        </div>

        {/* Title and subtitle */}
        <div style={phaseStyle(phase >= 2)} className="text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-widest leading-tight">
            LR LICENCE
          </h1>
          <p
            className="text-lg sm:text-xl mt-3 font-semibold tracking-wide"
            style={{ color: '#09D1C7' }}
          >
            Verification System
          </p>
        </div>

        {/* Pulsing loading dots */}
        <div
          style={phaseStyle(phase >= 3)}
          className="flex items-center gap-3 mt-14"
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background:
                  'linear-gradient(135deg, #09D1C7, #46DFB1)',
                animation: `pulseGlow 1.4s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────
   PasswordField - reusable input with eye toggle
   ────────────────────────────────────────────────────── */
function PasswordField({
  value,
  onChange,
  show,
  onToggleShow,
  placeholder,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  placeholder: string;
  autoComplete: string;
}) {
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 rounded-xl pr-12 glass-strong text-white placeholder:text-white/25 input-teal"
        autoComplete={autoComplete}
      />
      <button
        type="button"
        onClick={onToggleShow}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors p-1 rounded-md"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? (
          <EyeOff className="w-4 h-4" />
        ) : (
          <Eye className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────────────
   ErrorBox - red glass card with lock icon
   ────────────────────────────────────────────────────── */
function ErrorBox({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div
      className="p-3.5 rounded-xl text-sm flex items-start gap-2.5 animate-fade-up"
      style={{
        background: 'rgba(239, 68, 68, 0.10)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(239, 68, 68, 0.20)',
        color: '#fca5a5',
      }}
    >
      <Lock
        className="w-4 h-4 mt-0.5 shrink-0"
        style={{ color: '#ef4444' }}
      />
      <span>{message}</span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────
   SubmitButton - gradient button with loading state
   ────────────────────────────────────────────────────── */
function SubmitButton({
  loading,
  label,
}: {
  loading: boolean;
  label: string;
}) {
  return (
    <Button
      type="submit"
      className="w-full h-12 rounded-xl btn-gradient text-sm flex items-center justify-center gap-2"
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <span>{label}</span>
          <ArrowRight className="w-4 h-4" />
        </>
      )}
    </Button>
  );
}

/* ──────────────────────────────────────────────────────
   LoginPage - main component
   ────────────────────────────────────────────────────── */
export default function LoginPage() {
  const [showSplash, setShowSplash] = useState(true);
  const [cardVisible, setCardVisible] = useState(false);
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

  /* Reveal login card after splash */
  useEffect(() => {
    if (!showSplash) {
      const t = setTimeout(() => setCardVisible(true), 60);
      return () => clearTimeout(t);
    }
  }, [showSplash]);

  const clearError = () => setError('');

  /* Owner login handler */
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
      toast({ title: 'Welcome back, Owner!' });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Invalid credentials';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* Admin login handler */
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
      toast({
        title: `Welcome, ${data.data?.displayName || adminId}!`,
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Invalid credentials';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* Splash phase */
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  /* Login card phase */
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background:
          'linear-gradient(160deg, #213A58 0%, #0C6478 40%, #15919B 100%)',
      }}
    >
      {/* Background orbs - all 6 PRD colours */}
      <div
        className="orb w-[500px] h-[500px]"
        style={{
          top: '-14%',
          right: '-12%',
          background: 'rgba(9,209,199,0.10)',
        }}
      />
      <div
        className="orb w-[420px] h-[420px]"
        style={{
          bottom: '-10%',
          left: '-10%',
          background: 'rgba(70,223,177,0.08)',
        }}
      />
      <div
        className="orb w-[240px] h-[240px]"
        style={{
          top: '20%',
          left: '10%',
          background: 'rgba(128,238,152,0.05)',
        }}
      />
      <div
        className="orb w-[190px] h-[190px]"
        style={{
          top: '12%',
          right: '12%',
          background: 'rgba(21,145,155,0.08)',
        }}
      />
      <div
        className="orb w-[170px] h-[170px]"
        style={{
          bottom: '20%',
          right: '28%',
          background: 'rgba(12,100,120,0.10)',
        }}
      />
      <div
        className="orb w-[140px] h-[140px]"
        style={{
          bottom: '34%',
          left: '26%',
          background: 'rgba(33,58,88,0.18)',
        }}
      />

      {/* Login card */}
      <div
        className="w-full max-w-md relative z-10"
        style={{
          opacity: cardVisible ? 1 : 0,
          transform: cardVisible
            ? 'translateY(0) scale(1)'
            : 'translateY(36px) scale(0.96)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Glass card */}
        <div
          className="rounded-3xl p-8 sm:p-10 shadow-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            border: '1px solid rgba(255, 255, 255, 0.10)',
          }}
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center glow-teal"
                style={{
                  background:
                    'linear-gradient(135deg, #09D1C7, #46DFB1)',
                }}
              >
                <Shield
                  className="w-8 h-8 text-white"
                  strokeWidth={1.5}
                />
              </div>
            </div>
            <h1 className="text-xl font-bold text-white tracking-wider leading-snug">
              LR LICENCE VERIFICATION
            </h1>
            <p
              className="text-sm mt-2 font-medium"
              style={{ color: '#15919B' }}
            >
              Secure Key Management System
            </p>
          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v);
              clearError();
            }}
            className="w-full"
          >
            <TabsList
              className="w-full grid grid-cols-2 mb-7 h-12 rounded-xl p-1"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <TabsTrigger
                value="owner"
                className="rounded-lg text-sm font-medium transition-all duration-300 data-[state=active]:shadow-lg text-white/50 hover:text-white/70 data-[state=active]:bg-[#09D1C7] data-[state=active]:text-[#213A58]"
              >
                <Shield className="w-4 h-4 mr-1.5" />
                Owner Login
              </TabsTrigger>
              <TabsTrigger
                value="admin"
                className="rounded-lg text-sm font-medium transition-all duration-300 data-[state=active]:shadow-lg text-white/50 hover:text-white/70 data-[state=active]:bg-[#09D1C7] data-[state=active]:text-[#213A58]"
              >
                <KeyRound className="w-4 h-4 mr-1.5" />
                Admin Login
              </TabsTrigger>
            </TabsList>

            {/* Owner Form */}
            <TabsContent value="owner">
              <form
                onSubmit={handleOwnerLogin}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <Label
                    className="text-sm font-medium"
                    style={{ color: 'rgba(255,255,255,0.55)' }}
                  >
                    Email Address
                  </Label>
                  <Input
                    type="email"
                    placeholder="owner@example.com"
                    value={ownerEmail}
                    onChange={(e) => {
                      setOwnerEmail(e.target.value);
                      clearError();
                    }}
                    className="h-12 rounded-xl glass-strong text-white placeholder:text-white/25 input-teal"
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    className="text-sm font-medium"
                    style={{ color: 'rgba(255,255,255,0.55)' }}
                  >
                    Password
                  </Label>
                  <PasswordField
                    value={ownerPassword}
                    onChange={(v) => {
                      setOwnerPassword(v);
                      clearError();
                    }}
                    show={showOwnerPw}
                    onToggleShow={() => setShowOwnerPw(!showOwnerPw)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                </div>

                <ErrorBox message={error} />
                <SubmitButton
                  loading={loading}
                  label="Sign In as Owner"
                />
              </form>
            </TabsContent>

            {/* Admin Form */}
            <TabsContent value="admin">
              <form
                onSubmit={handleAdminLogin}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <Label
                    className="text-sm font-medium"
                    style={{ color: 'rgba(255,255,255,0.55)' }}
                  >
                    Admin ID
                  </Label>
                  <Input
                    type="text"
                    placeholder="Enter your admin ID"
                    value={adminId}
                    onChange={(e) => {
                      setAdminId(e.target.value);
                      clearError();
                    }}
                    className="h-12 rounded-xl glass-strong text-white placeholder:text-white/25 input-teal"
                    autoComplete="username"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    className="text-sm font-medium"
                    style={{ color: 'rgba(255,255,255,0.55)' }}
                  >
                    Password
                  </Label>
                  <PasswordField
                    value={adminPassword}
                    onChange={(v) => {
                      setAdminPassword(v);
                      clearError();
                    }}
                    show={showAdminPw}
                    onToggleShow={() => setShowAdminPw(!showAdminPw)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                </div>

                <ErrorBox message={error} />
                <SubmitButton
                  loading={loading}
                  label="Sign In as Admin"
                />
              </form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <p
          className="text-center text-xs mt-6 font-medium"
          style={{ color: 'rgba(255,255,255,0.20)' }}
        >
          &copy; {new Date().getFullYear()} LR Licence Verification
          System. All rights reserved.
        </p>
      </div>
    </div>
  );
}
