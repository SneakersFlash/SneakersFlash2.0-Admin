import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Image as ImageIcon, X } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import BrandsService from '@/services/brands.service';
import api, { getErrorMessage } from '@/lib/api';
import type { Brand, CreateBrandPayload } from '@/types/master.types';

interface BrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Brand | null;
}

export default function BrandModal({ 
  isOpen, onClose, onSuccess, initialData 
}: BrandModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<CreateBrandPayload>({
    name: '',
    logoUrl: '',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({ 
        name: initialData.name, 
        logoUrl: initialData.logoUrl || '',
      });
      setPreviewUrl(initialData.logoUrl || null);
    } else {
      setFormData({ name: '', logoUrl: '' });
      setPreviewUrl(null);
    }
    setSelectedFile(null);
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ─── Logika Pilih File & Preview ─────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Hanya file gambar yang diperbolehkan!');
        return;
      }
      if (file.size > 2 * 1024 * 1024) { 
        toast.error('Ukuran maksimal logo adalah 2MB!');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFormData(prev => ({ ...prev, logoUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── Logika Submit (Upload -> Create/Update Brand) ───────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      let finalLogoUrl = formData.logoUrl;

      // 1. Upload file baru jika ada
      if (selectedFile) {
        const uploadData = new FormData();
        uploadData.append('file', selectedFile);

        const { data } = await api.post('/media/upload', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        
        if (data.url) {
          finalLogoUrl = data.url.startsWith('http') ? data.url : `${baseUrl}${data.url}`;
        } else if (data.filename) {
          finalLogoUrl = `${baseUrl}/uploads/${data.filename}`;
        } else if (typeof data === 'string') {
          finalLogoUrl = `${baseUrl}/uploads/${data}`;
        }
      }

      // 2. Susun Payload
      const payload: CreateBrandPayload = {
        name: formData.name,
        logoUrl: finalLogoUrl || undefined,
      };

      // 3. Simpan data Merek
      if (initialData) {
        await BrandsService.update(initialData.id, payload);
        toast.success('Merek berhasil diperbarui!');
      } else {
        await BrandsService.create(payload);
        toast.success('Merek berhasil ditambahkan!');
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Merek' : 'Tambah Merek Baru'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Merek <span className="text-red-500">*</span></Label>
            <Input 
              id="name" name="name" placeholder="Contoh: Nike" 
              value={formData.name} onChange={handleChange} required 
            />
          </div>
          
          <div className="space-y-2">
            <Label>Logo Merek (Opsional)</Label>
            
            {previewUrl ? (
              <div className="relative w-32 h-32 border rounded-md overflow-hidden bg-gray-50 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Preview Logo" className="object-contain w-full h-full" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-red-600 hover:bg-red-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div 
                className="w-32 h-32 border-2 border-dashed rounded-md flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-gray-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="w-8 h-8 mb-2" />
                <span className="text-xs font-medium text-gray-500">Pilih Logo</span>
              </div>
            )}
            
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/jpeg, image/png, image/gif, image/jpg" 
              className="hidden" 
              onChange={handleFileChange} 
            />
          </div>
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name.trim()}>
              {isLoading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}