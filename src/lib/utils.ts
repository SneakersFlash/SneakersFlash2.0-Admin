import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

// ─── Tailwind class merging ───────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency ─────────────────────────────────────────────────────────────────

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function parseCurrency(value: string): number {
  return parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
}

// ─── Dates ────────────────────────────────────────────────────────────────────

export function formatDate(
  dateString: string,
  fmt = 'dd MMM yyyy, HH:mm',
): string {
  try {
    return format(new Date(dateString), fmt, { locale: idLocale });
  } catch {
    return '-';
  }
}

export function formatRelativeDate(dateString: string): string {
  try {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: idLocale,
    });
  } catch {
    return '-';
  }
}

// ─── Numbers ─────────────────────────────────────────────────────────────────

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}

export function formatPercent(num: number, decimals = 1): string {
  return `${num.toFixed(decimals)}%`;
}

// ─── Strings ─────────────────────────────────────────────────────────────────

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

// ─── File utils ───────────────────────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function getImageUrl(path?: string | null): string {
  if (!path) return '/placeholder-product.png';
  if (path.startsWith('http')) return path;
  return `${process.env.NEXT_PUBLIC_API_URL ?? ''}/${path}`;
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

export function generateOrderNumber(): string {
  return `SF-${Date.now()}`;
}

export function parseSearchParams(
  params: URLSearchParams,
): Record<string, string> {
  return Object.fromEntries(params.entries());
}
