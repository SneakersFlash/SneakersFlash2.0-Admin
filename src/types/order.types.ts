// ─── Order Status Lifecycle ───────────────────────────────────────────────────

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'PACKED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentStatus =
  | 'PENDING'
  | 'SETTLEMENT'
  | 'EXPIRE'
  | 'CANCEL'
  | 'DENY'
  | 'REFUND';

export type PaymentMethod =
  | 'BANK_TRANSFER'
  | 'CREDIT_CARD'
  | 'GOPAY'
  | 'SHOPEEPAY'
  | 'QRIS'
  | 'INDOMARET'
  | 'ALFAMART';

// ─── Order Item (snapshot at time of order) ──────────────────────────────────

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId: string;
  productName: string;   // snapshot
  productImage: string;  // snapshot
  size: string;          // snapshot
  color?: string;        // snapshot
  sku?: string;          // snapshot
  quantity: number;
  unitPrice: number;     // price at time of order
  subtotal: number;
}

// ─── Shipping Address (snapshot) ─────────────────────────────────────────────

export interface ShippingAddress {
  recipientName: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  notes?: string;
}

// ─── Order ────────────────────────────────────────────────────────────────────

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  shippingCost: number;
  shippingCourier: string;
  shippingService: string;
  awbNumber?: string;
  subtotal: number;
  discountAmount: number;
  voucherCode?: string;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  midtransOrderId?: string;
  midtransTransactionId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderFilters {
  search?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  startDate?: string;
  endDate?: string;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
  notes?: string;
  awbNumber?: string;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
  totalRevenue: number;
  revenueToday: number;
  revenueGrowth: number; // percentage vs last period
  totalOrders: number;
  ordersToday: number;
  ordersGrowth: number;
  totalUsers: number;
  newUsersToday: number;
  lowStockCount: number;
  pendingOrdersCount: number;
}

export interface RevenueChartData {
  date: string;
  revenue: number;
  orders: number;
}

export interface OrderStatusDistribution {
  status: OrderStatus;
  count: number;
  percentage: number;
}
