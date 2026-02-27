'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ShoppingBag, Search, ChevronLeft, ChevronRight,
  RefreshCw, Eye, ArrowUpDown, X, Package,
  Truck, CheckCircle2, XCircle, Clock, CreditCard,
  MapPin, User, Phone, Hash, CalendarDays, Tag,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/api';
import OrdersService from '@/services/orders.service';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type {
  Order, OrderStatus, OrderMeta, OrderQueryParams, UpdateOrderStatusPayload,
} from '@/types/order.types';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: OrderStatus | ''; label: string }[] = [
  { value: '',                label: 'Semua Status'        },
  { value: 'PENDING_PAYMENT', label: 'Menunggu Pembayaran' },
  { value: 'PAID',            label: 'Sudah Dibayar'       },
  { value: 'PROCESSING',      label: 'Diproses'            },
  { value: 'SHIPPED',         label: 'Dikirim'             },
  { value: 'DELIVERED',       label: 'Terkirim'            },
  { value: 'CANCELLED',       label: 'Dibatalkan'          },
  { value: 'REFUNDED',        label: 'Dikembalikan'        },
];

// Enforces valid admin-driven status transitions
const NEXT_STATUSES: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PAID:       ['PROCESSING'],
  PROCESSING: ['SHIPPED'],
  SHIPPED:    ['DELIVERED'],
};

const TERMINAL_STATUSES: OrderStatus[] = ['DELIVERED', 'CANCELLED', 'REFUNDED'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatRupiah = (num: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));

const formatDateShort = (iso: string) =>
  new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(iso));

// ─── Status Config ────────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<OrderStatus, {
  label: string;
  className: string;
  icon: React.ElementType;
}> = {
  PENDING_PAYMENT: { label: 'Menunggu Bayar', className: 'bg-amber-50 text-amber-700 border-amber-200',       icon: Clock        },
  PAID:            { label: 'Dibayar',         className: 'bg-blue-50 text-blue-700 border-blue-200',          icon: CreditCard   },
  PROCESSING:      { label: 'Diproses',        className: 'bg-purple-50 text-purple-700 border-purple-200',    icon: Package      },
  SHIPPED:         { label: 'Dikirim',         className: 'bg-indigo-50 text-indigo-700 border-indigo-200',    icon: Truck        },
  DELIVERED:       { label: 'Terkirim',        className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  CANCELLED:       { label: 'Dibatalkan',      className: 'bg-red-50 text-red-700 border-red-200',             icon: XCircle      },
  REFUNDED:        { label: 'Dikembalikan',    className: 'bg-gray-50 text-gray-600 border-gray-200',          icon: RefreshCw    },
};

// ─── StatusBadge Component ────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status, className: 'bg-gray-100 text-gray-600 border-gray-200', icon: Clock,
  };
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

// ─── OrderDetailModal Component ───────────────────────────────────────────────

