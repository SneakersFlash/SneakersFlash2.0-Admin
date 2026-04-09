// ─── Enums ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'waiting_payment'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'returned';

export type PaymentMethod = 'bank_transfer' | 'gopay' | 'qris' | 'credit_card' | 'cod';

export type PaymentStatus = 
  | 'pending'
  | 'success'
  | 'failed'
  | 'expired'
  | 'refunded';
// ─── Sub-entities ─────────────────────────────────────────────────────────────

export interface OrderAddress {
  recipientName: string;
  phone: string;
  street: string;
  subdistrict: string;
  city: string;
  province: string;
  postalCode: string;
  notes?: string;
}

export interface CourierInfo {
  name: string;
  service: string;
  cost: number;
  trackingNumber?: string;
}

export interface OrderItem {
  id: string;
  productName: string;
  variantSku: string;
  size: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  imageUrl?: string | string[] | null; // Backend mengirim array atau null
}

export interface OrderUser {
  name: string;
  email: string;
  phone?: string;
  // id tidak di-return oleh backend
}

// ─── Main Order entity ────────────────────────────────────────────────────────

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  voucherCode?: string | null;

  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  total: number;

  user: OrderUser | null; // Bisa null jika checkout sebagai guest
  address: OrderAddress;
  courier: CourierInfo;
  items: OrderItem[];

  createdAt: string;
  paidAt?: string | null;
}

// ─── API Payloads ─────────────────────────────────────────────────────────────

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
  trackingNumber?: string;
  notes?: string;
}

// ─── Query Params ─────────────────────────────────────────────────────────────

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus | 'ALL' | '';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

export interface OrderMeta {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}