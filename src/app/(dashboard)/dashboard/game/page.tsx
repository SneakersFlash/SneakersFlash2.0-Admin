'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  RefreshCw, Trophy, Gamepad2, Users, Mail, CheckCircle2,
  Clock, Loader2, Zap, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  gameService,
  type GamePlayRow,
  type GamePrizeRow,
  type GameSummary,
  type GameWinnerRow,
  type UpdatePrizePayload,
} from '@/services/game.service';

// ─── Label ────────────────────────────────────────────────────────────────────

const OUTCOME_LABEL: Record<string, string> = {
  points:      'Dapat Poin',
  apparel_won: 'Menang Barang',
  already_won: 'Sudah Diambil Orang',
  no_prize:    'Tidak Sampai Puncak',
};

const OUTCOME_WARNA: Record<string, string> = {
  points:      'bg-emerald-100 text-emerald-700',
  apparel_won: 'bg-amber-100 text-amber-800',
  already_won: 'bg-slate-100 text-slate-600',
  no_prize:    'bg-slate-100 text-slate-500',
};

const KLAIM_LABEL: Record<string, string> = {
  pending_verification: 'Menunggu verifikasi email',
  verified:             'Terverifikasi, siap diserahkan',
  fulfilled:            'Sudah diserahkan',
  expired:              'Tautan kedaluwarsa',
};

const KLAIM_WARNA: Record<string, string> = {
  pending_verification: 'bg-amber-100 text-amber-800',
  verified:             'bg-blue-100 text-blue-700',
  fulfilled:            'bg-emerald-100 text-emerald-700',
  expired:              'bg-red-100 text-red-700',
};

const JENIS_LABEL: Record<string, string> = {
  points:  'Poin',
  apparel: 'Apparel',
  sneaker: 'Sepatu',
};

/**
 * Ubah ISO dari server jadi nilai untuk <input type="datetime-local">.
 *
 * Input itu tidak mengenal zona waktu - isinya selalu dibaca sebagai waktu
 * lokal browser. Admin ada di WIB dan servernya UTC, jadi konversinya harus
 * eksplisit di dua arah; kalau tidak, jadwal hadiah meleset 7 jam.
 */
function isoKeInputLokal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const geser = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return geser.toISOString().slice(0, 16);
}

function inputLokalKeIso(nilai: string): string | null {
  if (!nilai) return null;
  return new Date(nilai).toISOString();
}

function waktuSingkat(iso: string | null): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  });
}

// ─── Halaman ──────────────────────────────────────────────────────────────────

