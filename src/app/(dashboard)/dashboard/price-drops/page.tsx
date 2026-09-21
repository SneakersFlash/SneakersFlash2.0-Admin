'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  TrendingDown, Search, Loader2, X, Plus, RotateCcw, Clock, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import ProductService from '@/services/products.service';
import type { PriceDrop, PriceDropStatus } from '@/types/price-drop.types';
import PageHeader from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { getErrorMessage } from '@/lib/api';
import { toNum } from '@/lib/utils';

const rupiah = (n: number) => 'Rp' + Math.round(n).toLocaleString('id-ID');

// Harga yang BENAR-BENAR berlaku sekarang: promo event kalau ada, kalau tidak
// harga varian. Dipakai sebagai pembanding supaya admin lihat turun berapa.
function hargaBerjalan(p: any): number {
  const event = p?.activeEvent?.specialPrice;
  if (event) return toNum(event);
  const varian = p?.variants?.[0]?.price;
  return toNum(varian ?? p?.basePrice ?? 0);
}

// Input datetime-local butuh "YYYY-MM-DDTHH:mm" waktu lokal, bukan ISO UTC.
function toLocalInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

interface Baris {
  productId: string;
  name: string;
  skuParent: string | null;
  basePrice: number;
  hargaSekarang: number;
  dropPrice: string;
}

