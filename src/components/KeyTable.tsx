'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, Copy, Check, Eye, EyeOff, Ban, RotateCcw,
  Trash2, ChevronLeft, ChevronRight, Key, Monitor, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [tab, setTab] = useState('active');
  const [keys, setKeys] = useState<LicenceKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedKeys, setCopiedKeys] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<{
    type: 'block' | 'unblock' | 'delete';
    key: LicenceKey;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: tab,
        page: page.toString(),
        limit: PAGE_SIZE.toString(),
      });
      if (search.trim()) params.set('search', search.trim());
      const data = await getKeys(params.toString());
      setKeys(data.keys || []);
      setTotalPages(Math.max(1, Math.ceil((data.total || 0) / PAGE_SIZE)));
    } catch {
      setKeys([]);
    } finally {
      setLoading(false);
    }
  }, [tab, page, search]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  useEffect(() => {
    setPage(1);
  }, [tab, search]);

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyKey = async (key: string, id: string) => {
    const success = await copyToClipboard(key);
    if (success) {
      setCopiedKeys((prev) => new Set(prev).add(id));
      toast({ title: 'Copied to clipboard!' });
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
    if (!confirm) return;
    setActionLoading(true);
    try {
      if (confirm.type === 'delete') {
        await deleteKey(confirm.key.id);
        toast({ title: 'Key deleted successfully' });
      } else {
        await updateKey(confirm.key.id, {
          status: confirm.type === 'block' ? 'blocked' : 'active',
        });
        toast({
          title: confirm.type === 'block' ? 'Key blocked' : 'Key unblocked',
        });
      }
      setConfirm(null);
      fetchKeys();
    } catch (err: unknown) {
      toast({
        title: 'Action Failed',
        description: err instanceof Error ? err.message : 'Operation failed',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string, expiry: string) => {
    const effectiveStatus =
      status === 'active' && isExpired(expiry) ? 'expired' : status;
    const styles: Record<string, string> = {
      active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
      blocked: 'bg-red-500/15 text-red-400 border-red-500/25',
      expired: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    };
    return (
      <Badge
        variant="outline"
        className={`${styles[effectiveStatus] || 'bg-white/10 text-white/50'} text-xs rounded-lg px-2.5 py-0.5 font-medium`}
      >
        {effectiveStatus}
      </Badge>
    );
  };

  const maskKey = (k: string) =>
    k.length <= 8 ? '•'.repeat(k.length) : k.slice(0, 4) + '•••••' + k.slice(-4);

  return (
    <div className="space-y-4">
      {/* Tabs + Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="glass rounded-xl h-10 p-1">
            <TabsTrigger
              value="active"
              className="rounded-lg text-xs font-medium transition-all duration-200 data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 text-white/40 hover:text-white/60"
            >
              Active
            </TabsTrigger>
            <TabsTrigger
              value="blocked"
              className="rounded-lg text-xs font-medium transition-all duration-200 data-[state=active]:bg-red-500/15 data-[state=active]:text-red-400 text-white/40 hover:text-white/60"
            >
              Blocked
            </TabsTrigger>
            <TabsTrigger
              value="expired"
              className="rounded-lg text-xs font-medium transition-all duration-200 data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-400 text-white/40 hover:text-white/60"
            >
              Expired
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <Input
            placeholder="Search by username or key..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-10 text-sm glass rounded-xl placeholder:text-white/20 input-teal"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="glass rounded-2xl overflow-hidden custom-scrollbar">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl animate-shimmer" />
            ))}
          </div>
        ) : keys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/25">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <Key className="w-7 h-7 opacity-40" />
            </div>
            <p className="text-sm font-medium">No {tab} keys found</p>
            <p className="text-xs text-white/15 mt-1">
              {search ? 'Try a different search term' : 'Keys will appear here when generated'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/[0.04] hover:bg-transparent">
                    <TableHead className="text-white/35 font-medium text-xs uppercase tracking-wider">
                      Username
                    </TableHead>
                    <TableHead className="text-white/35 font-medium text-xs uppercase tracking-wider">
                      Key
                    </TableHead>
                    <TableHead className="text-white/35 font-medium text-xs uppercase tracking-wider">
                      Created
                    </TableHead>
                    <TableHead className="text-white/35 font-medium text-xs uppercase tracking-wider">
                      Expiry
                    </TableHead>
                    <TableHead className="text-white/35 font-medium text-xs uppercase tracking-wider">
                      Devices
                    </TableHead>
                    <TableHead className="text-white/35 font-medium text-xs uppercase tracking-wider">
                      Status
                    </TableHead>
                    <TableHead className="text-white/35 font-medium text-xs uppercase tracking-wider text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map((item) => (
                    <TableRow
                      key={item.id}
                      className="border-white/[0.04] table-row-hover"
                    >
                      <TableCell className="text-white font-medium text-sm py-3.5">
                        {item.username}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-1.5">
                          <code className="text-xs text-white/45 font-mono bg-white/5 px-2.5 py-1 rounded-lg max-w-40 truncate">
                            {visibleKeys.has(item.id) ? item.key : maskKey(item.key)}
                          </code>
                          <button
                            onClick={() => toggleKeyVisibility(item.id)}
                            className="text-white/20 hover:text-white/50 transition-colors p-1 rounded-md hover:bg-white/5"
                            aria-label="Toggle key visibility"
                          >
                            {visibleKeys.has(item.id) ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => copyKey(item.key, item.id)}
                            className="text-white/20 hover:text-white/50 transition-colors p-1 rounded-md hover:bg-white/5"
                            aria-label="Copy key"
                          >
                            {copiedKeys.has(item.id) ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-white/30 text-xs py-3.5 whitespace-nowrap">
                        {formatDate(item.createdAt)}
                      </TableCell>
                      <TableCell className="text-white/30 text-xs py-3.5 whitespace-nowrap">
                        {formatDate(item.expiryAt)}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-white/35">
                          <Monitor className="w-3 h-3" />
                          <span>
                            {item.usedDevices?.length || 0}/{item.devicesLimit}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5">
                        {getStatusBadge(item.status, item.expiryAt)}
                      </TableCell>
                      <TableCell className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {item.status === 'active' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2.5 text-xs text-amber-400/50 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all duration-200"
                              onClick={() =>
                                setConfirm({ type: 'block', key: item })
                              }
                            >
                              <Ban className="w-3.5 h-3.5 mr-1" />
                              Block
                            </Button>
                          )}
                          {item.status === 'blocked' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2.5 text-xs text-emerald-400/50 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all duration-200"
                              onClick={() =>
                                setConfirm({ type: 'unblock', key: item })
                              }
                            >
                              <RotateCcw className="w-3.5 h-3.5 mr-1" />
                              Unblock
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                            onClick={() =>
                              setConfirm({ type: 'delete', key: item })
                            }
                            aria-label="Delete key"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card Layout */}
            <div className="md:hidden divide-y divide-white/[0.04]">
              {keys.map((item) => (
                <div key={item.id} className="p-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-sm">
                      {item.username}
                    </span>
                    {getStatusBadge(item.status, item.expiryAt)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <code className="text-xs text-white/45 font-mono bg-white/5 px-2.5 py-1.5 rounded-lg flex-1 truncate">
                      {visibleKeys.has(item.id) ? item.key : maskKey(item.key)}
                    </code>
                    <button
                      onClick={() => toggleKeyVisibility(item.id)}
                      className="text-white/20 hover:text-white/50 transition-colors p-1.5 rounded-md hover:bg-white/5"
                    >
                      {visibleKeys.has(item.id) ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => copyKey(item.key, item.id)}
                      className="text-white/20 hover:text-white/50 transition-colors p-1.5 rounded-md hover:bg-white/5"
                    >
                      {copiedKeys.has(item.id) ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-white/30">
                    <span>Exp: {formatDate(item.expiryAt)}</span>
                    <div className="flex items-center gap-1">
                      <Monitor className="w-3 h-3" />
                      {item.usedDevices?.length || 0}/{item.devicesLimit}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    {item.status === 'active' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 px-3 text-xs text-amber-400/50 hover:text-amber-400 hover:bg-amber-500/10 flex-1 rounded-lg transition-all duration-200 font-medium"
                        onClick={() =>
                          setConfirm({ type: 'block', key: item })
                        }
                      >
                        <Ban className="w-3.5 h-3.5 mr-1.5" />
                        Block
                      </Button>
                    )}
                    {item.status === 'blocked' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 px-3 text-xs text-emerald-400/50 hover:text-emerald-400 hover:bg-emerald-500/10 flex-1 rounded-lg transition-all duration-200 font-medium"
                        onClick={() =>
                          setConfirm({ type: 'unblock', key: item })
                        }
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                        Unblock
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-9 px-3 text-xs text-white/20 hover:text-red-400 hover:bg-red-500/10 flex-1 rounded-lg transition-all duration-200 font-medium"
                      onClick={() =>
                        setConfirm({ type: 'delete', key: item })
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3.5 border-t border-white/[0.04]">
                <p className="text-xs text-white/25 font-medium">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-3 text-white/35 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 font-medium"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Prev
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-3 text-white/35 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 font-medium"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirmation Dialog */}
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
                ? 'Delete Key'
                : confirm?.type === 'block'
                  ? 'Block Key'
                  : 'Unblock Key'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/40 text-sm leading-relaxed">
              {confirm?.type === 'delete'
                ? `Permanently delete the key for "${confirm?.key.username}"? This action cannot be undone.`
                : `${confirm?.type === 'block' ? 'Block' : 'Unblock'} the key for "${confirm?.key.username}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-4">
            <AlertDialogCancel className="glass rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200 font-medium">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
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
