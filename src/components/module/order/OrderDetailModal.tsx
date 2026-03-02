import { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle2, User, MapPin, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import OrdersService from '@/services/orders.service';
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

  useEffect(() => {
    if (order?.courier?.trackingNumber) {
      setTrackingNumber(order.courier.trackingNumber);
    } else {
      setTrackingNumber('');
    }
    setCancelReason('');
  }, [order]);

  if (!order) return null;

  const statusConf = ORDER_STATUS_CONFIG[order.status as OrderStatus];

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (newStatus === 'shipped' && !trackingNumber.trim()) {
      return toast.error('Nomor Resi wajib diisi untuk mengirim barang!');
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
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
                <p className="font-semibold text-gray-900 uppercase">{order.courier?.name} - {order.courier?.service}</p>
                <p className="text-gray-600 text-xs mt-0.5">Ongkir: Rp {Number(order.courier?.cost || 0).toLocaleString('id-ID')}</p>
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
                    <p className="text-xs text-gray-500">Var: {item.variantSku} | Ukuran: {item.size} | Qty: {item.quantity}</p>
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    Rp {Number(item.subtotal).toLocaleString('id-ID')}
                  </div>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Pembayaran</span>
                <span className="font-bold text-emerald-600">Rp {Number(order.total).toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Area Aksi Status (Sesuai Logic Enum Baru) ─────────────────────── */}
        <div className="border-t pt-4 space-y-4">
          
          {/* PAID -> PROCESSING */}
          {order.status === 'paid' && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleCancelOrder} disabled={isProcessing}>Batalkan</Button>
              <Button onClick={() => handleUpdateStatus('processing')} disabled={isProcessing} className="bg-indigo-600 hover:bg-indigo-700">Terima & Proses Pesanan</Button>
            </div>
          )}

          {/* PROCESSING -> SHIPPED (Input Resi di sini) */}
          {order.status === 'processing' && (
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 flex flex-col gap-3">
              <div className="space-y-1">
                <label className="text-sm font-bold text-orange-900">Input Nomor Resi ({order.courier?.name})</label>
                <p className="text-xs text-orange-700">Pesanan telah diproses. Masukkan resi kurir untuk mengirim barang.</p>
              </div>
              <div className="flex gap-2">
                <Input 
                  placeholder="Contoh: JNT1234567890" 
                  value={trackingNumber} 
                  onChange={(e) => setTrackingNumber(e.target.value)} 
                  className="bg-white"
                />
                <Button onClick={() => handleUpdateStatus('shipped')} disabled={isProcessing || !trackingNumber} className="bg-orange-600 hover:bg-orange-700 whitespace-nowrap">
                  <Truck className="w-4 h-4 mr-2" /> Kirim Barang
                </Button>
              </div>
            </div>
          )}

          {/* SHIPPED -> DELIVERED */}
          {order.status === 'shipped' && (
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border">
              <div>
                <p className="text-sm text-gray-500">Nomor Resi Pengiriman</p>
                <p className="font-bold text-lg font-mono tracking-wider">{order.courier?.trackingNumber || trackingNumber || '-'}</p>
              </div>
              <Button variant="outline" onClick={() => handleUpdateStatus('delivered')} disabled={isProcessing} className="text-green-600 border-green-200 hover:bg-green-50">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Tandai Terkirim
              </Button>
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
          {['pending', 'waiting_payment', 'paid', 'processing'].includes(order.status) && order.status !== 'paid' && (
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