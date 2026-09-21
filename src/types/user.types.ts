// Prisma Decimal fields arrive as a Decimal.js internal object when not post-processed
// Endpoint admin menyerialkan Decimal Prisma jadi string (lihat konvensi di
// users.service.ts), sementara endpoint lain bisa mengirim angka atau objek
// Decimal mentah. `toNum()` menangani ketiganya.
export type PrismaDecimal =
  | number
  | string
  | { s: number; e: number; d: number[] };

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

// ── FlashPoint manual (admin) ────────────────────────────────────────────────

export interface GrantPointsPayload {
  amount: number;
  note: string;
}

export interface GrantPointsResult {
  id: string;
  name: string | null;
  email: string | null;
  amount: number;
  balanceBefore: string;
  balanceAfter: string;
}

export interface GrantPointsBulkPayload {
  identifiers: string[];
  amount: number;
  note: string;
}

export interface GrantPointsBulkResult {
  batchRef: string;
  amount: number;
  totalBerhasil: number;
  totalGagal: number;
  berhasil: Array<{
    identifier: string;
    userId: string;
    name: string | null;
    email: string | null;
    balanceAfter: string;
  }>;
  gagal: Array<{ identifier: string; alasan: string }>;
}
