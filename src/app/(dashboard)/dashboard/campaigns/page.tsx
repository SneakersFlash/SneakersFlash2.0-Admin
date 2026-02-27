'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Megaphone, CalendarClock, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import CampaignsService from '@/services/campaigns.service';
import type { CampaignEvent } from '@/types/marketing.types';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { getErrorMessage } from '@/lib/api';
import CampaignModal from '@/components/module/campaign/CampaignModal';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignEvent | null>(null);

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      const data = await CampaignsService.getAllAdmin();
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

  const handleDelete = async (id: string | number) => {
    if (!confirm('Apakah kamu yakin ingin menghapus kampanye ini? Semua produk di dalamnya juga akan terhapus dari daftar flash sale.')) return;
    try {
      await CampaignsService.delete(id);
      toast.success('Kampanye berhasil dihapus');
      fetchCampaigns();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const toggleStatus = async (id: string | number, currentStatus: boolean) => {
    try {
      setCampaigns(campaigns.map(c => c.id === id ? { ...c, isActive: !currentStatus } : c));
      await CampaignsService.update(id, { isActive: !currentStatus });
      toast.success('Status kampanye diperbarui');
    } catch (error) {
      toast.error(getErrorMessage(error));
      fetchCampaigns(); 
    }
  };

  // Logic untuk mengecek apakah Flash Sale Sedang Berjalan / Segera Hadir / Selesai
  const getEventStatus = (start: string, end: string) => {
    const now = new Date().getTime();
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();

    if (now < startTime) return <Badge className="bg-yellow-500 text-white">Segera Hadir</Badge>;
    if (now > endTime) return <Badge className="bg-gray-400 text-white">Selesai</Badge>;
    return <Badge className="bg-green-500 text-white animate-pulse">Sedang Berjalan</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Manajemen Kampanye (Events)" 
        description="Kelola jadwal Flash Sale, event promo, dan batas waktunya."
        icon={Megaphone}
        actions={
          <Button onClick={() => { setSelectedCampaign(null); setIsModalOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Buat Kampanye
          </Button>
        }
      />

      <Card className="p-0 overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 font-medium">Info Kampanye</th>
                <th className="px-6 py-4 font-medium text-center">Jadwal Event</th>
                <th className="px-6 py-4 font-medium text-center">Status Periode</th>
                <th className="px-6 py-4 font-medium text-center">Tampilkan?</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Memuat data kampanye...</td></tr>
              ) : campaigns.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Belum ada kampanye.</td></tr>
              ) : (
                campaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-gray-50/50 transition-colors">
                    
                    <td className="px-6 py-4 space-y-1">
                      <div className="font-bold text-gray-900">{camp.title}</div>
                      <div className="text-xs text-gray-500 font-mono flex items-center">
                        <LinkIcon className="w-3 h-3 mr-1" /> /{camp.slug}
                      </div>
                      <div className="text-xs text-gray-400 pt-1">
                        Berisi <span className="font-bold text-gray-700">{camp._count?.eventProducts || 0}</span> Produk
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center justify-center gap-1 text-xs text-gray-600">
                         <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-md border border-green-100">
                           <CalendarClock className="w-3 h-3" />
                           {new Date(camp.startAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short'})}
                         </div>
                         <div className="text-gray-300">s/d</div>
                         <div className="flex items-center gap-1 bg-red-50 text-red-700 px-2 py-1 rounded-md border border-red-100">
                           <CalendarClock className="w-3 h-3" />
                           {new Date(camp.endAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short'})}
                         </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      {getEventStatus(camp.startAt, camp.endAt)}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <Switch checked={camp.isActive} onCheckedChange={() => toggleStatus(camp.id, camp.isActive)} />
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2 items-center">
                        <Button variant="outline" size="icon" className="h-8 w-8 text-blue-600" onClick={() => { setSelectedCampaign(camp); setIsModalOpen(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(camp.id)}>
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

      <CampaignModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchCampaigns} 
        initialData={selectedCampaign} 
      />
    </div>
  );
}