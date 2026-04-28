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
  meta: OrderMeta & {
    summary?: {
      total_all:       number;
      pending:         number;
      waiting_payment: number;
      paid:            number;
      processing:      number;
      shipped:         number;
      delivered:       number;
      completed:       number;
      cancelled:       number;
      returned:        number;
    };
  };
}

// Shape tracking manifest dari RajaOngkir (sudah dinormalisasi backend)
export interface TrackingManifest {
  manifest_code:        string;
  manifest_description: string;
  manifest_date:        string;
  manifest_time:        string;
  city_name:            string;
}

export interface TrackingResult {
  delivered: boolean;
  summary: {
    courier_code:   string;
    courier_name:   string;
    waybill_number: string;
    service_code:   string;
    waybill_date:   string;
    shipper_name:   string;
    receiver_name:  string;
    origin:         string;
    destination:    string;
    status:         string;
  };
  details:         any;
  delivery_status: {
    status:       string;
    pod_receiver: string;
    pod_date:     string;
    pod_time:     string;
  };
  manifest: TrackingManifest[]; // diurutkan terbaru di atas oleh backend
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

  /**
   * Lacak resi via RajaOngkir
   * @param awb           Nomor resi
   * @param courier       Kode kurir lowercase (jne, sicepat, dll)
   * @param lastPhone     Nomor HP penerima — 5 digit terakhir, wajib untuk JNE
   */
  async trackShipment(awb: string, courier: string, lastPhone?: string): Promise<TrackingResult> {
    const params: Record<string, string> = { courier };
    if (lastPhone) {
      // Kirim 5 digit terakhir, strip karakter non-digit di sisi FE juga
      params.last_phone = lastPhone.replace(/\D/g, '').slice(-5);
    }
    const { data } = await api.get<TrackingResult>(`/logistics/track/${awb}`, { params });
    return data;
  },
};

export default OrdersService;