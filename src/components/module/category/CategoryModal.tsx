import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Image as ImageIcon, X } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import CategoriesService from '@/services/categories.service';
import api, { getErrorMessage } from '@/lib/api';
import type { Category, CreateCategoryPayload } from '@/types/master.types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Category | null;
  categories: Category[];
}

export default function CategoryModal({ 
  isOpen, onClose, onSuccess, initialData, categories
}: CategoryModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State form standar
  const [formData, setFormData] = useState<CreateCategoryPayload>({
    name: '',
    imageUrl: '',
    parentId: null,
  });

  // State khusus untuk file upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({ 
        name: initialData.name, 
        imageUrl: initialData.imageUrl || '',
        parentId: initialData.parentId ? String(initialData.parentId) : null,
      });
      setPreviewUrl(initialData.imageUrl || null);
    } else {
      setFormData({ name: '', imageUrl: '', parentId: null });
      setPreviewUrl(null);
    }
    // Reset file tiap kali modal dibuka/ditutup
    setSelectedFile(null);
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleParentChange = (value: string) => {
    setFormData((prev) => ({ ...prev, parentId: value === "none" ? null : value }));
  };

  // ─── Logika Pilih File & Preview ─────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Hanya file gambar yang diperbolehkan!');
        return;
      }
      if (file.size > 2 * 1024 * 1024) { // Validasi 2MB sesuai backend
        toast.error('Ukuran maksimal gambar adalah 2MB!');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file)); // Buat preview lokal sesaat
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── Logika Submit (Upload -> Create/Update Category) ────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      let finalImageUrl = formData.imageUrl;

      // 1. Jika ada file baru yang dipilih, UPLOAD DULU ke backend
      if (selectedFile) {
        const uploadData = new FormData();
        uploadData.append('file', selectedFile);

        const { data } = await api.post('/media/upload', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        
        // Ekstrak URL dari response backend
        if (data.url) {
          finalImageUrl = data.url.startsWith('http') ? data.url : `${baseUrl}${data.url}`;
        } else if (data.filename) {
          finalImageUrl = `${baseUrl}/uploads/${data.filename}`;
        } else if (typeof data === 'string') {
          finalImageUrl = `${baseUrl}/uploads/${data}`;
        }
      }

      // 2. Susun Payload untuk disimpan ke tabel Categories
      const payload: CreateCategoryPayload = {
        name: formData.name,
        imageUrl: finalImageUrl || undefined,
        parentId: formData.parentId ? Number(formData.parentId) : undefined,
      };

      // 3. Simpan data kategori
      if (initialData) {
        await CategoriesService.update(initialData.id, payload);
        toast.success('Kategori berhasil diperbarui!');
      } else {
        await CategoriesService.create(payload);
        toast.success('Kategori berhasil ditambahkan!');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const availableParents = categories.filter(cat => 
    !initialData || String(cat.id) !== String(initialData.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Kategori' : 'Tambah Kategori Baru'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* ... Input Nama Kategori (Tetap Sama) ... */}
          <div className="space-y-2">
            <Label htmlFor="name">Nama Kategori <span className="text-red-500">*</span></Label>
            <Input 
              id="name" name="name" placeholder="Contoh: Sepatu Pria" 
              value={formData.name} onChange={handleChange} required 
            />
          </div>
          
          {/* ... Input Parent ID (Tetap Sama) ... */}
          <div className="space-y-2">
            <Label htmlFor="parentId">Kategori Induk (Opsional)</Label>
            <Select value={formData.parentId ? String(formData.parentId) : "none"} onValueChange={handleParentChange}>
              <SelectTrigger><SelectValue placeholder="Pilih kategori induk..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- Tidak Ada (Kategori Utama) --</SelectItem>
                {availableParents.map(cat => (
                  <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ─── Area Input Gambar Baru ─── */}
          <div className="space-y-2">
            <Label>Gambar Kategori (Opsional)</Label>
            
            {/* Jika ada preview gambar, tampilkan kotaknya */}
            {previewUrl ? (
              <div className="relative w-32 h-32 border rounded-md overflow-hidden bg-gray-50 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Preview" className="object-contain w-full h-full" />
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
                <span className="text-xs font-medium text-gray-500">Pilih Gambar</span>
              </div>
            )}
            
            {/* Input file disembunyikan secara visual */}
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