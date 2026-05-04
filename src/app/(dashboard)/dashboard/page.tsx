'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ShoppingCart, DollarSign, Users, Package,
  TrendingUp, Clock, LayoutDashboardIcon, Loader2,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { toast } from 'sonner';
import StatCard from '@/components/shared/StatCard';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/utils';
import type { DashboardStats, RevenueChartData, OrderStatusDist } from '@/types';
import api, { getErrorMessage } from '@/lib/api';

const PIE_COLORS = ['#f59e0b', '#6366f1', '#f97316', '#22c55e', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6'];

export default function DashboardPage() {
  const [stats, setStats]           = useState<DashboardStats | null>(null);
  const [chart, setChart]           = useState<RevenueChartData[]>([]);
  const [statusDist, setStatusDist] = useState<OrderStatusDist[]>([]);
  const [isLoading, setIsLoading]   = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      setIsLoading(true);
      const [statsRes, chartRes, statusRes] = await Promise.all([
        api.get<DashboardStats>('/dashboard/stats'),
        api.get<RevenueChartData[]>('/dashboard/revenue-chart?days=7'),
        api.get<OrderStatusDist[]>('/dashboard/order-status'),
      ]);
      setStats(statsRes.data);
      setChart(chartRes.data);
      setStatusDist(statusRes.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

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
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Revenue 7 Hari Terakhir</h3>
              <p className="text-xs text-gray-500 mt-0.5">Total pendapatan harian</p>
            </div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center h-[200px]">
              <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chart}>
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
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
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
          )}
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-gray-900">Status Pesanan</h3>
            <p className="text-xs text-gray-500 mt-0.5">Distribusi status saat ini</p>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center h-[180px]">
              <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={statusDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {statusDist.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, _: unknown, props: { payload?: { label: string } }) => [
                      value,
                      props.payload?.label ?? '',
                    ]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {statusDist.map((item, i) => (
                  <div key={item.status} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="text-gray-600">{item.label}</span>
                    </div>
                    <span className="font-medium text-gray-900">{item.count}</span>
                  </div>
                ))}
              </div>
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
