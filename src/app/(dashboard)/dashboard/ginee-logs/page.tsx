'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  RefreshCw, Eye, AlertCircle, CheckCircle2,
  Clock, ArrowUpDown, ChevronLeft, ChevronRight, XCircle, FileJson,
  Activity, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import GineeService from '@/services/ginee.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import type {
  GineeLog, GineeLogStatus, GineeOperationType,
  GineeMeta, GineeStats, GineeQueueStatus,
} from '@/types/ginee.types';

// ─── Config ───────────────────────────────────────────────────────────────────

const OPERATION_LABELS: Record<GineeOperationType, string> = {
  pull_stock:   'Stock Update',
  push_order:   'Push Order',
  pull_product: 'Pull Product',
  push_product: 'Push Product',
  sync_all:     'Sync All Job',
};

const OPERATION_TYPES: GineeOperationType[] = [
  'pull_stock', 'push_order', 'pull_product', 'push_product', 'sync_all',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function timeAgo(iso: string | null) {
  if (!iso) return '-';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return 'Baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs} jam lalu`;
  return `${Math.floor(hrs / 24)} hari lalu`;
}

function getStatusBadge(status: GineeLogStatus) {
  switch (status) {
    case 'success':
    case 'completed':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200 gap-1"><CheckCircle2 className="w-3 h-3" /> {status === 'completed' ? 'Completed' : 'Success'}</Badge>;
    case 'failed':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200 gap-1"><XCircle className="w-3 h-3" /> Failed</Badge>;
    case 'partial':
      return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200 gap-1"><AlertCircle className="w-3 h-3" /> Partial</Badge>;
    default:
      return <Badge variant="outline" className="text-slate-500 gap-1"><Clock className="w-3 h-3" /> {status}</Badge>;
  }
}

function getTypeBadge(type: GineeOperationType) {
  return (
    <span className="font-mono text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded border">
      {OPERATION_LABELS[type] ?? type}
    </span>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function OperationStatCard({
  label, success, failed, lastSuccess,
}: {
  label: string;
  success: number;
  failed: number;
  lastSuccess: string | null;
}) {
  return (
    <div className={cn(
      'bg-white rounded-xl border p-4 shadow-sm',
      failed > 0 ? 'border-red-200' : 'border-slate-200',
    )}>
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">{label}</p>
      <div className="flex items-end gap-3 mb-2">
        <div>
          <p className="text-2xl font-bold text-slate-900">{success}</p>
          <p className="text-[10px] text-slate-400">berhasil</p>
        </div>
        {failed > 0 && (
          <div>
            <p className="text-2xl font-bold text-red-600">{failed}</p>
            <p className="text-[10px] text-slate-400">gagal</p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 text-[10px] text-slate-400">
        <Clock className="w-3 h-3 flex-shrink-0" />
        <span>{timeAgo(lastSuccess)}</span>
      </div>
    </div>
  );
}

function QueueBadge({ label, value, variant }: { label: string; value: number; variant: 'neutral' | 'warning' | 'danger' }) {
  const colors = { neutral: 'bg-slate-100 text-slate-700', warning: 'bg-yellow-100 text-yellow-700', danger: 'bg-red-100 text-red-700' };
  return (
    <div className={cn('flex flex-col items-center px-5 py-3 rounded-lg', colors[variant])}>
      <span className="text-xl font-bold">{value}</span>
      <span className="text-xs mt-0.5">{label}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GineeLogsPage() {
  const [logs, setLogs]   = useState<GineeLog[]>([]);
  const [meta, setMeta]   = useState<GineeMeta | null>(null);
  const [loading, setLoading] = useState(true);

  const [stats, setStats]   = useState<GineeStats | null>(null);
  const [queue, setQueue]   = useState<GineeQueueStatus | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [page, setPage]             = useState(1);
  const [limit, setLimit]           = useState(20);
  const [typeFilter, setTypeFilter] = useState<GineeOperationType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<GineeLogStatus | 'all'>('all');

  const [selectedLog, setSelectedLog] = useState<GineeLog | null>(null);
  const [detailOpen, setDetailOpen]   = useState(false);

  // ── Fetchers ─────────────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    try {
      const [statsData, queueData] = await Promise.all([
        GineeService.getStats(),
        GineeService.getQueueStatus(),
      ]);
      setStats(statsData);
      setQueue(queueData);
    } catch {
      // stats bersifat opsional, jangan blokir halaman
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await GineeService.getLogs({ page, limit, type: typeFilter, status: statusFilter });
      setLogs(result.data);
      setMeta(result.meta);
    } catch {
      toast.error('Gagal memuat log Ginee.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, typeFilter, statusFilter]);

  const handleRefresh = async () => {
    await Promise.all([fetchStats(), fetchLogs()]);
    toast.success('Data diperbarui');
  };

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="space-y-6 p-6">

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ginee Integration Logs</h1>
          <p className="text-sm text-slate-500">Pantau aktivitas sinkronisasi produk, stok, dan order.</p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={loading && loadingStats}
          className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700 gap-2"
        >
          <RefreshCw className={cn('h-4 w-4', (loading || loadingStats) && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* ── STATS 24 JAM ────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-700">Ringkasan 24 Jam Terakhir</h2>
          {stats && (
            <Badge variant="secondary" className="text-xs">
              {stats.processedEventsToday} event diproses
            </Badge>
          )}
        </div>

        {loadingStats ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 h-28 animate-pulse">
                <div className="h-2.5 bg-slate-200 rounded w-2/3 mb-4" />
                <div className="h-6 bg-slate-200 rounded w-1/3 mb-3" />
                <div className="h-2.5 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            {OPERATION_TYPES.map((op) => (
              <OperationStatCard
                key={op}
                label={OPERATION_LABELS[op]}
                success={stats.summary[op]?.success ?? 0}
                failed={stats.summary[op]?.failed ?? 0}
                lastSuccess={stats.summary[op]?.lastSuccess ?? null}
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* ── QUEUE STATUS ────────────────────────────────────────────────────── */}
      {!loadingStats && queue && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Status Queue Real-time</h2>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <QueueBadge label="Aktif"     value={queue.active}  variant={queue.active > 0  ? 'warning' : 'neutral'} />
              <QueueBadge label="Menunggu"  value={queue.waiting} variant={queue.waiting > 5 ? 'warning' : 'neutral'} />
              <QueueBadge label="Gagal"     value={queue.failed}  variant={queue.failed > 0  ? 'danger'  : 'neutral'} />
              <QueueBadge label="Delayed"   value={queue.delayed} variant={queue.delayed > 0 ? 'warning' : 'neutral'} />
            </div>

            {queue.failedJobs.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-red-600 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Job Gagal
                </p>
                {queue.failedJobs.map((job, i) => (
                  <div key={i} className="bg-red-50 border border-red-100 rounded-lg px-3 py-2.5 text-xs">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-red-800">{job.name}</span>
                      <span className="text-red-500">{job.attemptsMade}x percobaan</span>
                    </div>
                    <p className="text-red-600 mb-1">{job.failedReason}</p>
                    <p className="text-slate-400 font-mono truncate">{JSON.stringify(job.data)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── RECENT FAILURES ─────────────────────────────────────────────────── */}
      {!loadingStats && stats && stats.recentFailures.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Kegagalan Terbaru
          </h2>
          <div className="space-y-2">
            {stats.recentFailures.map((f, i) => (
              <div key={i} className="bg-white border border-red-100 rounded-lg px-3 py-2.5 text-xs">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <Badge className="bg-red-100 text-red-700 border-none text-[10px]">
                    {OPERATION_LABELS[f.type]}
                  </Badge>
                  <span className="text-slate-400">{formatDate(f.createdAt)}</span>
                </div>
                <p className="text-red-600 mb-1">{f.errorMessage}</p>
                <p className="text-slate-400 font-mono truncate">{JSON.stringify(f.payloadSent)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FILTERS ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="w-full sm:w-48">
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v as GineeOperationType | 'all'); setPage(1); }}>
            <SelectTrigger className="bg-slate-50 border-slate-200">
              <SelectValue placeholder="Filter Tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              {OPERATION_TYPES.map((op) => (
                <SelectItem key={op} value={op}>{OPERATION_LABELS[op]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-48">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as GineeLogStatus | 'all'); setPage(1); }}>
            <SelectTrigger className="bg-slate-50 border-slate-200">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1" />

        <div className="w-full sm:w-32">
          <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
            <SelectTrigger className="bg-slate-50 border-slate-200">
              <SelectValue placeholder="Limit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / page</SelectItem>
              <SelectItem value="20">20 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
              <SelectItem value="100">100 / page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── TABLE ───────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b">
              <tr>
                <th className="px-6 py-4 w-[180px]">Timestamp</th>
                <th className="px-6 py-4 w-[150px]">Type</th>
                <th className="px-6 py-4 w-[120px]">Status</th>
                <th className="px-6 py-4">Message / Error</th>
                <th className="px-6 py-4 text-right w-[100px]">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-6 py-4">
                      <div className="h-8 bg-slate-100 rounded animate-pulse w-full" />
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <FileJson className="h-10 w-10 text-slate-300 mb-3" />
                      <p className="font-medium">Belum ada log aktivitas.</p>
                      <p className="text-xs text-slate-400">Aktivitas sinkronisasi Ginee akan muncul di sini.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={String(log.id)} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-6 py-4">{getTypeBadge(log.type)}</td>
                    <td className="px-6 py-4">{getStatusBadge(log.status)}</td>
                    <td className="px-6 py-4">
                      {log.errorMessage ? (
                        <span className="text-red-600 font-medium line-clamp-1" title={log.errorMessage}>
                          {log.errorMessage}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-xs">No error message</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => { setSelectedLog(log); setDetailOpen(true); }}
                        className="h-8 w-8 p-0 hover:bg-slate-200 text-slate-500"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t">
          <div className="text-sm text-slate-500">
            Page <span className="font-medium text-slate-900">{meta?.page ?? 1}</span> of{' '}
            <span className="font-medium text-slate-900">{meta?.lastPage ?? 1}</span>
            <span className="hidden sm:inline"> ({meta?.total ?? 0} logs)</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="h-8"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            <Button
              variant="outline" size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= (meta?.lastPage ?? 1) || loading}
              className="h-8"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── DETAIL MODAL ────────────────────────────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5 text-blue-500" />
              Log Detail #{String(selectedLog?.id)}
            </DialogTitle>
            <DialogDescription>
              Detail payload request dan response dari Ginee.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <ScrollArea className="flex-1 pr-4 -mr-4 mt-2">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 text-xs">Type</span>
                    {getTypeBadge(selectedLog.type)}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 text-xs">Status</span>
                    <div>{getStatusBadge(selectedLog.status)}</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 text-xs">Time</span>
                    <span className="font-mono text-slate-700">{formatDate(selectedLog.createdAt)}</span>
                  </div>
                </div>

                {selectedLog.errorMessage && (
                  <div className="rounded-md bg-red-50 p-4 border border-red-100">
                    <h4 className="text-red-800 font-semibold text-sm mb-1 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> Error Occurred
                    </h4>
                    <pre className="text-xs text-red-700 whitespace-pre-wrap break-words font-mono">
                      {selectedLog.errorMessage}
                    </pre>
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <ArrowUpDown className="w-3 h-3 rotate-45" /> Payload Sent
                  </h4>
                  <div className="rounded-md bg-slate-900 p-4 overflow-auto max-h-60">
                    <pre className="text-xs text-green-400 font-mono">
                      {JSON.stringify(selectedLog.payloadSent, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <ArrowUpDown className="w-3 h-3 -rotate-135" /> Response Received
                  </h4>
                  <div className="rounded-md bg-slate-900 p-4 overflow-auto max-h-60">
                    <pre className="text-xs text-blue-400 font-mono">
                      {JSON.stringify(selectedLog.responseReceived, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
