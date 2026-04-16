'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus, Ban, RotateCcw, Trash2, Wallet, Settings, Loader2,
  Users, Shield, Calendar, MoreVertical,
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
import { ScrollArea } from '@/components/ui/scroll-area';
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

  // Create form
  const [newAdminId, setNewAdminId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newInitialBalance, setNewInitialBalance] = useState('1000');
  const [creating, setCreating] = useState(false);

  // Balance form
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

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleCreateAdmin = async () => {
    if (!newAdminId.trim() || !newPassword.trim() || !newDisplayName.trim()) {
      toast({ title: 'Validation Error', description: 'All fields are required.', variant: 'destructive' });
      return;
    }
    const balance = parseInt(newInitialBalance);
    if (!balance || balance < 1000) {
      toast({ title: 'Validation Error', description: 'Initial balance must be at least 1000.', variant: 'destructive' });
      return;
    }
    if (balance > 100000) {
      toast({ title: 'Validation Error', description: 'Initial balance cannot exceed 100,000.', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      await createAdmin({
        adminId: newAdminId.trim(),
        password: newPassword,
        displayName: newDisplayName.trim(),
      });
      toast({ title: 'Admin Created', description: `Admin "${newDisplayName.trim()}" has been created.` });
      setCreateOpen(false);
      setNewAdminId('');
      setNewPassword('');
      setNewDisplayName('');
      setNewInitialBalance('1000');
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
      toast({ title: 'Validation Error', description: 'Amount must be a positive number.', variant: 'destructive' });
      return;
    }

    setAdjusting(true);
    try {
      const newBalance = balanceType === 'credit'
        ? (selectedAdmin.balance || 0) + amount
        : (selectedAdmin.balance || 0) - amount;
      if (newBalance < 0) {
        toast({ title: 'Error', description: 'Balance cannot go below 0.', variant: 'destructive' });
        setAdjusting(false);
        return;
      }
      await updateAdmin(selectedAdmin.adminId, { balance: newBalance });
      toast({
        title: 'Balance Updated',
        description: `${balanceType === 'credit' ? 'Credited' : 'Debited'} ${amount} to ${selectedAdmin.displayName}.`,
      });
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
        toast({ title: 'Deleted', description: 'Admin has been deleted.' });
      } else {
        const newStatus = confirmAction.type === 'block' ? 'blocked' : 'active';
        await updateAdmin(confirmAction.admin.adminId, { status: newStatus });
        toast({
          title: confirmAction.type === 'block' ? 'Blocked' : 'Unblocked',
          description: `Admin "${confirmAction.admin.displayName}" has been ${confirmAction.type}ed.`,
        });
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
        <div className="flex items-center gap-2 text-white/70">
          <Users className="w-5 h-5" />
          <span className="text-sm font-medium">Admin Management</span>
          <Badge variant="secondary" className="text-xs bg-white/5 text-white/50">
            {admins.length} admins
          </Badge>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="btn-gradient rounded-xl h-9 text-sm">
              <UserPlus className="w-4 h-4 mr-2" />
              Create Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-white/10 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5" style={{ color: 'var(--lr-3)' }} />
                Create New Admin
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-white/80 text-sm">Admin ID <span className="text-red-400">*</span></Label>
                <Input
                  placeholder="Enter admin ID"
                  value={newAdminId}
                  onChange={(e) => setNewAdminId(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/80 text-sm">Password <span className="text-red-400">*</span></Label>
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/80 text-sm">Display Name <span className="text-red-400">*</span></Label>
                <Input
                  placeholder="Enter display name"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/80 text-sm">Initial Balance</Label>
                <Input
                  type="number"
                  min="1000"
                  max="100000"
                  value={newInitialBalance}
                  onChange={(e) => setNewInitialBalance(e.target.value)}
                  className="h-10"
                />
                <p className="text-xs text-white/30">Min: 1,000 | Max: 100,000</p>
              </div>
              <Button
                onClick={handleCreateAdmin}
                disabled={creating}
                className="w-full h-11 btn-gradient rounded-xl"
              >
                {creating ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </span>
                ) : (
                  'Create Admin'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Admin Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : admins.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-white/40"
        >
          <Users className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">No admins created yet</p>
          <p className="text-xs mt-1 text-white/25">Click &quot;Create Admin&quot; to add one</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {admins.map((admin, index) => (
              <motion.div
                key={admin.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
                className="glass-card glass-card-hover rounded-2xl p-5 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, rgba(9,209,199,0.15), rgba(70,223,177,0.05))' }}>
                      <Shield className="w-5 h-5" style={{ color: 'var(--lr-3)' }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm">{admin.displayName}</h3>
                      <p className="text-xs text-white/40">@{admin.adminId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge
                      className={
                        admin.status === 'active'
                          ? 'bg-[#80EE98]/15 text-[#80EE98] border-[#80EE98]/25'
                          : 'bg-[#ff6b6b]/15 text-[#ff6b6b] border-[#ff6b6b]/25'
                      }
                    >
                      {admin.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/40 hover:text-white/70 hover:bg-white/10">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="glass-card border-white/10" align="end">
                        <DropdownMenuItem
                          onClick={() => openBalanceDialog(admin)}
                          className="text-white/70 focus:text-white focus:bg-white/10 cursor-pointer"
                        >
                          <Wallet className="w-4 h-4 mr-2" style={{ color: 'var(--lr-3)' }} />
                          Set Balance
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        {admin.status === 'active' ? (
                          <DropdownMenuItem
                            onClick={() => setConfirmAction({ type: 'block', admin })}
                            className="text-[#ffd93d]/80 focus:text-[#ffd93d] focus:bg-[#ffd93d]/10 cursor-pointer"
                          >
                            <Ban className="w-4 h-4 mr-2" />
                            Block Admin
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => setConfirmAction({ type: 'unblock', admin })}
                            className="text-[#80EE98]/80 focus:text-[#80EE98] focus:bg-[#80EE98]/10 cursor-pointer"
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Unblock Admin
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem
                          onClick={() => setConfirmAction({ type: 'delete', admin })}
                          className="text-red-400/80 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Admin
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-white/40">Balance</span>
                    <span className="font-semibold" style={{ color: 'var(--lr-1)' }}>{admin.balance || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/40">Initial Balance</span>
                    <span className="text-white/60">{admin.initialBalance || 0}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/6">
                    <span className="text-white/30">Created</span>
                    <span className="text-white/50">{formatDate(admin.createdAt)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Balance Adjustment Dialog */}
      <Dialog open={balanceOpen} onOpenChange={setBalanceOpen}>
        <DialogContent className="glass-card border-white/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Wallet className="w-5 h-5" style={{ color: 'var(--lr-3)' }} />
              Adjust Balance
            </DialogTitle>
          </DialogHeader>
          {selectedAdmin && (
            <div className="space-y-4 mt-4">
              <div className="p-3 rounded-xl bg-white/5 border border-white/8">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">Admin:</span>
                  <span className="text-white font-medium">{selectedAdmin.displayName}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-white/50">Current Balance:</span>
                  <span className="font-bold" style={{ color: 'var(--lr-1)' }}>{selectedAdmin.balance || 0}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white/80 text-sm">Type</Label>
                <Select value={balanceType} onValueChange={(v) => setBalanceType(v as 'credit' | 'debit')}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-white/10">
                    <SelectItem value="credit">Credit (Add)</SelectItem>
                    <SelectItem value="debit">Debit (Remove)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white/80 text-sm">Amount</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Enter amount"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="flex gap-3">
                <DialogClose asChild>
                  <Button className="flex-1 h-10 bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white rounded-xl">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  onClick={handleAdjustBalance}
                  disabled={adjusting}
                  className="flex-1 h-10 btn-gradient rounded-xl"
                >
                  {adjusting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    `${balanceType === 'credit' ? 'Credit' : 'Debit'} Balance`
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => { if (!open) setConfirmAction(null); }}>
        <AlertDialogContent className="glass-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {confirmAction?.type === 'delete' ? 'Delete Admin' : confirmAction?.type === 'block' ? 'Block Admin' : 'Unblock Admin'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              {confirmAction?.type === 'delete'
                ? `Are you sure you want to delete admin "${confirmAction?.admin.displayName}"? This action cannot be undone.`
                : confirmAction?.type === 'block'
                  ? `Are you sure you want to block admin "${confirmAction?.admin.displayName}"? They will lose access.`
                  : `Are you sure you want to unblock admin "${confirmAction?.admin.displayName}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAdminAction}
              disabled={actionLoading}
              className={
                confirmAction?.type === 'delete'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                  : confirmAction?.type === 'block'
                    ? 'bg-[#ffd93d]/15 text-[#ffd93d] border border-[#ffd93d]/25 hover:bg-[#ffd93d]/25'
                    : 'bg-[#80EE98]/15 text-[#80EE98] border border-[#80EE98]/25 hover:bg-[#80EE98]/25'
              }
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                confirmAction?.type === 'delete' ? 'Delete' : confirmAction?.type === 'block' ? 'Block' : 'Unblock'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
