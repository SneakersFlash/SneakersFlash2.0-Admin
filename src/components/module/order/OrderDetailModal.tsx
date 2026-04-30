// src/components/module/order/OrderDetailModal.tsx
import { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle2, User, MapPin, Phone, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import OrdersService, { type TrackingResult } from '@/services/orders.service';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/api';
import { ORDER_STATUS_CONFIG } from '@/lib/constants';
import type { Order, OrderStatus } from '@/types/order.types';

interface OrderDetailModalProps {
  order: Order | any;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export default function OrderDetailModal({ order, isOpen, onClose, onRefresh }: OrderDetailModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [trackingData, setTrackingData] = useState<TrackingResult | null>(null);

  useEffect(() => {
    if (order?.awbTrackingNumber) {
      setTrackingNumber(order.awbTrackingNumber);
    } else if (order?.trackingNumber) {
      setTrackingNumber(order.trackingNumber);
    } else if (order?.courier?.trackingNumber) {
      setTrackingNumber(order.courier.trackingNumber);
    } else {
      setTrackingNumber('');
    }
    setCancelReason('');
    setTrackingData(null); // Reset tracking saat modal dibuka untuk pesanan lain
  }, [order]);

  if (!order) return null;

  const statusConf = ORDER_STATUS_CONFIG[order.status as OrderStatus];

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (newStatus === 'shipped' && !trackingNumber.trim()) {
      return toast.error('Nomor Resi wajib diisi untuk mengirim barang secara manual!');
    }
    try {
      setIsProcessing(true);
      await OrdersService.updateStatus(String(order.id), { 
        status: newStatus, 
        trackingNumber: newStatus === 'shipped' ? trackingNumber : undefined 
      });
      toast.success(`Status pesanan diperbarui menjadi ${ORDER_STATUS_CONFIG[newStatus]?.label || newStatus}`);
      onRefresh();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKomercePickup = async () => {
    try {
      setIsProcessing(true);
      await OrdersService.requestKomercePickup(String(order.id));
      toast.success('Kurir Komerce berhasil dijadwalkan untuk pickup!');
      onRefresh();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsProcessing(false);
    }
  };

  // 👇 FUNGSI BARU: CETAK LABEL KOMERCE (MENGGUNAKAN BASE64 BLOB)
  const handlePrintLabel = async () => {
    if (!order.komerceOrderId) {
      return toast.error('Pesanan ini tidak memiliki Komerce Order ID');
    }

    // 1. Buka tab kosong (Bypass Popup Blocker)
    const printWindow = window.open('', '_blank');

    try {
      setIsProcessing(true);
      if (printWindow) {
        printWindow.document.write('Memuat dokumen resi pengiriman...');
      }

      // 2. Panggil API backend kamu
      const { data } = await api.get(`/logistics/label/${order.komerceOrderId}`);
      
      // 3. Gunakan data BASE64, abaikan pdf_url yang sering 404 di Sandbox
      if (data?.base64) {
        // Trik jitu mengubah Base64 menjadi file Blob PDF asli di browser
        const base64Response = await fetch(`data:application/pdf;base64,${data.base64}`);
        const blob = await base64Response.blob();
        
        // Buat URL lokal di browser (hanya hidup di tab pengguna)
        const blobUrl = URL.createObjectURL(blob);
        
        // Arahkan tab ke URL lokal tersebut
        if (printWindow) {
          printWindow.location.href = blobUrl;
        }
      } 
      // Fallback jika anehnya base64 kosong tapi URL ada (buat jaga-jaga di Production)
      else if (data?.pdf_url) {
        if (printWindow) {
          printWindow.location.href = data.pdf_url;
        }
      } else {
        if (printWindow) printWindow.close();
        toast.error('Data label gagal didapatkan dari Komerce.');
      }
    } catch (error) {
      if (printWindow) printWindow.close();
      toast.error(getErrorMessage(error) || 'Gagal mencetak label. Pastikan kurir sudah di-request pickup.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTrackOrder = async () => {
    const awb = order.awb || order.awbTrackingNumber || order.trackingNumber || order.courier?.trackingNumber;
    const courier = (order.courierName || order.courier?.name || '').toLowerCase();

    if (!awb) return toast.error('Nomor resi belum tersedia untuk pesanan ini.');
    if (!courier) return toast.error('Nama kurir tidak ditemukan.');

    // JNE butuh 5 digit terakhir nomor HP penerima
    const phone = order.address?.phone || order.user?.phone || '';

    try {
      setIsProcessing(true);
      const result = await OrdersService.trackShipment(awb, courier, phone || undefined);
      setTrackingData(result);
      toast.success('Berhasil memuat status pengiriman');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) return toast.error('Alasan pembatalan wajib diisi!');
    try {
      setIsProcessing(true);
      await OrdersService.cancelOrder(String(order.id), cancelReason);
      toast.success('Pesanan berhasil dibatalkan');
      onRefresh();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader className="flex flex-row items-center justify-between pr-6 border-b pb-4">
          <div>
            <DialogTitle className="text-xl font-bold font-mono">Pesanan #{order.orderNumber || order.id}</DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(order.createdAt).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
            </p>
          </div>
          <Badge className={`${statusConf?.bgColor || 'bg-gray-100'} ${statusConf?.color || 'text-gray-700'} border-none text-sm px-3 py-1`}>
            {statusConf?.label || order.status}
          </Badge>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Info Pelanggan & Pengiriman */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center"><User className="w-4 h-4 mr-2"/> Info Pelanggan</h4>
              <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1 border border-gray-100">
                <p className="font-semibold text-gray-900">{order.user?.name || order.address?.recipientName || 'Guest'}</p>
                <p className="text-gray-600 flex items-center"><Phone className="w-3 h-3 mr-2"/> {order.user?.phone || order.address?.phone || '-'}</p>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center"><MapPin className="w-4 h-4 mr-2"/> Alamat Pengiriman</h4>
              <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 leading-relaxed border border-gray-100">
                <p className="font-medium text-gray-900">{order.address?.recipientName}</p>
                <p>{order.address?.phone}</p>
                <p className="mt-1">{order.address?.street}</p>
                <p>{order.address?.city}, {order.address?.province} {order.address?.postalCode}</p>
                {order.address?.notes && (
                  <p className="mt-2 text-xs italic text-gray-500">Catatan: {order.address.notes}</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center"><Truck className="w-4 h-4 mr-2"/> Kurir Pengiriman</h4>
              <div className="bg-gray-50 p-3 rounded-lg text-sm border border-gray-100">
                <p className="font-semibold text-gray-900 uppercase">{order.courierName || order.courier?.name} - {order.courierService || order.courier?.service}</p>
                <p className="text-gray-600 text-xs mt-0.5">Ongkir: Rp {Number(order.shippingCost || order.courier?.cost || 0).toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>

          {/* Rincian Item */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center"><Package className="w-4 h-4 mr-2"/> Rincian Barang</h4>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-3">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex gap-3 items-center border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                  <div className="w-12 h-12 bg-white rounded border overflow-hidden flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {item.imageUrl ? <img src={item.imageUrl[0] || item.imageUrl} alt="" className="object-cover w-full h-full"/> : <Package className="w-6 h-6 m-3 text-gray-300"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                    <p className="text-xs text-gray-500">Var: {item.variantName || item.variantSku} | Qty: {item.quantity}</p>
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    Rp {Number(item.subtotal).toLocaleString('id-ID')}
                  </div>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Pembayaran</span>
                <span className="font-bold text-emerald-600">Rp {Number(order.finalAmount || order.total).toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Area Aksi Status ─────────────────────── */}
        <div className="border-t pt-4 space-y-4">
          
          {/* PAID -> PROCESSING */}
          {order.status === 'paid' && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleCancelOrder} disabled={isProcessing}>Batalkan</Button>
              <Button onClick={() => handleUpdateStatus('processing')} disabled={isProcessing} className="bg-indigo-600 hover:bg-indigo-700">Terima & Proses Pesanan</Button>
            </div>
          )}

          {/* PROCESSING -> SHIPPED */}
          {order.status === 'processing' &&(
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 flex flex-col gap-3">
              <div className="space-y-1">
                <label className="text-sm font-bold text-indigo-900">Pesanan Siap Dikirim?</label>
                <p className="text-xs text-indigo-700">Kemas barang, cetak label resi, lalu panggil kurir Komerce.</p>
              </div>
              <div className="flex gap-2 mt-1">
                 {/* Tombol Cetak Label (Bisa dicetak meski masih processing selama sudah ada Komerce ID) */}
                 {order.komerceOrderId && (
                  <Button variant="outline" onClick={handlePrintLabel} disabled={isProcessing} className="bg-white text-blue-600 border-blue-200 hover:bg-blue-50 w-1/3">
                    <Printer className="w-4 h-4 mr-2" /> Cetak Label
                  </Button>
                )}
                <Button onClick={handleKomercePickup} disabled={isProcessing} className="bg-indigo-600 hover:bg-indigo-700 shadow-sm flex-1">
                  <Truck className="w-4 h-4 mr-2" /> Panggil Kurir (Pickup)
                </Button>
              </div>
            </div>
          )}

          {/* SHIPPED -> DELIVERED */}
          {order.status === 'shipped' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between bg-gray-50 p-4 rounded-lg border gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nomor Resi Pengiriman</p>
                  <p className="font-bold text-lg font-mono tracking-wider text-gray-900">{order.awb || order.awbTrackingNumber || order.trackingNumber || trackingNumber || '-'}</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {/* Tombol Cetak Label di status Shipped */}
                  {order.komerceOrderId && (
                    <Button variant="outline" onClick={handlePrintLabel} disabled={isProcessing} className="text-blue-600 border-blue-200 hover:bg-blue-50 bg-white">
                      <Printer className="w-4 h-4 mr-2" /> Cetak Label
                    </Button>
                  )}
                  
                  {/* Tombol Lacak Pesanan */}
                  <Button variant="outline" onClick={handleTrackOrder} disabled={isProcessing} className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 bg-white">
                    <MapPin className="w-4 h-4 mr-2" /> Lacak Pesanan
                  </Button>
                  
                  <Button variant="outline" onClick={() => handleUpdateStatus('delivered')} disabled={isProcessing} className="text-green-600 border-green-200 hover:bg-green-50 bg-white">
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Tandai Terkirim
                  </Button>
                </div>
              </div>

              {/* TAMPILAN TIMELINE TRACKING (RajaOngkir) */}
              {trackingData && trackingData.manifest && (
                <div className="bg-white border rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
                  {/* Header: status ringkas */}
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-gray-900 flex items-center">
                      <Truck className="w-4 h-4 mr-2" /> Riwayat Perjalanan Paket
                    </h4>
                    <div className="flex items-center gap-2">
                      {trackingData.delivered && (
                        <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Terkirim
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {trackingData.summary.courier_name} · {trackingData.summary.service_code}
                      </span>
                    </div>
                  </div>

                  {/* Timeline manifest */}
                  <div className="relative pl-6 border-l-2 border-indigo-100 space-y-5">
                    {trackingData.manifest.map((item, idx) => (
                      <div key={idx} className="relative">
                        <div className={`absolute -left-[31px] w-4 h-4 rounded-full border-2 border-white ${idx === 0 ? 'bg-indigo-600' : 'bg-gray-300'}`} />
                        <div className="space-y-0.5">
                          <p className={`text-sm font-semibold ${idx === 0 ? 'text-indigo-900' : 'text-gray-700'}`}>
                            {item.manifest_description}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{item.manifest_date} {item.manifest_time}</span>
                            {item.city_name && (
                              <>
                                <span>·</span>
                                <span className="font-medium text-gray-600">{item.city_name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* POD Info jika sudah delivered */}
                  {trackingData.delivery_status?.pod_receiver && (
                    <div className="mt-4 pt-3 border-t border-dashed border-gray-200 text-xs text-gray-500">
                      Diterima oleh <span className="font-semibold text-gray-700">{trackingData.delivery_status.pod_receiver}</span>
                      {' · '}{trackingData.delivery_status.pod_date} {trackingData.delivery_status.pod_time}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* DELIVERED -> COMPLETED */}
          {order.status === 'delivered' && (
            <div className="flex justify-end gap-2">
              <Button onClick={() => handleUpdateStatus('completed')} disabled={isProcessing} className="bg-teal-600 hover:bg-teal-700">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Selesaikan Pesanan
              </Button>
            </div>
          )}

          {/* ZONA PEMBATALAN */}
          {['pending', 'waiting_payment', 'paid'].includes(order.status) && (
            <div className="mt-6 pt-4 border-t border-dashed">
              <p className="text-xs font-bold text-red-600 mb-2">Zona Bahaya: Pembatalan</p>
              <div className="flex gap-2">
                <Input placeholder="Alasan pembatalan (misal: Stok Habis)..." value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
                <Button variant="destructive" onClick={handleCancelOrder} disabled={isProcessing || !cancelReason}>Batalkan Pesanan</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}