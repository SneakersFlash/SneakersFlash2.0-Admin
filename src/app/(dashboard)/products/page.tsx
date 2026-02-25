'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Filter,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Interface Data (Sesuaikan field ini dengan database/backend kamu)
interface Product {
  id: number;
  name: string;
  sku?: string;
  price: number;
  stock: number;
  category: string;
  image?: string; 
  status: 'active' | 'draft';
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // 1. Fetch Data dari Backend
  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Asumsi endpoint backend kamu '/products'
      const response = await api.get('/products');
      // Jika backend membungkus data dalam field 'data', sesuaikan disini (misal: response.data.data)
      setProducts(response.data.data || response.data); 
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat produk", {
        description: "Cek koneksi backend atau coba muat ulang."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 2. Fungsi Delete
  const handleDelete = async (id: number) => {
    if(!confirm("Yakin ingin menghapus produk ini?")) return;

    try {
      await api.delete(`/products/${id}`);
      toast.success("Produk berhasil dihapus");
      fetchProducts(); // Refresh table
    } catch (error) {
      toast.error("Gagal menghapus produk");
    }
  };

  // 3. Filter Search Client-side (Bisa diubah ke Server-side jika data banyak)
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  // Helper Formatter Rupiah
  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number);
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Products</h1>
          <p className="text-sm text-slate-500">Kelola katalog sepatu SneakerFlash Anda disini.</p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/dashboard/products/create">
            <Plus className="mr-2 h-4 w-4" /> Tambah Produk
          </Link>
        </Button>
      </div>

      {/* TOOLBAR (Search & Filter) */}
      <div className="flex items-center gap-2 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Cari nama sepatu..." 
            className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2 text-slate-600">
            <Filter className="h-4 w-4" /> Filter
        </Button>
      </div>

      {/* TABLE SECTION */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b">
              <tr>
                <th className="px-6 py-4">Product Info</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              
              {loading ? (
                // SKELETON LOADING
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-10 w-32 bg-slate-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-10 bg-slate-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-16 bg-slate-100 rounded-full"></div></td>
                    <td className="px-6 py-4"></td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                // EMPTY STATE
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                        <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                            <Search className="h-6 w-6 text-slate-400"/>
                        </div>
                        <p>Tidak ada produk ditemukan.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                // DATA ROWS
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                            {/* Gambar Produk */}
                            <div className="relative h-12 w-12 rounded-lg border bg-slate-100 overflow-hidden flex-shrink-0">
                                {product.image ? (
                                    <Image 
                                        src={product.image} // Pastikan URL ini lengkap dari backend
                                        alt={product.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-slate-400 text-xs">No IMG</div>
                                )}
                            </div>
                            <div>
                                <div className="font-medium text-slate-900">{product.name}</div>
                                <div className="text-xs text-slate-500 uppercase">{product.sku || 'NO-SKU'}</div>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                        {product.category || 'Uncategorized'}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                        {formatRupiah(product.price)}
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                             <span className={`h-2 w-2 rounded-full ${product.stock > 10 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                             <span>{product.stock} pcs</span>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            product.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                            {product.status || 'Active'}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem asChild>
                                    <Link href={`/dashboard/products/${product.id}/edit`} className="flex items-center cursor-pointer">
                                        <Pencil className="mr-2 h-4 w-4" /> Edit
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    className="text-red-600 focus:text-red-600 cursor-pointer"
                                    onClick={() => handleDelete(product.id)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* PAGINATION FOOTER (Opsional, tampilan saja dulu) */}
        {!loading && filteredProducts.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50">
                <div className="text-sm text-slate-500">
                    Showing <strong>1-{filteredProducts.length}</strong> of <strong>{filteredProducts.length}</strong> products
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled>Previous</Button>
                    <Button variant="outline" size="sm" disabled>Next</Button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}