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
  /**
   * Fetch paginated list of all orders (Admin).
   */
  async getOrders(params: OrderQueryParams): Promise<OrdersResponse> {
    // ⚠️ PERBAIKAN: Menambahkan { params } agar query dikirim ke backend
    const { data } = await api.get<OrdersResponse>('/orders/admin', { params });
    return data;
  },

  /**
   * Fetch a single order by ID (Admin).
   */
  async getOrder(id: string): Promise<Order> {
    const { data } = await api.get<Order>(`/orders/${id}`);
    return data;
  },

  /**
   * Update order status — e.g. mark as PROCESSING, SHIPPED, etc.
   */
  async updateStatus(id: string, payload: UpdateOrderStatusPayload): Promise<Order> {
    const { data } = await api.patch<Order>(`/orders/${id}/status`, payload);
    return data;
  },

  /**
   * Cancel an order (Admin override).
   */
  async cancelOrder(id: string, reason?: string): Promise<Order> {
    const { data } = await api.patch<Order>(`/orders/${id}/cancel`, { reason });
    return data;
  },
};

export default OrdersService;