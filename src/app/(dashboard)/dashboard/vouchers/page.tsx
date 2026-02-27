'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Ticket, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import VouchersService from '@/services/vouchers.service';
import CampaignsService from '@/services/campaigns.service';
import type { Voucher } from '@/types/voucher.types';
import type { CampaignEvent } from '@/types/campaign.types';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { getErrorMessage } from '@/lib/api';
import VoucherModal from '@/components/module/voucher/VoucherModal';

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [vouchersData, campaignsData] = await Promise.all([
        VouchersService.getAll(),
        CampaignsService.getAllAdmin()
      ]);
      setVouchers(vouchersData);
      setCampaigns(campaignsData);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string | number) => {
    if (!confirm('Apakah kamu yakin ingin menghapus voucher ini?')) return;
    try {
      await VouchersService.delete(id);
      toast.success('Voucher berhasil dihapus');
      fetchData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const toggleStatus = async (id: string | number, currentStatus: boolean) => {
    try {
      setVouchers(vouchers.map(v => v.id === id ? { ...v, isActive: !currentStatus } : v));
      await VouchersService.update(id, { isActive: !currentStatus });
      toast.success('Status voucher diperbarui');
    } catch (error) {
      toast.error(getErrorMessage(error));
      fetchData(); 
    }
  };

  const formatDiscount = (type: string, value: number) => {
    if (type === 'percentage') return `${value}% OFF`;
    if (type === 'free_shipping') return 'Gratis Ongkir';
    return `Rp ${value.toLocaleString('id-ID')}`;
  };

  const getStatusBadge = (start: string, end: string) => {
    const now = new Date().getTime();
    if (now < new Date(start).getTime()) return <Badge className="bg-yellow-500">Akan Datang</Badge>;
    if (now > new Date(end).getTime()) return <Badge className="bg-gray-400">Kedaluwarsa</Badge>;
    return <Badge className="bg-green-500">Berlaku</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Manajemen Voucher" 
        description="Kelola kode promo dan diskon untuk pelanggan."
        icon={Ticket}
        actions={
          <Button onClick={() => { setSelectedVoucher(null); setIsModalOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Buat Voucher
          </Button>
        }
      />

      <Card className="p-0 overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 font-medium">Info Voucher</th>
                <th className="px-6 py-4 font-medium">Nilai Diskon</th>
                <th className="px-6 py-4 font-medium text-center">Periode & Status</th>
                <th className="px-6 py-4 font-medium text-center">Aktif?</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Memuat data voucher...</td></tr>
              ) : vouchers.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Belum ada voucher.</td></tr>
              ) : (
                vouchers.map((voucher) => {
                  // Mencari nama kampanye yang terkait
                  const camp = campaigns.find(c => String(c.id) === String(voucher.campaignId));

                  return (
                  <tr key={voucher.id} className="hover:bg-gray-50/50 transition-colors">
                    
                    <td className="px-6 py-4 space-y-1">
                      <div className="font-bold text-gray-900 font-mono tracking-wider text-base">{voucher.code}</div>
                      <div className="text-sm font-medium text-gray-700">{voucher.name}</div>
                      <div className="text-xs text-blue-600 font-medium bg-blue-50 inline-block px-2 py-0.5 rounded">
                        Camp: {camp ? camp.title : 'Tidak Diketahui'}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-bold text-emerald-600 text-lg">
                        {formatDiscount(voucher.discountType, voucher.discountValue)}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-1">
                        Min. Belanja: Rp {Number(voucher.minPurchaseAmount).toLocaleString('id-ID')}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center space-y-2">
                       {getStatusBadge(voucher.startAt, voucher.expiresAt)}
                       <div className="flex items-center justify-center gap-1 text-[11px] text-gray-500">
                         <CalendarClock className="w-3 h-3" />
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
                )})
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <VoucherModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchData} 
        initialData={selectedVoucher}
        campaigns={campaigns}
      />
    </div>
  );
}