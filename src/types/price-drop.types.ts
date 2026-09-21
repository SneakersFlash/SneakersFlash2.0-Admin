export type PriceDropStatus = 'active' | 'scheduled' | 'ended' | 'all';

export interface PriceDrop {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  skuParent: string | null;
  basePrice: number;
  dropPrice: number;
  startAt: string;
  endAt: string;
  isActive: boolean;
  // Sedang benar-benar tayang (aktif DAN di dalam jendela waktunya).
  isRunning: boolean;
  note: string | null;
  createdAt: string;
}

export interface CreatePriceDropsPayload {
  items: Array<{ productId: string; dropPrice: number }>;
  startAt?: string;
  endAt: string;
  note?: string;
}

export interface CreatePriceDropsResult {
  totalBerhasil: number;
  totalGagal: number;
  berhasil: Array<{
    id: string;
    productId: string;
    productName: string;
    hargaSebelum: number;
    dropPrice: number;
    startAt: string;
    endAt: string;
  }>;
  gagal: Array<{ productId: string; alasan: string }>;
}
