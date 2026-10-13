'use client';

import { CalendarDays, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DateRange {
  from: string; // "YYYY-MM-DD", kosong = tanpa batas
  to: string;
}

export type DatePreset = 'all' | 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'custom';

const PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'all',       label: 'Semua' },
  { value: 'today',     label: 'Hari ini' },
  { value: 'yesterday', label: 'Kemarin' },
  { value: '7d',        label: '7 hari' },
  { value: '30d',       label: '30 hari' },
  { value: 'month',     label: 'Bulan ini' },
  { value: 'custom',    label: 'Pilih tanggal' },
];

// Tanggal hari ini menurut WIB, bukan zona browser — backend juga membaca
// rentang sebagai hari kalender WIB.
function todayWib(): Date {
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function toYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function shiftDays(d: Date, days: number): Date {
  const n = new Date(d);
  n.setUTCDate(n.getUTCDate() + days);
  return n;
}

export function rangeForPreset(preset: DatePreset): DateRange {
  const today = todayWib();
  switch (preset) {
    case 'today':     return { from: toYmd(today), to: toYmd(today) };
    case 'yesterday': return { from: toYmd(shiftDays(today, -1)), to: toYmd(shiftDays(today, -1)) };
    case '7d':        return { from: toYmd(shiftDays(today, -6)), to: toYmd(today) };
    case '30d':       return { from: toYmd(shiftDays(today, -29)), to: toYmd(today) };
    case 'month':     return { from: `${toYmd(today).slice(0, 8)}01`, to: toYmd(today) };
    default:          return { from: '', to: '' };
  }
}

export function formatRangeLabel({ from, to }: DateRange): string {
  const fmt = (ymd: string) =>
    new Date(`${ymd}T00:00:00Z`).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
    });
  if (from && to) return from === to ? fmt(from) : `${fmt(from)} – ${fmt(to)}`;
  if (from) return `Sejak ${fmt(from)}`;
  if (to) return `Sampai ${fmt(to)}`;
  return 'Semua tanggal';
}

interface DateRangeFilterProps {
  preset: DatePreset;
  range: DateRange;
  onChange: (preset: DatePreset, range: DateRange) => void;
  className?: string;
}

export default function DateRangeFilter({ preset, range, onChange, className }: DateRangeFilterProps) {
  const invalid = !!range.from && !!range.to && range.from > range.to;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mr-1">
          <CalendarDays className="w-3.5 h-3.5" aria-hidden />
          Tanggal pesanan
        </span>
        <div role="radiogroup" aria-label="Rentang tanggal" className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => {
            const active = preset === p.value;
            return (
              <button
                key={p.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() =>
                  onChange(p.value, p.value === 'custom' ? range : rangeForPreset(p.value))
                }
                className={cn(
                  'h-8 px-3 rounded-full text-xs font-medium border transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1',
                  active
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50',
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {preset === 'custom' && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-gray-500">
            Dari
            <input
              type="date"
              value={range.from}
              max={range.to || undefined}
              onChange={(e) => onChange('custom', { ...range, from: e.target.value })}
              className="h-8 rounded-md border border-gray-200 bg-gray-50 px-2 text-xs text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-gray-500">
            s/d
            <input
              type="date"
              value={range.to}
              min={range.from || undefined}
              onChange={(e) => onChange('custom', { ...range, to: e.target.value })}
              className="h-8 rounded-md border border-gray-200 bg-gray-50 px-2 text-xs text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            />
          </label>
          {(range.from || range.to) && (
            <button
              type="button"
              onClick={() => onChange('all', { from: '', to: '' })}
              className="flex items-center gap-1 h-8 px-2 text-xs text-gray-400 hover:text-gray-700"
            >
              <X className="w-3 h-3" aria-hidden /> Reset
            </button>
          )}
          {invalid && (
            <span role="alert" className="text-xs text-red-600">
              Tanggal awal lebih besar dari tanggal akhir.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
