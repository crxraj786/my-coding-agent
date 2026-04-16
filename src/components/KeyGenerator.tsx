'use client';

import { useState, useMemo } from 'react';
import { KeyRound, Loader2, AlertTriangle } from 'lucide-react';
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
      toast({ title: 'Error', description: 'Username is required.', variant: 'destructive' });
      return;
    }
    const val = parseInt(validityValue);
    if (!val || val <= 0) {
      toast({ title: 'Error', description: 'Validity must be a positive number.', variant: 'destructive' });
      return;
    }
    const dev = parseInt(devicesCount);
    if (!dev || dev <= 0) {
      toast({ title: 'Error', description: 'Devices count must be a positive number.', variant: 'destructive' });
      return;
    }

    if (insufficientBalance) {
      toast({ title: 'Error', description: 'Not enough balance.', variant: 'destructive' });
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
      toast({ title: 'Key Generated!', description: `Created for "${username.trim()}"` });
      if (data.key) {
        navigator.clipboard.writeText(data.key.key || data.key).catch(() => {});
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
        <Button className="btn-primary rounded-lg h-9 text-sm">
          <KeyRound className="w-4 h-4 mr-1.5" />
          Generate Key
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-700 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Generate New Licence Key</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label className="text-sm text-slate-300">Username <span className="text-red-400">*</span></Label>
            <Input
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-10 bg-slate-800/50 border-slate-700/50 focus:border-[#09D1C7]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-slate-300">Manual Key (optional)</Label>
            <Input
              placeholder="Leave empty for auto-generated"
              value={manualKey}
              onChange={(e) => setManualKey(e.target.value)}
              className="h-10 bg-slate-800/50 border-slate-700/50 focus:border-[#09D1C7]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm text-slate-300">Validity Type</Label>
              <Select value={validityType} onValueChange={(v) => setValidityType(v as 'days' | 'hours')}>
                <SelectTrigger className="h-10 bg-slate-800/50 border-slate-700/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-slate-300">Value</Label>
              <Input
                type="number"
                min="1"
                placeholder="30"
                value={validityValue}
                onChange={(e) => setValidityValue(e.target.value)}
                className="h-10 bg-slate-800/50 border-slate-700/50 focus:border-[#09D1C7]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-slate-300">Devices Count</Label>
            <Input
              type="number"
              min="1"
              placeholder="1"
              value={devicesCount}
              onChange={(e) => setDevicesCount(e.target.value)}
              className="h-10 bg-slate-800/50 border-slate-700/50 focus:border-[#09D1C7]"
            />
          </div>

          {user?.role === 'admin' && (
            <div className={`p-3 rounded-lg border text-sm ${
              insufficientBalance
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : 'bg-slate-800/50 border-slate-700/50 text-slate-300'
            }`}>
              <div className="flex items-center gap-2">
                {insufficientBalance && <AlertTriangle className="w-4 h-4" />}
                Cost: <span className="font-semibold text-white">{cost}</span>
                {insufficientBalance && (
                  <span className="text-red-400/70 text-xs">(Balance: {user.balance})</span>
                )}
              </div>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={loading || insufficientBalance}
            className="w-full h-11 btn-primary rounded-xl text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Licence Key'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
