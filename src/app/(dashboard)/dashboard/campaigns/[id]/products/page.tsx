'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Package, FileSpreadsheet, Trash2, Loader2, X, ArrowLeft, Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import CampaignsService from '@/services/campaigns.service';
import type { CampaignEvent } from '@/types/marketing.types';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getErrorMessage } from '@/lib/api';

export default function EventProductsDetailPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.id as string;

    const [eventInfo, setEventInfo] = useState<CampaignEvent | null>(null);
    const [eventProducts, setEventProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // === STATE UNTUK FILTER, SORT & PAGINATION ===
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sortBy, setSortBy] = useState('displayOrder');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [meta, setMeta] = useState({ total: 0, lastPage: 1, hasNextPage: false, hasPrevPage: false, page: 1 });

    // State Modal Sync
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
    const [sheetUrl, setSheetUrl] = useState('');
    const [sheetName, setSheetName] = useState('Sheet1');
    const [isSyncing, setIsSyncing] = useState(false);

    const fetchEventData = useCallback(async () => {
        setIsLoading(true);
        try {
        // Fetch info detail produk dengan query params
        const response = await CampaignsService.getEventProducts(eventId, {
            page,
            limit,
            search,
            sortBy,
            sortOrder
        });
        
        setEventProducts(response.data);
        setMeta(response.meta);

        // (Opsional) Fetch info judul event jika belum ada
        if (!eventInfo) {
            const allEvents = await CampaignsService.getAllAdmin();
            const currentEvent = allEvents.find((e) => e.id.toString() === eventId);
            if (currentEvent) setEventInfo(currentEvent);
        }

        } catch (error) {
        toast.error(getErrorMessage(error));
        } finally {
        setIsLoading(false);
        }
    }, [eventId, page, limit, search, sortBy, sortOrder]);

    // Panggil API setiap kali page, search, atau sorting berubah
    useEffect(() => {
        if (eventId) {
        // Sedikit delay (debounce) manual untuk pencarian agar tidak spam API saat mengetik
        const timeoutId = setTimeout(() => {
            fetchEventData();
        }, 500);
        return () => clearTimeout(timeoutId);
        }
    }, [fetchEventData]);

    const handleSort = (column: string) => {
        if (sortBy === column) {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
        setSortBy(column);
        setSortOrder('asc');
        }
        setPage(1); // Reset ke halaman 1 jika mengubah sorting
    };

    const handleRemoveProduct = async (variantId: string) => {
        if (!confirm('Hapus produk ini dari event?')) return;
        try {
        await CampaignsService.removeEventProduct(eventId, variantId);
        toast.success('Produk dihapus dari event');
        fetchEventData(); // Refresh data agar pagination tetap akurat
        } catch (error) {
        toast.error(getErrorMessage(error));
        }
    };

    const handleSyncSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sheetUrl) return;

        try {
            setIsSyncing(true);
            const response = await CampaignsService.syncFromSheet(eventId, { sheetUrl, sheetName });
            
            toast.success(response.message);
            if (response.warning) toast.warning(response.warning, { duration: 8000 });
            
            setIsSyncModalOpen(false);
            setSheetUrl('');
            fetchEventData(); 
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="space-y-6">
        <Button variant="ghost" className="text-gray-500 mb-[-10px]" onClick={() => router.push('/dashboard/campaigns')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Kampanye
        </Button>

        <PageHeader 
            title={`Produk: ${eventInfo?.title || 'Memuat...'}`}
            description="Kelola daftar produk, harga diskon, dan kuota untuk event ini."
            icon={Package}
            actions={
            <Button onClick={() => setIsSyncModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white">
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Sync Spreadsheet
            </Button>
            }
        />

        {/* Tampilan Filter & Pencarian */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
            <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
                type="text"
                placeholder="Cari SKU atau Nama Produk..."
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                value={search}
                onChange={(e) => {
                setSearch(e.target.value);
                setPage(1); // Reset ke halaman 1 saat mencari
                }}
            />
            </div>
            <div className="text-sm text-gray-500 w-full sm:w-auto text-right">
            Total: <span className="font-bold text-gray-900">{meta.total}</span> Produk
            </div>
        </div>

        <Card className="p-0 overflow-hidden border border-gray-100 shadow-sm">
            <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b">
                <tr>
                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('sku')}>
                    <div className="flex items-center gap-1">SKU <ArrowUpDown className="h-3 w-3" /></div>
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('productName')}>
                    <div className="flex items-center gap-1">Nama Produk <ArrowUpDown className="h-3 w-3" /></div>
                    </th>
                    <th className="px-6 py-4 text-right">Harga Normal</th>
                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 text-right" onClick={() => handleSort('specialPrice')}>
                    <div className="flex items-center justify-end gap-1">Harga Promo <ArrowUpDown className="h-3 w-3" /></div>
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 text-center" onClick={() => handleSort('quotaSold')}>
                    <div className="flex items-center justify-center gap-1">Kuota Promo <ArrowUpDown className="h-3 w-3" /></div>
                    </th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                    <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        <Loader2 className="w-6 h-6 mx-auto animate-spin text-blue-500 mb-2" />
                        Memuat data produk...
                    </td>
                    </tr>
                ) : eventProducts.length === 0 ? (
                    <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        {search ? 'Produk yang dicari tidak ditemukan.' : 'Belum ada produk di event ini. Silakan klik "Sync Spreadsheet".'}
                    </td>
                    </tr>
                ) : (
                    eventProducts.map((p) => (
                    <tr key={p.productVariantId} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-mono text-xs text-gray-600">{p.sku}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{p.productName}</td>
                        <td className="px-6 py-4 text-right text-gray-400 line-through">
                        Rp{p.originalPrice.toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-red-600">
                        {p.specialPrice ? `Rp${p.specialPrice.toLocaleString('id-ID')}` : '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-700">
                            {p.quotaLimit === 0 ? 'Unlimited' : `${p.quotaSold} / ${p.quotaLimit}`}
                        </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                        <Button 
                            variant="ghost" size="icon" 
                            className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleRemoveProduct(p.productVariantId)}
                            title="Hapus dari event"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        </td>
                    </tr>
                    ))
                )}
                </tbody>
            </table>
            </div>

            {/* PAGINATION CONTROLS */}
            {!isLoading && eventProducts.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50/30">
                <div className="text-sm text-gray-500">
                Halaman <span className="font-bold text-gray-900">{meta.page}</span> dari <span className="font-bold text-gray-900">{meta.lastPage}</span>
                </div>
                <div className="flex gap-2">
                <Button 
                    variant="outline" size="sm" 
                    disabled={!meta.hasPrevPage} 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                </Button>
                <Button 
                    variant="outline" size="sm" 
                    disabled={!meta.hasNextPage} 
                    onClick={() => setPage(p => p + 1)}
                >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
                </div>
            </div>
            )}
        </Card>

        {/* Modal Sync (Sama seperti sebelumnya, disembunyikan untuk menyingkat kode) */}
        {isSyncModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            {/* ... Form input URL Spreadsheet ... */}
            <Card className="w-full max-w-md p-6 bg-white">
                <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-green-600" /> Sync Produk Event
                </h3>
                <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => !isSyncing && setIsSyncModalOpen(false)}>
                    <X className="w-4 h-4" />
                </Button>
                </div>
                <form onSubmit={handleSyncSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Link URL Google Sheet</label>
                    <input type="url" required disabled={isSyncing} className="w-full px-3 py-2 border rounded-md" value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)} />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsSyncModalOpen(false)} disabled={isSyncing}>Batal</Button>
                    <Button type="submit" disabled={!sheetUrl || isSyncing} className="bg-green-600 hover:bg-green-700 text-white">
                    {isSyncing ? 'Syncing...' : 'Mulai Sync'}
                    </Button>
                </div>
                </form>
            </Card>
            </div>
        )}
        </div>
    );
}