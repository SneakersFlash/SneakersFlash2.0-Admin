'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Plus, Search, MoreHorizontal, Pencil, Trash2,
  ArrowUpDown, ChevronLeft, ChevronRight, RefreshCw, 
  FileSpreadsheet, CloudUpload, CloudDownload, Zap
} from 'lucide-react';
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
  const [syncing, setSyncing]     = useState(false);

  // ── Ginee Sync All state ─────────────────────────────────────────────────────
  const [syncAllOpen, setSyncAllOpen]   = useState(false);
  const [dryRun, setDryRun]             = useState(true);
  const [syncingAll, setSyncingAll]     = useState(false);

  // ── Ginee per-product sync state ─────────────────────────────────────────────
  // Tracks which productId is currently being synced (push or pull)
  const [syncingProductId, setSyncingProductId] = useState<string | null>(null);

  // ── Query params ─────────────────────────────────────────────────────────────
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [limit, setLimit]         = useState(10);
  const [sortBy, setSortBy]       = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
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
        params: { page, limit, search: debouncedSearch, sortBy, sortOrder },
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
  }, [page, limit, debouncedSearch, sortBy, sortOrder]);

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
  const handleSyncGoogleSheet = async () => {
    setSyncing(true);
    const toastId = toast.loading('Sinkronisasi dengan Google Sheet...');
    try {
      const response = await api.post('/products/sync/google-sheet');
      toast.success(response.data.message || 'Sinkronisasi Berhasil!', { id: toastId });
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal sinkronisasi', { id: toastId });
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
          {/* Google Sheet Sync */}
          <Button
            variant="outline"
            onClick={handleSyncGoogleSheet}
            disabled={syncing || loading}
            className="border-green-600 text-green-700 hover:bg-green-50"
          >
            {syncing
              ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              : <FileSpreadsheet className="mr-2 h-4 w-4" />}
            {syncing ? 'Syncing...' : 'Sync G-Sheet'}
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
                <th className="px-6 py-4">Ginee</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-6 py-4">
                      <div className="h-8 bg-slate-100 rounded animate-pulse w-full" />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
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
                              Pull dari Ginee
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

      {/* ── SYNC ALL GINEE DIALOG ────────────────────────────────────────────────── */}
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

    </div>
  );
}