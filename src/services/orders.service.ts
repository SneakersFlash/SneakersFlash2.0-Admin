// src/services/orders.service.ts
import api from '@/lib/api';
import type {
  Order,
  OrderMeta,
  OrderQueryParams,
  UpdateOrderStatusPayload,
} from '@/types/order.types';

export interface OrdersResponse {
  data: Order[];
  meta: OrderMeta;
}

const OrdersService = {
  async getOrders(params: OrderQueryParams): Promise<OrdersResponse> {
    const { data } = await api.get<OrdersResponse>('/orders/admin', { params });
    return data;
  },

  async getOrder(id: string): Promise<Order> {
    const { data } = await api.get<Order>(`/orders/${id}`);
    return data;
  },

  async updateStatus(id: string, payload: UpdateOrderStatusPayload): Promise<Order> {
    const { data } = await api.patch<Order>(`/orders/${id}/status`, payload);
    return data;
  },

  async cancelOrder(id: string, reason?: string): Promise<Order> {
    const { data } = await api.patch<Order>(`/orders/${id}/cancel`, { reason });
    return data;
  },

  async requestKomercePickup(id: string): Promise<any> {
    const { data } = await api.post(`/orders/${id}/komerce-pickup`);
    return data;
  },
};

export default OrdersService;