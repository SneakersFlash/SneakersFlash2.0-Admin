'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Plus, Search, MoreHorizontal, Pencil, Trash2,
  ArrowUpDown, ChevronLeft, ChevronRight, RefreshCw,
  FileSpreadsheet, CloudUpload, CloudDownload, Zap, Link2, Warehouse, PackageSearch
} from 'lucide-react';

// Ginee warehouse IDs — extracted from Ginee dashboard one-time.
// Update jika ada warehouse baru / dihapus di Ginee.
const GINEE_WAREHOUSE_IDS = [
  'WW614C57B6E21B840001B4A467', // KCG01 — KCG ALL
  'WW69A102944CEDFD0001C67A65', // BG02 — BG EXHIBITION
  'WW69954C23CFF47E0001C8B127', // SF02 — SF EXHIBITION
  'WW69A11C3846E0FB0001B52A07', // FD02 — FOLDE EXHIBITION
  'WW69EB1A058701D40001AABB36', // PM01 — PUMA SF
  'WW69EB18A5C9E77C00019158F6', // DIA01 — DIADORA SF
  'WW69EB17F24CEDFD000101F734', // CON01 — CONVERSE SF
  'WW69EB16B68701D40001AABA74', // HK01 — HOKA SF
  'WW69E981F05255EE0001DF5ABB', // NR01 — NOT READY SF
  'WW69E981D54CEDFD0001FF18F1', // SBK01 — SBK ALL
  'WW69E981C4BC818C0001ABE413', // SDL01 — SDL ALL
  'WW69E98195230F3A0001250B60', // VAN01 — VANS SF
  'WW69E98168C9E77C0001907A49', // SKE01 — SKECHERS SF
  'WW69E98134BC818C0001ABE3CD', // REE01 — REEBOK SF
  'WW69E89A7B8701D40001A8F9A4', // NB01 — NEW BALANCE SF
  'WW69E97FDCC9E77C0001907953', // AD01 — ADIDAS SF
  'WW69E980215255EE0001DF59F1', // ASC01 — ASICS SF
  'WW69E9803A230F3A0001250AC6', // NIK01 — NIKE SF
  'WW693A7865CFF47E00015F7B5B', // FD01 — FOLDE
  'WW693792AD744C1500017CD7B6', // BG01 — BETTER GOODS
];
import { toast } from 'sonner';
import api from '@/lib/api'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import PlatformBadge from '@/components/shared/PlatformBadge';
import { platformStore } from '@/lib/api';

