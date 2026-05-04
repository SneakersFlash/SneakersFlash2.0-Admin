'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  CreditCard, Search, CalendarClock, Hash, ShieldAlert,
  ChevronLeft, ChevronRight, Download, Loader2, User,
} from 'lucide-react';
import { toast } from 'sonner';
import PaymentsService from '@/services/payments.service';
import type { PaymentLog, PaymentLogMeta, TransactionStatus } from '@/types/payment.types';
import PageHeader from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { getErrorMessage } from '@/lib/api';

const TRANSACTION_STATUS_OPTIONS = [
  { value: 'ALL',        label: 'Semua Status' },
  { value: 'settlement', label: 'Settlement (Lunas)' },
  { value: 'capture',    label: 'Capture (Berhasil)' },
  { value: 'pending',    label: 'Pending (Menunggu)' },
  { value: 'expire',     label: 'Expired (Kedaluwarsa)' },
  { value: 'cancel',     label: 'Canceled (Batal)' },
  { value: 'deny',       label: 'Denied (Ditolak)' },
  { value: 'failure',    label: 'Failed (Gagal)' },
  { value: 'refund',     label: 'Refunded' },
];

const PAYMENT_TYPE_OPTIONS = [
  { value: 'ALL',          label: 'Semua Metode' },
  { value: 'bank_transfer', label: 'Bank Transfer (VA)' },
  { value: 'gopay',        label: 'GoPay' },
  { value: 'qris',         label: 'QRIS' },
  { value: 'credit_card',  label: 'Kartu Kredit' },
  { value: 'echannel',     label: 'Mandiri Bill' },
  { value: 'cstore',       label: 'Indomaret / Alfamart' },
];

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  settlement: { label: 'Settlement (Lunas)',      color: 'bg-green-100 text-green-700' },
  capture:    { label: 'Capture (Berhasil)',       color: 'bg-green-100 text-green-700' },
  pending:    { label: 'Pending (Menunggu)',        color: 'bg-yellow-100 text-yellow-700' },
  expire:     { label: 'Expired (Kedaluwarsa)',    color: 'bg-gray-100 text-gray-700' },
  cancel:     { label: 'Canceled (Batal)',         color: 'bg-red-100 text-red-700' },
  deny:       { label: 'Denied (Ditolak)',         color: 'bg-red-100 text-red-700' },
  failure:    { label: 'Failed (Gagal)',           color: 'bg-red-100 text-red-700' },
  refund:     { label: 'Refunded',                color: 'bg-purple-100 text-purple-700' },
};

