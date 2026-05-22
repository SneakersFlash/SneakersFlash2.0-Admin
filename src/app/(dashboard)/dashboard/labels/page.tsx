'use client';

import { useCallback, useEffect, useState } from 'react';
import { Printer, Search, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import LabelsService, { LabelProduct } from '@/services/labels.service';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

const SIZE_PRESETS = [
  { label: '5 × 2,5 cm', width: 50, height: 25 },
  { label: '5 × 3 cm', width: 50, height: 30 },
  { label: '5 × 2 cm', width: 50, height: 20 },
  { label: '10 × 5 cm', width: 100, height: 50 },
];

const ROTATE_OPTIONS = [
  { label: 'Normal', value: 0 },
  { label: 'Terbalik (180°)', value: 180 },
];

export default function LabelsPage() {
  const [products, setProducts] = useState<LabelProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Map<string, LabelProduct>>(new Map());

  const [width, setWidth] = useState(50);
  const [height, setHeight] = useState(25);
  const [copies, setCopies] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [isPrinting, setIsPrinting] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setProducts(await LabelsService.searchProducts(search, 100));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Debounce pencarian
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const toggle = (p: LabelProduct) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(p.sku)) next.delete(p.sku);
      else next.set(p.sku, p);
      return next;
    });
  };

  const allShownSelected =
    products.length > 0 && products.every((p) => selected.has(p.sku));

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (allShownSelected) products.forEach((p) => next.delete(p.sku));
      else products.forEach((p) => next.set(p.sku, p));
      return next;
    });
  };

  const openInWindow = (win: Window | null, blob: Blob) => {
    const url = URL.createObjectURL(blob);
    if (win) win.location.href = url;
    else window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const printSelected = async () => {
    if (selected.size === 0) {
      toast.error('Pilih minimal satu produk.');
      return;
    }
    // Buka tab kosong dulu (saat klik) supaya tidak diblokir popup blocker
    const win = window.open('', '_blank');
    try {
      setIsPrinting(true);
      const blob = await LabelsService.getBatchPdf([...selected.keys()], {
        width,
        height,
        copies,
        rotate,
      });
      openInWindow(win, blob);
      toast.success(
        `PDF ${selected.size * copies} label dibuka di tab baru.`,
      );
    } catch (error) {
      win?.close();
      toast.error(getErrorMessage(error));
    } finally {
      setIsPrinting(false);
    }
  };

  const printSingle = async (p: LabelProduct) => {
    const win = window.open('', '_blank');
    try {
      const blob = await LabelsService.getSinglePdf(p.sku, {
        width,
        height,
        copies,
        rotate,
      });
      openInWindow(win, blob);
    } catch (error) {
      win?.close();
      toast.error(getErrorMessage(error));
    }
  };

  const formatPrice = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cetak Label"
        description="Cetak label produk ber-barcode (PDF) dari data inventory."
        icon={Printer}
      />

      {/* Pengaturan label */}
      <Card className="p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Ukuran Label</p>
            <div className="flex flex-wrap gap-2">
              {SIZE_PRESETS.map((preset) => {
                const active =
                  preset.width === width && preset.height === height;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setWidth(preset.width);
                      setHeight(preset.height);
                    }}
                    className={cn(
                      'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                      active
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 text-gray-600 hover:border-gray-400',
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Lebar (mm)</label>
                <Input
                  type="number"
                  min={20}
                  max={150}
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value) || 0)}
                  className="w-24"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Tinggi (mm)</label>
                <Input
                  type="number"
                  min={12}
                  max={150}
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value) || 0)}
                  className="w-24"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">
                  Jumlah / produk
                </label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={copies}
                  onChange={(e) => setCopies(Number(e.target.value) || 1)}
                  className="w-24"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Isi ukuran = ukuran label fisik (ukur dengan penggaris). Kalau
              hasil cetak terbalik, pilih Rotasi &quot;Terbalik&quot;.
            </p>

            <div className="space-y-2 pt-1">
              <p className="text-sm font-medium text-gray-700">Rotasi Konten</p>
              <div className="flex flex-wrap gap-2">
                {ROTATE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRotate(opt.value)}
                    className={cn(
                      'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                      rotate === opt.value
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 text-gray-600 hover:border-gray-400',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-2 lg:items-end">
            <Button
              onClick={printSelected}
              disabled={isPrinting || selected.size === 0}
            >
              {isPrinting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Printer className="mr-2 h-4 w-4" />
              )}
              Cetak {selected.size} Label
            </Button>
            {selected.size > 0 && (
              <button
                type="button"
                onClick={() => setSelected(new Map())}
                className="text-xs text-gray-500 hover:text-red-600"
              >
                Bersihkan pilihan ({selected.size})
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Daftar produk */}
      <Card className="overflow-hidden p-0">
        <div className="border-b border-gray-100 p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari SKU atau nama produk..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 text-xs uppercase text-gray-500">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allShownSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 cursor-pointer accent-gray-900"
                  />
                </th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Nama Produk</th>
                <th className="px-4 py-3 font-medium">Brand</th>
                <th className="px-4 py-3 text-right font-medium">Harga Ritel</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Memuat produk...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Produk tidak ditemukan.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const checked = selected.has(p.sku);
                  return (
                    <tr
                      key={p.sku}
                      onClick={() => toggle(p)}
                      className={cn(
                        'cursor-pointer transition-colors',
                        checked ? 'bg-gray-50' : 'hover:bg-gray-50/50',
                      )}
                    >
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(p)}
                          className="h-4 w-4 cursor-pointer accent-gray-900"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-medium text-gray-900">
                        {p.sku}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{p.name}</td>
                      <td className="px-4 py-3 text-gray-500">{p.brand}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {formatPrice(p.ritelPrice)}
                      </td>
                      <td
                        className="px-4 py-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => printSingle(p)}
                        >
                          <FileText className="mr-1.5 h-3.5 w-3.5" /> Cetak
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-100 px-4 py-2.5 text-xs text-gray-500">
          Menampilkan {products.length} produk &middot; {selected.size} dipilih
        </div>
      </Card>
    </div>
  );
}
