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
  id: string;
  username: string;
  key: string;
  createdBy: string;
  createdAt: string;
  expiryAt: string;
  usedDevices: string[];
  devicesLimit: number;
  status: string;
  validityDays: number;
  validityHours: number;
}

interface KeyTableProps {
  role?: 'owner' | 'admin';
}

const PAGE_SIZE = 10;

export default function KeyTable({ role = 'admin' }: KeyTableProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('active');
  const [keys, setKeys] = useState<LicenceKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedKeys, setCopiedKeys] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<{
    type: 'block' | 'unblock' | 'delete';
    key: LicenceKey;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const status = activeTab === 'expired' ? 'expired' : activeTab;
      const params = new URLSearchParams({
        status,
        page: page.toString(),
        limit: PAGE_SIZE.toString(),
      });
      if (search.trim()) params.set('search', search.trim());
      const data = await getKeys(params.toString());
      setKeys(data.keys || []);
      const totalCount = data.total || 0;
      setTotalPages(Math.max(1, Math.ceil(totalCount / PAGE_SIZE)));
    } catch {
      setKeys([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, search]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, search]);

  const handleCopyKey = async (key: string, id: string) => {
    const ok = await copyToClipboard(key);
    if (ok) {
      setCopiedKeys((prev) => new Set(prev).add(id));
      toast({ title: 'Copied!' });
      setTimeout(() => {
        setCopiedKeys((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 2000);
    }
  };

  const handleAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      if (confirmAction.type === 'delete') {
        await deleteKey(confirmAction.key.id);
        toast({ title: 'Deleted' });
      } else {
        const newStatus = confirmAction.type === 'block' ? 'blocked' : 'active';
        await updateKey(confirmAction.key.id, { status: newStatus });
        toast({ title: confirmAction.type === 'block' ? 'Blocked' : 'Unblocked' });
      }
      setConfirmAction(null);
      fetchKeys();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Action failed.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string, expiry: string) => {
    const isExp = status === 'active' && isExpired(expiry);
    const s = isExp ? 'expired' : status;
    const styles: Record<string, string> = {
      active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      blocked: 'bg-red-500/10 text-red-400 border-red-500/20',
      expired: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    };
    return (
      <Badge variant="outline" className={styles[s] || 'bg-slate-500/10 text-slate-400'}>
        {s}
      </Badge>
    );
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return '•'.repeat(key.length);
    return key.slice(0, 4) + '•'.repeat(key.length - 8) + key.slice(-4);
  };

  return (
    <div className="space-y-4">
      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800/50 border border-slate-700/50 h-9">
            <TabsTrigger value="active" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white rounded-md text-xs">
              Active
            </TabsTrigger>
            <TabsTrigger value="blocked" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white rounded-md text-xs">
              Blocked
            </TabsTrigger>
            <TabsTrigger value="expired" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white rounded-md text-xs">
              Expired
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-sm bg-slate-800/50 border-slate-700/50"
          />
        </div>
      </div>

      {/* Table */}
      <div className="lr-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : keys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Key className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">No {activeTab} keys found</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700/50 hover:bg-transparent">
                    <TableHead className="text-slate-400 font-medium text-xs">Username</TableHead>
                    <TableHead className="text-slate-400 font-medium text-xs">Key</TableHead>
                    <TableHead className="text-slate-400 font-medium text-xs">Created</TableHead>
                    <TableHead className="text-slate-400 font-medium text-xs">Expiry</TableHead>
                    <TableHead className="text-slate-400 font-medium text-xs">Devices</TableHead>
                    <TableHead className="text-slate-400 font-medium text-xs">Status</TableHead>
                    <TableHead className="text-slate-400 font-medium text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map((item) => (
                    <TableRow key={item.id} className="border-slate-700/30 hover:bg-slate-800/30">
                      <TableCell className="text-white font-medium text-sm py-3">{item.username}</TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1">
                          <code className="text-xs text-slate-300 font-mono bg-slate-800/50 px-2 py-1 rounded">
                            {visibleKeys.has(item.id) ? item.key : maskKey(item.key)}
                          </code>
                          <button onClick={() => {
                            const next = new Set(visibleKeys);
                            if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
                            setVisibleKeys(next);
                          }} className="text-slate-500 hover:text-slate-300 p-0.5">
                            {visibleKeys.has(item.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => handleCopyKey(item.key, item.id)} className="text-slate-500 hover:text-slate-300 p-0.5">
                            {copiedKeys.has(item.id) ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-400 text-xs py-3">{formatDate(item.createdAt)}</TableCell>
                      <TableCell className="text-slate-400 text-xs py-3">{formatDate(item.expiryAt)}</TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Monitor className="w-3 h-3" />
                          {item.usedDevices?.length || 0}/{item.devicesLimit}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">{getStatusBadge(item.status, item.expiryAt)}</TableCell>
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {item.status === 'active' && (
                            <Button size="sm" variant="ghost"
                              className="h-7 px-2 text-xs text-amber-400/70 hover:text-amber-400 hover:bg-amber-500/10"
                              onClick={() => setConfirmAction({ type: 'block', key: item })}>
                              <Ban className="w-3.5 h-3.5 mr-1" /> Block
                            </Button>
                          )}
                          {item.status === 'blocked' && (
                            <Button size="sm" variant="ghost"
                              className="h-7 px-2 text-xs text-emerald-400/70 hover:text-emerald-400 hover:bg-emerald-500/10"
                              onClick={() => setConfirmAction({ type: 'unblock', key: item })}>
                              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Unblock
                            </Button>
                          )}
                          <Button size="sm" variant="ghost"
                            className="h-7 px-2 text-xs text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                            onClick={() => setConfirmAction({ type: 'delete', key: item })}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-700/30">
              {keys.map((item) => (
                <div key={item.id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white text-sm">{item.username}</span>
                    {getStatusBadge(item.status, item.expiryAt)}
                  </div>
                  <div className="flex items-center gap-1">
                    <code className="text-xs text-slate-300 font-mono bg-slate-800/50 px-2 py-1 rounded flex-1 truncate">
                      {visibleKeys.has(item.id) ? item.key : maskKey(item.key)}
                    </code>
                    <button onClick={() => {
                      const next = new Set(visibleKeys);
                      if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
                      setVisibleKeys(next);
                    }} className="text-slate-500 hover:text-slate-300 p-1">
                      {visibleKeys.has(item.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => handleCopyKey(item.key, item.id)} className="text-slate-500 hover:text-slate-300 p-1">
                      {copiedKeys.has(item.id) ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Exp: {formatDate(item.expiryAt)}</span>
                    <div className="flex items-center gap-1">
                      <Monitor className="w-3 h-3" />
                      {item.usedDevices?.length || 0}/{item.devicesLimit}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    {item.status === 'active' && (
                      <Button size="sm" variant="ghost"
                        className="h-8 px-3 text-xs text-amber-400/70 hover:text-amber-400 hover:bg-amber-500/10 flex-1"
                        onClick={() => setConfirmAction({ type: 'block', key: item })}>
                        <Ban className="w-3.5 h-3.5 mr-1" /> Block
                      </Button>
                    )}
                    {item.status === 'blocked' && (
                      <Button size="sm" variant="ghost"
                        className="h-8 px-3 text-xs text-emerald-400/70 hover:text-emerald-400 hover:bg-emerald-500/10 flex-1"
                        onClick={() => setConfirmAction({ type: 'unblock', key: item })}>
                        <RotateCcw className="w-3.5 h-3.5 mr-1" /> Unblock
                      </Button>
                    )}
                    <Button size="sm" variant="ghost"
                      className="h-8 px-3 text-xs text-slate-500 hover:text-red-400 hover:bg-red-500/10 flex-1"
                      onClick={() => setConfirmAction({ type: 'delete', key: item })}>
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700/30">
                <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost"
                    className="h-7 text-slate-500 hover:text-white hover:bg-slate-800"
                    disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost"
                    className="h-7 text-slate-500 hover:text-white hover:bg-slate-800"
                    disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => { if (!open) setConfirmAction(null); }}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {confirmAction?.type === 'delete' ? 'Delete Key' : confirmAction?.type === 'block' ? 'Block Key' : 'Unblock Key'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {confirmAction?.type === 'delete'
                ? `Delete key for "${confirmAction?.key.username}"? This cannot be undone.`
                : confirmAction?.type === 'block'
                  ? `Block key for "${confirmAction?.key.username}"?`
                  : `Unblock key for "${confirmAction?.key.username}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
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
