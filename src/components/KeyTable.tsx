'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Copy, Check, Eye, EyeOff, Ban, RotateCcw,
  Trash2, ChevronLeft, ChevronRight, Key, Monitor, Loader2,
  AlertCircle, ShieldOff,
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

  // Reset page on tab change or search
  useEffect(() => {
    setPage(1);
  }, [activeTab, search]);

  const handleCopyKey = async (key: string, id: string) => {
    const ok = await copyToClipboard(key);
    if (ok) {
      setCopiedKeys((prev) => new Set(prev).add(id));
      toast({ title: 'Copied!', description: 'Key copied to clipboard.' });
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
        toast({ title: 'Deleted', description: 'Key has been deleted.' });
      } else {
        const newStatus = confirmAction.type === 'block' ? 'blocked' : 'active';
        await updateKey(confirmAction.key.id, { status: newStatus });
        toast({
          title: confirmAction.type === 'block' ? 'Blocked' : 'Unblocked',
          description: `Key has been ${confirmAction.type}ed.`,
        });
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
    const displayStatus = isExp ? 'expired' : status;

    switch (displayStatus) {
      case 'active':
        return (
          <Badge className="bg-[#80EE98]/15 text-[#80EE98] border-[#80EE98]/25 hover:bg-[#80EE98]/20">
            Active
          </Badge>
        );
      case 'blocked':
        return (
          <Badge className="bg-[#ff6b6b]/15 text-[#ff6b6b] border-[#ff6b6b]/25 hover:bg-[#ff6b6b]/20">
            Blocked
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-[#ffd93d]/15 text-[#ffd93d] border-[#ffd93d]/25 hover:bg-[#ffd93d]/20">
            Expired
          </Badge>
        );
      default:
        return (
          <Badge className="bg-white/10 text-white/50 border-white/20">
            {status}
          </Badge>
        );
    }
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
          <TabsList className="glass-card border-white/10">
            <TabsTrigger value="active" className="data-[state=active]:bg-[#09D1C7]/20 data-[state=active]:text-[#80EE98] rounded-lg transition-all">
              Active Keys
            </TabsTrigger>
            <TabsTrigger value="blocked" className="data-[state=active]:bg-[#ff6b6b]/20 data-[state=active]:text-[#ff6b6b] rounded-lg transition-all">
              Blocked Keys
            </TabsTrigger>
            <TabsTrigger value="expired" className="data-[state=active]:bg-[#ffd93d]/20 data-[state=active]:text-[#ffd93d] rounded-lg transition-all">
              Expired Keys
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            placeholder="Search username or key..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : keys.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-white/40"
          >
            <Key className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No {activeTab} keys found</p>
            {search && (
              <p className="text-xs mt-1 text-white/25">Try adjusting your search</p>
            )}
          </motion.div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/8 hover:bg-transparent">
                    <TableHead className="text-white/50 font-medium">Username</TableHead>
                    <TableHead className="text-white/50 font-medium">Key</TableHead>
                    <TableHead className="text-white/50 font-medium">Created</TableHead>
                    <TableHead className="text-white/50 font-medium">Expiry</TableHead>
                    <TableHead className="text-white/50 font-medium">Devices</TableHead>
                    <TableHead className="text-white/50 font-medium">Status</TableHead>
                    <TableHead className="text-white/50 font-medium text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map((item, index) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-white/6 hover:bg-white/[0.03] transition-colors"
                    >
                      <TableCell className="text-white font-medium text-sm py-3">
                        {item.username}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1.5">
                          <code className="text-xs text-white/60 font-mono bg-white/5 px-2 py-1 rounded">
                            {visibleKeys.has(item.id) ? item.key : maskKey(item.key)}
                          </code>
                          <button
                            onClick={() => {
                              setVisibleKeys((prev) => {
                                const next = new Set(prev);
                                if (next.has(item.id)) next.delete(item.id);
                                else next.add(item.id);
                                return next;
                              });
                            }}
                            className="text-white/30 hover:text-white/60 transition-colors p-1"
                          >
                            {visibleKeys.has(item.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleCopyKey(item.key, item.id)}
                            className="text-white/30 hover:text-white/60 transition-colors p-1"
                          >
                            {copiedKeys.has(item.id) ? (
                              <Check className="w-3.5 h-3.5 text-[#80EE98]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-white/50 text-xs py-3 whitespace-nowrap">
                        {formatDate(item.createdAt)}
                      </TableCell>
                      <TableCell className="text-white/50 text-xs py-3 whitespace-nowrap">
                        {formatDate(item.expiryAt)}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1 text-xs">
                          <Monitor className="w-3.5 h-3.5 text-white/40" />
                          <span className="text-white/70">{item.usedDevices?.length || 0}</span>
                          <span className="text-white/30">/</span>
                          <span className="text-white/50">{item.devicesLimit}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        {getStatusBadge(item.status, item.expiryAt)}
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {item.status === 'active' ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-[#ff6b6b]/70 hover:text-[#ff6b6b] hover:bg-[#ff6b6b]/10"
                              onClick={() => setConfirmAction({ type: 'block', key: item })}
                            >
                              <Ban className="w-3.5 h-3.5 mr-1" />
                              Block
                            </Button>
                          ) : item.status === 'blocked' ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-[#80EE98]/70 hover:text-[#80EE98] hover:bg-[#80EE98]/10"
                              onClick={() => setConfirmAction({ type: 'unblock', key: item })}
                            >
                              <RotateCcw className="w-3.5 h-3.5 mr-1" />
                              Unblock
                            </Button>
                          ) : null}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-white/40 hover:text-red-400 hover:bg-red-500/10"
                            onClick={() => setConfirmAction({ type: 'delete', key: item })}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-white/6">
              {keys.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-sm">{item.username}</span>
                    {getStatusBadge(item.status, item.expiryAt)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <code className="text-xs text-white/60 font-mono bg-white/5 px-2 py-1 rounded flex-1 truncate">
                      {visibleKeys.has(item.id) ? item.key : maskKey(item.key)}
                    </code>
                    <button
                      onClick={() => {
                        setVisibleKeys((prev) => {
                          const next = new Set(prev);
                          if (next.has(item.id)) next.delete(item.id);
                          else next.add(item.id);
                          return next;
                        });
                      }}
                      className="text-white/30 hover:text-white/60 transition-colors p-1"
                    >
                      {visibleKeys.has(item.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleCopyKey(item.key, item.id)}
                      className="text-white/30 hover:text-white/60 transition-colors p-1"
                    >
                      {copiedKeys.has(item.id) ? (
                        <Check className="w-3.5 h-3.5 text-[#80EE98]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-white/40">
                    <span>{formatDate(item.createdAt)}</span>
                    <div className="flex items-center gap-1">
                      <Monitor className="w-3 h-3" />
                      <span>{item.usedDevices?.length || 0}/{item.devicesLimit}</span>
                    </div>
                  </div>
                  <div className="text-xs text-white/30">Expires: {formatDate(item.expiryAt)}</div>
                  <div className="flex gap-2 pt-1">
                    {item.status === 'active' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-3 text-xs text-[#ff6b6b]/70 hover:text-[#ff6b6b] hover:bg-[#ff6b6b]/10 flex-1"
                        onClick={() => setConfirmAction({ type: 'block', key: item })}
                      >
                        <Ban className="w-3.5 h-3.5 mr-1" /> Block
                      </Button>
                    )}
                    {item.status === 'blocked' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-3 text-xs text-[#80EE98]/70 hover:text-[#80EE98] hover:bg-[#80EE98]/10 flex-1"
                        onClick={() => setConfirmAction({ type: 'unblock', key: item })}
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1" /> Unblock
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-3 text-xs text-white/40 hover:text-red-400 hover:bg-red-500/10 flex-1"
                      onClick={() => setConfirmAction({ type: 'delete', key: item })}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/6">
                <p className="text-xs text-white/40">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-white/50 hover:text-white hover:bg-white/10"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-white/50 hover:text-white hover:bg-white/10"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => { if (!open) setConfirmAction(null); }}>
        <AlertDialogContent className="glass-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {confirmAction?.type === 'delete' ? 'Delete Key' : confirmAction?.type === 'block' ? 'Block Key' : 'Unblock Key'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              {confirmAction?.type === 'delete'
                ? `Are you sure you want to delete the key for "${confirmAction?.key.username}"? This action cannot be undone.`
                : confirmAction?.type === 'block'
                  ? `Are you sure you want to block the key for "${confirmAction?.key.username}"? The user will lose access.`
                  : `Are you sure you want to unblock the key for "${confirmAction?.key.username}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
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
