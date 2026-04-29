'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ShoppingBag, Search, ChevronLeft, ChevronRight,
  Eye, CalendarDays, User, Loader2, Package, Truck, CheckCircle2, Wallet,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/api';
import OrdersService, { type OrderAdminMeta } from '@/services/orders.service';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ORDER_STATUS_CONFIG } from '@/lib/constants';
import type { Order, OrderStatus } from '@/types/order.types';
import OrderDetailModal from '@/components/module/order/OrderDetailModal';

const STATUS_OPTIONS: { value: OrderStatus | 'ALL'; label: string }[] = [
  { value: 'ALL',             label: 'Semua Status' },
  { value: 'pending',         label: 'Pending' },
  { value: 'waiting_payment', label: 'Menunggu Pembayaran' },
  { value: 'paid',            label: 'Sudah Dibayar' },
  { value: 'processing',      label: 'Diproses' },
  { value: 'shipped',         label: 'Dikirim' },
  { value: 'delivered',       label: 'Terkirim' },
  { value: 'completed',       label: 'Selesai' },
  { value: 'cancelled',       label: 'Dibatalkan' },
  { value: 'returned',        label: 'Dikembalikan' },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  // FIX: pakai OrderAdminMeta agar meta.lastPage tersedia (backend kirim lastPage, bukan totalPages)
  const [meta, setMeta] = useState<OrderAdminMeta | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Statistics State ---
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    processing: 0,
    shipped: 0,
  });

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // --- Export State ---
  const [exporting, setExporting]     = useState(false);
  const [exportDateFrom, setExportDateFrom] = useState('');
  const [exportDateTo, setExportDateTo]     = useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Orders for the Table
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await OrdersService.getOrders({
        page,
        limit: 10,
        status: status === 'ALL' ? undefined : status,
        search: debouncedSearch || undefined,
      });
      setOrders(res.data);
      // FIX: backend kirim res.meta langsung dengan field yang benar (lastPage, dll)
      setMeta(res.meta);
      if (res.meta.summary) {
        setStats({
          total:      res.meta.summary.total_all,
          paid:       res.meta.summary.paid,
          processing: res.meta.summary.processing,
          shipped:    res.meta.summary.shipped,
        });
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [page, status, debouncedSearch]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const openDetailModal = async (order: Order) => {
    try {
      const fullOrder = await OrdersService.getOrder(String(order.id));
      setSelectedOrder(fullOrder);
      setDetailOpen(true);
    } catch (error) {
      toast.error('Gagal mengambil detail pesanan');
    }
  };

  const handleRefresh = () => fetchOrders();

  // --- Export Handler ---
  const handleExport = async () => {
    try {
      setExporting(true);
      await OrdersService.exportOrders({
        status:   status !== 'ALL' ? status : undefined,
        search:   debouncedSearch || undefined,
        dateFrom: exportDateFrom || undefined,
        dateTo:   exportDateTo   || undefined,
      });
      toast.success('File CSV berhasil diunduh!');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setExporting(false);
    }
  };
  

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Manajemen Pesanan" 
        description="Pantau transaksi, proses pengiriman, dan kelola status pesanan."
        icon={ShoppingBag}
      />

      {/* ── 📊 KARTU STATISTIK (STAT CARDS) ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Pesanan */}
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Pesanan</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Pesanan Baru (Sudah Dibayar) */}
        <Card className="border-blue-200 shadow-sm bg-blue-50/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">Perlu Diproses</p>
              <h3 className="text-2xl font-bold text-blue-900">{stats.paid}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Pesanan Sedang Diproses / Dikemas */}
        <Card className="border-indigo-200 shadow-sm bg-indigo-50/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-indigo-800">Sedang Dikemas</p>
              <h3 className="text-2xl font-bold text-indigo-900">{stats.processing}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Pesanan Dikirim */}
        <Card className="border-orange-200 shadow-sm bg-orange-50/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-orange-800">Dalam Pengiriman</p>
              <h3 className="text-2xl font-bold text-orange-900">{stats.shipped}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        
        {/* Header Tabs (Scrollable on Mobile) */}
        <div className="flex overflow-x-auto border-b border-gray-100 bg-gray-50/50 px-2 pt-2 no-scrollbar">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setStatus(opt.value as OrderStatus | 'ALL'); setPage(1); }}
              className={`whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                status === opt.value
                  ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg shadow-[0_-2px_10px_rgba(0,0,0,0.02)]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-100/50 rounded-t-lg'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Search Bar + Export Area */}
        <div className="p-4 flex flex-col gap-3 bg-white">
          {/* Row 1: Search + item count */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari ID Pesanan, Nama, atau Resi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-gray-50 border-gray-200 focus-visible:ring-indigo-500"
              />
            </div>
            <div className="text-sm text-gray-500 font-medium px-2 shrink-0">
              Menampilkan <span className="text-gray-900 font-bold">{orders.length}</span> pesanan
            </div>
          </div>

          {/* Row 2: Export controls */}
          <div className="flex flex-wrap gap-2 items-center border-t border-gray-100 pt-3">
            <span className="text-xs font-medium text-gray-500 mr-1">Export CSV:</span>
            <div className="flex items-center gap-1">
              <label className="text-xs text-gray-500 shrink-0">Dari</label>
              <Input
                type="date"
                value={exportDateFrom}
                onChange={(e) => setExportDateFrom(e.target.value)}
                className="h-8 text-xs w-36 bg-gray-50 border-gray-200"
              />
            </div>
            <div className="flex items-center gap-1">
              <label className="text-xs text-gray-500 shrink-0">s/d</label>
              <Input
                type="date"
                value={exportDateTo}
                onChange={(e) => setExportDateTo(e.target.value)}
                className="h-8 text-xs w-36 bg-gray-50 border-gray-200"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exporting}
              className="h-8 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800"
            >
              {exporting
                ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Mengekspor...</>
                : <><Download className="w-3.5 h-3.5 mr-1.5" /> Export{status !== 'ALL' ? ` (${status})` : ''}</>
              }
            </Button>
            {(exportDateFrom || exportDateTo) && (
              <button
                onClick={() => { setExportDateFrom(''); setExportDateTo(''); }}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Reset tanggal
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── TABEL PESANAN ──────────────────────────────────────────────────── */}
      <Card className="p-0 overflow-hidden border border-gray-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 font-medium">ID Pesanan & Tanggal</th>
                <th className="px-6 py-4 font-medium">Pelanggan</th>
                <th className="px-6 py-4 font-medium">Total Harga</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2"/> Memuat pesanan...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Tidak ada pesanan ditemukan.</td></tr>
              ) : (
                orders.map((order) => {
                  const statusConf = ORDER_STATUS_CONFIG[order.status as OrderStatus];
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 space-y-1">
                        <div className="font-bold text-gray-900 font-mono">#{order.orderNumber || order.id}</div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <CalendarDays className="w-3 h-3 mr-1" />
                          {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 space-y-1">
                        <div className="font-medium text-gray-900 flex items-center"><User className="w-3 h-3 mr-1 text-gray-400"/>{order.user?.name || order.address?.recipientName || 'Guest'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-emerald-600">Rp {Number(order.total).toLocaleString('id-ID')}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant="outline" className={`${statusConf?.bgColor || 'bg-gray-100'} ${statusConf?.color || 'text-gray-700'} border-none`}>
                          {statusConf?.label || order.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="outline" size="sm" onClick={() => openDetailModal(order)}>
                          <Eye className="w-4 h-4 mr-2" /> Detail
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION ─────────────────────────────────────────────────────── */}
        {/* FIX: backend kirim lastPage, bukan totalPages */}
        {meta && meta.lastPage > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-sm text-gray-500">Halaman {meta.page} dari {meta.lastPage}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!meta.hasPrevPage}><ChevronLeft className="w-4 h-4 mr-1" /> Prev</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={!meta.hasNextPage}>Next <ChevronRight className="w-4 h-4 ml-1" /></Button>
            </div>
          </div>
        )}
      </Card>

      <OrderDetailModal
        order={selectedOrder}
        isOpen={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedOrder(null); }}
        onRefresh={handleRefresh}
      />
    </div>
  );
}