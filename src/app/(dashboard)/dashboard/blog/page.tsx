'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus, Edit, Trash2, Newspaper, Star, Eye, Search,
  FolderTree, ChevronLeft, ChevronRight, ImageOff,
} from 'lucide-react';
import { toast } from 'sonner';
import BlogService from '@/services/blog.service';
import type { BlogCategory, BlogPost, BlogPostStatus } from '@/types/cms.types';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getErrorMessage } from '@/lib/api';
import BlogPostModal from '@/components/module/blog/BlogPostModal';

const STATUS_CONFIG: Record<BlogPostStatus, { label: string; cls: string }> = {
  draft: { label: 'Draft', cls: 'bg-gray-100 text-gray-600' },
  published: { label: 'Published', cls: 'bg-green-100 text-green-700' },
  archived: { label: 'Diarsipkan', cls: 'bg-amber-100 text-amber-700' },
};

const FILTERS: { value: 'all' | BlogPostStatus; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Diarsipkan' },
];

const PAGE_SIZE = 10;

export default function BlogPostsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: PAGE_SIZE, lastPage: 1 });
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | BlogPostStatus>('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await BlogService.getPosts({
        page,
        limit: PAGE_SIZE,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: search || undefined,
      });
      setPosts(res.data);
      setMeta(res.meta);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, search]);

  const fetchCategories = useCallback(async () => {
    try {
      setCategories(await BlogService.getCategories());
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Debounce pencarian
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleAdd = () => {
    setSelectedPost(null);
    setIsModalOpen(true);
  };

  const handleEdit = async (post: BlogPost) => {
    try {
      const full = await BlogService.getPost(post.id);
      setSelectedPost(full);
      setIsModalOpen(true);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm('Apakah kamu yakin ingin menghapus artikel ini?')) return;
    try {
      await BlogService.deletePost(id);
      toast.success('Artikel berhasil dihapus');
      fetchPosts();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const toggleFeatured = async (post: BlogPost) => {
    try {
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, isFeatured: !p.isFeatured } : p)),
      );
      await BlogService.updatePost(post.id, { isFeatured: !post.isFeatured });
      toast.success(
        !post.isFeatured ? 'Ditandai sebagai unggulan' : 'Dihapus dari unggulan',
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
      fetchPosts();
    }
  };

  const formatDate = (value?: string | null) =>
    value
      ? new Date(value).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'short', year: 'numeric',
        })
      : '-';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blog & Artikel"
        description="Kelola artikel berita, rilis, dan interview yang tampil di toko."
        icon={Newspaper}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/dashboard/blog/categories">
              <Button variant="outline">
                <FolderTree className="mr-2 h-4 w-4" /> Kategori
              </Button>
            </Link>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" /> Tulis Artikel
            </Button>
          </div>
        }
      />

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={statusFilter === f.value ? 'default' : 'outline'}
              onClick={() => {
                setStatusFilter(f.value);
                setPage(1);
              }}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari judul artikel..."
            className="pl-9"
          />
        </div>
      </div>

      <Card className="p-0 overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 font-medium w-44">Thumbnail</th>
                <th className="px-6 py-4 font-medium">Artikel</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-center">Views</th>
                <th className="px-6 py-4 font-medium text-center">Unggulan</th>
                <th className="px-6 py-4 font-medium">Tanggal</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Memuat data artikel...
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Belum ada artikel yang cocok.
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="h-16 w-32 rounded-md overflow-hidden bg-gray-100 border flex items-center justify-center">
                        {post.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={post.thumbnailUrl}
                            alt={post.title}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <ImageOff className="w-5 h-5 text-gray-300" />
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 line-clamp-2 max-w-md">
                        {post.title}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                        <span className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 font-medium">
                          {post.category?.name ?? 'Tanpa kategori'}
                        </span>
                        <span>oleh {post.author?.name ?? 'Admin'}</span>
                      </div>
                      <div className="mt-1 text-xs text-gray-400 font-mono">/{post.slug}</div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_CONFIG[post.status].cls}`}
                      >
                        {STATUS_CONFIG[post.status].label}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1 text-gray-600">
                        <Eye className="w-3.5 h-3.5" />
                        <span className="font-medium">{post.viewCount}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => toggleFeatured(post)}
                        title={post.isFeatured ? 'Hapus dari unggulan' : 'Jadikan unggulan'}
                      >
                        <Star
                          className={`w-5 h-5 transition-colors ${
                            post.isFeatured
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-300 hover:text-amber-300'
                          }`}
                        />
                      </button>
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-500">
                      <div>{formatDate(post.publishedAt ?? post.createdAt)}</div>
                      <div className="text-gray-400">
                        {post.publishedAt ? 'Dipublikasi' : 'Dibuat'}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2 items-center">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-blue-600"
                          onClick={() => handleEdit(post)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(post.id)}
                        >
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

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3 text-sm text-gray-500">
          <span>
            {meta.total} artikel &middot; Halaman {meta.page} dari {meta.lastPage}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" /> Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.lastPage || isLoading}
              onClick={() => setPage((p) => p + 1)}
            >
              Berikutnya <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <BlogPostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchPosts}
        initialData={selectedPost}
        categories={categories}
      />
    </div>
  );
}
