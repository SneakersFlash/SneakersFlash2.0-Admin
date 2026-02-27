import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Image as ImageIcon, X } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import CampaignsService from '@/services/campaigns.service';
import api, { getErrorMessage } from '@/lib/api';
import type { CampaignEvent, CreateCampaignPayload } from '@/types/marketing.types';

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: CampaignEvent | null;
}

const formatForInput = (isoString?: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

export default function CampaignModal({ isOpen, onClose, onSuccess, initialData }: CampaignModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs untuk input file tersembunyi
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<CreateCampaignPayload>({
    title: '',
    slug: '',
    bannerDesktopUrl: '',
    bannerMobileUrl: '', // <--- Tambahan banner mobile
    startAt: '',
    endAt: '',
    styleConfig: { backgroundColor: '#ffffff' },
    isActive: true,
  });

  // State terpisah untuk menampung file desktop dan mobile
  const [files, setFiles] = useState<{ desktop: File | null; mobile: File | null }>({ desktop: null, mobile: null });
  const [previews, setPreviews] = useState<{ desktop: string | null; mobile: string | null }>({ desktop: null, mobile: null });

  useEffect(() => {
    if (initialData) {
      setFormData({ 
        title: initialData.title, 
        slug: initialData.slug,
        bannerDesktopUrl: initialData.bannerDesktopUrl || '',
        bannerMobileUrl: initialData.bannerMobileUrl || '', // <--- Set initial data
        startAt: formatForInput(initialData.startAt),
        endAt: formatForInput(initialData.endAt),
        styleConfig: initialData.styleConfig || { backgroundColor: '#ffffff' },
        isActive: initialData.isActive,
      });
      setPreviews({ 
        desktop: initialData.bannerDesktopUrl || null, 
        mobile: initialData.bannerMobileUrl || null 
      });
    } else {
      setFormData({ 
        title: '', slug: '', bannerDesktopUrl: '', bannerMobileUrl: '', 
        startAt: '', endAt: '', styleConfig: { backgroundColor: '#ffffff' }, isActive: true 
      });
      setPreviews({ desktop: null, mobile: null });
    }
    setFiles({ desktop: null, mobile: null });
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, styleConfig: { ...prev.styleConfig, backgroundColor: e.target.value }}));
  };

  // Fungsi generic untuk handle file Desktop ATAU Mobile
  const handleFileChange = (type: 'desktop' | 'mobile', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) return toast.error('Hanya gambar!');
      setFiles(prev => ({ ...prev, [type]: file }));
      setPreviews(prev => ({ ...prev, [type]: URL.createObjectURL(file) }));
    }
  };

  // Fungsi generic untuk menghapus gambar
  const removeFile = (type: 'desktop' | 'mobile') => {
    setFiles(prev => ({ ...prev, [type]: null }));
    setPreviews(prev => ({ ...prev, [type]: null }));
    setFormData(prev => ({ ...prev, [type === 'desktop' ? 'bannerDesktopUrl' : 'bannerMobileUrl']: '' }));
  };

  const uploadImage = async (file: File) => {
    const uploadData = new FormData();
    uploadData.append('file', file);
    const { data } = await api.post('/media/upload', uploadData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    return data.url ? (data.url.startsWith('http') ? data.url : `${baseUrl}${data.url}`) : `${baseUrl}/uploads/${data.filename || data}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      let desktopUrl = formData.bannerDesktopUrl;
      let mobileUrl = formData.bannerMobileUrl;

      // Upload if new file selected
      if (files.desktop) desktopUrl = await uploadImage(files.desktop);
      if (files.mobile) mobileUrl = await uploadImage(files.mobile);

      // Konversi ISO String dan susun Payload
      const payload: CreateCampaignPayload = {
        ...formData,
        bannerDesktopUrl: desktopUrl || undefined,
        bannerMobileUrl: mobileUrl || undefined,
        startAt: new Date(formData.startAt).toISOString(),
        endAt: new Date(formData.endAt).toISOString(),
      };

      if (initialData) {
        await CampaignsService.update(initialData.id, payload);
        toast.success('Kampanye diperbarui!');
      } else {
        await CampaignsService.create(payload);
        toast.success('Kampanye ditambahkan!');
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
          <DialogTitle>{initialData ? 'Edit Kampanye (Event)' : 'Tambah Kampanye'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Kolom Informasi Teks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nama Event <span className="text-red-500">*</span></Label>
              <Input name="title" value={formData.title} onChange={handleChange} required placeholder="Flash Sale Lebaran" />
            </div>

            <div className="space-y-2">
              <Label>Slug <span className="text-red-500">*</span></Label>
              <Input name="slug" value={formData.slug} onChange={handleChange} required placeholder="flash-sale-lebaran" />
            </div>

            <div className="space-y-2">
              <Label>Waktu Mulai <span className="text-red-500">*</span></Label>
              <Input type="datetime-local" name="startAt" value={formData.startAt} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label>Waktu Berakhir <span className="text-red-500">*</span></Label>
              <Input type="datetime-local" name="endAt" value={formData.endAt} onChange={handleChange} required />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Warna Tema Background</Label>
              <div className="flex items-center gap-2">
                <Input type="color" value={formData.styleConfig?.backgroundColor || '#ffffff'} onChange={handleColorChange} className="w-16 h-10 p-1 cursor-pointer" />
                <span className="text-sm font-mono text-gray-500">{formData.styleConfig?.backgroundColor || '#ffffff'}</span>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2 flex items-center justify-between p-3 border rounded-lg bg-gray-50">
              <div className="space-y-0.5">
                <Label>Status Aktif</Label>
                <p className="text-xs text-gray-500">Bisa diakses pelanggan atau tidak.</p>
              </div>
              <Switch checked={formData.isActive} onCheckedChange={(checked) => setFormData(p => ({...p, isActive: checked}))} />
            </div>
          </div>

          {/* Area Upload Gambar (Desktop & Mobile berdampingan) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            {/* Desktop Upload */}
            <div className="space-y-2">
              <Label>Banner Desktop (Opsional)</Label>
              {previews.desktop ? (
                <div className="relative h-32 border rounded bg-gray-50 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previews.desktop} alt="Desktop" className="object-cover w-full h-full" />
                  <button type="button" onClick={() => removeFile('desktop')} className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-red-600 hover:bg-red-50"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <div onClick={() => desktopInputRef.current?.click()} className="h-32 border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 text-gray-400 transition-colors">
                  <ImageIcon className="mb-2" />
                  <span className="text-xs font-medium">Klik pilih gambar Desktop</span>
                  <span className="text-[10px] text-gray-400 mt-1">Rasio memanjang (Horizontal)</span>
                </div>
              )}
              <input ref={desktopInputRef} type="file" className="hidden" onChange={(e) => handleFileChange('desktop', e)} />
            </div>

            {/* Mobile Upload */}
            <div className="space-y-2">
              <Label>Banner Mobile (Opsional)</Label>
              {previews.mobile ? (
                <div className="relative h-32 w-28 mx-auto border rounded bg-gray-50 overflow-hidden shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previews.mobile} alt="Mobile" className="object-cover w-full h-full" />
                  <button type="button" onClick={() => removeFile('mobile')} className="absolute top-1 right-1 bg-white/90 p-1 rounded-full text-red-600 hover:bg-red-50 shadow-sm"><X className="w-3 h-3" /></button>
                </div>
              ) : (
                <div onClick={() => mobileInputRef.current?.click()} className="h-32 border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 text-gray-400 transition-colors">
                  <ImageIcon className="mb-2" />
                  <span className="text-xs font-medium">Klik pilih gambar Mobile</span>
                  <span className="text-[10px] text-gray-400 mt-1">Rasio meninggi (Vertical/Square)</span>
                </div>
              )}
              <input ref={mobileInputRef} type="file" className="hidden" onChange={(e) => handleFileChange('mobile', e)} />
            </div>
          </div>
          
          <DialogFooter className="pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Batal</Button>
            <Button type="submit" disabled={isLoading || !formData.title || !formData.slug}>Simpan Kampanye</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}