'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Search, CalendarClock, Hash, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import PaymentsService from '@/services/payments.service';
import type { PaymentLog, TransactionStatus } from '@/types/payment.types';
import PageHeader from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { getErrorMessage } from '@/lib/api';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const data = await PaymentsService.getAll();
      setPayments(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Filter lokal (karena ini log, kadang admin butuh search cepat berdasar Order ID atau TX ID)
  const filteredPayments = payments.filter(p => 
    p.transactionId?.toLowerCase().includes(search.toLowerCase()) ||
    String(p.orderId).toLowerCase().includes(search.toLowerCase()) ||
    p.order?.orderNumber?.toLowerCase().includes(search.toLowerCase())
  );

  // Helper Warna Status
  const getStatusBadge = (status: TransactionStatus) => {
    const config: Record<string, { label: string, color: string }> = {
      settlement: { label: 'Settlement (Lunas)', color: 'bg-green-100 text-green-700' },
      capture: { label: 'Capture (Berhasil)', color: 'bg-green-100 text-green-700' },
      pending: { label: 'Pending (Menunggu)', color: 'bg-yellow-100 text-yellow-700' },
      expire: { label: 'Expired (Kedaluwarsa)', color: 'bg-gray-100 text-gray-700' },
      cancel: { label: 'Canceled (Batal)', color: 'bg-red-100 text-red-700' },
      deny: { label: 'Denied (Ditolak)', color: 'bg-red-100 text-red-700' },
      failure: { label: 'Failed (Gagal)', color: 'bg-red-100 text-red-700' },
      refund: { label: 'Refunded', color: 'bg-purple-100 text-purple-700' },
    };

    const style = config[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
    return <Badge variant="outline" className={`border-none ${style.color}`}>{style.label}</Badge>;
  };

  // Helper Format Nama Pembayaran
  const formatPaymentType = (type: string) => {
    if (!type) return '-';
    const map: Record<string, string> = {
      bank_transfer: 'Bank Transfer (VA)',
      gopay: 'GoPay',
      qris: 'QRIS',
      credit_card: 'Kartu Kredit',
      echannel: 'Mandiri Bill',
      cstore: 'Indomaret / Alfamart',
    };
    return map[type] || type.replace('_', ' ').toUpperCase();
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Log Pembayaran" 
        description="Pantau riwayat transaksi masuk dari Payment Gateway (Midtrans)."
        icon={CreditCard}
      />

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Cari ID Transaksi Midtrans atau Order ID..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-9" 
          />
        </div>
      </div>

      <Card className="p-0 overflow-hidden border border-gray-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium">Transaksi & Waktu</th>
                <th className="px-6 py-4 font-medium">Order ID (Internal)</th>
                <th className="px-6 py-4 font-medium">Metode</th>
                <th className="px-6 py-4 font-medium text-right">Gross Amount</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Memuat log pembayaran...</td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Tidak ada log pembayaran ditemukan.</td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                    
                    <td className="px-6 py-4 space-y-1">
                      <div className="font-bold text-gray-900 font-mono flex items-center">
                        <Hash className="w-3 h-3 text-gray-400 mr-1" />
                        {payment.transactionId || '-'}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center">
                        <CalendarClock className="w-3 h-3 mr-1 text-gray-400" />
                        {new Date(payment.createdAt).toLocaleString('id-ID', {
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-800">
                        {payment.order?.orderNumber || payment.orderId || '-'}
                      </div>
                      {payment.order?.user?.name && (
                        <div className="text-xs text-gray-500">{payment.order.user.name}</div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="bg-gray-100 text-gray-700 font-medium">
                        {formatPaymentType(payment.paymentType)}
                      </Badge>
                      {payment.fraudStatus && payment.fraudStatus !== 'accept' && (
                        <div className="mt-1 flex items-center text-[10px] text-red-600 font-bold">
                          <ShieldAlert className="w-3 h-3 mr-1" /> Fraud: {payment.fraudStatus.toUpperCase()}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-emerald-600 text-base">
                        Rp {Number(payment.grossAmount || 0).toLocaleString('id-ID')}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(payment.transactionStatus)}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}