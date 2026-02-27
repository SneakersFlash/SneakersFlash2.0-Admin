// ─── Enums ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentMethod = 'bank_transfer' | 'gopay' | 'qris' | 'credit_card' | 'cod';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'refunded';

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
  name: string;       // e.g. "JNE"
  service: string;    // e.g. "REG"
  trackingNumber?: string;
  estimatedDays?: number;
  cost: number;
}

export interface OrderItem {
  id: string;
  productName: string;
  variantSku: string;
  size: string;
  color?: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

// ─── Main Order entity ────────────────────────────────────────────────────────

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  snapToken?: string;

  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  total: number;

  voucherCode?: string;
  notes?: string;

  user: OrderUser;
  address: OrderAddress;
  courier: CourierInfo;
  items: OrderItem[];

  createdAt: string;
  updatedAt: string;
  paidAt?: string;
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
  status?: OrderStatus | '';
  paymentMethod?: PaymentMethod | '';
  startDate?: string;
  endDate?: string;
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
