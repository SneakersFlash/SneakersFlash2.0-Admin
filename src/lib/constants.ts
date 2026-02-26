import type { OrderStatus, PaymentStatus } from '@/types/order.types';
import type { ProductStatus } from '@/types/product.types';
import type { VoucherStatus, CampaignStatus } from '@/types/index';

// ─── Order Status Config ──────────────────────────────────────────────────────

export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  PENDING_PAYMENT: {
    label: 'Menunggu Pembayaran',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: 'clock',
  },
  PAID: {
    label: 'Sudah Dibayar',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: 'check-circle',
  },
  PROCESSING: {
    label: 'Diproses',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
    icon: 'loader',
  },
  PACKED: {
    label: 'Dikemas',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    icon: 'package',
  },
  SHIPPED: {
    label: 'Dikirim',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    icon: 'truck',
  },
  DELIVERED: {
    label: 'Terkirim',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: 'check-circle-2',
  },
  CANCELLED: {
    label: 'Dibatalkan',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: 'x-circle',
  },
  REFUNDED: {
    label: 'Dikembalikan',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: 'rotate-ccw',
  },
};

// ─── Payment Status Config ────────────────────────────────────────────────────

export const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; color: string; bgColor: string }
> = {
  PENDING:    { label: 'Pending',     color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  SETTLEMENT: { label: 'Lunas',       color: 'text-green-700',  bgColor: 'bg-green-100'  },
  EXPIRE:     { label: 'Kadaluarsa',  color: 'text-gray-700',   bgColor: 'bg-gray-100'   },
  CANCEL:     { label: 'Dibatalkan',  color: 'text-red-700',    bgColor: 'bg-red-100'    },
  DENY:       { label: 'Ditolak',     color: 'text-red-700',    bgColor: 'bg-red-100'    },
  REFUND:     { label: 'Refund',      color: 'text-purple-700', bgColor: 'bg-purple-100' },
};

// ─── Product Status Config ────────────────────────────────────────────────────

export const PRODUCT_STATUS_CONFIG: Record<
  ProductStatus,
  { label: string; color: string; bgColor: string }
> = {
  ACTIVE:   { label: 'Aktif',      color: 'text-green-700', bgColor: 'bg-green-100' },
  DRAFT:    { label: 'Draft',      color: 'text-gray-700',  bgColor: 'bg-gray-100'  },
  ARCHIVED: { label: 'Diarsipkan', color: 'text-red-700',   bgColor: 'bg-red-100'   },
};

// ─── Voucher Status Config ────────────────────────────────────────────────────

export const VOUCHER_STATUS_CONFIG: Record<
  VoucherStatus,
  { label: string; color: string; bgColor: string }
> = {
  ACTIVE:    { label: 'Aktif',      color: 'text-green-700',  bgColor: 'bg-green-100'  },
  INACTIVE:  { label: 'Nonaktif',   color: 'text-gray-700',   bgColor: 'bg-gray-100'   },
  EXPIRED:   { label: 'Kadaluarsa', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  EXHAUSTED: { label: 'Habis',      color: 'text-red-700',    bgColor: 'bg-red-100'    },
};

// ─── Campaign Status Config ───────────────────────────────────────────────────

export const CAMPAIGN_STATUS_CONFIG: Record<
  CampaignStatus,
  { label: string; color: string; bgColor: string }
> = {
  DRAFT:     { label: 'Draft',     color: 'text-gray-700',  bgColor: 'bg-gray-100'  },
  SCHEDULED: { label: 'Terjadwal', color: 'text-blue-700',  bgColor: 'bg-blue-100'  },
  ACTIVE:    { label: 'Aktif',     color: 'text-green-700', bgColor: 'bg-green-100' },
  ENDED:     { label: 'Berakhir',  color: 'text-gray-700',  bgColor: 'bg-gray-100'  },
};

// ─── Nav Items ────────────────────────────────────────────────────────────────

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  badge?: 'pendingOrders';
}

export const NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard',   href: '/dashboard',              icon: 'layout-dashboard' },
  { title: 'Produk',      href: '/dashboard/products',     icon: 'package'          },
  { title: 'Kategori',    href: '/dashboard/categories',   icon: 'tag'              },
  { title: 'Pesanan',     href: '/dashboard/orders',       icon: 'shopping-cart', badge: 'pendingOrders' },
  { title: 'Pembayaran',  href: '/dashboard/payments',     icon: 'credit-card'      },
  { title: 'Logistik',    href: '/dashboard/logistics',    icon: 'truck'            },
  { title: 'Voucher',     href: '/dashboard/vouchers',     icon: 'ticket'           },
  { title: 'Inventori',   href: '/dashboard/inventory',    icon: 'warehouse'        },
  { title: 'Kampanye',    href: '/dashboard/campaigns',    icon: 'megaphone'        },
  { title: 'Notifikasi',  href: '/dashboard/notifications',icon: 'bell'             },
  { title: 'Pengguna',    href: '/dashboard/users',        icon: 'users'            },
];

// ─── Thresholds & Defaults ───────────────────────────────────────────────────

export const LOW_STOCK_THRESHOLD = 5;
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
