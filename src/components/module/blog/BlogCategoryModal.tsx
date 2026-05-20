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
import { Textarea } from '@/components/ui/textarea';
import BlogService from '@/services/blog.service';
import api, { getErrorMessage } from '@/lib/api';
import type { BlogCategory, CreateBlogCategoryPayload } from '@/types/cms.types';

interface BlogCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: BlogCategory | null;
}

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  imageUrl: '',
  sortOrder: 0,
  isActive: true,
};

export default function BlogCategoryModal({
  isOpen, onClose, onSuccess, initialData,
}: BlogCategoryModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({ ...emptyForm });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        slug: initialData.slug,
        description: initialData.description || '',
        imageUrl: initialData.imageUrl || '',
        sortOrder: initialData.sortOrder ?? 0,
        isActive: initialData.isActive,
      });
      setPreviewUrl(initialData.imageUrl || null);
      setSlugTouched(true);
    } else {
      setFormData({ ...emptyForm });
      setPreviewUrl(null);
      setSlugTouched(false);
    }
    setSelectedFile(null);
  }, [initialData, isOpen]);

  const handleNameChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      name: value,
      slug: slugTouched ? prev.slug : slugify(value),
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file gambar yang diperbolehkan!');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran maksimal gambar adalah 5MB!');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadImage = async (file: File) => {
    const uploadData = new FormData();
    uploadData.append('file', file);
    const { data } = await api.post('/media/upload', uploadData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    if (data.url) {
      return data.url.startsWith('http') ? data.url : `${baseUrl}${data.url}`;
    }
    if (data.filename) return `${baseUrl}/uploads/${data.filename}`;
    return `${baseUrl}/uploads/${data}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error('Nama dan slug kategori wajib diisi.');
      return;
    }
    try {
      setIsLoading(true);
      let finalImageUrl = formData.imageUrl;
      if (selectedFile) finalImageUrl = await uploadImage(selectedFile);

      const payload: CreateBlogCategoryPayload = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || undefined,
        imageUrl: finalImageUrl || undefined,
        sortOrder: formData.sortOrder,
        isActive: formData.isActive,
      };

      if (initialData) {
        await BlogService.updateCategory(initialData.id, payload);
        toast.success('Kategori blog diperbarui!');
      } else {
        await BlogService.createCategory(payload);
        toast.success('Kategori blog ditambahkan!');
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
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Kategori Blog' : 'Tambah Kategori Blog'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Nama Kategori <span className="text-red-500">*</span></Label>
            <Input
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Contoh: Berita, Rilis Terbaru, Interview"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Slug <span className="text-red-500">*</span></Label>
            <Input
              value={formData.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setFormData((p) => ({ ...p, slug: e.target.value }));
              }}
              placeholder="berita"
              required
            />
            <p className="text-xs text-gray-500">
              Dipakai di URL. Otomatis dari nama, bisa diubah manual.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Deskripsi (Opsional)</Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Deskripsi singkat kategori..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Urutan Tampil</Label>
            <Input
              type="number"
              value={formData.sortOrder}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  sortOrder: parseInt(e.target.value) || 0,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Gambar Kategori (Opsional)</Label>
            {previewUrl ? (
              <div className="relative w-32 h-32 border rounded-md overflow-hidden bg-gray-50 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Preview" className="object-cover w-full h-full" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-red-600 hover:bg-red-100"
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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg, image/png, image/gif, image/jpg, image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
            <div className="space-y-0.5">
              <Label>Status Kategori</Label>
              <p className="text-xs text-gray-500">
                Aktifkan agar kategori tampil di toko.
              </p>
            </div>
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData((p) => ({ ...p, isActive: checked }))
              }
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.name.trim() || !formData.slug.trim()}
            >
              {isLoading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
