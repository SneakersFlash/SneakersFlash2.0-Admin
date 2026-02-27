export type DiscountType = 'percentage' | 'fixed_amount' | 'free_shipping';

export interface Voucher {
  id: string | number;
  campaignId: string | number;
  userId?: string | number | null;
  code: string;
  name: string;
  description?: string | null;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minPurchaseAmount: number;
  usageLimitTotal?: number | null;
  usageLimitPerUser: number;
  startAt: string;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateVoucherPayload {
  campaignId: number;
  code: string;
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  minPurchaseAmount: number;
  usageLimitTotal?: number;
  usageLimitPerUser: number;
  startAt: string;
  expiresAt: string;
  isActive?: boolean;
}