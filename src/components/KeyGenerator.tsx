'use client';

import { useState, useMemo } from 'react';
import { KeyRound, Loader2, AlertTriangle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/store/auth-store';
import { generateKey } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface KeyGeneratorProps {
  onKeyGenerated: () => void;
}

export default function KeyGenerator({ onKeyGenerated }: KeyGeneratorProps) {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [validityType, setValidityType] = useState<'days' | 'hours'>('days');
  const [validityValue, setValidityValue] = useState('30');
  const [devicesCount, setDevicesCount] = useState('1');
  const [loading, setLoading] = useState(false);

  const cost = useMemo(() => {
    return (parseInt(validityValue) || 0) * (parseInt(devicesCount) || 1) * 10;
  }, [validityValue, devicesCount]);

  const insufficientBalance = user?.role === 'admin' && cost > (user.balance || 0);

  const resetForm = () => {
    setUsername('');
    setManualKey('');
    setValidityType('days');
    setValidityValue('30');
    setDevicesCount('1');
  };

  const handleGenerate = async () => {
    if (!username.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Username is required.',
        variant: 'destructive',
      });
      return;
    }
    const val = parseInt(validityValue);
    const dev = parseInt(devicesCount);
    if (!val || val <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Validity must be a positive number.',
        variant: 'destructive',
      });
      return;
    }
    if (!dev || dev <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Devices count must be a positive number.',
        variant: 'destructive',
      });
      return;
    }
    if (insufficientBalance) {
      toast({
        title: 'Insufficient Balance',
        description: 'You do not have enough balance to generate this key.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const data = await generateKey({
        username: username.trim(),
        manualKey: manualKey.trim() || undefined,
        validityType,
        validityValue: val,
        devicesLimit: dev,
      });
      toast({ title: 'Key Generated!', description: `Licence created for "${username.trim()}"` });
      const generatedKey = typeof data.key === 'string' ? data.key : data.key?.key;
      if (generatedKey) {
        navigator.clipboard.writeText(generatedKey).catch(() => {});
      }
      resetForm();
      setOpen(false);
      onKeyGenerated();
    } catch (err: unknown) {
      toast({
        title: 'Generation Failed',
        description: err instanceof Error ? err.message : 'Failed to generate key.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button className="btn-gradient rounded-xl h-10 text-sm gap-1.5">
          <KeyRound className="w-4 h-4" />
          <span>Generate Key</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-strong rounded-2xl sm:max-w-md border-white/10 p-6 sm:p-7">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2.5 text-lg">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(9,209,199,0.15)' }}
            >
              <Sparkles className="w-4 h-4" style={{ color: '#09D1C7' }} />
            </div>
            Generate Licence Key
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* Username */}
          <div className="space-y-2">
            <Label className="text-sm text-white/60 font-medium">
              Username <span className="text-red-400">*</span>
            </Label>
            <Input
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-11 rounded-xl glass text-white placeholder:text-white/20 input-teal"
            />
          </div>

          {/* Manual Key */}
          <div className="space-y-2">
            <Label className="text-sm text-white/60 font-medium">
              Manual Key{' '}
              <span className="text-white/25 text-xs font-normal">(optional)</span>
            </Label>
            <Input
              placeholder="Leave empty for auto-generated"
              value={manualKey}
              onChange={(e) => setManualKey(e.target.value)}
              className="h-11 rounded-xl glass text-white placeholder:text-white/20 input-teal"
            />
          </div>

          {/* Validity Type + Value */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm text-white/60 font-medium">Validity Type</Label>
              <Select
                value={validityType}
                onValueChange={(v) => setValidityType(v as 'days' | 'hours')}
              >
                <SelectTrigger className="h-11 rounded-xl glass text-white input-teal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-strong rounded-xl border-white/10">
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-white/60 font-medium">Value</Label>
              <Input
                type="number"
                min="1"
                placeholder="30"
                value={validityValue}
                onChange={(e) => setValidityValue(e.target.value)}
                className="h-11 rounded-xl glass text-white placeholder:text-white/20 input-teal"
              />
            </div>
          </div>

          {/* Devices Count */}
          <div className="space-y-2">
            <Label className="text-sm text-white/60 font-medium">Devices Count</Label>
            <Input
              type="number"
              min="1"
              placeholder="1"
              value={devicesCount}
              onChange={(e) => setDevicesCount(e.target.value)}
              className="h-11 rounded-xl glass text-white placeholder:text-white/20 input-teal"
            />
          </div>

          {/* Cost Display (admin only) */}
          {user?.role === 'admin' && (
            <div
              className={`p-3.5 rounded-xl border text-sm transition-all duration-200 ${
                insufficientBalance
                  ? 'bg-red-500/10 border-red-500/20 text-red-400'
                  : 'bg-[#09D1C7]/5 border-[#09D1C7]/15 text-white/60'
              }`}
            >
              <div className="flex items-center gap-2">
                {insufficientBalance && <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>Cost:</span>
                <span className="font-bold text-gradient">{cost}</span>
                <span className="text-white/25 text-xs">balance points</span>
                {insufficientBalance && (
                  <span className="text-red-400/50 text-xs ml-auto">
                    (Balance: {user.balance})
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Submit */}
          <Button
            onClick={handleGenerate}
            disabled={loading || insufficientBalance}
            className="w-full h-12 btn-gradient rounded-xl text-sm mt-1"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>Generate Licence Key</span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
