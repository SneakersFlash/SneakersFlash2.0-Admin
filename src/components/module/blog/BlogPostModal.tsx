import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Image as ImageIcon, X, AlertTriangle } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import BlogService from '@/services/blog.service';
import api, { getErrorMessage } from '@/lib/api';
import type {
  BlogCategory, BlogPost, BlogPostStatus, CreateBlogPostPayload,
} from '@/types/cms.types';

interface BlogPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: BlogPost | null;
  categories: BlogCategory[];
}

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const emptyForm = {
  title: '',
  slug: '',
  excerpt: '',
  contentHtml: '',
  categoryId: '',
  status: 'draft' as BlogPostStatus,
  isFeatured: false,
  tags: '',
  thumbnailUrl: '',
  coverImageUrl: '',
  metaTitle: '',
  metaDescription: '',
  metaKeywords: '',
};

// ─── Sub-komponen: pemilih gambar ──────────────────────────────────────────────
function ImagePicker({
  label, hint, preview, onFile, onRemove,
}: {
  label: string;
  hint?: string;
  preview: string | null;
  onFile: (file: File) => void;
  onRemove: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {preview ? (
        <div className="relative h-32 border rounded-md overflow-hidden bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt={label} className="object-cover w-full h-full" />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-red-600 hover:bg-red-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => ref.current?.click()}
          className="h-32 border-2 border-dashed rounded-md flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-gray-400 transition-colors cursor-pointer"
        >
          <ImageIcon className="w-7 h-7 mb-1" />
          <span className="text-xs font-medium text-gray-500">Pilih Gambar</span>
        </div>
      )}
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
      <input
        ref={ref}
        type="file"
        accept="image/jpeg, image/png, image/gif, image/jpg, image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
    </div>
  );
}

