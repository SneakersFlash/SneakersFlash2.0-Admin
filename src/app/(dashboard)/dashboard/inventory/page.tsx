'use client';

import { useEffect, useState, useRef } from 'react';
import { Warehouse, Plus, Minus, FileText, Search, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import InventoryService from '@/services/inventory.service';
import ProductsService from '@/services/products.service';
import type { InventoryLog, CreateInventoryPayload, InventoryLogType } from '@/types/inventory.types';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { getErrorMessage } from '@/lib/api';

export default function InventoryPage() {
  // --- Autocomplete State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- Selection State ---
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');

  // --- Inventory Data State ---
  const [history, setHistory] = useState<InventoryLog[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);

  const [formData, setFormData] = useState({
    action: 'add',
    quantity: 0,
    type: 'restock' as InventoryLogType,
    note: '',
    referenceId: ''
  });

  // 1. Debounce Logic: Tunggu 500ms setelah user berhenti mengetik
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 2. Fetch data produk berdasarkan keyword pencarian
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!debouncedSearch.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        // Panggil API dengan parameter search & limit 5-10 saja biar ringan
        const res = await ProductsService.getAll({ search: debouncedSearch, limit: 10 });
        setSearchResults(res.data || res);
      } catch (error) {
        toast.error('Gagal mencari produk');
      } finally {
        setIsSearching(false);
      }
    };

    fetchSearchResults();
  }, [debouncedSearch]);

  // Tutup dropdown jika user klik di luar kotak pencarian
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 3. Fetch History jika Varian dipilih
  useEffect(() => {
    if (selectedVariantId) {
      loadHistory(selectedVariantId);
    } else {
      setHistory([]);
    }
  }, [selectedVariantId]);

  const loadHistory = async (varId: string) => {
    try {
      setIsLoadingHistory(true);
      const data = await InventoryService.getHistory(varId);
      setHistory(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // 4. Handle Submit Adjustment
  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariantId || formData.quantity <= 0) {
      return toast.error('Jumlah harus lebih dari 0');
    }

    const quantityChange = formData.action === 'add' ? formData.quantity : -Math.abs(formData.quantity);

    try {
      setIsAdjusting(true);
      const payload: CreateInventoryPayload = {
        productVariantId: Number(selectedVariantId),
        quantityChange,
        type: formData.type,
        note: formData.note || undefined,
        referenceId: formData.referenceId || undefined,
      };

      const res = await InventoryService.adjustStock(payload);
      toast.success(res.message);
      
      setFormData(prev => ({ ...prev, quantity: 0, note: '', referenceId: '' }));
      loadHistory(selectedVariantId);
      
      // Update sisa stok di variant yang sedang di-select secara lokal (biar UI langsung update tanpa fetch product lagi)
      setSelectedProduct((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          variants: prev.variants.map((v: any) => 
            String(v.id) === selectedVariantId ? { ...v, stock: v.stock + quantityChange } : v
          )
        };
      });

    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);
    setSelectedVariantId(''); // Reset varian jika ganti produk
    setSearchQuery(product.name); // Isi input dengan nama produk
    setShowDropdown(false);
  };

  const handleClearProduct = () => {
    setSelectedProduct(null);
    setSelectedVariantId('');
    setSearchQuery('');
    setSearchResults([]);
  };

  const getTypeLabel = (type: InventoryLogType) => {
    const types: Record<string, { label: string, color: string }> = {
      restock: { label: 'Restock', color: 'bg-green-100 text-green-700' },
      damage: { label: 'Rusak', color: 'bg-red-100 text-red-700' },
      adjustment: { label: 'Penyesuaian', color: 'bg-yellow-100 text-yellow-700' },
      order_fulfillment: { label: 'Pesanan', color: 'bg-blue-100 text-blue-700' },
      return: { label: 'Retur', color: 'bg-purple-100 text-purple-700' },
    };
    return types[type] || { label: type, color: 'bg-gray-100 text-gray-700' };
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Manajemen Inventori" 
        description="Cari produk untuk melihat kartu stok dan melakukan penyesuaian kuantitas."
        icon={Warehouse}
      />

      {/* SECTION 1: PEMILIHAN PRODUK (AUTOCOMPLETE) */}
      <Card className="border-gray-200 overflow-visible relative">
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-visible">
          
          {/* Autocomplete Product Input */}
          <div className="space-y-2 relative" ref={dropdownRef}>
            <Label>1. Cari Produk</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Ketik nama atau SKU produk..."
                className="pl-9 pr-10"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                  if (selectedProduct) setSelectedProduct(null); // Reset jika mulai ngetik lagi
                }}
                onFocus={() => setShowDropdown(true)}
              />
              {isSearching ? (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />
              ) : searchQuery ? (
                <button onClick={handleClearProduct} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            {/* Dropdown Results */}
            {showDropdown && searchQuery.trim().length > 0 && !selectedProduct && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center text-sm text-gray-500">Mencari...</div>
                ) : searchResults.length > 0 ? (
                  <ul className="py-1">
                    {searchResults.map((product) => (
                      <li 
                        key={product.id} 
                        onClick={() => handleSelectProduct(product)}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-0"
                      >
                        {product.variants?.[0]?.imageUrl?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.variants[0].imageUrl[0]} alt={product.name} className="w-10 h-10 rounded object-cover border" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-100 border flex items-center justify-center"><Warehouse className="w-4 h-4 text-gray-400"/></div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">Stok Total: {product.totalStock}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">Produk tidak ditemukan</div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>2. Pilih Varian / SKU</Label>
            <Select disabled={!selectedProduct} value={selectedVariantId} onValueChange={setSelectedVariantId}>
              <SelectTrigger className={!selectedProduct ? 'bg-gray-50' : ''}>
                <SelectValue placeholder="-- Pilih Varian --" />
              </SelectTrigger>
              <SelectContent>
                {selectedProduct?.variants?.map((v: any) => (
                  <SelectItem key={v.id} value={String(v.id)}>
                    {v.sku} — Stok: {v.stock}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* TAMPILKAN JIKA VARIAN SUDAH DIPILIH */}
      {selectedVariantId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* SECTION 2: FORM ADJUSTMENT */}
          <div className="lg:col-span-1">
            <Card className="border-gray-200 shadow-sm sticky top-24">
              <CardHeader className="bg-gray-50/50 border-b pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  Form Penyesuaian
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <form onSubmit={handleAdjustStock} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Aksi</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        type="button" 
                        variant={formData.action === 'add' ? 'default' : 'outline'}
                        className={formData.action === 'add' ? 'bg-green-600 hover:bg-green-700 text-white border-transparent' : ''}
                        onClick={() => setFormData(p => ({ ...p, action: 'add', type: 'restock' }))}
                      >
                        <Plus className="w-4 h-4 mr-2" /> Tambah
                      </Button>
                      <Button 
                        type="button" 
                        variant={formData.action === 'subtract' ? 'default' : 'outline'}
                        className={formData.action === 'subtract' ? 'bg-red-600 hover:bg-red-700 text-white border-transparent' : ''}
                        onClick={() => setFormData(p => ({ ...p, action: 'subtract', type: 'damage' }))}
                      >
                        <Minus className="w-4 h-4 mr-2" /> Kurangi
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Jumlah Barang</Label>
                    <Input 
                      type="number" 
                      required min={1} 
                      value={formData.quantity || ''} 
                      onChange={(e) => setFormData(p => ({ ...p, quantity: Number(e.target.value) }))} 
                      placeholder="Contoh: 10" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tipe Log</Label>
                    <Select value={formData.type} onValueChange={(val) => setFormData(p => ({...p, type: val as InventoryLogType}))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {formData.action === 'add' ? (
                          <>
                            <SelectItem value="restock">Restock (Barang Masuk)</SelectItem>
                            <SelectItem value="return">Retur Pelanggan</SelectItem>
                            <SelectItem value="adjustment">Penyesuaian Sistem (+)</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="damage">Barang Rusak</SelectItem>
                            <SelectItem value="order_fulfillment">Dikirim ke Pesanan</SelectItem>
                            <SelectItem value="adjustment">Penyesuaian Sistem (-)</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Referensi (Opsional)</Label>
                    <Input 
                      value={formData.referenceId} 
                      onChange={(e) => setFormData(p => ({ ...p, referenceId: e.target.value }))} 
                      placeholder="Contoh: PO-2026-001 / ORD-123" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Catatan</Label>
                    <Input 
                      value={formData.note} 
                      onChange={(e) => setFormData(p => ({ ...p, note: e.target.value }))} 
                      placeholder="Barang datang dari vendor X..." 
                    />
                  </div>

                  <Button type="submit" className="w-full mt-4" disabled={isAdjusting || formData.quantity <= 0}>
                    {isAdjusting ? 'Menyimpan...' : 'Simpan Penyesuaian'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* SECTION 3: TABEL HISTORY */}
          <div className="lg:col-span-2">
            <Card className="border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                    <tr>
                      <th className="px-4 py-3 font-medium">Waktu</th>
                      <th className="px-4 py-3 font-medium text-center">Perubahan</th>
                      <th className="px-4 py-3 font-medium">Tipe / Referensi</th>
                      <th className="px-4 py-3 font-medium">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {isLoadingHistory ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Memuat data kartu stok...</td></tr>
                    ) : history.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Belum ada riwayat pergerakan stok untuk SKU ini.</td></tr>
                    ) : (
                      history.map((log) => {
                        const typeInfo = getTypeLabel(log.type);
                        const isPositive = log.quantityChange > 0;
                        return (
                          <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                              {new Date(log.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className={`font-bold text-base ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                {isPositive ? '+' : ''}{log.quantityChange}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className={`border-none ${typeInfo.color} mb-1 block w-fit`}>
                                {typeInfo.label}
                              </Badge>
                              {log.referenceId && (
                                <div className="text-[10px] text-gray-500 font-mono mt-0.5 flex items-center gap-1">
                                  Ref: <span className="text-gray-700">{log.referenceId}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600 max-w-[200px] truncate" title={log.note || ''}>
                              {log.note || '-'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

        </div>
      )}
    </div>
  );
}