export default function PriceDropsPage() {
  const [drops, setDrops] = useState<PriceDrop[]>([]);
  const [status, setStatus] = useState<PriceDropStatus>('active');
  const [isLoading, setIsLoading] = useState(true);
  const [endingId, setEndingId] = useState<string | null>(null);

  // Keranjang drop yang sedang disusun.
  const [baris, setBaris] = useState<Baris[]>([]);
  const [search, setSearch] = useState('');
  const [hasil, setHasil] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [mulai, setMulai] = useState(() => toLocalInput(new Date()));
  const [selesai, setSelesai] = useState(() =>
    toLocalInput(new Date(Date.now() + 3 * 60 * 60 * 1000)),
  );
  const [note, setNote] = useState('');

  const fetchDrops = useCallback(async () => {
    setIsLoading(true);
    try {
      setDrops(await ProductService.getPriceDrops(status));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchDrops();
  }, [fetchDrops]);

  // Muat ulang berkala supaya hitung mundur dan status "sudah lewat" tidak basi
  // saat halaman ditinggal terbuka sepanjang live.
  useEffect(() => {
    const t = setInterval(fetchDrops, 60_000);
    return () => clearInterval(t);
  }, [fetchDrops]);

  useEffect(() => {
    if (search.trim().length < 2) {
      setHasil([]);
      return;
    }
    const t = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await ProductService.getAll({ search: search.trim(), limit: 8 } as any);
        setHasil((res as any).data ?? []);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const tambah = (p: any) => {
    const id = String(p.id);
    if (baris.some((b) => b.productId === id)) return toast.info('Produk itu sudah ada di daftar');
    setBaris((prev) => [
      ...prev,
      {
        productId: id,
        name: p.name,
        skuParent: p.skuParent ?? null,
        basePrice: toNum(p.basePrice),
        hargaSekarang: hargaBerjalan(p),
        dropPrice: '',
      },
    ]);
    setSearch('');
    setHasil([]);
  };

  const simpan = async () => {
    const items = baris
      .filter((b) => Number(b.dropPrice) > 0)
      .map((b) => ({ productId: b.productId, dropPrice: Number(b.dropPrice) }));

    if (items.length === 0) return toast.error('Isi dulu harga baru minimal satu produk');
    if (new Date(selesai) <= new Date(mulai))
      return toast.error('Jam selesai harus setelah jam mulai');

    try {
      setIsSaving(true);
      const res = await ProductService.createPriceDrops({
        items,
        startAt: new Date(mulai).toISOString(),
        endAt: new Date(selesai).toISOString(),
        note: note.trim() || undefined,
      });

      if (res.totalBerhasil > 0) toast.success(`${res.totalBerhasil} harga berhasil diturunkan`);
      if (res.totalGagal > 0) {
        res.gagal.forEach((g) => toast.error(`Produk ${g.productId}: ${g.alasan}`));
      } else {
        setBaris([]);
        setNote('');
      }
      setStatus('active');
      fetchDrops();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const kembalikan = async (d: PriceDrop) => {
    try {
      setEndingId(d.id);
      await ProductService.endPriceDrop(d.id);
      toast.success(`Harga ${d.productName} sudah kembali normal`);
      fetchDrops();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setEndingId(null);
    }
  };

  const sisaWaktu = (endAt: string) => {
    const ms = new Date(endAt).getTime() - Date.now();
    if (ms <= 0) return 'sudah lewat';
    const jam = Math.floor(ms / 3_600_000);
    const menit = Math.floor((ms % 3_600_000) / 60_000);
    return jam > 0 ? `${jam} jam ${menit} mnt lagi` : `${menit} mnt lagi`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Price Drop"
        description="Turunkan harga sementara selama sesi live. Harga asli tidak diubah dan kembali sendiri saat waktunya habis."
        icon={TrendingDown}
      />

      {/* ─── Susun drop baru ─────────────────────────────────────────────── */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Turunkan Harga</h2>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Cari produk: nama, SKU, atau kode artikel…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
          )}

          {hasil.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-lg border bg-white shadow-lg max-h-72 overflow-y-auto">
              {hasil.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => tambah(p)}
                  className="w-full text-left px-3 py-2.5 hover:bg-gray-50 border-b last:border-0"
                >
                  <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                  <p className="text-xs text-gray-500">
                    {p.skuParent ?? '-'} · harga sekarang{' '}
                    <strong>{rupiah(hargaBerjalan(p))}</strong>
                    {p.activeEvent?.eventName ? ` (${p.activeEvent.eventName})` : ''}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {baris.length > 0 && (
          <>
            <div className="rounded-lg border divide-y">
              {baris.map((b, i) => {
                const drop = Number(b.dropPrice);
                const valid = drop > 0 && drop < b.hargaSekarang;
                const persen = valid
                  ? Math.round(((b.hargaSekarang - drop) / b.hargaSekarang) * 100)
                  : 0;
                return (
                  <div key={b.productId} className="p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{b.name}</p>
                      <p className="text-xs text-gray-500">
                        {b.skuParent ?? '-'} · sekarang <strong>{rupiah(b.hargaSekarang)}</strong>
                        {' · '}asli {rupiah(b.basePrice)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="harga baru"
                        value={b.dropPrice}
                        onChange={(e) =>
                          setBaris((prev) =>
                            prev.map((x, idx) =>
                              idx === i ? { ...x, dropPrice: e.target.value } : x,
                            ),
                          )
                        }
                        className="w-36"
                      />
                      {b.dropPrice !== '' && (
                        <Badge
                          className={
                            valid
                              ? 'bg-emerald-100 text-emerald-700 border-none'
                              : 'bg-rose-100 text-rose-700 border-none'
                          }
                        >
                          {valid ? `-${persen}%` : 'harus lebih murah'}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setBaris((prev) => prev.filter((_, idx) => idx !== i))}
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="mulai">Mulai</Label>
                <Input
                  id="mulai"
                  type="datetime-local"
                  value={mulai}
                  onChange={(e) => setMulai(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="selesai">Selesai</Label>
                <Input
                  id="selesai"
                  type="datetime-local"
                  value={selesai}
                  onChange={(e) => setSelesai(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="catatan">Catatan (opsional)</Label>
                <Input
                  id="catatan"
                  placeholder="contoh: Wave 1 live 21 Sep"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Harga langsung tayang begitu disimpan dan kembali normal sendiri pada jam selesai.
                Tetap bisa dihentikan lebih awal lewat tombol <strong>Kembalikan Harga</strong>.
              </span>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setBaris([])} disabled={isSaving}>
                Kosongkan
              </Button>
              <Button onClick={simpan} disabled={isSaving} className="bg-gray-900 hover:bg-gray-800">
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Turunkan Harga
              </Button>
            </div>
          </>
        )}
      </Card>

      {/* ─── Daftar drop ─────────────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b">
          <h2 className="font-semibold text-gray-900">Daftar Price Drop</h2>
          <div className="flex gap-1">
            {(['active', 'scheduled', 'ended'] as PriceDropStatus[]).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={status === s ? 'default' : 'outline'}
                onClick={() => setStatus(s)}
              >
                {s === 'active' ? 'Berjalan' : s === 'scheduled' ? 'Terjadwal' : 'Selesai'}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : drops.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-12">Belum ada price drop di sini.</p>
        ) : (
          <div className="divide-y">
            {drops.map((d) => {
              const persen = Math.round(((d.basePrice - d.dropPrice) / d.basePrice) * 100);
              return (
                <div key={d.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{d.productName}</p>
                    <p className="text-xs text-gray-500">
                      {d.skuParent ?? '-'} · <span className="line-through">{rupiah(d.basePrice)}</span>{' '}
                      <strong className="text-gray-900">{rupiah(d.dropPrice)}</strong>{' '}
                      <span className="text-emerald-600">-{persen}%</span>
                    </p>
                    {d.note && <p className="text-xs text-gray-400 mt-0.5">{d.note}</p>}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      {d.isRunning ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-none">Berjalan</Badge>
                      ) : d.isActive ? (
                        <Badge className="bg-blue-100 text-blue-700 border-none">Terjadwal</Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">Selesai</Badge>
                      )}
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" /> {sisaWaktu(d.endAt)}
                      </p>
                    </div>

                    {d.isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => kembalikan(d)}
                        disabled={endingId === d.id}
                      >
                        {endingId === d.id ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <RotateCcw className="w-4 h-4 mr-1" />
                        )}
                        Kembalikan Harga
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
