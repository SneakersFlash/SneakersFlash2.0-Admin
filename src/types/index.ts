// ─── Voucher ──────────────────────────────────────────────────────────────────

export type VoucherType = 'FIXED' | 'PERCENT';
export type VoucherStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'EXHAUSTED';

export interface Voucher {
  id: string;
  code: string;
  type: VoucherType;
  value: number;        // amount (IDR) if FIXED, percentage if PERCENT
  minOrderAmount: number;
  maxDiscount?: number; // cap for PERCENT type
  quota: number;        // total allowed usage
  usedCount: number;
  maxPerUser: number;
  startDate: string;
  endDate: string;
  status: VoucherStatus;
  isPublic: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVoucherDto {
  code: string;
  type: VoucherType;
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  quota: number;
  maxPerUser?: number;
  startDate: string;
  endDate: string;
  isPublic?: boolean;
  description?: string;
}

export interface BulkCreateVoucherDto {
  prefix: string;
  count: number;
  type: VoucherType;
  value: number;
  minOrderAmount?: number;
  quota: number;
  startDate: string;
  endDate: string;
}

// ─── Campaign ─────────────────────────────────────────────────────────────────

export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'ENDED';
export type CampaignType = 'BANNER' | 'FLASH_SALE' | 'NEW_ARRIVAL' | 'PROMO';

export interface CampaignProduct {
  id: string;
  campaignId: string;
  productId: string;
  product: {
    id: string;
    name: string;
    images: string[];
    basePrice: number;
  };
  displayOrder: number;
}

export interface Campaign {
  id: string;
  name: string;
  slug: string;
  type: CampaignType;
  status: CampaignStatus;
  bannerImage?: string;
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  ctaUrl?: string;
  startDate: string;
  endDate: string;
  voucherId?: string;
  voucher?: {
    id: string;
    code: string;
    value: number;
    type: VoucherType;
  };
  products: CampaignProduct[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignDto {
  name: string;
  type: CampaignType;
  status?: CampaignStatus;
  bannerImage?: string;
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  ctaUrl?: string;
  startDate: string;
  endDate: string;
  voucherId?: string;
  productIds?: string[];
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export interface InventoryItem {
  variantId: string;
  productId: string;
  productName: string;
  productImage: string;
  sku?: string;
  size: string;
  color?: string;
  currentStock: number;
  reservedStock: number;  // items in pending orders
  availableStock: number;
  lastUpdated: string;
}

export interface StockAdjustmentDto {
  variantId: string;
  adjustment: number;  // positive = add, negative = subtract
  reason: string;
  notes?: string;
}

export type StockAdjustmentReason =
  | 'RESTOCK'
  | 'RETURN'
  | 'DAMAGED'
  | 'CORRECTION'
  | 'INITIAL';

export interface StockHistory {
  id: string;
  variantId: string;
  type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  reason: StockAdjustmentReason;
  notes?: string;
  balanceBefore: number;
  balanceAfter: number;
  createdBy: string;
  createdAt: string;
}

// ─── Logistics ────────────────────────────────────────────────────────────────

export interface ShippingRate {
  courier: string;
  service: string;
  description: string;
  cost: number;
  etd: string;  // estimated delivery
}

export interface CheckShippingRateDto {
  originCityId: string;
  destinationCityId: string;
  weight: number;  // in grams
}

export interface PickupRequest {
  id: string;
  orderId: string;
  orderNumber: string;
  status: 'PENDING' | 'CONFIRMED' | 'PICKED_UP' | 'FAILED';
  courierPickupCode?: string;
  awbNumber?: string;
  scheduledAt?: string;
  pickedUpAt?: string;
  createdAt: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export type NotificationChannel = 'EMAIL' | 'WHATSAPP';
export type NotificationTemplate =
  | 'ORDER_CONFIRMATION'
  | 'PAYMENT_SUCCESS'
  | 'SHIPPING_UPDATE'
  | 'ORDER_DELIVERED'
  | 'PROMO'
  | 'CUSTOM';

export interface SendNotificationDto {
  channel: NotificationChannel;
  template: NotificationTemplate;
  targetType: 'ALL' | 'SPECIFIC';
  userIds?: string[];
  customMessage?: string;
  subject?: string;
  data?: Record<string, unknown>;
}

export interface NotificationLog {
  id: string;
  channel: NotificationChannel;
  template: NotificationTemplate;
  recipient: string;
  subject?: string;
  status: 'SENT' | 'FAILED' | 'PENDING';
  error?: string;
  sentAt: string;
  createdAt: string;
}
