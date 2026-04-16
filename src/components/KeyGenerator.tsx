'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  // Cost calculation: validity × devices × 10 (as per PRD)
  const cost = useMemo(() => {
    const validity = parseInt(validityValue) || 0;
    const devices = parseInt(devicesCount) || 1;
    return validity * devices * 10;
  }, [validityValue, devicesCount]);

  const insufficientBalance = user?.role === 'admin' && user.balance !== undefined && cost > (user.balance || 0);

  const resetForm = () => {
    setUsername('');
    setManualKey('');
    setValidityType('days');
    setValidityValue('30');
    setDevicesCount('1');
  };

  const handleGenerate = async () => {
    if (!username.trim()) {
      toast({ title: 'Validation Error', description: 'Username is required.', variant: 'destructive' });
      return;
    }
    const val = parseInt(validityValue);
    if (!val || val <= 0) {
      toast({ title: 'Validation Error', description: 'Validity must be a positive number.', variant: 'destructive' });
      return;
    }
    const dev = parseInt(devicesCount);
    if (!dev || dev <= 0) {
      toast({ title: 'Validation Error', description: 'Devices count must be a positive number.', variant: 'destructive' });
      return;
    }

    if (insufficientBalance) {
      toast({ title: 'Insufficient Balance', description: 'You do not have enough balance to generate this key.', variant: 'destructive' });
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
      toast({
        title: 'Key Generated!',
        description: `Licence key for "${username.trim()}" has been created.`,
      });
      if (data.key) {
        navigator.clipboard.writeText(data.key.key || data.key).catch(() => {});
        toast({ title: 'Copied!', description: 'Key has been copied to clipboard.' });
      }
      resetForm();
      setOpen(false);
      onKeyGenerated();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate key.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button className="btn-gradient rounded-xl h-10">
          <KeyRound className="w-4 h-4 mr-2" />
          Generate Key
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card sm:max-w-md border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5" style={{ color: 'var(--lr-3)' }} />
            Generate New Licence Key
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Username */}
          <div className="space-y-2">
            <Label className="text-white/80 text-sm">Username <span className="text-red-400">*</span></Label>
            <Input
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-10"
            />
          </div>

          {/* Manual Key */}
          <div className="space-y-2">
            <Label className="text-white/80 text-sm">Manual Key (optional)</Label>
            <Input
              placeholder="Leave empty for auto-generated"
              value={manualKey}
              onChange={(e) => setManualKey(e.target.value)}
              className="h-10"
            />
            <p className="text-xs text-white/30">If empty, a random key will be generated automatically.</p>
          </div>

          {/* Validity Type + Value */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-white/80 text-sm">Validity Type</Label>
              <Select value={validityType} onValueChange={(v) => setValidityType(v as 'days' | 'hours')}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-card border-white/10">
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-white/80 text-sm">Validity Value</Label>
              <Input
                type="number"
                min="1"
                placeholder="30"
                value={validityValue}
                onChange={(e) => setValidityValue(e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          {/* Devices Count */}
          <div className="space-y-2">
            <Label className="text-white/80 text-sm">Devices Count</Label>
            <Input
              type="number"
              min="1"
              placeholder="1"
              value={devicesCount}
              onChange={(e) => setDevicesCount(e.target.value)}
              className="h-10"
            />
          </div>

          {/* Cost Preview for Admin */}
          {user?.role === 'admin' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`p-3 rounded-xl border ${
                insufficientBalance
                  ? 'bg-red-500/10 border-red-500/20'
                  : 'bg-[#09D1C7]/5 border-[#09D1C7]/15'
              }`}
            >
              <div className="flex items-center gap-2 text-sm">
                {insufficientBalance ? (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                ) : (
                  <Sparkles className="w-4 h-4 shrink-0" style={{ color: 'var(--lr-3)' }} />
                )}
                <span className={insufficientBalance ? 'text-red-400 font-semibold' : 'text-white/70'}>
                  Cost: <span className={insufficientBalance ? 'text-red-300' : ''} style={!insufficientBalance ? { color: 'var(--lr-1)', fontWeight: 700 } : {}}>{cost}</span>
                  {insufficientBalance && (
                    <span className="text-red-400/70 ml-1">(Insufficient balance: {user.balance})</span>
                  )}
                </span>
              </div>
            </motion.div>
          )}

          {/* Submit */}
          <Button
            onClick={handleGenerate}
            disabled={loading || insufficientBalance}
            className="w-full h-11 btn-gradient rounded-xl"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </span>
            ) : (
              'Generate Licence Key'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
