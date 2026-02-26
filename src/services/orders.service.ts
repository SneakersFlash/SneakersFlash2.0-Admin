/**
 * src/services/orders.service.ts
 */
import api from '@/lib/api';
import type {
  Order,
  OrderFilters,
  UpdateOrderStatusDto,
  DashboardStats,
  RevenueChartData,
} from '@/types/order.types';
import type { PaginatedResponse, PaginationParams } from '@/types/api.types';

const OrderService = {
  async getAll(
    params?: PaginationParams & OrderFilters,
  ): Promise<PaginatedResponse<Order>> {
    const { data } = await api.get<PaginatedResponse<Order>>('/orders/admin', { params });
    return data;
  },

  async getById(id: string): Promise<Order> {
    const { data } = await api.get<Order>(`/orders/${id}`);
    return data;
  },

  async updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<Order> {
    const { data } = await api.patch<Order>(`/orders/${id}/status`, dto);
    return data;
  },

  async getStats(): Promise<DashboardStats> {
    const { data } = await api.get<DashboardStats>('/orders/admin/stats');
    return data;
  },

  async getRevenueChart(days = 7): Promise<RevenueChartData[]> {
    const { data } = await api.get<RevenueChartData[]>('/orders/admin/revenue-chart', {
      params: { days },
    });
    return data;
  },
};

export default OrderService;
