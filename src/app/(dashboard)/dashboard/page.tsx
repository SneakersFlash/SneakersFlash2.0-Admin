'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ShoppingCart, DollarSign, Users, Package,
  TrendingUp, Clock, LayoutDashboardIcon, Loader2,
} from 'lucide-react';
import {
  ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { toast } from 'sonner';
import StatCard from '@/components/shared/StatCard';
import PageHeader from '@/components/shared/PageHeader';
import { cn, formatCurrency } from '@/lib/utils';
import type { DashboardStats, RevenueChartData, OrderStatusDist } from '@/types';
import api, { getErrorMessage } from '@/lib/api';

// Warna status disamakan dengan badge status di halaman pesanan (ORDER_STATUS_CONFIG)
const STATUS_COLORS: Record<string, string> = {
  pending:         '#9ca3af',
  waiting_payment: '#eab308',
  paid:            '#3b82f6',
  processing:      '#6366f1',
  shipped:         '#f97316',
  delivered:       '#14b8a6',
  completed:       '#22c55e',
  cancelled:       '#ef4444',
  returned:        '#a855f7',
};

// Backend membatasi revenue-chart maksimal 30 hari
const RANGE_OPTIONS = [7, 14, 30] as const;
type RangeDays = (typeof RANGE_OPTIONS)[number];

const formatShortRupiah = (v: number) => {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1).replace('.0', '')}M`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace('.0', '')}jt`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}rb`;
  return String(v);
};

function RevenueTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { dataKey: string; value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const revenue = payload.find((p) => p.dataKey === 'revenue')?.value ?? 0;
  const orders  = payload.find((p) => p.dataKey === 'orders')?.value ?? 0;
  return (
    <div className="rounded-lg border border-gray-200 bg-white/95 backdrop-blur px-3 py-2.5 shadow-lg text-xs">
      <p className="font-semibold text-gray-900 mb-1.5">{label}</p>
      <div className="flex items-center justify-between gap-6">
        <span className="flex items-center gap-1.5 text-gray-500">
          <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" /> Revenue
        </span>
        <span className="font-semibold text-gray-900 tabular-nums">{formatCurrency(revenue)}</span>
      </div>
      <div className="flex items-center justify-between gap-6 mt-1">
        <span className="flex items-center gap-1.5 text-gray-500">
          <span className="w-2.5 h-2.5 rounded-sm bg-slate-300" /> Pesanan
        </span>
        <span className="font-semibold text-gray-900 tabular-nums">{orders}</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats]           = useState<DashboardStats | null>(null);
  const [chart, setChart]           = useState<RevenueChartData[]>([]);
  const [statusDist, setStatusDist] = useState<OrderStatusDist[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [rangeDays, setRangeDays]   = useState<RangeDays>(30);
  const [chartLoading, setChartLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      setIsLoading(true);
      const [statsRes, statusRes] = await Promise.all([
        api.get<DashboardStats>('/dashboard/stats'),
        api.get<OrderStatusDist[]>('/dashboard/order-status'),
      ]);
      setStats(statsRes.data);
      setStatusDist(statusRes.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    let cancelled = false;
    setChartLoading(true);
    api.get<RevenueChartData[]>(`/dashboard/revenue-chart?days=${rangeDays}`)
      .then((res) => { if (!cancelled) setChart(res.data); })
      .catch((error) => { if (!cancelled) toast.error(getErrorMessage(error)); })
      .finally(() => { if (!cancelled) setChartLoading(false); });
    return () => { cancelled = true; };
  }, [rangeDays]);

  const chartTotals = useMemo(() => {
    const revenue = chart.reduce((sum, d) => sum + d.revenue, 0);
    const orders  = chart.reduce((sum, d) => sum + d.orders, 0);
    return { revenue, orders, avgPerDay: chart.length ? revenue / chart.length : 0 };
  }, [chart]);

  const statusSorted = useMemo(
    () => [...statusDist].sort((a, b) => b.count - a.count),
    [statusDist],
  );
  const statusTotal = statusSorted.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Selamat datang kembali! Berikut ringkasan hari ini."
        icon={LayoutDashboardIcon}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={stats ? formatCurrency(stats.totalRevenue) : '-'}
          subtitle={stats ? `${formatCurrency(stats.revenueToday)} hari ini` : ''}
          icon={DollarSign}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
          trend={stats?.revenueGrowth}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Pesanan"
          value={stats ? stats.totalOrders.toLocaleString('id-ID') : '-'}
          subtitle={stats ? `${stats.ordersToday} pesanan hari ini` : ''}
          icon={ShoppingCart}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
          trend={stats?.ordersGrowth}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Pengguna"
          value={stats ? stats.totalUsers.toLocaleString('id-ID') : '-'}
          subtitle={stats ? `+${stats.newUsersToday} pengguna baru` : ''}
          icon={Users}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
          isLoading={isLoading}
        />
        <StatCard
          title="Stok Menipis"
          value={stats?.lowStockCount ?? '-'}
          subtitle="Produk perlu restok"
          icon={Package}
          iconColor="text-red-600"
          iconBgColor="bg-red-100"
          isLoading={isLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Revenue Chart */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-500" aria-hidden />
                <h3 className="text-sm font-semibold text-gray-900">Revenue & Pesanan</h3>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Pendapatan lunas per hari vs jumlah pesanan masuk</p>
            </div>
            <div role="radiogroup" aria-label="Rentang grafik" className="inline-flex self-start rounded-lg bg-gray-100 p-0.5">
              {RANGE_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={rangeDays === d}
                  onClick={() => setRangeDays(d)}
                  className={cn(
                    'px-3 h-7 rounded-md text-xs font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                    rangeDays === d ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800',
                  )}
                >
                  {d} hari
                </button>
              ))}
            </div>
          </div>

          {/* Ringkasan periode */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Total revenue', value: formatCurrency(chartTotals.revenue) },
              { label: 'Pesanan masuk', value: chartTotals.orders.toLocaleString('id-ID') },
              { label: 'Rata-rata / hari', value: formatCurrency(chartTotals.avgPerDay) },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-gray-50 px-3 py-2.5 min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 truncate">{item.label}</p>
                {chartLoading ? (
                  <div className="mt-1 h-5 w-20 bg-gray-200 rounded animate-pulse" />
                ) : (
                  <p className="mt-0.5 text-sm sm:text-base font-bold text-gray-900 tabular-nums truncate">{item.value}</p>
                )}
              </div>
            ))}
          </div>

          {chartLoading && chart.length === 0 ? (
            <div className="flex items-center justify-center h-[260px]">
              <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
            </div>
          ) : (
            <div className={cn('transition-opacity', chartLoading && 'opacity-50')}>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={chart} margin={{ top: 5, right: 0, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                    minTickGap={16}
                  />
                  <YAxis
                    yAxisId="revenue"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    tickFormatter={formatShortRupiah}
                  />
                  <YAxis
                    yAxisId="orders"
                    orientation="right"
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip content={<RevenueTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar
                    yAxisId="orders"
                    dataKey="orders"
                    fill="#e2e8f0"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={18}
                  />
                  <Area
                    yAxisId="revenue"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fill="url(#revenueFill)"
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: '#6366f1' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-5 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded bg-indigo-500" /> Revenue (kiri)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-200" /> Pesanan (kanan)</span>
              </div>
            </div>
          )}
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Status Pesanan</h3>
            <p className="text-xs text-gray-500 mt-0.5">Distribusi seluruh pesanan saat ini</p>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center h-[180px]">
              <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
            </div>
          ) : (
            <>
              <div className="relative">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={statusSorted}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={80}
                      paddingAngle={2}
                      cornerRadius={4}
                      stroke="none"
                      dataKey="count"
                      nameKey="label"
                    >
                      {statusSorted.map((item) => (
                        <Cell key={item.status} fill={STATUS_COLORS[item.status] ?? '#9ca3af'} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        `${value} (${statusTotal ? Math.round((value / statusTotal) * 100) : 0}%)`,
                        name,
                      ]}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900 tabular-nums">{statusTotal.toLocaleString('id-ID')}</span>
                  <span className="text-[11px] text-gray-500">total pesanan</span>
                </div>
              </div>
              <ul className="space-y-2.5 mt-4">
                {statusSorted.map((item) => {
                  const pct = statusTotal ? (item.count / statusTotal) * 100 : 0;
                  const color = STATUS_COLORS[item.status] ?? '#9ca3af';
                  return (
                    <li key={item.status} className="text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="flex items-center gap-2 text-gray-600">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                          {item.label}
                        </span>
                        <span className="tabular-nums">
                          <span className="font-semibold text-gray-900">{item.count}</span>
                          <span className="text-gray-400 ml-1.5">{pct.toFixed(0)}%</span>
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Pending Orders Alert */}
      {!isLoading && stats && stats.pendingOrdersCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {stats.pendingOrdersCount} pesanan menunggu tindakan
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Segera proses pesanan yang sudah dibayar untuk menjaga pengalaman pelanggan.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