function OrderDetailModal({
  order,
  open,
  onClose,
  onStatusUpdate,
}: {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onStatusUpdate: (orderId: string, status: OrderStatus, trackingNumber?: string) => Promise<void>;
}) {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');

  useEffect(() => {
    setTrackingNumber(order?.courier?.trackingNumber ?? '');
  }, [order]);

  if (!order) return null;

  const nextStatuses = NEXT_STATUSES[order.status] ?? [];
  const canCancel = !TERMINAL_STATUSES.includes(order.status);

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    setUpdatingStatus(true);
    try {
      await onStatusUpdate(
        order.id,
        newStatus,
        newStatus === 'SHIPPED' ? trackingNumber : undefined,
      );
      onClose();
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ShoppingBag className="h-4 w-4 text-gray-500" />
            Order #{order.orderNumber}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-3">
            <StatusBadge status={order.status} />
            <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* ── Customer & Address ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-100 p-4 space-y-2.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pelanggan</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-gray-800 font-medium">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  {order.user?.name ?? '-'}
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Hash className="w-3.5 h-3.5 text-gray-400" />
                  {order.user?.email ?? '-'}
                </div>
                {order.user?.phone && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    {order.user.phone}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-gray-100 p-4 space-y-2.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Alamat Pengiriman</p>
              {order.address ? (
                <div className="text-sm text-gray-700 space-y-1">
                  <p className="font-medium">{order.address.recipientName}</p>
                  <p className="text-gray-500">{order.address.phone}</p>
                  <div className="flex gap-1 text-gray-500">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-gray-400" />
                    <p>
                      {[
                        order.address.street,
                        order.address.subdistrict,
                        order.address.city,
                        order.address.province,
                        order.address.postalCode,
                      ].filter(Boolean).join(', ')}
                    </p>
                  </div>
                  {order.address.notes && (
                    <p className="text-xs text-gray-400 italic">Catatan: {order.address.notes}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Tidak ada data alamat</p>
              )}
            </div>
          </div>

          {/* ── Courier & Payment ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-100 p-4 space-y-2.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pengiriman</p>
              {order.courier ? (
                <div className="text-sm space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-medium text-gray-800">
                      {order.courier.name} {order.courier.service}
                    </span>
                  </div>
                  <p className="text-gray-500 ml-5">{formatRupiah(order.courier.cost)}</p>
                  {order.courier.trackingNumber && (
                    <div className="ml-5 mt-1">
                      <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                        {order.courier.trackingNumber}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">-</p>
              )}
            </div>

            <div className="rounded-lg border border-gray-100 p-4 space-y-2.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pembayaran</p>
              <div className="text-sm space-y-1.5">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-medium text-gray-800 capitalize">
                    {order.paymentMethod?.replace('_', ' ') ?? '-'}
                  </span>
                </div>
                {order.paidAt && (
                  <div className="flex items-center gap-2 text-gray-500 ml-5">
                    <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                    {formatDate(order.paidAt)}
                  </div>
                )}
                {order.voucherCode && (
                  <div className="flex items-center gap-2 text-gray-500 ml-5">
                    <Tag className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-mono text-xs">{order.voucherCode}</span>
                    <span className="text-gray-400">(-{formatRupiah(order.discountAmount ?? 0)})</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Items ── */}
          <div className="rounded-lg border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Item Pesanan</p>
            </div>

            {order.items && order.items.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-12 h-12 object-cover rounded-lg flex-shrink-0 bg-gray-100"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                      <p className="text-xs text-gray-500">SKU: {item.variantSku} · Size: {item.size}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-900">{formatRupiah(item.subtotal)}</p>
                      <p className="text-xs text-gray-400">{item.quantity} × {formatRupiah(item.unitPrice)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-4 py-6 text-sm text-center text-gray-400">Tidak ada item</p>
            )}

            {/* Totals */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 space-y-1.5">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span><span>{formatRupiah(order.subtotal ?? 0)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Ongkir</span><span>{formatRupiah(order.shippingCost ?? 0)}</span>
              </div>
              {(order.discountAmount ?? 0) > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Diskon Voucher</span>
                  <span>-{formatRupiah(order.discountAmount)}</span>
                </div>
              )}
              <Separator className="my-1" />
              <div className="flex justify-between text-sm font-bold text-gray-900">
                <span>Total</span><span>{formatRupiah(order.total ?? 0)}</span>
              </div>
            </div>
          </div>

          {/* ── Status Update Actions ── */}
          {(nextStatuses.length > 0 || canCancel) && (
            <div className="rounded-lg border border-gray-100 p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Update Status</p>

              {/* Tracking number — only shown when about to ship */}
              {order.status === 'PROCESSING' && (
                <div className="space-y-1.5">
                  <label className="text-sm text-gray-600 font-medium">Nomor Resi (opsional)</label>
                  <Input
                    placeholder="Masukkan nomor resi pengiriman"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="text-sm"
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {nextStatuses.map((nextStatus) => (
                  <Button
                    key={nextStatus}
                    size="sm"
                    onClick={() => handleStatusUpdate(nextStatus)}
                    disabled={updatingStatus}
                    className="bg-gray-900 hover:bg-gray-700 text-white text-xs"
                  >
                    {updatingStatus && <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                    Tandai: {STATUS_CONFIG[nextStatus]?.label ?? nextStatus}
                  </Button>
                ))}
                {canCancel && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusUpdate('CANCELLED')}
                    disabled={updatingStatus}
                    className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1.5" />
                    Batalkan Order
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [meta, setMeta]       = useState<OrderMeta | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Filters ────────────────────────────────────────────────────────────────
  const [search, setSearch]                   = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus]                   = useState<OrderStatus | ''>('');
  const [page, setPage]                       = useState(1);
  const [limit]                               = useState(10);
  const [sortBy, setSortBy]                   = useState('createdAt');
  const [sortOrder, setSortOrder]             = useState<'asc' | 'desc'>('desc');

  // ── Detail modal ──────────────────────────────────────────────────────────
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen]       = useState(false);

  // ── Search debounce ────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => { setPage(1); }, [status]);

  // ── Fetch via OrdersService ────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: OrderQueryParams = { page, limit, sortBy, sortOrder };
      if (debouncedSearch) params.search = debouncedSearch;
      if (status) params.status = status;

      const { data, meta } = await OrdersService.getOrders(params);
      setOrders(data);
      setMeta(meta ?? null);
    } catch (error: any) {
      if (error.response?.status !== 401) toast.error('Gagal memuat data pesanan.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, status, sortBy, sortOrder]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ── Open detail modal — fetch full order via OrdersService ─────────────────
  const handleViewDetail = async (order: Order) => {
    setSelectedOrder(order); // optimistic: show list data immediately
    setDetailOpen(true);
    try {
      const fullOrder = await OrdersService.getOrder(order.id);
      setSelectedOrder(fullOrder);
    } catch {
      // keep the list-level data as fallback — modal still opens
    }
  };

  // ── Status update via OrdersService ───────────────────────────────────────
  const handleStatusUpdate = async (
    orderId: string,
    newStatus: OrderStatus,
    trackingNumber?: string,
  ) => {
    const toastId = toast.loading('Memperbarui status...');
    try {
      const payload: UpdateOrderStatusPayload = { status: newStatus };
      if (trackingNumber) payload.trackingNumber = trackingNumber;

      await OrdersService.updateStatus(orderId, payload);
      toast.success(
        `Status berhasil diubah ke "${STATUS_CONFIG[newStatus]?.label ?? newStatus}"`,
        { id: toastId },
      );
      fetchOrders();
    } catch (error) {
      toast.error(getErrorMessage(error), { id: toastId });
      throw error; // re-throw so modal can catch & stay open
    }
  };

  // ── Sort ──────────────────────────────────────────────────────────────────
  const handleSort = (key: string) => {
    if (sortBy === key) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(key); setSortOrder('asc'); }
  };

  const clearFilters = () => { setSearch(''); setStatus(''); setPage(1); };
  const hasActiveFilters = !!search || !!status;

  // ── KPI counts (from current page) ────────────────────────────────────────
  const kpiCounts = {
    pending:    orders.filter((o) => o.status === 'PENDING_PAYMENT').length,
    processing: orders.filter((o) => o.status === 'PROCESSING').length,
    shipped:    orders.filter((o) => o.status === 'SHIPPED').length,
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pesanan"
        description={`${meta?.total ?? orders.length} total pesanan`}
        icon={ShoppingBag}
        actions={
          <Button size="sm" variant="outline" onClick={fetchOrders} disabled={loading} className="h-9">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {/* ── KPI Strip ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {([
          { label: 'Menunggu Bayar', count: kpiCounts.pending,    filterStatus: 'PENDING_PAYMENT' as OrderStatus, color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-100'  },
          { label: 'Diproses',       count: kpiCounts.processing, filterStatus: 'PROCESSING' as OrderStatus,      color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
          { label: 'Dikirim',        count: kpiCounts.shipped,    filterStatus: 'SHIPPED' as OrderStatus,         color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
        ] as const).map((kpi) => (
          <button
            key={kpi.filterStatus}
            onClick={() => setStatus(status === kpi.filterStatus ? '' : kpi.filterStatus)}
            className={`rounded-xl border p-4 text-left transition-all duration-150 hover:shadow-sm ${kpi.bg} ${kpi.border} ${status === kpi.filterStatus ? 'ring-2 ring-offset-1 ring-gray-900' : ''}`}
          >
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.count}</p>
            <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">halaman ini</p>
          </button>
        ))}
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari nomor order, nama, atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        <Select
          value={status || 'all'}
          onValueChange={(v) => setStatus(v === 'all' ? '' : v as OrderStatus)}
        >
          <SelectTrigger className="h-9 w-full sm:w-52 text-sm">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value || 'all'} value={opt.value || 'all'} className="text-sm">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-gray-500">
            <X className="h-4 w-4 mr-1.5" /> Reset
          </Button>
        )}
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-3.5 text-left">
                  <button onClick={() => handleSort('orderNumber')} className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-900">
                    Order <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pelanggan</th>
                <th className="px-6 py-3.5 text-left">
                  <button onClick={() => handleSort('createdAt')} className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-900">
                    Tanggal <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pembayaran</th>
                <th className="px-6 py-3.5 text-right">
                  <button onClick={() => handleSort('total')} className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-900 ml-auto">
                    Total <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: limit }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-100 rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-gray-300" />
                      </div>
                      <p className="text-sm font-medium text-gray-500">Tidak ada pesanan ditemukan</p>
                      {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                          Reset filter
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const nextStatuses = NEXT_STATUSES[order.status] ?? [];
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Order Number */}
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                          {order.orderNumber}
                        </span>
                        {order.items?.length > 0 && (
                          <p className="text-[11px] text-gray-400 mt-1">{order.items.length} item</p>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 text-sm">{order.user?.name ?? '-'}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[160px]">{order.user?.email ?? '-'}</p>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {formatDateShort(order.createdAt)}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <StatusBadge status={order.status} />
                      </td>

                      {/* Payment Method */}
                      <td className="px-6 py-4 text-sm text-gray-500 capitalize">
                        {order.paymentMethod?.replace('_', ' ') ?? '-'}
                      </td>

                      {/* Total */}
                      <td className="px-6 py-4 text-right">
                        <span className="font-semibold text-gray-900">{formatRupiah(order.total ?? 0)}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem className="cursor-pointer" onClick={() => handleViewDetail(order)}>
                              <Eye className="mr-2 h-4 w-4" /> Lihat Detail
                            </DropdownMenuItem>

                            {nextStatuses.length > 0 && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-[10px] text-gray-400 font-normal py-0">
                                  Update Status
                                </DropdownMenuLabel>
                                {nextStatuses.map((ns) => (
                                  <DropdownMenuItem
                                    key={ns}
                                    className="cursor-pointer text-gray-700"
                                    onClick={() => handleStatusUpdate(order.id, ns)}
                                  >
                                    <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
                                    {STATUS_CONFIG[ns]?.label ?? ns}
                                  </DropdownMenuItem>
                                ))}
                              </>
                            )}

                            {!TERMINAL_STATUSES.includes(order.status) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer"
                                  onClick={() => handleStatusUpdate(order.id, 'CANCELLED')}
                                >
                                  <XCircle className="mr-2 h-4 w-4" /> Batalkan
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-gray-100">
          <div className="text-sm text-slate-500">
            {meta ? (
              <>
                Halaman <span className="font-medium text-slate-900">{meta.page}</span> dari{' '}
                <span className="font-medium text-slate-900">{meta.lastPage}</span>
                <span className="hidden sm:inline"> · {meta.total} pesanan</span>
              </>
            ) : (
              <span>{orders.length} pesanan</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!meta?.hasPrevPage || loading}
              className="h-8"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            <Button
              variant="outline" size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!meta?.hasNextPage || loading}
              className="h-8"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Detail Modal ────────────────────────────────────────────────────── */}
      <OrderDetailModal
        order={selectedOrder}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedOrder(null); }}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
}