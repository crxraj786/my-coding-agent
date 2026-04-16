'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  UserPlus, Ban, RotateCcw, Trash2, Wallet, Loader2,
  Users, Shield, MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  const [createOpen, setCreateOpen] = useState(false);
  const [balanceOpen, setBalanceOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'block' | 'unblock' | 'delete';
    admin: Admin;
  } | null>(null);

  const [newAdminId, setNewAdminId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newInitialBalance, setNewInitialBalance] = useState('1000');
  const [creating, setCreating] = useState(false);

  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceType, setBalanceType] = useState<'credit' | 'debit'>('credit');
  const [adjusting, setAdjusting] = useState(false);
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

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  const handleCreateAdmin = async () => {
    if (!newAdminId.trim() || !newPassword.trim() || !newDisplayName.trim()) {
      toast({ title: 'Error', description: 'All fields are required.', variant: 'destructive' });
      return;
    }
    const balance = parseInt(newInitialBalance);
    if (!balance || balance < 1000) {
      toast({ title: 'Error', description: 'Balance must be at least 1000.', variant: 'destructive' });
      return;
    }
    if (balance > 100000) {
      toast({ title: 'Error', description: 'Balance cannot exceed 100,000.', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      await createAdmin({
        adminId: newAdminId.trim(),
        password: newPassword,
        displayName: newDisplayName.trim(),
      });
      toast({ title: 'Admin Created' });
      setCreateOpen(false);
      setNewAdminId(''); setNewPassword(''); setNewDisplayName(''); setNewInitialBalance('1000');
      fetchAdmins();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create admin.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleAdjustBalance = async () => {
    if (!selectedAdmin) return;
    const amount = parseInt(balanceAmount);
    if (!amount || amount <= 0) {
      toast({ title: 'Error', description: 'Amount must be positive.', variant: 'destructive' });
      return;
    }

    setAdjusting(true);
    try {
      const newBal = balanceType === 'credit'
        ? (selectedAdmin.balance || 0) + amount
        : (selectedAdmin.balance || 0) - amount;
      if (newBal < 0) {
        toast({ title: 'Error', description: 'Balance cannot go below 0.', variant: 'destructive' });
        setAdjusting(false);
        return;
      }
      await updateAdmin(selectedAdmin.adminId, { balance: newBal });
      toast({ title: 'Balance Updated' });
      setBalanceOpen(false);
      setBalanceAmount('');
      fetchAdmins();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to adjust balance.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setAdjusting(false);
    }
  };

  const handleAdminAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      if (confirmAction.type === 'delete') {
        await deleteAdmin(confirmAction.admin.adminId);
        toast({ title: 'Deleted' });
      } else {
        const newStatus = confirmAction.type === 'block' ? 'blocked' : 'active';
        await updateAdmin(confirmAction.admin.adminId, { status: newStatus });
        toast({ title: confirmAction.type === 'block' ? 'Blocked' : 'Unblocked' });
      }
      setConfirmAction(null);
      fetchAdmins();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Action failed.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const openBalanceDialog = (admin: Admin) => {
    setSelectedAdmin(admin);
    setBalanceAmount('');
    setBalanceType('credit');
    setBalanceOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-400">
          <Users className="w-4 h-4" />
          <span className="text-sm">{admins.length} admin(s)</span>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary rounded-lg h-9 text-sm">
              <UserPlus className="w-4 h-4 mr-1.5" />
              Create Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Admin</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label className="text-sm text-slate-300">Admin ID <span className="text-red-400">*</span></Label>
                <Input placeholder="Enter admin ID" value={newAdminId} onChange={(e) => setNewAdminId(e.target.value)}
                  className="h-10 bg-slate-800/50 border-slate-700/50 focus:border-[#09D1C7]" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-slate-300">Password <span className="text-red-400">*</span></Label>
                <Input type="password" placeholder="Enter password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="h-10 bg-slate-800/50 border-slate-700/50 focus:border-[#09D1C7]" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-slate-300">Display Name <span className="text-red-400">*</span></Label>
                <Input placeholder="Enter display name" value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)}
                  className="h-10 bg-slate-800/50 border-slate-700/50 focus:border-[#09D1C7]" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-slate-300">Initial Balance</Label>
                <Input type="number" min="1000" max="100000" value={newInitialBalance} onChange={(e) => setNewInitialBalance(e.target.value)}
                  className="h-10 bg-slate-800/50 border-slate-700/50 focus:border-[#09D1C7]" />
                <p className="text-xs text-slate-500">Min: 1,000 | Max: 100,000</p>
              </div>
              <Button onClick={handleCreateAdmin} disabled={creating} className="w-full h-11 btn-primary rounded-xl text-sm">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Admin'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Admin Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="lr-card p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-16" /></div>
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      ) : admins.length === 0 ? (
        <div className="lr-card p-12 flex flex-col items-center justify-center text-slate-500">
          <Users className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm">No admins created yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {admins.map((admin) => (
            <div key={admin.id} className="lr-card p-5 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#09D1C7]/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-[#09D1C7]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white text-sm">{admin.displayName}</h3>
                    <p className="text-xs text-slate-500">@{admin.adminId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className={
                    admin.status === 'active'
                      ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
                      : 'text-red-400 border-red-500/20 bg-red-500/10'
                  }>
                    {admin.status}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-white hover:bg-slate-800">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-slate-900 border-slate-700" align="end">
                      <DropdownMenuItem onClick={() => openBalanceDialog(admin)}
                        className="text-slate-300 focus:text-white focus:bg-slate-800 cursor-pointer">
                        <Wallet className="w-4 h-4 mr-2 text-[#09D1C7]" /> Set Balance
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-700" />
                      {admin.status === 'active' ? (
                        <DropdownMenuItem onClick={() => setConfirmAction({ type: 'block', admin })}
                          className="text-amber-400 focus:text-amber-300 focus:bg-amber-500/10 cursor-pointer">
                          <Ban className="w-4 h-4 mr-2" /> Block
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => setConfirmAction({ type: 'unblock', admin })}
                          className="text-emerald-400 focus:text-emerald-300 focus:bg-emerald-500/10 cursor-pointer">
                          <RotateCcw className="w-4 h-4 mr-2" /> Unblock
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator className="bg-slate-700" />
                      <DropdownMenuItem onClick={() => setConfirmAction({ type: 'delete', admin })}
                        className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Balance</span>
                  <span className="font-semibold text-[#09D1C7]">{admin.balance || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Initial</span>
                  <span className="text-slate-400">{admin.initialBalance || 0}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                  <span className="text-slate-600">Created</span>
                  <span className="text-slate-400">{formatDate(admin.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Balance Dialog */}
      <Dialog open={balanceOpen} onOpenChange={setBalanceOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Adjust Balance</DialogTitle>
          </DialogHeader>
          {selectedAdmin && (
            <div className="space-y-4 mt-2">
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Admin:</span>
                  <span className="text-white">{selectedAdmin.displayName}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-slate-400">Current:</span>
                  <span className="text-[#09D1C7] font-semibold">{selectedAdmin.balance || 0}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-slate-300">Type</Label>
                <Select value={balanceType} onValueChange={(v) => setBalanceType(v as 'credit' | 'debit')}>
                  <SelectTrigger className="h-10 bg-slate-800/50 border-slate-700/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="credit">Credit (Add)</SelectItem>
                    <SelectItem value="debit">Debit (Remove)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-slate-300">Amount</Label>
                <Input type="number" min="1" placeholder="Enter amount" value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  className="h-10 bg-slate-800/50 border-slate-700/50 focus:border-[#09D1C7]" />
              </div>
              <div className="flex gap-3">
                <DialogClose asChild>
                  <Button className="flex-1 h-10 bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 rounded-xl">
                    Cancel
                  </Button>
                </DialogClose>
                <Button onClick={handleAdjustBalance} disabled={adjusting} className="flex-1 h-10 btn-primary rounded-xl text-sm">
                  {adjusting ? <Loader2 className="w-4 h-4 animate-spin" /> : `${balanceType === 'credit' ? 'Credit' : 'Debit'}`}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => { if (!open) setConfirmAction(null); }}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {confirmAction?.type === 'delete' ? 'Delete Admin' : confirmAction?.type === 'block' ? 'Block Admin' : 'Unblock Admin'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {confirmAction?.type === 'delete'
                ? `Delete "${confirmAction?.admin.displayName}"? All their keys will be permanently deleted.`
                : confirmAction?.type === 'block'
                  ? `Block "${confirmAction?.admin.displayName}"? They will lose access.`
                  : `Unblock "${confirmAction?.admin.displayName}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAdminAction}
              disabled={actionLoading}
              className={
                confirmAction?.type === 'delete'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                  : confirmAction?.type === 'block'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
              }
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmAction?.type}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
