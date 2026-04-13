import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import PromoCampaignsService from '@/services/promo-campaigns.service';
import { getErrorMessage } from '@/lib/api';
import type { PromoCampaign, CreatePromoCampaignPayload } from '@/types/marketing.types';

interface PromoCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: PromoCampaign | null;
}

const formatForInput = (isoString?: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

export default function PromoCampaignModal({ isOpen, onClose, onSuccess, initialData }: PromoCampaignModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<CreatePromoCampaignPayload>({
    name: '',
    description: '',
    totalBudgetLimit: 0,
    startAt: '',
    endAt: '',
    isActive: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({ 
        name: initialData.name, 
        description: initialData.description || '',
        totalBudgetLimit: initialData.totalBudgetLimit || 0,
        startAt: formatForInput(initialData.startAt),
        endAt: formatForInput(initialData.endAt),
        isActive: initialData.isActive,
      });
    } else {
      setFormData({ 
        name: '', description: '', totalBudgetLimit: 0,
        startAt: '', endAt: '', isActive: true 
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: name === 'totalBudgetLimit' ? Number(value) : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const payload: CreatePromoCampaignPayload = {
        ...formData,
        startAt: new Date(formData.startAt).toISOString(),
        endAt: new Date(formData.endAt).toISOString(),
      };

      if (initialData) {
        await PromoCampaignsService.update(initialData.id, payload);
        toast.success('Anggaran Kampanye diperbarui!');
      } else {
        await PromoCampaignsService.create(payload);
        toast.success('Anggaran Kampanye ditambahkan!');
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Anggaran Kampanye' : 'Tambah Anggaran Kampanye'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Nama Kampanye <span className="text-red-500">*</span></Label>
            <Input name="name" value={formData.name} onChange={handleChange} required placeholder="Promo Harbolnas 12.12" />
          </div>

          <div className="space-y-2">
            <Label>Deskripsi</Label>
            <Input name="description" value={formData.description} onChange={handleChange} placeholder="Catatan internal untuk promo ini" />
          </div>

          <div className="space-y-2">
            <Label>Batas Anggaran (Rp)</Label>
            <Input 
              type="number" 
              name="totalBudgetLimit" 
              value={formData.totalBudgetLimit || ''} 
              onChange={handleChange} 
              placeholder="Kosongkan atau isi 0 jika unlimited" 
            />
            <p className="text-xs text-gray-500">Isi 0 jika tidak ada batasan budget promo.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Waktu Mulai <span className="text-red-500">*</span></Label>
              <Input type="datetime-local" name="startAt" value={formData.startAt} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label>Waktu Berakhir <span className="text-red-500">*</span></Label>
              <Input type="datetime-local" name="endAt" value={formData.endAt} onChange={handleChange} required />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 mt-2">
            <div className="space-y-0.5">
              <Label>Status Aktif</Label>
              <p className="text-xs text-gray-500">Izinkan voucher dalam kampanye ini digunakan.</p>
            </div>
            <Switch checked={formData.isActive} onCheckedChange={(checked) => setFormData(p => ({...p, isActive: checked}))} />
          </div>
          
          <DialogFooter className="pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Batal</Button>
            <Button type="submit" disabled={isLoading || !formData.name}>Simpan Data</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}