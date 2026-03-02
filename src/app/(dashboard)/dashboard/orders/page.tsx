'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ShoppingBag, Search, ChevronLeft, ChevronRight,
  Eye, CalendarDays, User, Loader2, Package, Truck, CheckCircle2, Wallet
} from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/api';
import OrdersService from '@/services/orders.service';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ORDER_STATUS_CONFIG } from '@/lib/constants';
import type { Order, OrderStatus, OrderMeta } from '@/types/order.types';
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
  const [meta, setMeta] = useState<OrderMeta | null>(null);
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
      setMeta(res.meta);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [page, status, debouncedSearch]);

  // Fetch Summary Statistics
  const fetchStats = useCallback(async () => {
    try {
      // Panggil API secara paralel dengan limit 1 untuk mengambil meta.total tiap status
      const [allRes, paidRes, procRes, shipRes] = await Promise.all([
        OrdersService.getOrders({ limit: 1 }),
        OrdersService.getOrders({ limit: 1, status: 'paid' }),
        OrdersService.getOrders({ limit: 1, status: 'processing' }),
        OrdersService.getOrders({ limit: 1, status: 'shipped' }),
      ]);
      setStats({
        total: allRes.meta.total,
        paid: paidRes.meta.total,
        processing: procRes.meta.total,
        shipped: shipRes.meta.total,
      });
    } catch (error) {
      console.error('Gagal mengambil statistik:', error);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchStats(); // Panggil fetchStats saat halaman pertama kali dimuat
  }, [fetchOrders, fetchStats]);

  const openDetailModal = async (order: Order) => {
    try {
      const fullOrder = await OrdersService.getOrder(String(order.id));
      setSelectedOrder(fullOrder);
      setDetailOpen(true);
    } catch (error) {
      toast.error('Gagal mengambil detail pesanan');
    }
  };

  // Fungsi ketika status diupdate (refresh tabel & refresh stats)
  const handleRefresh = () => {
    fetchOrders();
    fetchStats(); 
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

      {/* ── FILTER & SEARCH ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Cari ID Pesanan, Nama, atau Resi..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="w-full sm:w-64">
          <Select value={status} onValueChange={(val: any) => { setStatus(val); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="Filter Status" /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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