interface ProductVariant {
  id: string;
  sku: string;
  price: number;
  stock: number;
  imageUrl: string[] | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  isActive: boolean;
  platform?: 'SF' | 'TS' | 'BOTH' | null;
  gineeProductId?: string | null;
  gineeSyncStatus?: 'synced' | 'pending' | 'failed' | null;
  brand?: { name: string };
  category?: { name: string };
  variants: ProductVariant[];
  availableSizes: string[];
  totalStock: number;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function ProductsPage() {
  const [products, setProducts]   = useState<Product[]>([]);
  const [meta, setMeta]           = useState<Meta | null>(null);
  const [loading, setLoading]     = useState(true);
  const [syncing, setSyncing]     = useState<'SF' | 'TS' | false>(false);
  // Dialog nama sheet sebelum sync — kosong berarti pakai sheet default dari env backend.
  const [sheetPromptPlatform, setSheetPromptPlatform] = useState<'SF' | 'TS' | null>(null);
  const [sheetNameInput, setSheetNameInput] = useState('');

  // ── Pull Stock dari Ginee state ──────────────────────────────────────────────
  const [pullStockOpen, setPullStockOpen]   = useState(false);
  const [pullStockDryRun, setPullStockDryRun] = useState(true);
  const [pullingStock, setPullingStock]     = useState(false);
  // Bentuk ini HARUS sama dengan return pullStockOnlyByInventory() di backend.
  // Sebelumnya dipakai nama karangan (variantsUpdated/eventVariantsUpdated/
  // variantsNotFound) yang tidak pernah ada di response, jadi ringkasannya
  // selalu nol walau job-nya sukses.
  const [pullStockResult, setPullStockResult] = useState<{
    warehousesScanned: number;
    pagesFetched: number;
    inventoryRowsScanned: number;
    targetSkuCount: number;
    matchedSkus: number;
    updatedVariants: number;
    dryRun: boolean;
  } | null>(null);
  const [pullStockScope, setPullStockScope] = useState<{
    warehousesCount: number;
    targetSkuCount: number;
  } | null>(null);

  // ── Ginee Sync All state ─────────────────────────────────────────────────────
  const [syncAllOpen, setSyncAllOpen]   = useState(false);
  const [dryRun, setDryRun]             = useState(true);
  const [syncingAll, setSyncingAll]     = useState(false);

  // ── Ginee Map by SKU state ───────────────────────────────────────────────────
  const [mapBySkuOpen, setMapBySkuOpen]         = useState(false);
  const [mapDryRun, setMapDryRun]               = useState(true);
  const [mapCaseInsensitive, setMapCaseInsensitive] = useState(false);
  const [mappingBySku, setMappingBySku]         = useState(false);
  const [mapResult, setMapResult]               = useState<{
    pagesFetched: number;
    totalPagesReported: number;
    gineeVariantsScanned: number;
    matched: number;
    alreadyMapped: number;
    unmatched: number;
    productsUpdated: number;
    rateLimitSkips: number;
    sampleUnmatchedSkus: string[];
  } | null>(null);

  // ── Ginee Map Warehouse state ────────────────────────────────────────────────
  const [mapWhOpen, setMapWhOpen]               = useState(false);
  const [mapWhDryRun, setMapWhDryRun]           = useState(true);
  const [mappingWh, setMappingWh]               = useState(false);
  const [mapWhResult, setMapWhResult]           = useState<{
    warehousesScanned: number;
    pagesFetched: number;
    inventoryRowsScanned: number;
    matchedVariants: number;
    updatedVariants: number;
    multiWarehouseVariants: number;
    sampleUnmappedWarehouseIds: string[];
  } | null>(null);

  // ── Ginee per-product sync state ─────────────────────────────────────────────
  // Tracks which productId is currently being synced (push or pull)
  const [syncingProductId, setSyncingProductId] = useState<string | null>(null);

  // ── Query params ─────────────────────────────────────────────────────────────
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [limit, setLimit]         = useState(10);
  const [sortBy, setSortBy]       = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [platformFilter, setPlatformFilter] = useState<'ALL' | 'SF' | 'TS'>(() => platformStore.get());
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // ── Fetch products ────────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/products', {
        params: { page, limit, search: debouncedSearch, sortBy, sortOrder, platform: platformFilter },
      });
      const responseData = response.data;
      if (responseData.data && Array.isArray(responseData.data)) {
        setProducts(responseData.data);
        setMeta(responseData.meta);
      } else {
        setProducts([]);
      }
    } catch (error: any) {
      if (error.response?.status !== 401) toast.error('Gagal memuat data produk.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, sortBy, sortOrder, platformFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Hapus produk "${name}"?`)) return;
    const toastId = toast.loading('Menghapus produk...');
    try {
      await api.delete(`/products/${id}`);
      toast.success('Produk berhasil dihapus', { id: toastId });
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menghapus produk', { id: toastId });
    }
  };

  // ── Google Sheet sync ─────────────────────────────────────────────────────────
  // Sync Google Sheet — endpoint sekarang enqueue ke Bull queue (background),
  // admin polling status setiap 3 detik sampai selesai.
  const handleSyncGoogleSheet = async (platform: 'SF' | 'TS', sheetName?: string) => {
    setSyncing(platform);
    const toastId = toast.loading(`Queuing job sync Google Sheet [${platform}]...`);

    try {
      // sheetName sengaja tidak dikirim kalau kosong → backend pakai sheet default.
      const trimmed = sheetName?.trim();
      const url = `/products/sync/google-sheet?platform=${platform}`
        + (trimmed ? `&sheetName=${encodeURIComponent(trimmed)}` : '');
      const enqueueResp = await api.post(url);

      if (!enqueueResp.data.queued) {
        toast.warning(enqueueResp.data.message ?? 'Job tidak bisa di-queue', { id: toastId });
        setSyncing(false);
        return;
      }

      toast.loading('Sync berjalan di background. Polling status…', { id: toastId });

      // Poll status — timeout 10 menit (sync 2000+ produk biasanya butuh beberapa menit)
      const startedAt = Date.now();
      const TIMEOUT_MS = 10 * 60 * 1000;
      const POLL_INTERVAL_MS = 3000;

      while (true) {
        if (Date.now() - startedAt > TIMEOUT_MS) {
          toast.error('Timeout 10 menit — cek log server.', { id: toastId });
          break;
        }

        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

        const statusResp = await api.get('/products/sync/google-sheet/status');
        const { state, lastResult, lastError } = statusResp.data;

        if (state === 'running' || state === 'waiting') {
          toast.loading(`Status: ${state}…`, { id: toastId });
          continue;
        }

        if (state === 'completed' && lastResult) {
          toast.success(lastResult.message ?? 'Sinkronisasi Berhasil!', {
            id: toastId,
            duration: 8000,
          });
          fetchProducts();
          break;
        }

        if (state === 'failed') {
          toast.error(`Sync gagal: ${lastError ?? 'unknown error'}`, {
            id: toastId,
            duration: 10000,
          });
          break;
        }

        toast.warning('Status idle — job mungkin sudah selesai sebelumnya.', { id: toastId });
        break;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal queue sync', { id: toastId });
    } finally {
      setSyncing(false);
    }
  };

  // ── Ginee: Sync All ───────────────────────────────────────────────────────────
  const handleSyncAllGinee = async () => {
    setSyncingAll(true);
    const toastId = toast.loading(
      dryRun ? 'Menjalankan dry run Ginee...' : 'Sync semua produk ke Ginee...',
    );
    try {
      const response = await api.post('/ginee/sync/all', { dryRun });

      if (response.data.success) {
        toast.success(
          dryRun
            ? '✅ Dry run selesai — tidak ada data yang diubah. Cek log untuk detail.'
            : '🚀 Sync All berjalan di background. Proses mungkin butuh beberapa menit.',
          { id: toastId, duration: 5000 },
        );
      } else {
        // e.g. already running
        toast.warning(response.data.message, { id: toastId });
      }

      setSyncAllOpen(false);
      if (!dryRun) fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Sync All gagal', { id: toastId });
    } finally {
      setSyncingAll(false);
    }
  };

  // ── Ginee: Pull Stock (Ginee warehouse inventory → local DB) ─────────────────
  const handlePullStock = async () => {
    setPullingStock(true);
    setPullStockResult(null);
    setPullStockScope(null);
    const toastId = toast.loading('Queuing pull-stock job...');

    try {
      // Target (gudang + daftar gineeSkuId) ditentukan backend dari DB.
      // Jangan kirim GINEE_WAREHOUSE_IDS: daftar itu memuat gudang bisnis lain
      // di akun Ginee yang sama (KCG ALL, BETTER GOODS, FOLDE, BG/FD
      // EXHIBITION), sedangkan job MENJUMLAH stok lintas gudang — ikut
      // menyertakannya bikin stok lokal menggelembung.
      const enqueueResp = await api.post('/ginee/sync/pull-stock', {
        dryRun: pullStockDryRun,
      });

      setPullStockScope({
        warehousesCount: enqueueResp.data.warehousesCount ?? 0,
        targetSkuCount: enqueueResp.data.targetSkuCount ?? 0,
      });

      if (!enqueueResp.data.queued) {
        toast.warning(enqueueResp.data.message ?? 'Job tidak bisa di-queue', { id: toastId });
        setPullingStock(false);
        return;
      }

      toast.loading(
        pullStockDryRun
          ? 'Dry-run pull-stock berjalan di background. Polling status…'
          : 'Pull stock berjalan di background (~15-30 menit). Polling status…',
        { id: toastId },
      );

      const startedAt = Date.now();
      const TIMEOUT_MS = 90 * 60 * 1000;
      const POLL_INTERVAL_MS = 5000;

      while (true) {
        if (Date.now() - startedAt > TIMEOUT_MS) {
          toast.error('Timeout 90 menit — cek log server.', { id: toastId });
          break;
        }

        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

        const statusResp = await api.get('/ginee/sync/pull-stock/status');
        const { state, lastResult, lastError } = statusResp.data;

        if (state === 'running' || state === 'waiting') {
          toast.loading(`Status: ${state}…`, { id: toastId });
          continue;
        }

        if (state === 'completed' && lastResult) {
          setPullStockResult({
            warehousesScanned: lastResult.warehousesScanned ?? 0,
            pagesFetched: lastResult.pagesFetched ?? 0,
            inventoryRowsScanned: lastResult.inventoryRowsScanned ?? 0,
            targetSkuCount: lastResult.targetSkuCount ?? 0,
            matchedSkus: lastResult.matchedSkus ?? 0,
            updatedVariants: lastResult.updatedVariants ?? 0,
            dryRun: pullStockDryRun,
          });

          toast.success(
            pullStockDryRun
              ? `Dry run selesai: ${lastResult.matchedSkus ?? 0} SKU ketemu di Ginee`
              : `Selesai: ${lastResult.updatedVariants ?? 0} variant stok diupdate dari Ginee`,
            { id: toastId, duration: 8000 },
          );

          if (!pullStockDryRun) fetchProducts();
          break;
        }

        if (state === 'failed') {
          toast.error(`Job gagal: ${lastError ?? 'unknown error'}`, { id: toastId, duration: 10000 });
          break;
        }

        toast.warning('Status idle — job mungkin sudah selesai sebelumnya. Klik ulang kalau perlu.', { id: toastId });
        break;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal queue pull-stock', { id: toastId });
    } finally {
      setPullingStock(false);
    }
  };

  // ── Ginee: Map by SKU (backfill mapping local ↔ Ginee) ───────────────────────
  // Endpoint sekarang ENQUEUE ke Bull queue, lalu admin poll status setiap 3 detik.
  const handleMapBySku = async () => {
    setMappingBySku(true);
    setMapResult(null);
    const toastId = toast.loading('Queuing job...');

    try {
      const enqueueResp = await api.post('/ginee/sync/map-by-sku', {
        dryRun: mapDryRun,
        caseInsensitive: mapCaseInsensitive,
      });

      if (!enqueueResp.data.queued) {
        toast.warning(enqueueResp.data.message ?? 'Job tidak bisa di-queue', { id: toastId });
        setMappingBySku(false);
        return;
      }

      toast.loading(
        mapDryRun
          ? 'Dry-run berjalan di background. Polling status…'
          : 'Mapping berjalan di background. Polling status…',
        { id: toastId },
      );

      // Poll status setiap 3 detik sampai selesai (atau timeout 15 menit)
      const startedAt = Date.now();
      const TIMEOUT_MS = 15 * 60 * 1000;
      const POLL_INTERVAL_MS = 3000;

      while (true) {
        if (Date.now() - startedAt > TIMEOUT_MS) {
          toast.error('Timeout 15 menit — cek log server / queue dashboard.', { id: toastId });
          break;
        }

        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

        const statusResp = await api.get('/ginee/sync/map-by-sku/status');
        const { state, lastResult, lastError } = statusResp.data;

        if (state === 'running' || state === 'waiting') {
          toast.loading(`Status: ${state}…`, { id: toastId });
          continue;
        }

        if (state === 'completed' && lastResult) {
          setMapResult({
            pagesFetched: lastResult.pagesFetched ?? 0,
            totalPagesReported: lastResult.totalPagesReported ?? 0,
            gineeVariantsScanned: lastResult.gineeVariantsScanned ?? 0,
            matched: lastResult.matched ?? 0,
            alreadyMapped: lastResult.alreadyMapped ?? 0,
            unmatched: lastResult.unmatched ?? 0,
            productsUpdated: lastResult.productsUpdated ?? 0,
            rateLimitSkips: lastResult.rateLimitSkips ?? 0,
            sampleUnmatchedSkus: lastResult.sampleUnmatchedSkus ?? [],
          });

          toast.success(
            mapDryRun
              ? `Dry run selesai: ${lastResult.matched ?? 0} match akan di-update`
              : `Selesai: ${lastResult.matched ?? 0} variant ter-mapping, ${lastResult.productsUpdated ?? 0} produk diupdate`,
            { id: toastId, duration: 8000 },
          );

          if (!mapDryRun) fetchProducts();
          break;
        }

        if (state === 'failed') {
          toast.error(`Job gagal: ${lastError ?? 'unknown error'}`, { id: toastId, duration: 10000 });
          break;
        }

        // state === 'idle' — job belum terlihat di queue (mungkin sudah di-clean), berhenti
        toast.warning('Status idle — job mungkin sudah selesai sebelumnya. Klik ulang kalau perlu.', {
          id: toastId,
        });
        break;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal queue map-by-sku', { id: toastId });
    } finally {
      setMappingBySku(false);
    }
  };

  // ── Ginee: Map Warehouse IDs per variant (one-shot, ~30-60 min) ──────────────
  const handleMapWarehouses = async () => {
    setMappingWh(true);
    setMapWhResult(null);
    const toastId = toast.loading('Queuing map-warehouses job...');

    try {
      const enqueueResp = await api.post('/ginee/sync/map-warehouses', {
        warehouseIds: GINEE_WAREHOUSE_IDS,
        dryRun: mapWhDryRun,
      });

      if (!enqueueResp.data.queued) {
        toast.warning(enqueueResp.data.message ?? 'Job tidak bisa di-queue', { id: toastId });
        setMappingWh(false);
        return;
      }

      toast.loading(
        mapWhDryRun
          ? 'Dry-run map-warehouses berjalan di background. Polling status…'
          : 'Map-warehouses berjalan di background (~30-60 menit). Polling status…',
        { id: toastId },
      );

      // Poll status — timeout 90 menit (cukup untuk 20 warehouse × N page)
      const startedAt = Date.now();
      const TIMEOUT_MS = 90 * 60 * 1000;
      const POLL_INTERVAL_MS = 5000;

      while (true) {
        if (Date.now() - startedAt > TIMEOUT_MS) {
          toast.error('Timeout 90 menit — cek log server / queue dashboard.', { id: toastId });
          break;
        }

        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

        const statusResp = await api.get('/ginee/sync/map-warehouses/status');
        const { state, lastResult, lastError } = statusResp.data;

        if (state === 'running' || state === 'waiting') {
          toast.loading(`Status: ${state}…`, { id: toastId });
          continue;
        }

        if (state === 'completed' && lastResult) {
          setMapWhResult({
            warehousesScanned: lastResult.warehousesScanned ?? 0,
            pagesFetched: lastResult.pagesFetched ?? 0,
            inventoryRowsScanned: lastResult.inventoryRowsScanned ?? 0,
            matchedVariants: lastResult.matchedVariants ?? 0,
            updatedVariants: lastResult.updatedVariants ?? 0,
            multiWarehouseVariants: lastResult.multiWarehouseVariants ?? 0,
            sampleUnmappedWarehouseIds: lastResult.sampleUnmappedWarehouseIds ?? [],
          });

          toast.success(
            mapWhDryRun
              ? `Dry run selesai: ${lastResult.matchedVariants ?? 0} variants akan di-update`
              : `Selesai: ${lastResult.updatedVariants ?? 0} variants dapat warehouseId, ${lastResult.multiWarehouseVariants ?? 0} di multi-warehouse`,
            { id: toastId, duration: 8000 },
          );

          if (!mapWhDryRun) fetchProducts();
          break;
        }

        if (state === 'failed') {
          toast.error(`Job gagal: ${lastError ?? 'unknown error'}`, { id: toastId, duration: 10000 });
          break;
        }

        toast.warning('Status idle — job mungkin sudah selesai sebelumnya. Klik ulang kalau perlu.', {
          id: toastId,
        });
        break;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal queue map-warehouses', { id: toastId });
    } finally {
      setMappingWh(false);
    }
  };

  // ── Ginee: Pull single product (Ginee → Local) ────────────────────────────────
  const handlePullFromGinee = async (product: Product) => {
    if (!product.gineeProductId) {
      toast.error(`Produk "${product.name}" belum terhubung ke Ginee. Push dulu ke Ginee.`);
      return;
    }
    setSyncingProductId(product.id);
    const toastId = toast.loading(`Pulling "${product.name}" dari Ginee...`);
    try {
      await api.post('/ginee/sync/pull-product', { gineeProductId: product.gineeProductId });
      toast.success(`✅ "${product.name}" berhasil di-pull dari Ginee`, { id: toastId });
      fetchProducts();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || `Gagal pull "${product.name}" dari Ginee`,
        { id: toastId },
      );
    } finally {
      setSyncingProductId(null);
    }
  };

  // Tarik stok satu produk — HANYA stok.
  // Beda dari handlePullProduct di atas yang menimpa nama/harga/gambar/kategori.
  // Sumber angkanya sama dengan pull-stock massal (15 gudang SF), jadi hasil
  // kedua tombol konsisten.
  const handlePullStockProduct = async (product: Product) => {
    setSyncingProductId(product.id);
    const toastId = toast.loading(`Menarik stok "${product.name}" dari Ginee...`);
    try {
      const { data } = await api.post('/ginee/sync/pull-stock/product', {
        productId: product.id,
      });

      if (data.matchedSkus === 0) {
        toast.warning(
          `"${product.name}": tidak ada SKU yang ketemu di gudang Ginee — stok tidak diubah`,
          { id: toastId, duration: 8000 },
        );
      } else if (data.updatedVariants === 0) {
        toast.success(`"${product.name}": stok sudah sama dengan Ginee`, {
          id: toastId,
        });
      } else {
        const detail = (data.changes ?? [])
          .map(
            (c: { sku: string; from: number; to: number }) =>
              `${c.sku}: ${c.from} → ${c.to}`,
          )
          .join(', ');
        toast.success(
          `✅ ${data.updatedVariants} varian diupdate${detail ? ` (${detail})` : ''}`,
          { id: toastId, duration: 10000 },
        );
      }
      fetchProducts();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || `Gagal tarik stok "${product.name}"`,
        { id: toastId },
      );
    } finally {
      setSyncingProductId(null);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const handleSort = (key: string) => {
    if (sortBy === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortOrder('asc'); }
  };

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const getPriceDisplay = (basePrice: number, variants: ProductVariant[]) => {
    if (!variants || variants.length === 0) return formatRupiah(basePrice);
    const prices = variants.map((v) => v.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? formatRupiah(min) : `${formatRupiah(min)} - ${formatRupiah(max)}`;
  };

  const getGineeBadge = (product: Product) => {
    if (!product.gineeProductId) return null;
    const statusConfig = {
      synced:  { label: 'Synced',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      pending: { label: 'Pending',  cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
      failed:  { label: 'Failed',   cls: 'bg-red-50 text-red-700 border-red-200' },
    };
    const cfg = statusConfig[product.gineeSyncStatus ?? 'pending'];
    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${cfg.cls}`}>
        <Zap className="h-2.5 w-2.5" /> {cfg.label}
      </span>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-6">

      {/* ── HEADER ─────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Products</h1>
          <p className="text-sm text-slate-500">Kelola katalog dan stok sepatu Anda.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Google Sheet Sync SF */}
          <Button
            variant="outline"
            onClick={() => { setSheetNameInput(''); setSheetPromptPlatform('SF'); }}
            disabled={syncing !== false || loading}
            className="border-green-600 text-green-700 hover:bg-green-50"
          >
            {syncing === 'SF'
              ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              : <FileSpreadsheet className="mr-2 h-4 w-4" />}
            {syncing === 'SF' ? 'Syncing SF...' : 'Sync SF'}
          </Button>

          {/* Google Sheet Sync TS */}
          <Button
            variant="outline"
            onClick={() => { setSheetNameInput(''); setSheetPromptPlatform('TS'); }}
            disabled={syncing !== false || loading}
            className="border-blue-600 text-blue-700 hover:bg-blue-50"
          >
            {syncing === 'TS'
              ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              : <FileSpreadsheet className="mr-2 h-4 w-4" />}
            {syncing === 'TS' ? 'Syncing TS...' : 'Sync TS'}
          </Button>

          {/* Pull Stock dari Ginee */}
          <Button
            variant="outline"
            onClick={() => { setPullStockResult(null); setPullStockOpen(true); }}
            disabled={loading}
            className="border-teal-500 text-teal-600 hover:bg-teal-50"
          >
            <PackageSearch className="mr-2 h-4 w-4" />
            Pull Stock
          </Button>

          {/* Ginee Sync All */}
          <Button
            variant="outline"
            onClick={() => setSyncAllOpen(true)}
            disabled={loading}
            className="border-orange-500 text-orange-600 hover:bg-orange-50"
          >
            <Zap className="mr-2 h-4 w-4" />
            Sync Ginee
          </Button>

          {/* Ginee Map by SKU — one-shot backfill */}
          <Button
            variant="outline"
            onClick={() => { setMapResult(null); setMapBySkuOpen(true); }}
            disabled={loading}
            className="border-purple-500 text-purple-600 hover:bg-purple-50"
          >
            <Link2 className="mr-2 h-4 w-4" />
            Map by SKU
          </Button>

          {/* Ginee Map Warehouse — one-shot warehouse mapping */}
          <Button
            variant="outline"
            onClick={() => { setMapWhResult(null); setMapWhOpen(true); }}
            disabled={loading}
            className="border-cyan-500 text-cyan-600 hover:bg-cyan-50"
          >
            <Warehouse className="mr-2 h-4 w-4" />
            Map Warehouse
          </Button>

          {/* Add Product */}
          <Link href="/dashboard/products/create">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" /> Tambah Manual
            </Button>
          </Link>
        </div>
      </div>

      {/* ── SEARCH & FILTER ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari nama sepatu, brand, SKU..."
            className="pl-9 bg-slate-50 border-slate-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border border-slate-200 rounded-md px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={platformFilter}
          onChange={(e) => { setPlatformFilter(e.target.value as 'ALL' | 'SF' | 'TS'); setPage(1); }}
        >
          <option value="ALL">Semua Platform</option>
          <option value="SF">SF Only</option>
          <option value="TS">TS Only</option>
        </select>
        <select
          className="border border-slate-200 rounded-md px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={limit}
          onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
        >
          <option value="10">10 per page</option>
          <option value="20">20 per page</option>
          <option value="50">50 per page</option>
        </select>
      </div>

      {/* ── TABLE ───────────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b">
              <tr>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">Product <ArrowUpDown className="h-3 w-3" /></div>
                </th>
                <th className="px-6 py-4">Brand</th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition" onClick={() => handleSort('price')}>
                  <div className="flex items-center gap-1">Price <ArrowUpDown className="h-3 w-3" /></div>
                </th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Platform</th>
                <th className="px-6 py-4">Ginee</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-6 py-4">
                      <div className="h-8 bg-slate-100 rounded animate-pulse w-full" />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="h-8 w-8 text-slate-300 mb-2" />
                      <p>Produk tidak ditemukan.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const displayImage = product.variants?.[0]?.imageUrl?.[0] ?? '';
                  const isSyncingThis  = syncingProductId === product.id;

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-slate-50 transition-colors ${isSyncingThis ? 'opacity-60' : ''}`}
                    >
                      {/* Product */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-4">
                          <div className="relative h-14 w-14 rounded-lg border bg-slate-100 overflow-hidden shrink-0 mt-1">
                            {displayImage ? (
                              <Image src={displayImage} alt={product.name} fill className="object-cover" />
                            ) : (
                              <div className="flex items-center justify-center h-full text-slate-300">
                                <span className="text-[10px]">No IMG</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-900 line-clamp-1" title={product.name}>
                              {product.name}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              SKU: {product.variants?.[0]?.sku || '-'}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {product.availableSizes?.length > 0 ? (
                                product.availableSizes.map((size) => (
                                  <span key={size} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                    {size}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">No Size Info</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Brand */}
                      <td className="px-6 py-4 text-slate-600">{product.brand?.name || '-'}</td>

                      {/* Price */}
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {getPriceDisplay(product.basePrice, product.variants)}
                      </td>

                      {/* Stock */}
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${product.totalStock === 0 ? 'text-red-600' : 'text-slate-700'}`}>
                          {product.totalStock}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                          product.totalStock > 0
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {product.totalStock > 0 ? 'Active' : 'Out of Stock'}
                        </span>
                      </td>

                      {/* Platform */}
                      <td className="px-6 py-4">
                        <PlatformBadge platform={product.platform} />
                      </td>

                      {/* Ginee Status Badge */}
                      <td className="px-6 py-4">
                        {isSyncingThis ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                            <RefreshCw className="h-3 w-3 animate-spin" /> Syncing...
                          </span>
                        ) : (
                          getGineeBadge(product) ?? (
                            <span className="text-[10px] text-slate-400 italic">Not linked</span>
                          )
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:bg-slate-200"
                              disabled={isSyncingThis}
                            >
                              <MoreHorizontal className="h-4 w-4 text-slate-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>

                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/products/${product.id}/edit`} className="cursor-pointer">
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-[10px] text-slate-400 font-normal py-0">
                              Ginee
                            </DropdownMenuLabel>

                            {/* Pull: Ginee → Local */}
                            <DropdownMenuItem
                              className={`cursor-pointer focus:bg-blue-50 ${
                                !product.gineeProductId
                                  ? 'text-slate-400 cursor-not-allowed'
                                  : 'text-blue-600 focus:text-blue-700'
                              }`}
                              onClick={() => handlePullFromGinee(product)}
                              disabled={isSyncingThis || !product.gineeProductId}
                            >
                              <CloudDownload className="mr-2 h-4 w-4" />
                              Pull dari Ginee (semua data)
                            </DropdownMenuItem>

                            {/* Stok saja — tidak menimpa nama/harga/gambar/kategori.
                                Tidak butuh gineeProductId: kalau produk belum
                                ter-mapping, SKU lokal dipakai sebagai masterSku. */}
                            <DropdownMenuItem
                              className="cursor-pointer text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700"
                              onClick={() => handlePullStockProduct(product)}
                              disabled={isSyncingThis}
                            >
                              <PackageSearch className="mr-2 h-4 w-4" />
                              Tarik Stok Saja
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer"
                              onClick={() => handleDelete(product.id, product.name)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t">
          <div className="text-sm text-slate-500">
            Page <span className="font-medium text-slate-900">{meta?.page || 1}</span> of{' '}
            <span className="font-medium text-slate-900">{meta?.lastPage || 1}</span>
            <span className="hidden sm:inline"> ({meta?.total || 0} items)</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!meta?.hasPrevPage || loading}
              className="h-8"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            <Button
              variant="outline" size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!meta?.hasNextPage || loading}
              className="h-8"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── PULL STOCK GINEE DIALOG ──────────────────────────────────────────────── */}
      <Dialog
        open={pullStockOpen}
        onOpenChange={(open) => {
          if (pullingStock) return;
          setPullStockOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageSearch className="h-5 w-5 text-teal-500" />
              Pull Stock dari Ginee
            </DialogTitle>
            <DialogDescription>
              Ambil stok terkini dari Ginee dan update <code>stockQuantity</code> di local DB.
              Harga, SKU, nama, dan gambar tidak disentuh. Hanya variant yang sudah punya{' '}
              <code>gineeSkuId</code> yang diperbarui — gudang dan daftar SKU-nya
              ditentukan server dari isi katalog, jadi tidak perlu diisi manual.
            </DialogDescription>
          </DialogHeader>

          {pullStockResult && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm space-y-2">
              <div className="font-semibold text-emerald-900">
                {pullStockResult.dryRun ? '📋 Preview Hasil' : '✅ Pull Stock Selesai'}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-emerald-800">
                <div>Warehouse diproses:</div>
                <div className="font-medium text-right">{pullStockResult.warehousesScanned}</div>
                <div>Total halaman di-fetch:</div>
                <div className="font-medium text-right">{pullStockResult.pagesFetched}</div>
                <div>Baris inventori diproses:</div>
                <div className="font-medium text-right">{pullStockResult.inventoryRowsScanned}</div>
                <div>SKU target:</div>
                <div className="font-medium text-right">{pullStockResult.targetSkuCount}</div>
                <div>Ketemu stoknya di Ginee:</div>
                <div className="font-medium text-right text-emerald-900">{pullStockResult.matchedSkus}</div>
                {!pullStockResult.dryRun && (
                  <>
                    <div>Variant diupdate:</div>
                    <div className="font-medium text-right text-emerald-900">{pullStockResult.updatedVariants}</div>
                  </>
                )}
                <div>Tidak ketemu di gudang mana pun:</div>
                <div className="font-medium text-right text-amber-700">
                  {Math.max(0, pullStockResult.targetSkuCount - pullStockResult.matchedSkus)}
                </div>
              </div>
              <p className="text-xs text-emerald-700 border-t border-emerald-200 pt-2">
                SKU yang tidak ketemu <strong>stok lamanya dibiarkan</strong>, bukan dinolkan —
                job ini baca lewat warehouse-inventory, jadi varian yang di Ginee belum
                punya gudang memang tidak pernah muncul.
              </p>
            </div>
          )}

          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between rounded-lg border p-4 bg-slate-50">
              <div className="space-y-0.5 pr-4">
                <Label htmlFor="pull-stock-dry-run" className="text-sm font-medium">
                  Dry Run (Preview Only)
                </Label>
                <p className="text-xs text-slate-500">
                  Hitung berapa variant yang akan diupdate tanpa mengubah stok. Recommended sebelum live run.
                </p>
              </div>
              <Switch
                id="pull-stock-dry-run"
                checked={pullStockDryRun}
                onCheckedChange={setPullStockDryRun}
                disabled={pullingStock}
              />
            </div>

            {pullingStock && (
              <div className="flex gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                <RefreshCw className="h-4 w-4 animate-spin shrink-0 mt-0.5" />
                <span>
                  Sedang memproses {pullStockScope?.warehousesCount ?? '…'} warehouse
                  {pullStockScope ? ` / ${pullStockScope.targetSkuCount} SKU target` : ''}. Bisa 15-30 menit.
                  Tutup tab boleh — job tetap jalan di background.
                </span>
              </div>
            )}

            {!pullStockDryRun && !pullingStock && (
              <div className="flex gap-2 rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm text-teal-700">
                <span className="text-lg leading-none">ℹ️</span>
                <span>
                  Mode live — akan menimpa <code>stockQuantity</code> dengan stok terkini di Ginee
                  (dijumlah lintas gudang). Variant SF dan TS yang berbagi <code>gineeSkuId</code>
                  ikut di-set sama.
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPullStockOpen(false)} disabled={pullingStock}>
              Tutup
            </Button>
            <Button
              onClick={handlePullStock}
              disabled={pullingStock}
              className={pullStockDryRun ? 'bg-blue-600 hover:bg-blue-700' : 'bg-teal-600 hover:bg-teal-700'}
            >
              {pullingStock
                ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                : pullStockDryRun
                  ? <><Search className="mr-2 h-4 w-4" /> Preview</>
                  : <><PackageSearch className="mr-2 h-4 w-4" /> Pull Stock Sekarang</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── SYNC ALL GINEE DIALOG ────────────────────────────────────────────────── */}
      {/* Dialog: pilih nama tab sheet sebelum sync produk reguler (SF / TS) */}
      <Dialog
        open={sheetPromptPlatform !== null}
        onOpenChange={(open) => { if (!open) setSheetPromptPlatform(null); }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              Sync Produk Reguler [{sheetPromptPlatform}]
            </DialogTitle>
            <DialogDescription>
              Tentukan tab sheet yang mau dipakai. Ini hanya untuk produk reguler —
              produk event/kampanye disinkronkan lewat menu Campaigns.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="sheet-name" className="text-sm font-medium">
              Nama Tab Sheet <span className="text-slate-400 font-normal">(opsional)</span>
            </Label>
            <Input
              id="sheet-name"
              value={sheetNameInput}
              onChange={(e) => setSheetNameInput(e.target.value)}
              placeholder="data_front"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && sheetPromptPlatform) {
                  const p = sheetPromptPlatform;
                  setSheetPromptPlatform(null);
                  void handleSyncGoogleSheet(p, sheetNameInput);
                }
              }}
            />
            <p className="text-xs text-slate-500">
              Kosongkan untuk memakai sheet default yang sudah dikonfigurasi di server.
              Spreadsheet-nya sendiri tetap yang sudah diset per platform.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSheetPromptPlatform(null)}>
              Batal
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                if (!sheetPromptPlatform) return;
                const p = sheetPromptPlatform;
                setSheetPromptPlatform(null);
                void handleSyncGoogleSheet(p, sheetNameInput);
              }}
            >
              {sheetNameInput.trim() ? 'Sync Sheet Ini' : 'Sync Sheet Default'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={syncAllOpen} onOpenChange={setSyncAllOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              Sync Semua Produk ke Ginee
            </DialogTitle>
            <DialogDescription>
              Proses ini akan menarik semua produk aktif dari Ginee dan menyinkronkan stok ke database lokal. 
              Berjalan di background — halaman tidak perlu menunggu.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Dry Run Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4 bg-slate-50">
              <div className="space-y-0.5">
                <Label htmlFor="dry-run" className="text-sm font-medium">
                  Dry Run (Preview Only)
                </Label>
                <p className="text-xs text-slate-500">
                  Cek dulu tanpa mengubah data apapun. Sangat disarankan untuk pertama kali.
                </p>
              </div>
              <Switch
                id="dry-run"
                checked={dryRun}
                onCheckedChange={setDryRun}
              />
            </div>

            {/* Warning when dry run is OFF */}
            {!dryRun && (
              <div className="flex gap-2 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
                <span className="text-lg leading-none">⚠️</span>
                <span>
                  Mode live aktif — data stok akan benar-benar diupdate. 
                  Pastikan sudah test dengan dry run terlebih dahulu.
                </span>
              </div>
            )}

            {dryRun && (
              <div className="flex gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                <span className="text-lg leading-none">ℹ️</span>
                <span>
                  Dry run aktif — tidak ada data yang akan diubah. 
                  Hasil hanya bisa dilihat di server log.
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSyncAllOpen(false)}
              disabled={syncingAll}
            >
              Batal
            </Button>
            <Button
              onClick={handleSyncAllGinee}
              disabled={syncingAll}
              className={dryRun ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-500 hover:bg-orange-600'}
            >
              {syncingAll
                ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                : dryRun
                  ? <><Search className="mr-2 h-4 w-4" /> Jalankan Dry Run</>
                  : <><Zap className="mr-2 h-4 w-4" /> Sync Sekarang</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MAP BY SKU DIALOG ────────────────────────────────────────────────────── */}
      <Dialog
        open={mapBySkuOpen}
        onOpenChange={(open) => {
          if (mappingBySku) return; // jangan tutup saat sedang proses
          setMapBySkuOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-purple-500" />
              Map Local Variants ↔ Ginee by SKU
            </DialogTitle>
            <DialogDescription>
              Backfill <code>gineeProductId</code> dan <code>gineeSkuId</code> untuk variant yang sudah ada di
              local DB dengan mencocokkan SKU ke produk Ginee. Tidak membuat record baru, hanya UPDATE existing.
            </DialogDescription>
          </DialogHeader>

          {/* Result panel (kalau ada hasil) */}
          {mapResult && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm space-y-2">
              <div className="font-semibold text-emerald-900">
                {mapDryRun ? '📋 Preview Hasil' : '✅ Mapping Selesai'}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-emerald-800">
                <div>Pages fetched:</div>
                <div className="font-medium text-right">
                  {mapResult.pagesFetched}
                  {mapResult.totalPagesReported > 0 && (
                    <span className="text-emerald-600"> / {mapResult.totalPagesReported}</span>
                  )}
                </div>
                <div>Ginee variants scanned:</div>
                <div className="font-medium text-right">{mapResult.gineeVariantsScanned}</div>
                <div>{mapDryRun ? 'Akan di-update:' : 'Matched & updated:'}</div>
                <div className="font-medium text-right text-emerald-900">{mapResult.matched}</div>
                <div>Sudah ter-mapping sebelumnya:</div>
                <div className="font-medium text-right">{mapResult.alreadyMapped}</div>
                <div>Tidak ada SKU lokal cocok:</div>
                <div className="font-medium text-right text-amber-700">{mapResult.unmatched}</div>
                <div>Produk lokal yang diupdate:</div>
                <div className="font-medium text-right">{mapResult.productsUpdated}</div>
                {mapResult.rateLimitSkips > 0 && (
                  <>
                    <div>Skip karena Ginee rate-limit:</div>
                    <div className="font-medium text-right text-red-600">{mapResult.rateLimitSkips}</div>
                  </>
                )}
              </div>

              {mapResult.sampleUnmatchedSkus.length > 0 && (
                <div className="pt-2 mt-2 border-t border-emerald-200">
                  <div className="text-xs text-amber-700 mb-1">
                    Sample SKU Ginee yang tidak ketemu di lokal (max 20):
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {mapResult.sampleUnmatchedSkus.map((sku) => (
                      <code key={sku} className="px-1.5 py-0.5 rounded bg-white border text-[10px] text-slate-700">
                        {sku}
                      </code>
                    ))}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2">
                    Kalau banyak yang tidak match, coba aktifkan <strong>Case-insensitive</strong> lalu jalankan ulang.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Options panel */}
          <div className="space-y-3 py-2">
            {/* Dry run */}
            <div className="flex items-center justify-between rounded-lg border p-4 bg-slate-50">
              <div className="space-y-0.5 pr-4">
                <Label htmlFor="map-dry-run" className="text-sm font-medium">
                  Dry Run (Preview Only)
                </Label>
                <p className="text-xs text-slate-500">
                  Hanya hitung berapa SKU yang akan match — tidak update DB. Sangat disarankan untuk pertama kali.
                </p>
              </div>
              <Switch
                id="map-dry-run"
                checked={mapDryRun}
                onCheckedChange={setMapDryRun}
                disabled={mappingBySku}
              />
            </div>

            {/* Case insensitive */}
            <div className="flex items-center justify-between rounded-lg border p-4 bg-slate-50">
              <div className="space-y-0.5 pr-4">
                <Label htmlFor="map-ci" className="text-sm font-medium">
                  Case-insensitive Match
                </Label>
                <p className="text-xs text-slate-500">
                  Aktifkan kalau SKU di lokal &amp; Ginee bedanya cuma huruf besar/kecil (mis. <code>abc-001</code> vs <code>ABC-001</code>).
                </p>
              </div>
              <Switch
                id="map-ci"
                checked={mapCaseInsensitive}
                onCheckedChange={setMapCaseInsensitive}
                disabled={mappingBySku}
              />
            </div>

            {mappingBySku && (
              <div className="flex gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                <RefreshCw className="h-4 w-4 animate-spin shrink-0 mt-0.5" />
                <span>
                  Sedang memproses... endpoint blocking, mungkin butuh beberapa menit tergantung jumlah produk di Ginee.
                  Jangan tutup tab ini.
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setMapBySkuOpen(false)}
              disabled={mappingBySku}
            >
              Tutup
            </Button>
            <Button
              onClick={handleMapBySku}
              disabled={mappingBySku}
              className={mapDryRun ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}
            >
              {mappingBySku
                ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                : mapDryRun
                  ? <><Search className="mr-2 h-4 w-4" /> Preview Match</>
                  : <><Link2 className="mr-2 h-4 w-4" /> Jalankan Mapping</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MAP WAREHOUSE DIALOG ─────────────────────────────────────────────────── */}
      <Dialog
        open={mapWhOpen}
        onOpenChange={(open) => {
          if (mappingWh) return;
          setMapWhOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5 text-cyan-500" />
              Map Variant ↔ Ginee Warehouse
            </DialogTitle>
            <DialogDescription>
              Iterate <strong>{GINEE_WAREHOUSE_IDS.length} warehouse Ginee</strong> dan populate
              kolom <code>gineeWarehouseId</code> di tiap variant lokal. Wajib jalan setelah
              <strong> Map by SKU</strong> karena lookup-nya pakai <code>gineeSkuId</code>.
              Strategi pilih warehouse: prefer yang <code>availableStock &gt; 0</code>, fallback ke yang pertama.
            </DialogDescription>
          </DialogHeader>

          {/* Result panel */}
          {mapWhResult && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm space-y-2">
              <div className="font-semibold text-emerald-900">
                {mapWhDryRun ? '📋 Preview Hasil' : '✅ Mapping Selesai'}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-emerald-800">
                <div>Warehouse scanned:</div>
                <div className="font-medium text-right">{mapWhResult.warehousesScanned}</div>
                <div>Total pages fetched:</div>
                <div className="font-medium text-right">{mapWhResult.pagesFetched}</div>
                <div>Inventory rows scanned:</div>
                <div className="font-medium text-right">{mapWhResult.inventoryRowsScanned}</div>
                <div>Variant ter-match:</div>
                <div className="font-medium text-right">{mapWhResult.matchedVariants}</div>
                <div>{mapWhDryRun ? 'Akan di-update:' : 'Variant updated:'}</div>
                <div className="font-medium text-right text-emerald-900">{mapWhResult.updatedVariants}</div>
                <div>Variant di multi-warehouse:</div>
                <div className="font-medium text-right">{mapWhResult.multiWarehouseVariants}</div>
              </div>

              {mapWhResult.sampleUnmappedWarehouseIds.length > 0 && (
                <div className="pt-2 mt-2 border-t border-emerald-200">
                  <div className="text-xs text-amber-700 mb-1">
                    Sample masterVariationId yang tidak ketemu di local DB (perlu Map by SKU dulu):
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {mapWhResult.sampleUnmappedWarehouseIds.map((id) => (
                      <code key={id} className="px-1.5 py-0.5 rounded bg-white border text-[10px] text-slate-700">
                        {id}
                      </code>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Options */}
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between rounded-lg border p-4 bg-slate-50">
              <div className="space-y-0.5 pr-4">
                <Label htmlFor="map-wh-dry-run" className="text-sm font-medium">
                  Dry Run (Preview Only)
                </Label>
                <p className="text-xs text-slate-500">
                  Hitung berapa variant yang akan dapat warehouseId tanpa update DB. Recommended sebelum live run.
                </p>
              </div>
              <Switch
                id="map-wh-dry-run"
                checked={mapWhDryRun}
                onCheckedChange={setMapWhDryRun}
                disabled={mappingWh}
              />
            </div>

            {mappingWh && (
              <div className="flex gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                <RefreshCw className="h-4 w-4 animate-spin shrink-0 mt-0.5" />
                <span>
                  Sedang memproses ~{GINEE_WAREHOUSE_IDS.length} warehouse. Bisa 30-60 menit.
                  Tutup tab boleh — job tetap jalan di background.
                </span>
              </div>
            )}

            {!mapWhDryRun && !mappingWh && (
              <div className="flex gap-2 rounded-lg border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-700">
                <span className="text-lg leading-none">ℹ️</span>
                <span>
                  Mode live — akan update <code>gineeWarehouseId</code> di <code>product_variants</code>.
                  Setelah selesai, hourly scheduler dan hook payment akan langsung pakai warehouse yang benar per variant.
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setMapWhOpen(false)}
              disabled={mappingWh}
            >
              Tutup
            </Button>
            <Button
              onClick={handleMapWarehouses}
              disabled={mappingWh}
              className={mapWhDryRun ? 'bg-blue-600 hover:bg-blue-700' : 'bg-cyan-600 hover:bg-cyan-700'}
            >
              {mappingWh
                ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                : mapWhDryRun
                  ? <><Search className="mr-2 h-4 w-4" /> Preview Match</>
                  : <><Warehouse className="mr-2 h-4 w-4" /> Jalankan Mapping</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}