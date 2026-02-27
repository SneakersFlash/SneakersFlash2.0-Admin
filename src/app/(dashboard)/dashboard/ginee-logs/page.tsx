'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  Search, RefreshCw, Eye, AlertCircle, CheckCircle2, 
  Clock, ArrowUpDown, ChevronLeft, ChevronRight, XCircle, FileJson 
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api'; // Pastikan path ini benar
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

// Tipe data sesuai Prisma Enum & Response Backend
type GineeLogType = 'pull_stock' | 'push_order' | 'pull_product' | 'push_product' | 'sync_all';
type GineeLogStatus = 'success' | 'failed' | 'completed' | 'partial';

interface GineeLog {
  id: string; // BigInt usually comes as string from JSON API
  type: GineeLogType;
  status: GineeLogStatus;
  errorMessage: string | null;
  payloadSent: any;
  responseReceived: any;
  createdAt: string;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
}

export default function GineeLogsPage() {
  const [logs, setLogs] = useState<GineeLog[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Filter State ─────────────────────────────────────────────────────────────
  const [page, setPage]     = useState(1);
  const [limit, setLimit]   = useState(20);
  const [typeFilter, setTypeFilter] = useState<GineeLogType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<GineeLogStatus | 'all'>('all');

  // ── Modal Detail State ───────────────────────────────────────────────────────
  const [selectedLog, setSelectedLog] = useState<GineeLog | null>(null);
  const [detailOpen, setDetailOpen]   = useState(false);

  // ── Fetch Logs ───────────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (typeFilter !== 'all') params.type = typeFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await api.get('/ginee/logs', { params });
      
      if (response.data && Array.isArray(response.data.data)) {
        setLogs(response.data.data);
        setMeta(response.data.meta);
      } else {
        setLogs([]);
      }
    } catch (error: any) {
      toast.error('Gagal memuat log Ginee.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, typeFilter, statusFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const getStatusBadge = (status: GineeLogStatus) => {
    switch (status) {
      case 'success':
      case 'completed':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200 gap-1"><CheckCircle2 className="w-3 h-3" /> Success</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200 gap-1"><XCircle className="w-3 h-3" /> Failed</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200 gap-1"><AlertCircle className="w-3 h-3" /> Partial</Badge>;
      default:
        return <Badge variant="outline" className="text-slate-500 gap-1"><Clock className="w-3 h-3" /> {status}</Badge>;
    }
  };

  const getTypeBadge = (type: GineeLogType) => {
    const labels: Record<string, string> = {
      pull_stock: 'Stock Update',
      push_order: 'Push Order',
      pull_product: 'Pull Product',
      push_product: 'Push Product',
      sync_all: 'Sync All Job',
    };
    return <span className="font-mono text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded border">{labels[type] || type}</span>;
  };

  const openDetail = (log: GineeLog) => {
    setSelectedLog(log);
    setDetailOpen(true);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-6">
      
      {/* ── HEADER ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ginee Integration Logs</h1>
          <p className="text-sm text-slate-500">Pantau aktivitas sinkronisasi produk, stok, dan order.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchLogs} 
          disabled={loading}
          className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Log
        </Button>
      </div>

      {/* ── FILTERS ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        
        {/* Type Filter */}
        <div className="w-full sm:w-48">
          <Select value={typeFilter} onValueChange={(v: any) => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="bg-slate-50 border-slate-200">
              <SelectValue placeholder="Filter Tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              <SelectItem value="pull_stock">Stock Update</SelectItem>
              <SelectItem value="push_order">Push Order</SelectItem>
              <SelectItem value="pull_product">Pull Product</SelectItem>
              <SelectItem value="push_product">Push Product</SelectItem>
              <SelectItem value="sync_all">Sync All Job</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="w-full sm:w-48">
          <Select value={statusFilter} onValueChange={(v: any) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="bg-slate-50 border-slate-200">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="success">Success / Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1"></div> {/* Spacer */}

        {/* Limit Selector */}
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

      {/* ── TABLE ─────────────────────────────────────────────────────────────── */}
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
                [...Array(5)].map((_, i) => (
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
                    <td className="px-6 py-4">
                      {getTypeBadge(log.type)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(log.status)}
                    </td>
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
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openDetail(log)}
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
            Page <span className="font-medium text-slate-900">{meta?.page || 1}</span> of{' '}
            <span className="font-medium text-slate-900">{meta?.lastPage || 1}</span>
            <span className="hidden sm:inline"> ({meta?.total || 0} logs)</span>
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
              disabled={page >= (meta?.lastPage || 1) || loading}
              className="h-8"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── DETAIL MODAL ──────────────────────────────────────────────────────── */}
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
                
                {/* Info Ringkas */}
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

                {/* Error Message (If Any) */}
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

                {/* Payload Sent */}
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

                {/* Response Received */}
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