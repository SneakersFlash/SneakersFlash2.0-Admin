import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import VouchersService from '@/services/vouchers.service';
import { getErrorMessage } from '@/lib/api';
import type { Voucher, CreateVoucherPayload, DiscountType } from '@/types/voucher.types';
import type { CampaignEvent } from '@/types/campaign.types';

interface VoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Voucher | null;
  campaigns: CampaignEvent[];
}

const formatForInput = (isoString?: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

export default function VoucherModal({ isOpen, onClose, onSuccess, initialData, campaigns }: VoucherModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<CreateVoucherPayload>({
    campaignId: 0,
    code: '',
    name: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    maxDiscountAmount: undefined,
    minPurchaseAmount: 0,
    usageLimitTotal: undefined,
    usageLimitPerUser: 1,
    startAt: '',
    expiresAt: '',
    isActive: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({ 
        campaignId: Number(initialData.campaignId),
        code: initialData.code,
        name: initialData.name,
        description: initialData.description || '',
        discountType: initialData.discountType,
        discountValue: Number(initialData.discountValue),
        maxDiscountAmount: initialData.maxDiscountAmount ? Number(initialData.maxDiscountAmount) : undefined,
        minPurchaseAmount: Number(initialData.minPurchaseAmount),
        usageLimitTotal: initialData.usageLimitTotal || undefined,
        usageLimitPerUser: initialData.usageLimitPerUser,
        startAt: formatForInput(initialData.startAt),
        expiresAt: formatForInput(initialData.expiresAt),
        isActive: initialData.isActive,
      });
    } else {
      setFormData({ 
        campaignId: campaigns.length > 0 ? Number(campaigns[0].id) : 0,
        code: '', name: '', description: '', discountType: 'percentage', 
        discountValue: 0, maxDiscountAmount: undefined, minPurchaseAmount: 0, 
        usageLimitTotal: undefined, usageLimitPerUser: 1, startAt: '', expiresAt: '', isActive: true 
      });
    }
  }, [initialData, isOpen, campaigns]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'number' ? (value ? Number(value) : undefined) : value 
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'campaignId' ? Number(value) : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const payload: CreateVoucherPayload = {
        ...formData,
        startAt: new Date(formData.startAt).toISOString(),
        expiresAt: new Date(formData.expiresAt).toISOString(),
      };

      if (initialData) {
        await VouchersService.update(initialData.id, payload);
        toast.success('Voucher diperbarui!');
      } else {
        await VouchersService.create(payload);
        toast.success('Voucher ditambahkan!');
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Voucher' : 'Buat Voucher Baru'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          
          {/* SECTION 1: INFO DASAR */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Tautkan ke Kampanye <span className="text-red-500">*</span></Label>
              <Select value={String(formData.campaignId)} onValueChange={(v) => handleSelectChange('campaignId', v)}>
                <SelectTrigger><SelectValue placeholder="Pilih Kampanye..." /></SelectTrigger>
                <SelectContent>
                  {campaigns.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Kode Voucher <span className="text-red-500">*</span></Label>
              <Input name="code" value={formData.code} onChange={handleChange} required className="uppercase font-mono" placeholder="DISKON10" disabled={!!initialData} />
            </div>

            <div className="space-y-2">
              <Label>Nama Voucher <span className="text-red-500">*</span></Label>
              <Input name="name" value={formData.name} onChange={handleChange} required placeholder="Promo Spesial Kemerdekaan" />
            </div>
          </div>

          {/* SECTION 2: LOGIKA DISKON */}
          <div className="p-4 border rounded-xl bg-gray-50/50 space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipe Diskon</Label>
                  <Select value={formData.discountType} onValueChange={(v) => handleSelectChange('discountType', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Persentase (%)</SelectItem>
                      <SelectItem value="fixed_amount">Nominal Rupiah (Rp)</SelectItem>
                      <SelectItem value="free_shipping">Gratis Ongkir</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.discountType !== 'free_shipping' && (
                  <div className="space-y-2">
                    <Label>Nilai Diskon</Label>
                    <Input type="number" name="discountValue" value={formData.discountValue} onChange={handleChange} required />
                  </div>
                )}
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min. Pembelian (Rp)</Label>
                  <Input type="number" name="minPurchaseAmount" value={formData.minPurchaseAmount} onChange={handleChange} />
                </div>

                {formData.discountType === 'percentage' && (
                  <div className="space-y-2">
                    <Label>Maks. Potongan Diskon (Rp)</Label>
                    <Input type="number" name="maxDiscountAmount" value={formData.maxDiscountAmount || ''} onChange={handleChange} placeholder="Biarkan kosong jika tanpa batas" />
                  </div>
                )}
             </div>
          </div>

          {/* SECTION 3: BATASAN & WAKTU */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Batas Penggunaan Total (Kuota)</Label>
              <Input type="number" name="usageLimitTotal" value={formData.usageLimitTotal || ''} onChange={handleChange} placeholder="Kosong = Unlimited" />
            </div>

            <div className="space-y-2">
              <Label>Batas Per User <span className="text-red-500">*</span></Label>
              <Input type="number" name="usageLimitPerUser" value={formData.usageLimitPerUser} onChange={handleChange} required min={1} />
            </div>

            <div className="space-y-2">
              <Label>Berlaku Mulai <span className="text-red-500">*</span></Label>
              <Input type="datetime-local" name="startAt" value={formData.startAt} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label>Berakhir Pada <span className="text-red-500">*</span></Label>
              <Input type="datetime-local" name="expiresAt" value={formData.expiresAt} onChange={handleChange} required />
            </div>
            
            <div className="space-y-2 col-span-2 flex items-center justify-between p-3 border rounded-lg bg-gray-50 mt-2">
              <div className="space-y-0.5">
                <Label>Status Voucher</Label>
                <p className="text-xs text-gray-500">Aktifkan agar voucher bisa di-klaim.</p>
              </div>
              <Switch checked={formData.isActive} onCheckedChange={(checked) => setFormData(p => ({...p, isActive: checked}))} />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Batal</Button>
            <Button type="submit" disabled={isLoading || !formData.code || !formData.campaignId}>Simpan Voucher</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}