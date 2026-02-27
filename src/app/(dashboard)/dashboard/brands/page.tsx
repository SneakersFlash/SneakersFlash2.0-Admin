'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import BannersService from '@/services/banners.service';
import type { Banner } from '@/types/cms.types';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { getErrorMessage } from '@/lib/api';
import BannerModal from '@/components/module/banner/BannerModal';

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);

  const fetchBanners = async () => {
    try {
      setIsLoading(true);
      const data = await BannersService.getAllAdmin(); // Gunakan endpoint Admin
      setBanners(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleDelete = async (id: string | number) => {
    if (!confirm('Apakah kamu yakin ingin menghapus banner ini?')) return;
    try {
      await BannersService.delete(id);
      toast.success('Banner berhasil dihapus');
      fetchBanners();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const toggleStatus = async (id: string | number, currentStatus: boolean) => {
    try {
      setBanners(banners.map(b => b.id === id ? { ...b, isActive: !currentStatus } : b));
      await BannersService.update(id, { isActive: !currentStatus });
      toast.success('Status banner diperbarui');
    } catch (error) {
      toast.error(getErrorMessage(error));
      fetchBanners(); 
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Manajemen Banner" 
        description="Atur gambar banner promo untuk halaman beranda."
        icon={ImageIcon}
        actions={
          <Button onClick={() => { setSelectedBanner(null); setIsModalOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Banner
          </Button>
        }
      />

      <Card className="p-0 overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 font-medium w-48">Gambar Desktop</th>
                <th className="px-6 py-4 font-medium">Detail Banner</th>
                <th className="px-6 py-4 font-medium text-center">Urutan</th>
                <th className="px-6 py-4 font-medium text-center">Status Aktif</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Memuat data banner...</td></tr>
              ) : banners.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Belum ada banner.</td></tr>
              ) : (
                banners.map((banner) => (
                  <tr key={banner.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="relative h-16 w-32 rounded-md overflow-hidden bg-gray-100 border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={banner.imageDesktopUrl} alt={banner.title} className="object-cover w-full h-full" />
                      </div>
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      <div className="font-medium text-gray-900">{banner.title}</div>
                      <Badge variant="outline" className="text-[10px] uppercase bg-gray-50">{banner.position.replace('_', ' ')}</Badge>
                      {banner.targetUrl && (
                        <div className="flex items-center text-xs text-blue-600 hover:underline pt-1">
                          <LinkIcon className="w-3 h-3 mr-1" />
                          <a href={banner.targetUrl} target="_blank" rel="noreferrer">Link URL</a>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-gray-500">{banner.sortOrder}</td>
                    <td className="px-6 py-4 text-center">
                      <Switch checked={banner.isActive} onCheckedChange={() => toggleStatus(banner.id, banner.isActive)} />
                    </td>
                    <td className="px-6 py-4 flex justify-end gap-2 items-center h-full pt-8 border-t-0">
                      <Button variant="outline" size="icon" className="h-8 w-8 text-blue-600" onClick={() => { setSelectedBanner(banner); setIsModalOpen(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(banner.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <BannerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchBanners} 
        initialData={selectedBanner} 
      />
    </div>
  );
}