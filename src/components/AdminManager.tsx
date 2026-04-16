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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
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
  id: string; adminId: string; displayName: string; status: string;
  balance: number; initialBalance: number; createdAt: string;
}

export default function AdminManager() {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [balanceOpen, setBalanceOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ type: 'block' | 'unblock' | 'delete'; admin: Admin } | null>(null);

  const [newId, setNewId] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newName, setNewName] = useState('');
  const [newBal, setNewBal] = useState('1000');
  const [creating, setCreating] = useState(false);

  const [selAdmin, setSelAdmin] = useState<Admin | null>(null);
  const [balAmt, setBalAmt] = useState('');
  const [balType, setBalType] = useState<'credit' | 'debit'>('credit');
  const [adjusting, setAdjusting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try { const d = await getAdmins(); setAdmins(d.admins || []); } catch { setAdmins([]); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  const handleCreate = async () => {
    if (!newId.trim() || !newPw.trim() || !newName.trim()) {
      toast({ title: 'Error', description: 'All fields required.', variant: 'destructive' }); return;
    }
    const b = parseInt(newBal);
    if (!b || b < 1000 || b > 100000) {
      toast({ title: 'Error', description: 'Balance: min 1,000, max 100,000.', variant: 'destructive' }); return;
    }
    setCreating(true);
    try {
      await createAdmin({ adminId: newId.trim(), password: newPw, displayName: newName.trim() });
      toast({ title: 'Admin Created' });
      setCreateOpen(false); setNewId(''); setNewPw(''); setNewName(''); setNewBal('1000');
      fetchAdmins();
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally { setCreating(false); }
  };

  const handleBalance = async () => {
    if (!selAdmin) return;
    const amt = parseInt(balAmt);
    if (!amt || amt <= 0) { toast({ title: 'Error', description: 'Amount must be positive.', variant: 'destructive' }); return; }
    setAdjusting(true);
    try {
      const nb = balType === 'credit' ? (selAdmin.balance || 0) + amt : (selAdmin.balance || 0) - amt;
      if (nb < 0) { toast({ title: 'Error', description: 'Cannot go below 0.', variant: 'destructive' }); setAdjusting(false); return; }
      await updateAdmin(selAdmin.adminId, { balance: nb });
      toast({ title: 'Balance Updated' });
      setBalanceOpen(false); setBalAmt(''); fetchAdmins();
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally { setAdjusting(false); }
  };

  const handleAction = async () => {
    if (!confirm) return;
    setActionLoading(true);
    try {
      if (confirm.type === 'delete') { await deleteAdmin(confirm.admin.adminId); toast({ title: 'Deleted' }); }
      else { await updateAdmin(confirm.admin.adminId, { status: confirm.type === 'block' ? 'blocked' : 'active' }); toast({ title: confirm.type === 'block' ? 'Blocked' : 'Unblocked' }); }
      setConfirm(null); fetchAdmins();
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally { setActionLoading(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white/50">
          <Users className="w-4 h-4" />
          <span className="text-sm">{admins.length} admin(s)</span>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="btn-gradient rounded-xl h-10 text-sm gap-1.5">
              <UserPlus className="w-4 h-4" /> Create Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong rounded-2xl sm:max-w-md border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white text-lg">Create New Admin</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label className="text-sm text-white/70">Admin ID <span className="text-red-400">*</span></Label>
                <Input placeholder="Enter admin ID" value={newId} onChange={(e) => setNewId(e.target.value)}
                  className="h-11 rounded-xl glass text-white placeholder:text-white/25 focus:border-[#09D1C7]/40" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-white/70">Password <span className="text-red-400">*</span></Label>
                <Input type="password" placeholder="Enter password" value={newPw} onChange={(e) => setNewPw(e.target.value)}
                  className="h-11 rounded-xl glass text-white placeholder:text-white/25 focus:border-[#09D1C7]/40" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-white/70">Display Name <span className="text-red-400">*</span></Label>
                <Input placeholder="Enter display name" value={newName} onChange={(e) => setNewName(e.target.value)}
                  className="h-11 rounded-xl glass text-white placeholder:text-white/25 focus:border-[#09D1C7]/40" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-white/70">Initial Balance</Label>
                <Input type="number" min="1000" max="100000" value={newBal} onChange={(e) => setNewBal(e.target.value)}
                  className="h-11 rounded-xl glass text-white placeholder:text-white/25 focus:border-[#09D1C7]/40" />
                <p className="text-xs text-white/25">Min: 1,000 | Max: 100,000</p>
              </div>
              <Button onClick={handleCreate} disabled={creating} className="w-full h-12 btn-gradient rounded-xl text-sm">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Admin'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-xl" /><div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-16" /></div></div>
              </div>
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      ) : admins.length === 0 ? (
        <div className="glass rounded-2xl p-14 flex flex-col items-center text-white/25">
          <Users className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm">No admins created yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {admins.map((admin) => (
            <div key={admin.id} className="glass rounded-2xl p-5 transition-all duration-200 hover:border-white/15">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(9,209,199,0.1)' }}>
                    <Shield className="w-5 h-5" style={{ color: '#09D1C7' }} />
                  </div>
                  <div>
                    <h3 className="font-medium text-white text-sm">{admin.displayName}</h3>
                    <p className="text-xs text-white/35">@{admin.adminId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className={`text-xs rounded-lg px-2 py-0.5 ${admin.status === 'active' ? 'text-emerald-400 border-emerald-500/25 bg-emerald-500/10' : 'text-red-400 border-red-500/25 bg-red-500/10'}`}>
                    {admin.status}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/30 hover:text-white/60 hover:bg-white/10 rounded-lg">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="glass-strong rounded-xl border-white/10" align="end">
                      <DropdownMenuItem onClick={() => { setSelAdmin(admin); setBalAmt(''); setBalType('credit'); setBalanceOpen(true); }}
                        className="text-white/60 focus:text-white focus:bg-white/10 cursor-pointer rounded-lg">
                        <Wallet className="w-4 h-4 mr-2" style={{ color: '#09D1C7' }} /> Set Balance
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/[0.06]" />
                      {admin.status === 'active' ? (
                        <DropdownMenuItem onClick={() => setConfirm({ type: 'block', admin })}
                          className="text-amber-400/70 focus:text-amber-400 focus:bg-amber-500/10 cursor-pointer rounded-lg">
                          <Ban className="w-4 h-4 mr-2" /> Block
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => setConfirm({ type: 'unblock', admin })}
                          className="text-emerald-400/70 focus:text-emerald-400 focus:bg-emerald-500/10 cursor-pointer rounded-lg">
                          <RotateCcw className="w-4 h-4 mr-2" /> Unblock
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator className="bg-white/[0.06]" />
                      <DropdownMenuItem onClick={() => setConfirm({ type: 'delete', admin })}
                        className="text-red-400/70 focus:text-red-400 focus:bg-red-500/10 cursor-pointer rounded-lg">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between"><span className="text-white/35">Balance</span><span className="font-semibold text-gradient">{admin.balance || 0}</span></div>
                <div className="flex justify-between"><span className="text-white/35">Initial</span><span className="text-white/50">{admin.initialBalance || 0}</span></div>
                <div className="flex justify-between pt-2.5 border-t border-white/[0.06]"><span className="text-white/25">Created</span><span className="text-white/40">{formatDate(admin.createdAt)}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Balance Dialog */}
      <Dialog open={balanceOpen} onOpenChange={setBalanceOpen}>
        <DialogContent className="glass-strong rounded-2xl sm:max-w-md border-white/10">
          <DialogHeader><DialogTitle className="text-white text-lg">Adjust Balance</DialogTitle></DialogHeader>
          {selAdmin && (
            <div className="space-y-4 mt-2">
              <div className="p-3.5 rounded-xl glass">
                <div className="flex justify-between text-sm"><span className="text-white/40">Admin:</span><span className="text-white font-medium">{selAdmin.displayName}</span></div>
                <div className="flex justify-between text-sm mt-1"><span className="text-white/40">Current:</span><span className="font-bold text-gradient">{selAdmin.balance || 0}</span></div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-white/70">Type</Label>
                <Select value={balType} onValueChange={(v) => setBalType(v as 'credit' | 'debit')}>
                  <SelectTrigger className="h-11 rounded-xl glass text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="glass-strong rounded-xl border-white/10">
                    <SelectItem value="credit">Credit (Add)</SelectItem>
                    <SelectItem value="debit">Debit (Remove)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-white/70">Amount</Label>
                <Input type="number" min="1" placeholder="Enter amount" value={balAmt} onChange={(e) => setBalAmt(e.target.value)}
                  className="h-11 rounded-xl glass text-white placeholder:text-white/25 focus:border-[#09D1C7]/40" />
              </div>
              <div className="flex gap-3 pt-1">
                <DialogClose asChild><Button className="flex-1 h-11 glass rounded-xl text-white/60 hover:text-white hover:bg-white/10">Cancel</Button></DialogClose>
                <Button onClick={handleBalance} disabled={adjusting} className="flex-1 h-11 btn-gradient rounded-xl text-sm">
                  {adjusting ? <Loader2 className="w-4 h-4 animate-spin" /> : `${balType === 'credit' ? 'Credit' : 'Debit'}`}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <AlertDialog open={!!confirm} onOpenChange={(o) => { if (!o) setConfirm(null); }}>
        <AlertDialogContent className="glass-strong rounded-2xl border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">{confirm?.type === 'delete' ? 'Delete Admin' : confirm?.type === 'block' ? 'Block Admin' : 'Unblock Admin'}</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              {confirm?.type === 'delete' ? `Delete "${confirm?.admin.displayName}"? All keys will be removed.`
                : `${confirm?.type === 'block' ? 'Block' : 'Unblock'} "${confirm?.admin.displayName}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="glass rounded-xl text-white/60 hover:text-white hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} disabled={actionLoading}
              className={`rounded-xl ${confirm?.type === 'delete' ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30' : confirm?.type === 'block' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'}`}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirm?.type}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