export default function BlogPostModal({
  isOpen, onClose, onSuccess, initialData, categories,
}: BlogPostModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [formData, setFormData] = useState({ ...emptyForm });

  const [files, setFiles] = useState<{ thumbnail: File | null; cover: File | null }>({
    thumbnail: null, cover: null,
  });
  const [previews, setPreviews] = useState<{ thumbnail: string | null; cover: string | null }>({
    thumbnail: null, cover: null,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        slug: initialData.slug,
        excerpt: initialData.excerpt || '',
        contentHtml: initialData.contentHtml || '',
        categoryId: String(initialData.categoryId),
        status: initialData.status,
        isFeatured: initialData.isFeatured,
        tags: (initialData.tags || []).join(', '),
        thumbnailUrl: initialData.thumbnailUrl || '',
        coverImageUrl: initialData.coverImageUrl || '',
        metaTitle: initialData.metaTitle || '',
        metaDescription: initialData.metaDescription || '',
        metaKeywords: initialData.metaKeywords || '',
      });
      setPreviews({
        thumbnail: initialData.thumbnailUrl || null,
        cover: initialData.coverImageUrl || null,
      });
      setSlugTouched(true);
    } else {
      setFormData({ ...emptyForm });
      setPreviews({ thumbnail: null, cover: null });
      setSlugTouched(false);
    }
    setFiles({ thumbnail: null, cover: null });
  }, [initialData, isOpen]);

  const handleTitleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      title: value,
      slug: slugTouched ? prev.slug : slugify(value),
    }));
  };

  const handlePickFile = (type: 'thumbnail' | 'cover', file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file gambar yang diperbolehkan!');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran maksimal gambar adalah 5MB!');
      return;
    }
    setFiles((prev) => ({ ...prev, [type]: file }));
    setPreviews((prev) => ({ ...prev, [type]: URL.createObjectURL(file) }));
  };

  const handleRemoveFile = (type: 'thumbnail' | 'cover') => {
    setFiles((prev) => ({ ...prev, [type]: null }));
    setPreviews((prev) => ({ ...prev, [type]: null }));
    setFormData((prev) => ({
      ...prev,
      [type === 'thumbnail' ? 'thumbnailUrl' : 'coverImageUrl']: '',
    }));
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
    if (!formData.title.trim() || !formData.slug.trim()) {
      toast.error('Judul dan slug artikel wajib diisi.');
      return;
    }
    if (!formData.categoryId) {
      toast.error('Kategori artikel wajib dipilih.');
      return;
    }
    try {
      setIsLoading(true);
      let thumbnailUrl = formData.thumbnailUrl;
      let coverImageUrl = formData.coverImageUrl;

      if (files.thumbnail) thumbnailUrl = await uploadImage(files.thumbnail);
      if (files.cover) coverImageUrl = await uploadImage(files.cover);

      const payload: CreateBlogPostPayload = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        excerpt: formData.excerpt.trim() || undefined,
        contentHtml: formData.contentHtml || undefined,
        thumbnailUrl: thumbnailUrl || undefined,
        coverImageUrl: coverImageUrl || undefined,
        tags: formData.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        isFeatured: formData.isFeatured,
        categoryId: Number(formData.categoryId),
        status: formData.status,
        metaTitle: formData.metaTitle.trim() || undefined,
        metaDescription: formData.metaDescription.trim() || undefined,
        metaKeywords: formData.metaKeywords.trim() || undefined,
      };

      if (initialData) {
        await BlogService.updatePost(initialData.id, payload);
        toast.success('Artikel diperbarui!');
      } else {
        await BlogService.createPost(payload);
        toast.success('Artikel ditambahkan!');
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const noCategory = categories.length === 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Artikel' : 'Tulis Artikel Baru'}
          </DialogTitle>
        </DialogHeader>

        {noCategory && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              Belum ada kategori blog. Buat kategori dulu sebelum menulis artikel.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Judul Artikel <span className="text-red-500">*</span></Label>
            <Input
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Contoh: adidas Originals x Highsnobiety Collab"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Slug <span className="text-red-500">*</span></Label>
              <Input
                value={formData.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setFormData((p) => ({ ...p, slug: e.target.value }));
                }}
                placeholder="adidas-originals-highsnobiety"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Kategori <span className="text-red-500">*</span></Label>
              <Select
                value={formData.categoryId}
                onValueChange={(val) =>
                  setFormData((p) => ({ ...p, categoryId: val }))
                }
                disabled={noCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val) =>
                  setFormData((p) => ({ ...p, status: val as BlogPostStatus }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Diarsipkan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <Input
                value={formData.tags}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, tags: e.target.value }))
                }
                placeholder="adidas, collab, sneakers"
              />
              <p className="text-xs text-gray-500">Pisahkan dengan koma.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ringkasan (Excerpt)</Label>
            <Textarea
              value={formData.excerpt}
              onChange={(e) =>
                setFormData((p) => ({ ...p, excerpt: e.target.value }))
              }
              placeholder="Ringkasan singkat yang tampil di kartu artikel..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Konten Artikel</Label>
            <RichTextEditor
              value={formData.contentHtml}
              onChange={(html) =>
                setFormData((p) => ({ ...p, contentHtml: html }))
              }
            />
            <p className="text-xs text-gray-500">
              Bisa langsung salin-tempel dari Google Docs — heading, bold, list,
              link, dan perataan teks ikut terbawa.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
            <ImagePicker
              label="Thumbnail (Kartu)"
              hint="Gambar kecil untuk grid artikel."
              preview={previews.thumbnail}
              onFile={(f) => handlePickFile('thumbnail', f)}
              onRemove={() => handleRemoveFile('thumbnail')}
            />
            <ImagePicker
              label="Cover (Hero Detail)"
              hint="Gambar besar di halaman detail artikel."
              preview={previews.cover}
              onFile={(f) => handlePickFile('cover', f)}
              onRemove={() => handleRemoveFile('cover')}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
            <div className="space-y-0.5">
              <Label>Jadikan Artikel Unggulan</Label>
              <p className="text-xs text-gray-500">
                Tampil di section &quot;Latest News&quot; / hero.
              </p>
            </div>
            <Switch
              checked={formData.isFeatured}
              onCheckedChange={(checked) =>
                setFormData((p) => ({ ...p, isFeatured: checked }))
              }
            />
          </div>

          <details className="border rounded-lg p-3">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 select-none">
              Pengaturan SEO (Opsional)
            </summary>
            <div className="space-y-3 pt-3">
              <div className="space-y-2">
                <Label>Meta Title</Label>
                <Input
                  value={formData.metaTitle}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, metaTitle: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea
                  value={formData.metaDescription}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      metaDescription: e.target.value,
                    }))
                  }
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Meta Keywords</Label>
                <Input
                  value={formData.metaKeywords}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, metaKeywords: e.target.value }))
                  }
                  placeholder="sepatu, sneakers, adidas"
                />
              </div>
            </div>
          </details>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading ||
                noCategory ||
                !formData.title.trim() ||
                !formData.slug.trim()
              }
            >
              {isLoading ? 'Menyimpan...' : 'Simpan Artikel'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
