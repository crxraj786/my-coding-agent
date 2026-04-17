'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  UserPlus, Ban, RotateCcw, Trash2, Wallet, Loader2,
  Users, Shield, MoreVertical, ShieldCheck, ShieldX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { getAdmins, createAdmin, updateAdmin, deleteAdmin } from '@/lib/api';
import { formatDate } from '@/lib/utils-date';
import { useToast } from '@/hooks/use-toast';

interface Admin {
  id: string;
  adminId: string;
  displayName: string;
  status: string;
  balance: number;
  initialBalance: number;
  createdAt: string;
}

export default function AdminManager() {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);

  // Create admin dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newId, setNewId] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newName, setNewName] = useState('');
  const [newBal, setNewBal] = useState('1000');
  const [creating, setCreating] = useState(false);

  // Balance adjustment dialog
  const [balanceOpen, setBalanceOpen] = useState(false);
  const [selAdmin, setSelAdmin] = useState<Admin | null>(null);
  const [balAmt, setBalAmt] = useState('');
  const [balType, setBalType] = useState<'credit' | 'debit'>('credit');
  const [adjusting, setAdjusting] = useState(false);

  // Confirm dialog (block/unblock/delete)
  const [confirm, setConfirm] = useState<{
    type: 'block' | 'unblock' | 'delete';
    admin: Admin;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdmins();
      setAdmins(data.admins || []);
    } catch {
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const resetCreateForm = () => {
    setNewId('');
    setNewPw('');
    setNewName('');
    setNewBal('1000');
  };

  const handleCreate = async () => {
    if (!newId.trim() || !newPw.trim() || !newName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Admin ID, Password, and Display Name are required.',
        variant: 'destructive',
      });
      return;
    }
    const b = parseInt(newBal);
    if (isNaN(b) || b < 1000 || b > 100000) {
      toast({
        title: 'Validation Error',
        description: 'Initial balance must be between 1,000 and 100,000.',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    try {
      await createAdmin({
        adminId: newId.trim(),
        password: newPw,
        displayName: newName.trim(),
        initialBalance: b,
      });
      toast({ title: 'Admin created successfully' });
      setCreateOpen(false);
      resetCreateForm();
      fetchAdmins();
    } catch (err: unknown) {
      toast({
        title: 'Creation Failed',
        description: err instanceof Error ? err.message : 'Failed to create admin.',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleBalanceAdjust = async () => {
    if (!selAdmin) return;
    const amt = parseInt(balAmt);
    if (isNaN(amt) || amt <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Amount must be a positive number.',
        variant: 'destructive',
      });
      return;
    }

    setAdjusting(true);
    try {
      const currentBal = selAdmin.balance || 0;
      const newBalance = balType === 'credit' ? currentBal + amt : currentBal - amt;
      if (newBalance < 0) {
        toast({
          title: 'Validation Error',
          description: 'Resulting balance cannot go below zero.',
          variant: 'destructive',
        });
        setAdjusting(false);
        return;
      }
      await updateAdmin(selAdmin.adminId, { balance: newBalance });
      toast({ title: 'Balance updated successfully' });
      setBalanceOpen(false);
      setBalAmt('');
      fetchAdmins();
    } catch (err: unknown) {
      toast({
        title: 'Update Failed',
        description: err instanceof Error ? err.message : 'Failed to update balance.',
        variant: 'destructive',
      });
    } finally {
      setAdjusting(false);
    }
  };

  const handleAdminAction = async () => {
    if (!confirm) return;
    setActionLoading(true);
    try {
      if (confirm.type === 'delete') {
        await deleteAdmin(confirm.admin.adminId);
        toast({ title: 'Admin deleted successfully' });
      } else {
        await updateAdmin(confirm.admin.adminId, {
          status: confirm.type === 'block' ? 'blocked' : 'active',
        });
        toast({
          title: confirm.type === 'block' ? 'Admin blocked' : 'Admin unblocked',
        });
      }
      setConfirm(null);
      fetchAdmins();
    } catch (err: unknown) {
      toast({
        title: 'Action Failed',
        description: err instanceof Error ? err.message : 'Operation failed.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(21,145,155,0.15)' }}
          >
            <Users className="w-4 h-4" style={{ color: '#15919B' }} />
          </div>
          <span className="text-sm text-white/40 font-medium">
            {admins.length} admin{admins.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Create Admin Dialog */}
        <Dialog open={createOpen} onOpenChange={(v) => { setCreateOpen(v); if (!v) resetCreateForm(); }}>
          <DialogTrigger asChild>
            <Button className="btn-gradient rounded-xl h-10 text-sm gap-1.5">
              <UserPlus className="w-4 h-4" />
              <span>Create Admin</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong rounded-2xl sm:max-w-md border-white/10 p-6 sm:p-7">
            <DialogHeader>
              <DialogTitle className="text-white text-lg flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(9,209,199,0.15)' }}
                >
                  <UserPlus className="w-4 h-4" style={{ color: '#09D1C7' }} />
                </div>
                Create New Admin
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-3">
              <div className="space-y-2">
                <Label className="text-sm text-white/60 font-medium">
                  Admin ID <span className="text-red-400">*</span>
                </Label>
                <Input
                  placeholder="Enter admin ID"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  className="h-11 rounded-xl glass text-white placeholder:text-white/20 input-teal"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-white/60 font-medium">
                  Password <span className="text-red-400">*</span>
                </Label>
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="h-11 rounded-xl glass text-white placeholder:text-white/20 input-teal"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-white/60 font-medium">
                  Display Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  placeholder="Enter display name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-11 rounded-xl glass text-white placeholder:text-white/20 input-teal"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-white/60 font-medium">Initial Balance</Label>
                <Input
                  type="number"
                  min="1000"
                  max="100000"
                  value={newBal}
                  onChange={(e) => setNewBal(e.target.value)}
                  className="h-11 rounded-xl glass text-white placeholder:text-white/20 input-teal"
                />
                <p className="text-xs text-white/20 font-medium">
                  Min: 1,000 &middot; Max: 100,000
                </p>
              </div>
              <Button
                onClick={handleCreate}
                disabled={creating}
                className="w-full h-12 btn-gradient rounded-xl text-sm mt-1"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Create Admin</span>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Admin Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl animate-shimmer" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24 animate-shimmer" />
                    <Skeleton className="h-3 w-16 animate-shimmer" />
                  </div>
                </div>
              </div>
              <div className="space-y-2.5">
                <Skeleton className="h-3 w-full animate-shimmer" />
                <Skeleton className="h-3 w-3/4 animate-shimmer" />
              </div>
            </div>
          ))}
        </div>
      ) : admins.length === 0 ? (
        <div className="glass rounded-2xl p-16 flex flex-col items-center text-white/20">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <Users className="w-8 h-8 opacity-30" />
          </div>
          <p className="text-sm font-medium">No admins created yet</p>
          <p className="text-xs text-white/10 mt-1">
            Click &quot;Create Admin&quot; to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {admins.map((admin, index) => (
            <div
              key={admin.id}
              className="stat-card glass rounded-2xl p-5"
              style={{
                opacity: 1,
                animation: `fadeSlideUp 0.4s cubic-bezier(0.4,0,0.2,1) ${index * 50}ms forwards`,
              }}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(9,209,199,0.1)' }}
                  >
                    {admin.status === 'active' ? (
                      <ShieldCheck className="w-5 h-5" style={{ color: '#09D1C7' }} />
                    ) : (
                      <ShieldX className="w-5 h-5" style={{ color: '#ff6b6b' }} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">
                      {admin.displayName}
                    </h3>
                    <p className="text-xs text-white/30 mt-0.5">@{admin.adminId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className={`text-xs rounded-lg px-2.5 py-0.5 font-medium ${
                      admin.status === 'active'
                        ? 'text-emerald-400 border-emerald-500/25 bg-emerald-500/10'
                        : 'text-red-400 border-red-500/25 bg-red-500/10'
                    }`}
                  >
                    {admin.status}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-white/25 hover:text-white/50 hover:bg-white/10 rounded-lg transition-all duration-200"
                        aria-label="Admin actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="glass-strong rounded-xl border-white/10 p-1"
                      align="end"
                    >
                      <DropdownMenuItem
                        onClick={() => {
                          setSelAdmin(admin);
                          setBalAmt('');
                          setBalType('credit');
                          setBalanceOpen(true);
                        }}
                        className="text-white/50 focus:text-white focus:bg-white/10 cursor-pointer rounded-lg text-sm py-2"
                      >
                        <Wallet
                          className="w-4 h-4 mr-2.5"
                          style={{ color: '#09D1C7' }}
                        />
                        Set Balance
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/[0.05] my-1" />
                      {admin.status === 'active' ? (
                        <DropdownMenuItem
                          onClick={() => setConfirm({ type: 'block', admin })}
                          className="text-amber-400/60 focus:text-amber-400 focus:bg-amber-500/10 cursor-pointer rounded-lg text-sm py-2"
                        >
                          <Ban className="w-4 h-4 mr-2.5" />
                          Block
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => setConfirm({ type: 'unblock', admin })}
                          className="text-emerald-400/60 focus:text-emerald-400 focus:bg-emerald-500/10 cursor-pointer rounded-lg text-sm py-2"
                        >
                          <RotateCcw className="w-4 h-4 mr-2.5" />
                          Unblock
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator className="bg-white/[0.05] my-1" />
                      <DropdownMenuItem
                        onClick={() => setConfirm({ type: 'delete', admin })}
                        className="text-red-400/60 focus:text-red-400 focus:bg-red-500/10 cursor-pointer rounded-lg text-sm py-2"
                      >
                        <Trash2 className="w-4 h-4 mr-2.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Card Details */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-white/30 font-medium">Balance</span>
                  <span className="font-bold text-gradient text-sm">
                    {admin.balance?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/30 font-medium">Initial</span>
                  <span className="text-white/45 font-medium">
                    {admin.initialBalance?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-white/[0.05]">
                  <span className="text-white/20 font-medium">Created</span>
                  <span className="text-white/35 font-medium">
                    {formatDate(admin.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Balance Adjustment Dialog */}
      <Dialog open={balanceOpen} onOpenChange={setBalanceOpen}>
        <DialogContent className="glass-strong rounded-2xl sm:max-w-md border-white/10 p-6 sm:p-7">
          <DialogHeader>
            <DialogTitle className="text-white text-lg flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(9,209,199,0.15)' }}
              >
                <Wallet className="w-4 h-4" style={{ color: '#09D1C7' }} />
              </div>
              Adjust Balance
            </DialogTitle>
          </DialogHeader>
          {selAdmin && (
            <div className="space-y-4 mt-3">
              {/* Admin info box */}
              <div className="p-4 rounded-xl glass">
                <div className="flex justify-between text-sm">
                  <span className="text-white/35 font-medium">Admin:</span>
                  <span className="text-white font-semibold">{selAdmin.displayName}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-white/35 font-medium">Current Balance:</span>
                  <span className="font-bold text-gradient">
                    {selAdmin.balance?.toLocaleString() || 0}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-white/60 font-medium">Type</Label>
                <Select
                  value={balType}
                  onValueChange={(v) => setBalType(v as 'credit' | 'debit')}
                >
                  <SelectTrigger className="h-11 rounded-xl glass text-white input-teal">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-strong rounded-xl border-white/10">
                    <SelectItem value="credit">Credit (Add)</SelectItem>
                    <SelectItem value="debit">Debit (Remove)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-white/60 font-medium">Amount</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Enter amount"
                  value={balAmt}
                  onChange={(e) => setBalAmt(e.target.value)}
                  className="h-11 rounded-xl glass text-white placeholder:text-white/20 input-teal"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <DialogClose asChild>
                  <Button className="flex-1 h-11 glass rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200 font-medium">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  onClick={handleBalanceAdjust}
                  disabled={adjusting}
                  className="flex-1 h-11 btn-gradient rounded-xl text-sm font-semibold"
                >
                  {adjusting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>{balType === 'credit' ? 'Credit' : 'Debit'}</span>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <AlertDialog
        open={!!confirm}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
      >
        <AlertDialogContent className="glass-strong rounded-2xl border-white/10 p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-base">
              {confirm?.type === 'delete'
                ? 'Delete Admin'
                : confirm?.type === 'block'
                  ? 'Block Admin'
                  : 'Unblock Admin'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/40 text-sm leading-relaxed">
              {confirm?.type === 'delete'
                ? `Delete "${confirm?.admin.displayName}"? This will remove the admin and all associated data permanently.`
                : `${confirm?.type === 'block' ? 'Block' : 'Unblock'} "${confirm?.admin.displayName}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-4">
            <AlertDialogCancel className="glass rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200 font-medium">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAdminAction}
              disabled={actionLoading}
              className={`rounded-xl font-medium transition-all duration-200 ${
                confirm?.type === 'delete'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/25 hover:bg-red-500/30'
                  : confirm?.type === 'block'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/25 hover:bg-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/30'
              }`}
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                confirm?.type?.charAt(0).toUpperCase() + confirm?.type?.slice(1)
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
