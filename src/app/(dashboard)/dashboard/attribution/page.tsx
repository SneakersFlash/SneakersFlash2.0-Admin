'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, MousePointerClick, ShoppingCart, CheckCircle2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  attributionService,
  type AttributionReport,
} from '@/services/attribution.service';

const SEMUA = '__semua__';

const rupiah = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;

/** Persen order terjual per kunjungan; "-" kalau kunjungannya nol. */
function konversi(terjual: number, kunjungan: number) {
  if (!kunjungan) return '-';
  return `${((terjual / kunjungan) * 100).toFixed(1)}%`;
}

export default function AttributionPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [campaign, setCampaign] = useState(SEMUA);
  const [data, setData] = useState<AttributionReport | null>(null);
  const [memuat, setMemuat] = useState(true);

  const muat = useCallback(async () => {
    setMemuat(true);
    try {
      setData(
        await attributionService.report({
          from: from || undefined,
          to: to || undefined,
          campaign: campaign === SEMUA ? undefined : campaign,
        }),
      );
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setMemuat(false);
    }
  }, [from, to, campaign]);

  useEffect(() => {
    muat();
  }, [muat]);

  const total = data?.total;

  return (
    <div className="space-y-6 p-6">
      {/* ── Kepala ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tracking KOL / UTM</h1>
          <p className="text-sm text-muted-foreground">
            Kunjungan dan penjualan per link ber-UTM. Order dihitung dari klik terakhir
            dalam 30 hari sebelum checkout.
          </p>
        </div>
        <Button variant="outline" onClick={muat} disabled={memuat}>
          <RefreshCw className={cn('mr-2 h-4 w-4', memuat && 'animate-spin')} />
          Muat Ulang
        </Button>
      </div>

      {/* ── Filter ── */}
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Dari</span>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Sampai</span>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Campaign</span>
          <Select value={campaign} onValueChange={setCampaign}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SEMUA}>Semua campaign</SelectItem>
              {data?.campaigns.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>

      {/* ── Ringkasan ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KartuAngka
          ikon={<MousePointerClick className="h-4 w-4" />}
          judul="Kunjungan"
          nilai={(total?.visits ?? 0).toLocaleString('id-ID')}
          catatan="Sesi yang mendarat lewat link UTM"
        />
        <KartuAngka
          ikon={<ShoppingCart className="h-4 w-4" />}
          judul="Order dibuat"
          nilai={(total?.orders ?? 0).toLocaleString('id-ID')}
          catatan="Termasuk yang belum / batal bayar"
        />
        <KartuAngka
          ikon={<CheckCircle2 className="h-4 w-4" />}
          judul="Order terjual"
          nilai={(total?.paidOrders ?? 0).toLocaleString('id-ID')}
          catatan={`Konversi ${konversi(total?.paidOrders ?? 0, total?.visits ?? 0)}`}
        />
        <KartuAngka
          ikon={<Wallet className="h-4 w-4" />}
          judul="Omzet"
          nilai={rupiah(total?.revenue ?? 0)}
          catatan="Dari order terjual"
        />
      </div>

      {/* ── Tabel per link ── */}
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              {['KOL / Content', 'Source', 'Medium', 'Campaign', 'Kunjungan', 'Order', 'Terjual', 'Konversi', 'Omzet'].map((h, i) => (
                <th
                  key={h}
                  className={cn(
                    'px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground',
                    i >= 4 ? 'text-right' : 'text-left',
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.rows.map((r) => (
              <tr
                key={[r.utmSource, r.utmMedium, r.utmCampaign, r.utmContent].join('|')}
                className="border-b last:border-0"
              >
                <td className="px-3 py-2.5 font-semibold">{r.utmContent ?? <span className="text-muted-foreground">-</span>}</td>
                <td className="px-3 py-2.5">{r.utmSource ?? '-'}</td>
                <td className="px-3 py-2.5">{r.utmMedium ?? '-'}</td>
                <td className="px-3 py-2.5">{r.utmCampaign ?? '-'}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{r.visits.toLocaleString('id-ID')}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{r.orders.toLocaleString('id-ID')}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{r.paidOrders.toLocaleString('id-ID')}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{konversi(r.paidOrders, r.visits)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{rupiah(r.revenue)}</td>
              </tr>
            ))}
            {!memuat && !data?.rows.length && (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center text-muted-foreground">
                  Belum ada kunjungan lewat link UTM di rentang ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KartuAngka({
  ikon, judul, nilai, catatan,
}: {
  ikon: React.ReactNode;
  judul: string;
  nilai: number | string;
  catatan: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {ikon} {judul}
      </div>
      <div className="mt-1.5 text-2xl font-bold tabular-nums">{nilai}</div>
      <div className="text-xs text-muted-foreground">{catatan}</div>
    </div>
  );
}
