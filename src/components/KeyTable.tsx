'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, Copy, Check, Eye, EyeOff, Ban, RotateCcw,
  Trash2, ChevronLeft, ChevronRight, Key, Monitor, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { getKeys, updateKey, deleteKey } from '@/lib/api';
import { formatDate, isExpired, copyToClipboard } from '@/lib/utils-date';
import { useToast } from '@/hooks/use-toast';

interface LicenceKey {
  id: string; username: string; key: string; createdBy: string;
  createdAt: string; expiryAt: string; usedDevices: string[];
  devicesLimit: number; status: string; validityDays: number; validityHours: number;
}

const PAGE_SIZE = 10;

export default function KeyTable({ role = 'admin' }: { role?: 'owner' | 'admin' }) {
  const { toast } = useToast();
  const [tab, setTab] = useState('active');
  const [keys, setKeys] = useState<LicenceKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [visible, setVisible] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<{ type: 'block' | 'unblock' | 'delete'; key: LicenceKey } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: tab, page: page.toString(), limit: PAGE_SIZE.toString() });
      if (search.trim()) params.set('search', search.trim());
      const data = await getKeys(params.toString());
      setKeys(data.keys || []);
      setTotalPages(Math.max(1, Math.ceil((data.total || 0) / PAGE_SIZE)));
    } catch { setKeys([]); } finally { setLoading(false); }
  }, [tab, page, search]);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);
  useEffect(() => { setPage(1); }, [tab, search]);

  const copyKey = async (key: string, id: string) => {
    if (await copyToClipboard(key)) {
      setCopied(prev => new Set(prev).add(id));
      toast({ title: 'Copied!' });
      setTimeout(() => setCopied(prev => { const n = new Set(prev); n.delete(id); return n; }), 2000);
    }
  };

  const handleAction = async () => {
    if (!confirm) return;
    setActionLoading(true);
    try {
      if (confirm.type === 'delete') {
        await deleteKey(confirm.key.id);
        toast({ title: 'Deleted' });
      } else {
        await updateKey(confirm.key.id, { status: confirm.type === 'block' ? 'blocked' : 'active' });
        toast({ title: confirm.type === 'block' ? 'Blocked' : 'Unblocked' });
      }
      setConfirm(null); fetchKeys();
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally { setActionLoading(false); }
  };

  const statusBadge = (status: string, expiry: string) => {
    const s = (status === 'active' && isExpired(expiry)) ? 'expired' : status;
    const cls: Record<string, string> = {
      active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
      blocked: 'bg-red-500/15 text-red-400 border-red-500/25',
      expired: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    };
    return <Badge variant="outline" className={`${cls[s] || 'bg-white/10 text-white/50'} text-xs rounded-lg px-2.5 py-0.5`}>{s}</Badge>;
  };

  const maskKey = (k: string) => k.length <= 8 ? '•'.repeat(k.length) : k.slice(0, 4) + '•••' + k.slice(-4);

  return (
    <div className="space-y-4">
      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="glass rounded-xl h-9 p-1">
            <TabsTrigger value="active" className="rounded-lg text-xs font-medium transition-all data-[state=active]:bg-white/10 data-[state=active]:text-emerald-400">Active</TabsTrigger>
            <TabsTrigger value="blocked" className="rounded-lg text-xs font-medium transition-all data-[state=active]:bg-white/10 data-[state=active]:text-red-400">Blocked</TabsTrigger>
            <TabsTrigger value="expired" className="rounded-lg text-xs font-medium transition-all data-[state=active]:bg-white/10 data-[state=active]:text-amber-400">Expired</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-sm glass rounded-xl" />
        </div>
      </div>

      {/* Table Container */}
      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
        ) : keys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/30">
            <Key className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">No {tab} keys found</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/[0.04] hover:bg-transparent">
                    <TableHead className="text-white/40 font-medium text-xs">Username</TableHead>
                    <TableHead className="text-white/40 font-medium text-xs">Key</TableHead>
                    <TableHead className="text-white/40 font-medium text-xs">Created</TableHead>
                    <TableHead className="text-white/40 font-medium text-xs">Expiry</TableHead>
                    <TableHead className="text-white/40 font-medium text-xs">Devices</TableHead>
                    <TableHead className="text-white/40 font-medium text-xs">Status</TableHead>
                    <TableHead className="text-white/40 font-medium text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map((item) => (
                    <TableRow key={item.id} className="border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <TableCell className="text-white font-medium text-sm py-3">{item.username}</TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1">
                          <code className="text-xs text-white/50 font-mono bg-white/5 px-2 py-1 rounded-lg">
                            {visible.has(item.id) ? item.key : maskKey(item.key)}
                          </code>
                          <button onClick={() => { const n = new Set(visible); if (n.has(item.id)) n.delete(item.id); else n.add(item.id); setVisible(n); }}
                            className="text-white/25 hover:text-white/50 transition-colors p-0.5">
                            {visible.has(item.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => copyKey(item.key, item.id)} className="text-white/25 hover:text-white/50 transition-colors p-0.5">
                            {copied.has(item.id) ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-white/35 text-xs py-3 whitespace-nowrap">{formatDate(item.createdAt)}</TableCell>
                      <TableCell className="text-white/35 text-xs py-3 whitespace-nowrap">{formatDate(item.expiryAt)}</TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1 text-xs text-white/40">
                          <Monitor className="w-3 h-3" />{item.usedDevices?.length || 0}/{item.devicesLimit}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">{statusBadge(item.status, item.expiryAt)}</TableCell>
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {item.status === 'active' && (
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-amber-400/60 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg"
                              onClick={() => setConfirm({ type: 'block', key: item })}><Ban className="w-3.5 h-3.5 mr-1" />Block</Button>
                          )}
                          {item.status === 'blocked' && (
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg"
                              onClick={() => setConfirm({ type: 'unblock', key: item })}><RotateCcw className="w-3.5 h-3.5 mr-1" />Unblock</Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-white/25 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                            onClick={() => setConfirm({ type: 'delete', key: item })}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-white/[0.04]">
              {keys.map((item) => (
                <div key={item.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white text-sm">{item.username}</span>
                    {statusBadge(item.status, item.expiryAt)}
                  </div>
                  <div className="flex items-center gap-1">
                    <code className="text-xs text-white/50 font-mono bg-white/5 px-2 py-1 rounded-lg flex-1 truncate">
                      {visible.has(item.id) ? item.key : maskKey(item.key)}
                    </code>
                    <button onClick={() => { const n = new Set(visible); if (n.has(item.id)) n.delete(item.id); else n.add(item.id); setVisible(n); }}
                      className="text-white/25 hover:text-white/50 p-1">
                      {visible.has(item.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => copyKey(item.key, item.id)} className="text-white/25 hover:text-white/50 p-1">
                      {copied.has(item.id) ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-white/35">
                    <span>Exp: {formatDate(item.expiryAt)}</span>
                    <div className="flex items-center gap-1"><Monitor className="w-3 h-3" />{item.usedDevices?.length || 0}/{item.devicesLimit}</div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    {item.status === 'active' && (
                      <Button size="sm" variant="ghost" className="h-8 px-3 text-xs text-amber-400/60 hover:text-amber-400 hover:bg-amber-500/10 flex-1 rounded-lg"
                        onClick={() => setConfirm({ type: 'block', key: item })}><Ban className="w-3.5 h-3.5 mr-1" />Block</Button>
                    )}
                    {item.status === 'blocked' && (
                      <Button size="sm" variant="ghost" className="h-8 px-3 text-xs text-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-500/10 flex-1 rounded-lg"
                        onClick={() => setConfirm({ type: 'unblock', key: item })}><RotateCcw className="w-3.5 h-3.5 mr-1" />Unblock</Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-8 px-3 text-xs text-white/25 hover:text-red-400 hover:bg-red-500/10 flex-1 rounded-lg"
                      onClick={() => setConfirm({ type: 'delete', key: item })}><Trash2 className="w-3.5 h-3.5 mr-1" />Delete</Button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.04]">
                <p className="text-xs text-white/30">Page {page} of {totalPages}</p>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-8 text-white/40 hover:text-white hover:bg-white/10 rounded-lg" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 text-white/40 hover:text-white hover:bg-white/10 rounded-lg" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(o) => { if (!o) setConfirm(null); }}>
        <AlertDialogContent className="glass-strong rounded-2xl border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {confirm?.type === 'delete' ? 'Delete Key' : confirm?.type === 'block' ? 'Block Key' : 'Unblock Key'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              {confirm?.type === 'delete'
                ? `Permanently delete key for "${confirm?.key.username}"?`
                : `${confirm?.type === 'block' ? 'Block' : 'Unblock'} key for "${confirm?.key.username}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="glass rounded-xl text-white/60 hover:text-white hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} disabled={actionLoading}
              className={`rounded-xl ${
                confirm?.type === 'delete' ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                : confirm?.type === 'block' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
              }`}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirm?.type}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