export default function GameDashboardPage() {
  const [tab, setTab] = useState<'log' | 'pemenang' | 'hadiah'>('log');
  const [summary, setSummary] = useState<GameSummary | null>(null);
  const [plays, setPlays] = useState<GamePlayRow[]>([]);
  const [winners, setWinners] = useState<GameWinnerRow[]>([]);
  const [prizes, setPrizes] = useState<GamePrizeRow[]>([]);
  const [filterOutcome, setFilterOutcome] = useState<string>('semua');
  const [cari, setCari] = useState('');
  const [memuat, setMemuat] = useState(true);
  const [menyimpan, setMenyimpan] = useState<string | null>(null);

  const muat = useCallback(async () => {
    setMemuat(true);
    try {
      const [s, p, w, h] = await Promise.all([
        gameService.summary(),
        gameService.plays({
          limit: 50,
          outcome: filterOutcome === 'semua' ? undefined : filterOutcome,
          q: cari || undefined,
        }),
        gameService.winners(),
        gameService.prizes(),
      ]);
      setSummary(s);
      setPlays(p.data);
      setWinners(w);
      setPrizes(h);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal memuat data game');
    } finally {
      setMemuat(false);
    }
  }, [filterOutcome, cari]);

  useEffect(() => { muat(); }, [muat]);

  const simpanHadiah = async (id: string, payload: UpdatePrizePayload) => {
    setMenyimpan(id);
    try {
      setPrizes(await gameService.updatePrize(id, payload));
      toast.success('Pengaturan hadiah tersimpan');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal menyimpan');
      muat();
    } finally {
      setMenyimpan(null);
    }
  };

  const serahkan = async (id: string) => {
    setMenyimpan(id);
    try {
      setWinners(await gameService.fulfillClaim(id));
      toast.success('Klaim ditandai sudah diserahkan');
      gameService.summary().then(setSummary).catch(() => {});
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal menandai klaim');
    } finally {
      setMenyimpan(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* ── Kepala ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Merdeka Game</h1>
          <p className="text-sm text-muted-foreground">
            The 17-Box Climb &middot; log pemain, pemenang, dan pengaturan hadiah roda.
          </p>
        </div>
        <Button variant="outline" onClick={muat} disabled={memuat}>
          <RefreshCw className={cn('mr-2 h-4 w-4', memuat && 'animate-spin')} />
          Muat Ulang
        </Button>
      </div>

      {/* ── Ringkasan ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KartuAngka
          ikon={<Gamepad2 className="h-4 w-4" />}
          judul="Main hari ini"
          nilai={summary?.mainHariIni ?? 0}
          catatan={`${summary?.totalMain ?? 0} ronde total`}
        />
        <KartuAngka
          ikon={<Users className="h-4 w-4" />}
          judul="Pemain unik"
          nilai={summary?.pemainUnik ?? 0}
          catatan={`${summary?.persenSampaiPuncak ?? 0}% sampai puncak`}
        />
        <KartuAngka
          ikon={<Trophy className="h-4 w-4" />}
          judul="Pemenang barang"
          nilai={summary?.klaim.total ?? 0}
          catatan={`${summary?.klaim.selesai ?? 0} sudah diserahkan`}
        />
        <KartuAngka
          ikon={<Zap className="h-4 w-4" />}
          judul="Poin dibagikan"
          nilai={(summary?.totalPoinDibagikan ?? 0).toLocaleString('id-ID')}
          catatan="Sudah masuk saldo pemain"
        />
      </div>

      {/* Klaim yang menunggu tindakan CS sengaja diangkat jadi peringatan
          sendiri - kalau cuma jadi angka di kartu, gampang terlewat. */}
      {(summary?.klaim.terverifikasi ?? 0) > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            <b>{summary?.klaim.terverifikasi}</b> pemenang sudah memverifikasi
            email dan menunggu hadiahnya diserahkan.
          </span>
        </div>
      )}

      {/* ── Tab ── */}
      <div className="flex gap-1 border-b">
        {([
          ['log', 'Log Permainan'],
          ['pemenang', 'Pemenang & Klaim'],
          ['hadiah', 'Pengaturan Hadiah'],
        ] as const).map(([id, judul]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition',
              tab === id
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {judul}
          </button>
        ))}
      </div>

      {memuat && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memuat...
        </div>
      )}

      {/* ── Log permainan ── */}
      {!memuat && tab === 'log' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Cari nama atau email pemain..."
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              className="max-w-xs"
            />
            <Select value={filterOutcome} onValueChange={setFilterOutcome}>
              <SelectTrigger className="w-[210px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua hasil</SelectItem>
                {Object.entries(OUTCOME_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabel kepala={['Pemain', 'Waktu', 'Boxes', 'Hasil', 'Hadiah', 'Kode klaim']}>
            {plays.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="px-3 py-2.5">
                  <div className="font-medium">{r.user.name ?? '-'}</div>
                  <div className="text-xs text-muted-foreground">{r.user.email}</div>
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {waktuSingkat(r.startedAt)}
                </td>
                <td className="px-3 py-2.5 tabular-nums">
                  {r.boxes}/17
                  {r.reachedTop && (
                    <CheckCircle2 className="ml-1 inline h-3.5 w-3.5 text-emerald-600" />
                  )}
                </td>
                <td className="px-3 py-2.5">
                  {r.outcome ? (
                    <Badge variant="secondary" className={OUTCOME_WARNA[r.outcome]}>
                      {OUTCOME_LABEL[r.outcome]}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">Belum selesai</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  {r.outcome === 'points'
                    ? `${r.pointsAwarded.toLocaleString('id-ID')} poin`
                    : (r.prize?.label ?? '-')}
                </td>
                <td className="px-3 py-2.5 font-mono text-xs">
                  {r.claim?.code ?? '-'}
                </td>
              </tr>
            ))}
            {plays.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
                Belum ada yang main.
              </td></tr>
            )}
          </Tabel>
        </div>
      )}

      {/* ── Pemenang ── */}
      {!memuat && tab === 'pemenang' && (
        <Tabel kepala={['Pemenang', 'Hadiah', 'Kode', 'Status', 'Email / verifikasi', 'Aksi']}>
          {winners.map((w) => (
            <tr key={w.id} className="border-b last:border-0">
              <td className="px-3 py-2.5">
                <div className="font-medium">{w.user.name ?? '-'}</div>
                <div className="text-xs text-muted-foreground">{w.user.email}</div>
                {w.user.phone && (
                  <div className="text-xs text-muted-foreground">{w.user.phone}</div>
                )}
              </td>
              <td className="px-3 py-2.5">{w.prize.label}</td>
              <td className="px-3 py-2.5 font-mono text-xs font-semibold">{w.code}</td>
              <td className="px-3 py-2.5">
                <Badge variant="secondary" className={KLAIM_WARNA[w.status]}>
                  {KLAIM_LABEL[w.status]}
                </Badge>
              </td>
              <td className="px-3 py-2.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {waktuSingkat(w.emailSentAt)}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {waktuSingkat(w.verifiedAt)}
                </div>
              </td>
              <td className="px-3 py-2.5">
                {w.status === 'verified' ? (
                  <Button
                    size="sm"
                    disabled={menyimpan === w.id}
                    onClick={() => serahkan(w.id)}
                  >
                    {menyimpan === w.id && (
                      <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                    )}
                    Tandai diserahkan
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </td>
            </tr>
          ))}
          {winners.length === 0 && (
            <tr><td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
              Belum ada pemenang hadiah barang.
            </td></tr>
          )}
        </Tabel>
      )}

      {/* ── Pengaturan hadiah ── */}
      {!memuat && tab === 'hadiah' && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Urutan juring mengikuti gambar roda di storefront: slot 0 tepat di
            bawah jarum, lalu bertambah searah jarum jam. Jangan menukar
            urutannya tanpa mengganti gambarnya juga.
          </p>
          {prizes.map((p) => (
            <BarisHadiah
              key={p.id}
              hadiah={p}
              menyimpan={menyimpan === p.id}
              onSimpan={(payload) => simpanHadiah(p.id, payload)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Bagian kecil ─────────────────────────────────────────────────────────────

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

function Tabel({
  kepala, children,
}: {
  kepala: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full min-w-[820px] text-sm">
        <thead className="border-b bg-muted/40">
          <tr>
            {kepala.map((h) => (
              <th
                key={h}
                className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

/**
 * Satu juring roda beserta pengaturannya.
 *
 * Isian angka dan tanggal ditahan di state lokal dan baru dikirim saat tombol
 * Simpan ditekan; sakelar sebaliknya langsung dikirim, karena itu yang dipakai
 * admin saat buru-buru ("matikan hadiah ini sekarang").
 */
function BarisHadiah({
  hadiah, menyimpan, onSimpan,
}: {
  hadiah: GamePrizeRow;
  menyimpan: boolean;
  onSimpan: (payload: UpdatePrizePayload) => void;
}) {
  const [bobot, setBobot] = useState(String(hadiah.weight));
  const [stok, setStok] = useState(String(hadiah.stock));
  const [dari, setDari] = useState(isoKeInputLokal(hadiah.winnableFrom));
  const [sampai, setSampai] = useState(isoKeInputLokal(hadiah.winnableUntil));

  // Setelah server menjawab, isian di layar disamakan lagi dengan yang benar
  // tersimpan - supaya tidak ada kotak yang diam-diam berbeda dari database.
  useEffect(() => {
    setBobot(String(hadiah.weight));
    setStok(String(hadiah.stock));
    setDari(isoKeInputLokal(hadiah.winnableFrom));
    setSampai(isoKeInputLokal(hadiah.winnableUntil));
  }, [hadiah]);

  const bisaMenang =
    !hadiah.isGimmick && hadiah.stock > 0 && hadiah.kind !== 'points';

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
              slot {hadiah.slotIndex}
            </span>
            <Badge variant="outline">{JENIS_LABEL[hadiah.kind]}</Badge>
            {hadiah.isGimmick && (
              <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                Pajangan
              </Badge>
            )}
            {hadiah.kind !== 'points' && !hadiah.isGimmick && (
              <Badge
                variant="secondary"
                className={bisaMenang
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'}
              >
                {bisaMenang ? 'Bisa dimenangkan' : 'Habis'}
              </Badge>
            )}
          </div>
          <div className="mt-1 font-medium">{hadiah.label}</div>
          <div className="text-xs text-muted-foreground">
            Peluang {hadiah.peluangPersen}% &middot; sudah dimenangkan{' '}
            {hadiah.sudahDimenangkan}x
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Sakelar
            label="Aktif"
            nilai={hadiah.isActive}
            onUbah={(v) => onSimpan({ isActive: v })}
          />
          {hadiah.kind !== 'points' && (
            <>
              <Sakelar
                label="Pajangan"
                nilai={hadiah.isGimmick}
                onUbah={(v) => onSimpan({ isGimmick: v })}
              />
              <Sakelar
                label="Menangkan berikutnya"
                nilai={hadiah.forceNextWin}
                onUbah={(v) => onSimpan({ forceNextWin: v })}
              />
            </>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Isian label="Bobot undian" nilai={bobot} onUbah={setBobot} tipe="number" />
        {hadiah.kind !== 'points' && (
          <>
            <Isian label="Sisa stok" nilai={stok} onUbah={setStok} tipe="number" />
            <Isian
              label="Bisa menang dari (WIB)"
              nilai={dari}
              onUbah={setDari}
              tipe="datetime-local"
            />
            <Isian
              label="Sampai (WIB)"
              nilai={sampai}
              onUbah={setSampai}
              tipe="datetime-local"
            />
          </>
        )}
        <div className="flex items-end">
          <Button
            size="sm"
            disabled={menyimpan}
            onClick={() =>
              onSimpan({
                weight: Number(bobot),
                ...(hadiah.kind !== 'points'
                  ? {
                      stock: Number(stok),
                      winnableFrom: inputLokalKeIso(dari),
                      winnableUntil: inputLokalKeIso(sampai),
                    }
                  : {}),
              })
            }
          >
            {menyimpan && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
            Simpan
          </Button>
        </div>
      </div>

      {hadiah.forceNextWin && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Pemain berikutnya yang sampai puncak dipastikan mendarat di juring ini.
          Sakelarnya mati sendiri begitu terpakai.
        </p>
      )}
    </div>
  );
}

function Sakelar({
  label, nilai, onUbah,
}: {
  label: string;
  nilai: boolean;
  onUbah: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-medium">
      <Switch checked={nilai} onCheckedChange={onUbah} />
      {label}
    </label>
  );
}

function Isian({
  label, nilai, onUbah, tipe,
}: {
  label: string;
  nilai: string;
  onUbah: (v: string) => void;
  tipe: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <Input type={tipe} value={nilai} onChange={(e) => onUbah(e.target.value)} />
    </label>
  );
}
