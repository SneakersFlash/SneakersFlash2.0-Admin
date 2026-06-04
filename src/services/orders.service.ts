// src/services/orders.service.ts
import api from '@/lib/api';
import type {
  Order,
  OrderMeta,
  OrderQueryParams,
  UpdateOrderStatusPayload,
} from '@/types/order.types';

// ─── FIX: OrderMeta harus cocok dengan response backend findAllForAdmin ────────
// Backend mengirim: { total, page, limit, lastPage, hasNextPage, hasPrevPage }
// Sebelumnya frontend memakai `totalPages` yang tidak ada di backend → pagination mati.
// Pastikan order.types.ts juga sudah menggunakan `lastPage`, bukan `totalPages`.
export interface OrderAdminMeta {
  total:       number;
  page:        number;
  limit:       number;
  lastPage:    number;   // ← bukan totalPages
  hasNextPage: boolean;
  hasPrevPage: boolean;
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
}

export interface OrdersAdminResponse {
  data: Order[];
  meta: OrderAdminMeta;
}

// Tetap export interface lama agar komponen lain yang masih pakai tidak break
export interface OrdersResponse {
  data: Order[];
  meta: OrderMeta & { summary?: OrderAdminMeta['summary'] };
}

export interface ExportOrdersParams {
  status?:   string;
  search?:   string;
  dateFrom?: string; // "YYYY-MM-DD"
  dateTo?:   string; // "YYYY-MM-DD"
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
  manifest: TrackingManifest[];
}

export interface LionParcelHistoryItem {
  row:              number;
  datetime:         string;   // ISO: "2026-05-08T11:28:54+07:00"
  status_code:      string;   // "BKD", "DLV", "POD", dll
  current_status:   string;
  location:         string;   // kode kota: "CGK"
  city:             string;   // nama kota: "JAKARTA"
  remarks:          string;
  stt_journey_type: string;   // deskripsi: "PAKETMU TELAH DIPROSES..."
  proof?: {
    name:     string;
    relation: string;
  };
}
 
export interface LionParcelTrackingResult {
  provider:       'LION_PARCEL';   // ditambahkan oleh backend kita
  stt_no:         string;          // "99LP1778214534665"
  sender_name:    string;
  recipient_name: string;
  origin:         string;          // "KEBON JERUK, JAKARTA BARAT"
  destination:    string;          // "TEBET, JAKARTA SELATAN"
  current_status: string;          // "BKD", "DLV", dll
  status_code:    string;
  product_type:   string;          // "REGPACK", "JAGOPACK", dll
  gross_weight:   number;
  history:        LionParcelHistoryItem[];  // sudah sorted terbaru di atas oleh backend
}

const OrdersService = {
  // ─── FIX: return type pakai OrdersAdminResponse agar meta.lastPage tersedia ──
  async getOrders(params: OrderQueryParams): Promise<OrdersAdminResponse> {
    const { data } = await api.get<OrdersAdminResponse>('/orders/admin', { params });
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
   * Export orders ke CSV dan trigger download otomatis di browser.
   * Filter: status, search, dateFrom, dateTo.
   */
  async exportOrders(params: ExportOrdersParams = {}): Promise<void> {
    const response = await api.get('/orders/admin/export', {
      params,
      responseType: 'blob', // wajib: terima sebagai binary agar BOM & encoding terjaga
    });

    // Ambil nama file dari header Content-Disposition, fallback ke nama generik
    const disposition: string = response.headers['content-disposition'] ?? '';
    const filenameMatch = disposition.match(/filename="?([^";\n]+)"?/);
    const today    = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = filenameMatch?.[1] ?? `orders-export-${today}.csv`;

    const url  = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href     = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Lacak resi Lion Parcel via endpoint /logistics/track-lion/:stt
   */
  async trackLionParcel(stt: string): Promise<LionParcelTrackingResult> {
    const { data } = await api.get<LionParcelTrackingResult>(`/logistics/track-lion/${stt}`);
    return data;
  },

  /**
   * Lacak resi Komerce (kurir instant/same day) via RajaOngkir
   * @param awb     Nomor resi
   * @param courier Kode kurir lowercase (gosend, grabexpress, dll)
   */
  async trackKomerce(awb: string, courier: string): Promise<TrackingResult> {
    const params: Record<string, string> = { courier };
    const { data } = await api.get<TrackingResult>(`/logistics/track/${awb}`, { params });
    return data;
  },

  /**
   * Lacak resi secara otomatis berdasarkan shippingProvider order.
   * - LION_PARCEL  → trackLionParcel (gunakan lionParcelSttId / awb)
   * - KOMERCE / null → trackKomerce (gunakan awb + courierCode)
   */
  async trackAny(params: {
    awb: string;
    courier: string;
    shippingProvider?: 'LION_PARCEL' | 'KOMERCE' | null;
  }): Promise<LionParcelTrackingResult | TrackingResult> {
    const { awb, courier, shippingProvider } = params;
    if (shippingProvider === 'LION_PARCEL') {
      return this.trackLionParcel(awb);
    }
    return this.trackKomerce(awb, courier);
  },
};

export default OrdersService;