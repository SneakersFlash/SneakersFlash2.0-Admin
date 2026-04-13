'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Wallet, CalendarClock, PaintBucket } from 'lucide-react';
import { toast } from 'sonner';
import PromoCampaignsService from '@/services/promo-campaigns.service';
import type { PromoCampaign } from '@/types/marketing.types';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { getErrorMessage } from '@/lib/api';
import PromoCampaignModal from '@/components/module/promo-campaign/PromoCampaignModal';
import { useRouter } from 'next/navigation';

export default function PromoCampaignsPage() {
    const router = useRouter();
    
  const [campaigns, setCampaigns] = useState<PromoCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<PromoCampaign | null>(null);

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      const data = await PromoCampaignsService.getAll();
      setCampaigns(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus kampanye anggaran ini? Voucher yang terhubung mungkin akan bermasalah.')) return;
    try {
      await PromoCampaignsService.delete(id);
      toast.success('Kampanye berhasil dihapus');
      fetchCampaigns();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      setCampaigns(campaigns.map(c => c.id === id ? { ...c, isActive: !currentStatus } : c));
      await PromoCampaignsService.update(id, { isActive: !currentStatus });
      toast.success('Status kampanye diperbarui');
    } catch (error) {
      toast.error(getErrorMessage(error));
      fetchCampaigns(); 
    }
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Anggaran Kampanye (Budgeting)" 
        description="Kelola alokasi budget untuk promosi dan voucher diskon."
        icon={Wallet}
        actions={
          <Button onClick={() => { setSelectedCampaign(null); setIsModalOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Buat Anggaran
          </Button>
        }
      />

      <Card className="p-0 overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 font-medium">Nama Kampanye</th>
                <th className="px-6 py-4 font-medium text-center">Periode</th>
                <th className="px-6 py-4 font-medium">Pemakaian Budget</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Memuat data anggaran...</td></tr>
              ) : campaigns.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Belum ada anggaran kampanye.</td></tr>
              ) : (
                campaigns.map((camp) => {
                  const limit = camp.totalBudgetLimit || 0;
                  const used = camp.totalUsedBudget || 0;
                  const percent = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
                  const isUnlimited = limit === 0;

                  return (
                    <tr key={camp.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{camp.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{camp.description || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center justify-center gap-1 text-xs text-gray-600">
                           <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                             <CalendarClock className="w-3 h-3" />
                             {new Date(camp.startAt).toLocaleDateString('id-ID')} - {new Date(camp.endAt).toLocaleDateString('id-ID')}
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-red-600">{formatRupiah(used)}</span>
                            <span className="text-gray-500">{isUnlimited ? 'Unlimited' : formatRupiah(limit)}</span>
                          </div>
                          {!isUnlimited && (
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${percent > 80 ? 'bg-red-500' : 'bg-green-500'}`} 
                                style={{ width: `${percent}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Switch checked={camp.isActive} onCheckedChange={() => toggleStatus(camp.id, camp.isActive)} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-orange-600 border-orange-200 hover:bg-orange-50" 
                                onClick={() => router.push(`/dashboard/promo-campaigns/${camp.id}/vouchers`)}
                                >
                                <PaintBucket className="h-4 w-4 mr-1" /> Voucher
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8 text-blue-600" onClick={() => { setSelectedCampaign(camp); setIsModalOpen(true); }}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(camp.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <PromoCampaignModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchCampaigns} 
        initialData={selectedCampaign} 
      />
    </div>
  );
}