const PAYMENT_TYPE_LABEL: Record<string, string> = {
  bank_transfer: 'Bank Transfer (VA)',
  gopay:         'GoPay',
  qris:          'QRIS',
  credit_card:   'Kartu Kredit',
  echannel:      'Mandiri Bill',
  cstore:        'Indomaret / Alfamart',
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentLog[]>([]);
  const [meta, setMeta] = useState<PaymentLogMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [paymentType, setPaymentType] = useState('ALL');

  const [exportDateFrom, setExportDateFrom] = useState('');
  const [exportDateTo, setExportDateTo]     = useState('');
  const [exporting, setExporting]           = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 500);
    return () => clearTimeout(t);
  }, [search]);

  const fetchPayments = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await PaymentsService.getAll({
        page,
        limit: 20,
        search:      debouncedSearch || undefined,
        status:      status !== 'ALL' ? status : undefined,
        paymentType: paymentType !== 'ALL' ? paymentType : undefined,
      });
      setPayments(res.data);
      setMeta(res.meta);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, status, paymentType]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const handleExport = async () => {
    try {
      setExporting(true);
      await PaymentsService.exportLogs({
        search:      debouncedSearch || undefined,
        status:      status !== 'ALL' ? status : undefined,
        paymentType: paymentType !== 'ALL' ? paymentType : undefined,
        dateFrom:    exportDateFrom || undefined,
        dateTo:      exportDateTo   || undefined,
      });
      toast.success('File CSV berhasil diunduh!');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Log Pembayaran"
        description="Pantau riwayat transaksi masuk dari Payment Gateway (Midtrans)."
        icon={CreditCard}
      />

      {/* Filter & Export Bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 flex flex-col gap-3">

          {/* Row 1: Search + Status + Payment Type */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari No. Order, ID Transaksi, atau Nama..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-gray-50 border-gray-200 focus-visible:ring-indigo-500"
              />
            </div>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-52 bg-gray-50 border-gray-200">
                <SelectValue placeholder="Status Transaksi" />
              </SelectTrigger>
              <SelectContent>
                {TRANSACTION_STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={paymentType} onValueChange={(v) => { setPaymentType(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-48 bg-gray-50 border-gray-200">
                <SelectValue placeholder="Metode Pembayaran" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Row 2: Export controls */}
          <div className="flex flex-wrap gap-2 items-center border-t border-gray-100 pt-3">
            <span className="text-xs font-medium text-gray-500 mr-1">Export CSV:</span>
            <div className="flex items-center gap-1">
              <label className="text-xs text-gray-500 shrink-0">Dari</label>
              <Input
                type="date"
                value={exportDateFrom}
                onChange={(e) => setExportDateFrom(e.target.value)}
                className="h-8 text-xs w-36 bg-gray-50 border-gray-200"
              />
            </div>
            <div className="flex items-center gap-1">
              <label className="text-xs text-gray-500 shrink-0">s/d</label>
              <Input
                type="date"
                value={exportDateTo}
                onChange={(e) => setExportDateTo(e.target.value)}
                className="h-8 text-xs w-36 bg-gray-50 border-gray-200"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exporting}
              className="h-8 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800"
            >
              {exporting
                ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Mengekspor...</>
                : <><Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV</>
              }
            </Button>
            {(exportDateFrom || exportDateTo) && (
              <button
                onClick={() => { setExportDateFrom(''); setExportDateTo(''); }}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Reset tanggal
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <Card className="p-0 overflow-hidden border border-gray-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium">Transaksi & Waktu</th>
                <th className="px-6 py-4 font-medium">Pelanggan & Pesanan</th>
                <th className="px-6 py-4 font-medium">Metode</th>
                <th className="px-6 py-4 font-medium text-right">Gross Amount</th>
                <th className="px-6 py-4 font-medium text-center">Status Transaksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Memuat log pembayaran...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Tidak ada log pembayaran ditemukan.
                  </td>
                </tr>
              ) : (
                payments.map((payment) => {
                  const statusConf = STATUS_BADGE[payment.transactionStatus] ?? {
                    label: payment.transactionStatus,
                    color: 'bg-gray-100 text-gray-700',
                  };
                  return (
                    <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">

                      <td className="px-6 py-4 space-y-1">
                        <div className="font-bold text-gray-900 font-mono flex items-center text-xs">
                          <Hash className="w-3 h-3 text-gray-400 mr-1 shrink-0" />
                          {payment.transactionId || '-'}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <CalendarClock className="w-3 h-3 mr-1 text-gray-400 shrink-0" />
                          {new Date(payment.createdAt).toLocaleString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </div>
                      </td>

                      <td className="px-6 py-4 space-y-1">
                        <div className="font-semibold text-gray-900 font-mono text-xs">
                          #{payment.orderNumber}
                        </div>
                        <div className="text-xs text-gray-700 flex items-center">
                          <User className="w-3 h-3 mr-1 text-gray-400 shrink-0" />
                          {payment.customerName}
                        </div>
                        <div className="text-xs text-gray-400">{payment.customerEmail}</div>
                      </td>

                      <td className="px-6 py-4">
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700 font-medium">
                          {PAYMENT_TYPE_LABEL[payment.paymentType] ?? payment.paymentType?.replace('_', ' ').toUpperCase() ?? '-'}
                        </Badge>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="font-bold text-emerald-600 text-base">
                          Rp {Number(payment.grossAmount ?? 0).toLocaleString('id-ID')}
                        </div>
                        {payment.finalAmount !== payment.grossAmount && (
                          <div className="text-xs text-gray-400">
                            Final: Rp {Number(payment.finalAmount).toLocaleString('id-ID')}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <Badge variant="outline" className={`border-none ${statusConf.color}`}>
                          {statusConf.label}
                        </Badge>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-sm text-gray-500">
              Halaman {meta.page} dari {meta.totalPages}
              <span className="ml-2 text-gray-400">({meta.total} log)</span>
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={meta.page <= 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={meta.page >= meta.totalPages}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
