// Prisma Decimal fields arrive as a Decimal.js internal object when not post-processed
export type PrismaDecimal = number | { s: number; e: number; d: number[] };

export interface User {
  id: string | number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  customerTier: string;
  pointsBalance: PrismaDecimal;
  totalSpent: PrismaDecimal;
  totalOrder: number | null;
  isActive: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
}

export interface UserAddress {
  id: string | number;
  userId: string | number;
  recipientName: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  notes?: string | null;
  isDefault: boolean;
  createdAt: string;
}

export interface UserDetail extends User {
  tierPeriodeStart: string | null;
  tierPeriodeEnd: string | null;
  addresses: UserAddress[];
  _count: {
    orders: number;
    reviews: number;
    wishlists: number;
  };
}

export interface UserQueryParams {
  search?: string;
  role?: string;
  tier?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface UserListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserListResponse {
  data: User[];
  meta: UserListMeta;
}

export interface AdminUpdateUserPayload {
  name?: string;
  phone?: string;
  role?: string;
  customerTier?: string;
  isActive?: boolean;
  pointsBalance?: number;
}
