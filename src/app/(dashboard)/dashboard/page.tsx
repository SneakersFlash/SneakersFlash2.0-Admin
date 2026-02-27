'use client';

import { useEffect, useState } from 'react';
import {
  ShoppingCart, DollarSign, Users, Package,
  TrendingUp, Clock,
  LayoutDashboardIcon,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import StatCard from '@/components/shared/StatCard';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency, formatDate, formatRelativeDate } from '@/lib/utils';
import type { DashboardStats, RevenueChartData, Order } from '@/types';

// ─── Mock data — replace with real API calls ──────────────────────────────────

const MOCK_STATS: DashboardStats = {
  totalRevenue: 84_500_000,
  revenueToday: 3_200_000,
  revenueGrowth: 12.4,
  totalOrders: 1_842,
  ordersToday: 23,
  ordersGrowth: 8.2,
  totalUsers: 654,
  newUsersToday: 7,
  lowStockCount: 12,
  pendingOrdersCount: 38,
};

const MOCK_REVENUE: RevenueChartData[] = [
  { date: '20 Feb', revenue: 2_100_000, orders: 15 },
  { date: '21 Feb', revenue: 3_800_000, orders: 27 },
  { date: '22 Feb', revenue: 2_900_000, orders: 20 },
  { date: '23 Feb', revenue: 4_200_000, orders: 31 },
  { date: '24 Feb', revenue: 3_500_000, orders: 24 },
  { date: '25 Feb', revenue: 5_100_000, orders: 38 },
  { date: '26 Feb', revenue: 3_200_000, orders: 23 },
];

const MOCK_STATUS_DIST = [
  { status: 'PENDING_PAYMENT', count: 38, label: 'Menunggu Bayar' },
  { status: 'PROCESSING',      count: 24, label: 'Diproses' },
  { status: 'SHIPPED',         count: 57, label: 'Dikirim' },
  { status: 'DELIVERED',       count: 143, label: 'Terkirim' },
  { status: 'CANCELLED',       count: 11, label: 'Dibatalkan' },
];

const PIE_COLORS = ['#f59e0b', '#6366f1', '#f97316', '#22c55e', '#ef4444'];

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [stats] = useState<DashboardStats>(MOCK_STATS);
  const [isLoading] = useState(false);

  // TODO: replace with real API calls
  // useEffect(() => {
  //   OrderService.getStats().then(setStats);
  // }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Selamat datang kembali! Berikut ringkasan hari ini.`}
        icon={LayoutDashboardIcon}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          subtitle={`${formatCurrency(stats.revenueToday)} hari ini`}
          icon={DollarSign}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
          trend={stats.revenueGrowth}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Pesanan"
          value={stats.totalOrders.toLocaleString('id-ID')}
          subtitle={`${stats.ordersToday} pesanan hari ini`}
          icon={ShoppingCart}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
          trend={stats.ordersGrowth}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Pengguna"
          value={stats.totalUsers.toLocaleString('id-ID')}
          subtitle={`+${stats.newUsersToday} pengguna baru`}
          icon={Users}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
          isLoading={isLoading}
        />
        <StatCard
          title="Stok Menipis"
          value={stats.lowStockCount}
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
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Revenue 7 Hari Terakhir
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Total pendapatan harian
              </p>
            </div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={MOCK_REVENUE}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}jt`}
              />
              <Tooltip
                formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#111827"
                strokeWidth={2}
                dot={{ fill: '#111827', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-gray-900">
              Status Pesanan
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Distribusi status saat ini
            </p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={MOCK_STATUS_DIST}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="count"
              >
                {MOCK_STATUS_DIST.map((_, index) => (
                  <Cell
                    key={index}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any, _: unknown, props: { payload?: { label: string } }) => [
                  value,
                  props.payload?.label ?? '',
                ]}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {MOCK_STATUS_DIST.map((item, i) => (
              <div key={item.status} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: PIE_COLORS[i] }}
                  />
                  <span className="text-gray-600">{item.label}</span>
                </div>
                <span className="font-medium text-gray-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending Orders Alert */}
      {stats.pendingOrdersCount > 0 && (
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
