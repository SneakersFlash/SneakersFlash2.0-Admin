'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Ticket, CalendarClock, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import VouchersService from '@/services/vouchers.service';
import PromoCampaignsService from '@/services/promo-campaigns.service';
import type { Voucher } from '@/types/voucher.types';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { getErrorMessage } from '@/lib/api';
import VoucherModal from '@/components/module/voucher/VoucherModal';

export default function CampaignVouchersPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<any>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

  const fetchCampaignData = async () => {
    try {
      setIsLoading(true);
      // Panggil API GET /campaigns/:id yang sudah include vouchers
      const campaignData = await PromoCampaignsService.getById(campaignId);
      setCampaign(campaignData);
      setVouchers(campaignData.vouchers || []);
    } catch (error) {
      toast.error('Gagal memuat data campaign: ' + getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (campaignId) {
      fetchCampaignData();
    }
  }, [campaignId]);

  const handleDelete = async (id: string | number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus voucher ini?')) return;
    try {
      await VouchersService.delete(id);
      toast.success('Voucher berhasil dihapus');
      fetchCampaignData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const toggleStatus = async (id: string | number, currentStatus: boolean) => {
    try {
      // Optimistic update
      setVouchers(vouchers.map(v => v.id === id ? { ...v, isActive: !currentStatus } : v));
      await VouchersService.update(id, { isActive: !currentStatus });
      toast.success('Status voucher diperbarui');
    } catch (error) {
      toast.error(getErrorMessage(error));
      fetchCampaignData(); // Revert jika gagal
    }
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  return (
    <div className="space-y-6">
      {/* Tombol Kembali & Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/dashboard/promo-campaigns')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <PageHeader 
            title={campaign ? `Voucher: ${campaign.name}` : 'Memuat Data...'} 
            description={campaign ? `Kelola voucher khusus untuk anggaran ${campaign.name}` : '...'}
            icon={Ticket}
            actions={
              <Button onClick={() => { setSelectedVoucher(null); setIsModalOpen(true); }} disabled={isLoading}>
                <Plus className="mr-2 h-4 w-4" /> Buat Voucher
              </Button>
            }
          />
        </div>
      </div>

      <Card className="p-0 overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 font-medium">Kode & Info Voucher</th>
                <th className="px-6 py-4 font-medium">Nilai Diskon</th>
                <th className="px-6 py-4 font-medium">Batas Waktu</th>
                <th className="px-6 py-4 font-medium text-center">Aktif?</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Memuat data voucher...</td></tr>
              ) : vouchers.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Belum ada voucher di kampanye ini.</td></tr>
              ) : (
                vouchers.map((voucher) => (
                  <tr key={voucher.id} className="hover:bg-gray-50/50 transition-colors">
                    
                    <td className="px-6 py-4 space-y-1">
                      <div className="font-bold text-gray-900 uppercase">{voucher.code}</div>
                      <div className="text-xs text-gray-500">{voucher.name}</div>
                      <div className="text-xs text-gray-400">Min. Belanja: {formatRupiah(Number(voucher.minPurchaseAmount))}</div>
                    </td>

                    <td className="px-6 py-4">
                      {voucher.discountType === 'percentage' ? (
                        <div>
                          <span className="font-bold text-blue-600">{voucher.discountValue}%</span>
                          {voucher.maxDiscountAmount && <div className="text-xs text-gray-500 mt-0.5">Maks: {formatRupiah(Number(voucher.maxDiscountAmount))}</div>}
                        </div>
                      ) : (
                        <span className="font-bold text-green-600">{formatRupiah(Number(voucher.discountValue))}</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-600 space-y-1">
                        <div className="flex items-center gap-1">
                          <CalendarClock className="w-3 h-3" />
                          {new Date(voucher.startAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short'})} 
                          {' - '} 
                          {new Date(voucher.expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short'})}
                        </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <Switch checked={voucher.isActive} onCheckedChange={() => toggleStatus(voucher.id, voucher.isActive)} />
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2 items-center">
                        <Button variant="outline" size="icon" className="h-8 w-8 text-blue-600" onClick={() => { setSelectedVoucher(voucher); setIsModalOpen(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(voucher.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <VoucherModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchCampaignData} 
        initialData={selectedVoucher}
        campaignId={campaignId} // <--- PASTIKAN INI DIKIRIM
      />
    </div>
  );
}