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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import BannersService from '@/services/banners.service';
import api, { getErrorMessage } from '@/lib/api';
import type { Banner, CreateBannerPayload, BannerPosition } from '@/types/cms.types';

interface BannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Banner | null;
}

export default function BannerModal({ isOpen, onClose, onSuccess, initialData }: BannerModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<CreateBannerPayload>({
    title: '',
    imageDesktopUrl: '',
    imageMobileUrl: '',
    targetUrl: '',
    position: 'home_top',
    sortOrder: 0,
    isActive: true,
  });

  const [files, setFiles] = useState<{ desktop: File | null; mobile: File | null }>({ desktop: null, mobile: null });
  const [previews, setPreviews] = useState<{ desktop: string | null; mobile: string | null }>({ desktop: null, mobile: null });

  useEffect(() => {
    if (initialData) {
      setFormData({ 
        title: initialData.title, 
        imageDesktopUrl: initialData.imageDesktopUrl,
        imageMobileUrl: initialData.imageMobileUrl || '',
        targetUrl: initialData.targetUrl || '',
        position: initialData.position,
        sortOrder: initialData.sortOrder,
        isActive: initialData.isActive,
      });
      setPreviews({ desktop: initialData.imageDesktopUrl, mobile: initialData.imageMobileUrl || null });
    } else {
      setFormData({ title: '', imageDesktopUrl: '', imageMobileUrl: '', targetUrl: '', position: 'home_top', sortOrder: 0, isActive: true });
      setPreviews({ desktop: null, mobile: null });
    }
    setFiles({ desktop: null, mobile: null });
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.name === 'sortOrder' ? parseInt(e.target.value) || 0 : e.target.value;
    setFormData((prev) => ({ ...prev, [e.target.name]: value }));
  };

  const handleFileChange = (type: 'desktop' | 'mobile', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) return toast.error('Hanya gambar!');
      setFiles(prev => ({ ...prev, [type]: file }));
      setPreviews(prev => ({ ...prev, [type]: URL.createObjectURL(file) }));
    }
  };

  const removeFile = (type: 'desktop' | 'mobile') => {
    setFiles(prev => ({ ...prev, [type]: null }));
    setPreviews(prev => ({ ...prev, [type]: null }));
    setFormData(prev => ({ ...prev, [type === 'desktop' ? 'imageDesktopUrl' : 'imageMobileUrl']: '' }));
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
      let desktopUrl = formData.imageDesktopUrl;
      let mobileUrl = formData.imageMobileUrl;

      // Upload if there are new files
      if (files.desktop) desktopUrl = await uploadImage(files.desktop);
      if (files.mobile) mobileUrl = await uploadImage(files.mobile);

      if (!desktopUrl) return toast.error('Gambar Desktop wajib diisi!');

      const payload: CreateBannerPayload = {
        title: formData.title,
        imageDesktopUrl: desktopUrl,
        imageMobileUrl: mobileUrl || undefined,
        targetUrl: formData.targetUrl || undefined,
        position: formData.position,
        sortOrder: formData.sortOrder,
        isActive: formData.isActive,
      };

      console.log(payload);
      
      if (initialData) {
        await BannersService.update(initialData.id, payload);
        toast.success('Banner diperbarui!');
      } else {
        await BannersService.create(payload);
        toast.success('Banner ditambahkan!');
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Banner' : 'Tambah Banner'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Judul Banner <span className="text-red-500">*</span></Label>
              <Input name="title" value={formData.title} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label>Posisi <span className="text-red-500">*</span></Label>
              <Select value={formData.position} onValueChange={(val) => setFormData(p => ({ ...p, position: val as BannerPosition }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="home_top">Home Top (Hero)</SelectItem>
                  <SelectItem value="home_middle">Home Middle</SelectItem>
                  <SelectItem value="category_page">Category Page</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input type="number" name="sortOrder" value={formData.sortOrder} onChange={handleChange} />
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Target URL (Link saat diklik)</Label>
              <Input name="targetUrl" value={formData.targetUrl} onChange={handleChange} placeholder="https://..." />
            </div>

            <div className="space-y-2 col-span-2 flex items-center justify-between p-3 border rounded-lg bg-gray-50">
              <div className="space-y-0.5">
                <Label>Status Banner</Label>
                <p className="text-xs text-gray-500">Aktifkan untuk menampilkan banner ini.</p>
              </div>
              <Switch checked={formData.isActive} onCheckedChange={(checked) => setFormData(p => ({...p, isActive: checked}))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            {/* Desktop Upload */}
            <div className="space-y-2">
              <Label>Gambar Desktop (Wajib)</Label>
              {previews.desktop ? (
                <div className="relative h-24 border rounded bg-gray-50 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previews.desktop} alt="Desktop" className="object-cover w-full h-full" />
                  <button type="button" onClick={() => removeFile('desktop')} className="absolute top-1 right-1 bg-white p-1 rounded-full text-red-600"><X className="w-3 h-3" /></button>
                </div>
              ) : (
                <div onClick={() => desktopInputRef.current?.click()} className="h-24 border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:bg-gray-50">
                  <ImageIcon className="text-gray-400" />
                </div>
              )}
              <input ref={desktopInputRef} type="file" className="hidden" onChange={(e) => handleFileChange('desktop', e)} />
            </div>

            {/* Mobile Upload */}
            <div className="space-y-2">
              <Label>Gambar Mobile (Opsional)</Label>
              {previews.mobile ? (
                <div className="relative h-24 border rounded bg-gray-50 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previews.mobile} alt="Mobile" className="object-cover w-full h-full" />
                  <button type="button" onClick={() => removeFile('mobile')} className="absolute top-1 right-1 bg-white p-1 rounded-full text-red-600"><X className="w-3 h-3" /></button>
                </div>
              ) : (
                <div onClick={() => mobileInputRef.current?.click()} className="h-24 border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:bg-gray-50">
                  <ImageIcon className="text-gray-400" />
                </div>
              )}
              <input ref={mobileInputRef} type="file" className="hidden" onChange={(e) => handleFileChange('mobile', e)} />
            </div>
          </div>
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Batal</Button>
            <Button type="submit" disabled={isLoading || !formData.title}>Simpan Banner</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}