// src/components/module/order/OrderDetailModal.tsx
import { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle2, User, MapPin, Phone, Printer, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import OrdersService, { LionParcelTrackingResult, type TrackingResult } from '@/services/orders.service';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/api';
import { ORDER_STATUS_CONFIG } from '@/lib/constants';
import { getLionStatus, isLionParcelDelivered, isLionParcelProblem, LION_STATUS_CLASSES, LION_JOURNEY_TYPE } from '@/lib/constants/lionParcelStatus';
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
  const [trackingData, setTrackingData] = useState<LionParcelTrackingResult | TrackingResult | null>(null);
  const [deeplinkInput, setDeeplinkInput] = useState('');
  const [isSavingDeeplink, setIsSavingDeeplink] = useState(false);
  const [komerceStatus, setKomerceStatus] = useState<{ driverName?: string; driverPhone?: string } | null>(null);

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
    setDeeplinkInput(order?.deeplinkUrl || '');
    setCancelReason('');
    setTrackingData(null);
    setKomerceStatus(null);

    // Auto-fetch Komerce live tracking URL untuk instant courier
    const courierUpper = (order?.courier?.name || order?.courierName || '').toUpperCase();
    const isInstant = courierUpper.includes('GOSEND') || courierUpper.includes('GRAB');
    if (isInstant && order?.komerceOrderId) {
      api.get(`/logistics/komerce-detail/${order.komerceOrderId}`)
        .then(({ data }) => {
          setKomerceStatus({ driverName: data.driverName, driverPhone: data.driverPhone });
          if (data.liveTrackingUrl && !order.deeplinkUrl) {
            setDeeplinkInput(data.liveTrackingUrl);
            // Auto-simpan ke DB jika belum ada
            OrdersService.updateDeeplinkUrl(String(order.id), data.liveTrackingUrl).catch(() => {});
          }
        })
        .catch(() => {});
    }
  }, [order]);

  if (!order) return null;

  const statusConf = ORDER_STATUS_CONFIG[order.status as OrderStatus];

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    const isLionParcelOrder = order.shippingProvider === 'LION_PARCEL';
    // LP orders sudah punya STT dari backend — skip validasi resi manual
    if (newStatus === 'shipped' && !isLionParcelOrder && !trackingNumber.trim()) {
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

  // Cetak label Lion Parcel — buka URL genesis LP (label resmi LP)
  const handlePrintLabelLP = () => {
    const stt = order.trackingNumber || order.courier?.trackingNumber || order.awbTrackingNumber;
    if (!stt) return toast.error('STT Lion Parcel belum tersedia.');
    window.open(`https://genesis.lionparcel.com/print/stt?q=${stt}&client=40477`, '_blank', 'noopener,noreferrer');
  };

  // Cetak label custom Sneakers Flash (untuk non-LP: instant, Komerce reguler)
  const handlePrintLabelSF = () => {
    const resi    = order.trackingNumber || order.courier?.trackingNumber || order.awbTrackingNumber || '-';
    const courier = order.courier?.name || order.courierName || '-';
    const items   = (order.items || []).map((i: any) =>
      `${i.productName}${i.variantSku ? ` - ${i.variantSku}` : ''}`
    ).join('<br>');
    const address = [
      order.address?.street,
      order.address?.subdistrict ? `Kec. ${order.address.subdistrict}` : '',
      order.address?.city,
      order.address?.province,
      order.address?.postalCode,
    ].filter(Boolean).join(', ');

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Label Pengiriman - ${order.orderNumber}</title>
<style>
  @page { margin: 12mm; size: A5; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 11pt; color: #000; background: #fff; }
  .logo { text-align: center; margin-bottom: 10px; }
  .logo img { max-height: 60px; max-width: 160px; object-fit: contain; }
  .courier { text-align: center; font-size: 22pt; font-weight: 900; letter-spacing: 2px; margin: 8px 0 14px; text-transform: uppercase; }
  hr { border: none; border-top: 1.5px solid #000; margin: 10px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 4px 3px; vertical-align: top; line-height: 1.4; }
  td.label { font-weight: bold; width: 140px; white-space: nowrap; }
  td.colon { width: 12px; }
  .resi { font-family: monospace; font-size: 10pt; font-weight: bold; }
  @media print { body { -webkit-print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="logo">
  <img src="/images/Logo.png" alt="Sneakers Flash" onerror="this.outerHTML='<h2 style=font-size:18pt;font-weight:900;letter-spacing:1px>SNKRS FLASH</h2>'" />
</div>
<div class="courier">${courier}</div>
<hr>
<table>
  <tr><td class="label">NAMA</td><td class="colon">:</td><td>${order.address?.recipientName || '-'}</td></tr>
  <tr><td class="label">NO TEL/HP</td><td class="colon">:</td><td>${order.address?.phone || '-'}</td></tr>
  <tr><td class="label">ALAMAT</td><td class="colon">:</td><td>${address || '-'}</td></tr>
</table>
<hr>
<table>
  <tr><td class="label">No Orderan</td><td class="colon">:</td><td class="resi">${order.orderNumber}</td></tr>
</table>
<hr>
<table>
  <tr><td class="label">PENGIRIM</td><td class="colon">:</td><td>Sneakers Flash</td></tr>
  <tr><td class="label"></td><td class="colon">:</td><td>081280642219</td></tr>
  <tr><td class="label">BARANG YG DIKIRIM</td><td class="colon">:</td><td>${items || '-'}</td></tr>
  ${resi !== '-' ? `<tr><td class="label">NO RESI</td><td class="colon">:</td><td class="resi">${resi}</td></tr>` : ''}
</table>
<script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return toast.error('Pop-up diblokir browser. Izinkan pop-up dan coba lagi.');
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Router: LP pakai genesis LP, non-LP pakai custom SF label
  const handlePrintLabel = () => {
    if (order.shippingProvider === 'LION_PARCEL') return handlePrintLabelLP();
    return handlePrintLabelSF();
  };

  const handleSaveDeeplink = async () => {
    if (!deeplinkInput.trim()) return toast.error('Masukkan URL tracking terlebih dahulu.');
    try {
      setIsSavingDeeplink(true);
      await OrdersService.updateDeeplinkUrl(String(order.id), deeplinkInput.trim());
      toast.success('Link tracking berhasil disimpan');
      onRefresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSavingDeeplink(false);
    }
  };

  const handleTrackOrder = async () => {
    const isLionParcel = order.shippingProvider === 'LION_PARCEL';

    // LP order: gunakan STT number (99LP...) bukan stt_id (angka)
    const awb = isLionParcel
      ? (order.trackingNumber || order.courier?.trackingNumber || order.awbTrackingNumber)
      : (order.awb || order.trackingNumber || order.courier?.trackingNumber);

    const courier = (order.courierName || order.courier?.name || '').toLowerCase();

    if (!awb) return toast.error('Nomor resi belum tersedia untuk pesanan ini.');
    if (!isLionParcel && !courier) return toast.error('Nama kurir tidak ditemukan.');

    try {
      setIsProcessing(true);
      const result = await OrdersService.trackAny({
        awb,
        courier,
        shippingProvider: order.shippingProvider ?? null,
      });
      setTrackingData(result as LionParcelTrackingResult | TrackingResult);
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
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <p className="text-gray-600 text-xs">
                    Ongkir dibayar: <span className="font-medium">Rp {Number(order.shippingCost || order.courier?.cost || 0).toLocaleString('id-ID')}</span>
                  </p>
                  {/* Tampilkan tarif LP jika tracking sudah dimuat dan ada selisih */}
                  {trackingData && (trackingData as any).chargeable_total_tariff > 0 &&
                   (trackingData as any).chargeable_total_tariff !== Number(order.shippingCost || 0) && (
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                      LP tagih: Rp {Number((trackingData as any).chargeable_total_tariff).toLocaleString('id-ID')}
                    </span>
                  )}
                </div>
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
          {order.status === 'processing' && (() => {
            const courierUpper = (order.courier?.name || order.courierName || '').toUpperCase();
            const isInstant = courierUpper.includes('GOSEND') || courierUpper.includes('GRAB');
            const isLP = order.shippingProvider === 'LION_PARCEL';
            return (
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 flex flex-col gap-3">
                {isLP ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-indigo-900">Pesanan Lion Parcel</label>
                      <p className="text-xs text-indigo-700">STT: <span className="font-mono font-bold">{order.trackingNumber || order.lionParcelSttId || '-'}</span></p>
                      <p className="text-xs text-indigo-700">Kemas barang, cetak label, kurir LP akan pickup.</p>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <Button variant="outline" onClick={handlePrintLabel} disabled={isProcessing} className="bg-white text-blue-600 border-blue-200 hover:bg-blue-50 w-1/2">
                        <Printer className="w-4 h-4 mr-2" /> Cetak Label
                      </Button>
                      <Button onClick={() => handleUpdateStatus('shipped')} disabled={isProcessing} className="bg-indigo-600 hover:bg-indigo-700 shadow-sm flex-1">
                        <Truck className="w-4 h-4 mr-2" /> Tandai Dikirim
                      </Button>
                    </div>
                  </>
                ) : isInstant ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-indigo-900">Kurir Instant ({courierUpper})</label>
                      <p className="text-xs text-indigo-700">Kemas barang dan cetak label. Tempel link tracking Gosend/Grab di bawah (opsional).</p>
                    </div>
                    {komerceStatus?.driverName && (
                      <p className="text-xs text-indigo-700">
                        Driver: <span className="font-semibold">{komerceStatus.driverName}</span>
                        {komerceStatus.driverPhone ? ` · ${komerceStatus.driverPhone}` : ''}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://gosend.id/track/... atau link Grab"
                        value={deeplinkInput}
                        onChange={(e) => setDeeplinkInput(e.target.value)}
                        className="text-xs bg-white"
                      />
                      <Button variant="outline" onClick={handleSaveDeeplink} disabled={isSavingDeeplink} className="bg-white text-indigo-600 border-indigo-200 whitespace-nowrap text-xs px-3">
                        Simpan Link
                      </Button>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <Button variant="outline" onClick={handlePrintLabel} disabled={isProcessing} className="bg-white text-blue-600 border-blue-200 hover:bg-blue-50 w-1/3">
                        <Printer className="w-4 h-4 mr-2" /> Cetak Label
                      </Button>
                      <Button onClick={() => handleUpdateStatus('shipped')} disabled={isProcessing} className="bg-indigo-600 hover:bg-indigo-700 shadow-sm flex-1">
                        <Truck className="w-4 h-4 mr-2" /> Tandai Dikirim
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-indigo-900">Pesanan Siap Dikirim?</label>
                      <p className="text-xs text-indigo-700">Kemas barang, cetak label resi, lalu panggil kurir Komerce.</p>
                    </div>
                    <div className="flex gap-2 mt-1">
                      {order.komerceOrderId && (
                        <Button variant="outline" onClick={handlePrintLabel} disabled={isProcessing} className="bg-white text-blue-600 border-blue-200 hover:bg-blue-50 w-1/3">
                          <Printer className="w-4 h-4 mr-2" /> Cetak Label
                        </Button>
                      )}
                      <Button onClick={handleKomercePickup} disabled={isProcessing} className="bg-indigo-600 hover:bg-indigo-700 shadow-sm flex-1">
                        <Truck className="w-4 h-4 mr-2" /> Panggil Kurir (Pickup)
                      </Button>
                    </div>
                  </>
                )}
              </div>
            );
          })()}

          {/* SHIPPED -> DELIVERED */}
          {order.status === 'shipped' && (
            <div className="space-y-4">
              {/* Deeplink input untuk instant courier di status shipped */}
              {(() => {
                const courierUpper = (order.courier?.name || order.courierName || '').toUpperCase();
                const isInstant = courierUpper.includes('GOSEND') || courierUpper.includes('GRAB');
                if (!isInstant) return null;
                return (
                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 flex flex-col gap-2">
                    <label className="text-xs font-bold text-orange-800">Link Tracking Kurir Instant</label>
                    {order.deeplinkUrl && (
                      <a href={order.deeplinkUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 underline break-all">{order.deeplinkUrl}</a>
                    )}
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://gosend.id/track/..."
                        value={deeplinkInput}
                        onChange={(e) => setDeeplinkInput(e.target.value)}
                        className="text-xs bg-white"
                      />
                      <Button variant="outline" onClick={handleSaveDeeplink} disabled={isSavingDeeplink} className="bg-white text-orange-600 border-orange-200 whitespace-nowrap text-xs px-3">
                        Simpan
                      </Button>
                    </div>
                  </div>
                );
              })()}

              <div className="flex flex-col md:flex-row md:items-center justify-between bg-gray-50 p-4 rounded-lg border gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nomor Resi Pengiriman</p>
                  <p className="font-bold text-lg font-mono tracking-wider text-gray-900">{order.trackingNumber || trackingNumber || '-'}</p>
                </div>

                <div className="flex flex-wrap gap-1">
                  <Button variant="outline" onClick={handlePrintLabel} disabled={isProcessing} className="text-blue-600 border-blue-200 hover:bg-blue-50 bg-white">
                    <Printer className="w-4 h-4 mr-2" /> Cetak Label
                  </Button>

                  {/* Tombol Lacak Pesanan */}
                  <Button variant="outline" onClick={handleTrackOrder} disabled={isProcessing} className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 bg-white">
                    <MapPin className="w-4 h-4 mr-2" /> Lacak Pesanan
                  </Button>
                  
                  <Button variant="outline" onClick={() => handleUpdateStatus('delivered')} disabled={isProcessing} className="text-green-600 border-green-200 hover:bg-green-50 bg-white">
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Tandai Terkirim
                  </Button>
                </div>
              </div>

              {/* TAMPILAN TIMELINE TRACKING (Lion Parcel) */}
              {trackingData && 'history' in trackingData && (() => {
                const lpData  = trackingData as LionParcelTrackingResult;
                const history: any[] = lpData.history ?? [];
                const bkdEvent      = history.find((ev: any) => ev.status_code === 'BKD' && !ev.stt_journey_type);
                const adjustedEvent = history.find((ev: any) =>
                  ev.status_code === 'STT ADJUSTED' || ev.status_code === 'STT ADJUSTED POD'
                );
                const hasTariffChange = !!(adjustedEvent && bkdEvent && adjustedEvent.total_tariff > 0);
                const originalTariff  = bkdEvent?.total_tariff ?? 0;
                const newTariff       = adjustedEvent?.total_tariff ?? 0;
                const tariffDiff      = newTariff - originalTariff;
                const bookedWeightKg  = adjustedEvent?.request_gross_weight_kg;
                const actualWeightKg  = adjustedEvent?.chargeable_weight;
                const grossWeightKg   = adjustedEvent?.total_gross_weight;
                const volumeWeightKg  = adjustedEvent?.total_volume_weight;
                const adjustmentPhotos: string[] = adjustedEvent?.attachment?.filter(Boolean) ?? [];
                const fmtPrice = (n: number) =>
                  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
                const fmtDt = (iso: string) => {
                  if (!iso) return '';
                  const d = new Date(iso);
                  const p = (n: number) => String(n).padStart(2, '0');
                  return `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
                };
                const extractResi = (remarks: string) => {
                  const m = remarks?.match(/RESI\s+(?:TERBARU|BARU)\s+([A-Z0-9]+)/i);
                  return m?.[1] ?? null;
                };
                const TRANS_CODES = new Set(['REROUTE', 'RTS', 'RTSHQ', 'CNX', 'SCRAP']);
                const sections: { type: string; journeyType?: string; events?: any[]; event?: any }[] = [];
                let curJT: string | null = null;
                let curEvs: any[] = [];
                const flush = () => { if (curEvs.length) { sections.push({ type: 'journey', journeyType: curJT ?? '', events: [...curEvs] }); curEvs = []; } };
                for (const ev of history) {
                  const jt = ev.stt_journey_type || '';
                  if (TRANS_CODES.has(ev.status_code) && !ev.stt_journey_type) { flush(); sections.push({ type: 'transition', event: ev }); curJT = null; }
                  else if (jt !== curJT) { flush(); curJT = jt; curEvs.push(ev); }
                  else { curEvs.push(ev); }
                }
                flush();
                const jLabelMap: Record<string, { label: string; cls: string }> = {
                  reroute:          { label: 'Pengiriman Ulang (Reroute)',   cls: 'bg-orange-50 text-orange-700 border-orange-200' },
                  return:           { label: 'Perjalanan Retur ke Pengirim', cls: 'bg-red-50 text-red-700 border-red-200' },
                  returnhq:         { label: 'Retur ke Lion Parcel HQ',      cls: 'bg-red-50 text-red-700 border-red-200' },
                  cancel:           { label: 'Pengembalian (Cancel)',         cls: 'bg-red-50 text-red-700 border-red-200' },
                  'return-reroute': { label: 'Retur + Alamat Baru',          cls: 'bg-red-50 text-red-700 border-red-200' },
                };
                return (
                  <div className="bg-white border rounded-lg p-4 animate-in fade-in slide-in-from-top-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Truck className="w-4 h-4" /> Riwayat Perjalanan Paket
                      </h4>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {lpData.current_status && (() => { const cfg = getLionStatus(lpData.current_status); const cls = LION_STATUS_CLASSES[cfg.color]; return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cls.badge}`}>{cfg.label}</span>; })()}
                        {(() => { const jt = history[0]?.stt_journey_type; const jtCfg = jt ? LION_JOURNEY_TYPE[jt] : null; if (!jtCfg) return null; return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${LION_STATUS_CLASSES[jtCfg.color].badge}`}>{jtCfg.label}</span>; })()}
                        <span className="text-xs text-gray-400">Lion Parcel · {lpData.product_type}</span>
                      </div>
                    </div>
                    {(lpData.origin || lpData.destination) && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                        <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-700">{lpData.origin}</span>
                        <span className="text-gray-300">→</span>
                        <span className="font-medium text-gray-700">{lpData.destination}</span>
                      </div>
                    )}

                    {/* ── Perbandingan Ongkir: dibayar vs ditagih LP ─────── */}
                    {(() => {
                      const paidShipping  = Number(order.shippingCost || order.courier?.cost || 0);
                      const chargedByLP   = Number((trackingData as any).chargeable_total_tariff || 0);
                      if (chargedByLP <= 0 || chargedByLP === paidShipping) return null;
                      const diff = chargedByLP - paidShipping;

                      // Deteksi penyebab selisih
                      const hasRTS      = history.some((ev: any) => ev.status_code === 'RTS');
                      const hasReroute  = history.some((ev: any) => ev.status_code === 'REROUTE');
                      const hasAdjusted = history.some((ev: any) => ev.status_code === 'STT ADJUSTED' || ev.status_code === 'STT ADJUSTED POD');

                      const reasons: string[] = [];
                      if (hasRTS)      reasons.push('biaya retur ke pengirim');
                      if (hasReroute)  reasons.push('biaya pengiriman ulang');
                      if (hasAdjusted) reasons.push('penyesuaian berat/dimensi');

                      return (
                        <div className="p-3 rounded-lg border border-orange-200 bg-orange-50">
                          <p className="text-[10px] font-bold text-orange-700 uppercase tracking-widest mb-2">
                            ⚠ Perubahan Ongkir Lion Parcel
                          </p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2">
                            <span className="text-gray-500">Ongkir dibayar customer</span>
                            <span className="font-semibold text-gray-700">{fmtPrice(paidShipping)}</span>
                            <span className="text-gray-500">Total tarif Lion Parcel</span>
                            <span className="font-bold text-orange-700">{fmtPrice(chargedByLP)}</span>
                          </div>
                          <div className={`flex items-center gap-2 pt-2 border-t border-orange-200 ${diff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            <span className="text-[11px] font-bold">
                              {diff > 0 ? 'Kelebihan tagih' : 'Lebih bayar'}:
                              <span className="ml-1 font-mono">{diff > 0 ? '+' : ''}{fmtPrice(diff)}</span>
                            </span>
                          </div>
                          {reasons.length > 0 && (
                            <p className="text-[10px] text-orange-600 mt-1.5">
                              Termasuk: {reasons.join(', ')}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                    {hasTariffChange && (
                      <div className="p-3 rounded-lg border border-amber-200 bg-amber-50">
                        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Tarif & Berat Disesuaikan</p>
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="text-xs text-gray-400 line-through">{fmtPrice(originalTariff)}</span>
                          <span className="text-gray-300">→</span>
                          <span className="text-sm font-bold text-amber-700">{fmtPrice(newTariff)}</span>
                          {tariffDiff !== 0 && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${tariffDiff > 0 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'}`}>{tariffDiff > 0 ? '+' : ''}{fmtPrice(tariffDiff)}</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-[11px]">
                          {bookedWeightKg != null && <><span className="text-gray-400">Berat booking</span><span className="font-medium text-gray-600">{bookedWeightKg} kg</span></>}
                          {actualWeightKg != null && <><span className="text-gray-400">Berat aktual</span><span className={`font-bold ${bookedWeightKg != null && actualWeightKg > bookedWeightKg ? 'text-red-600' : 'text-gray-700'}`}>{actualWeightKg} kg</span></>}
                          {grossWeightKg != null && <><span className="text-gray-400">Gross weight</span><span className="font-medium text-gray-600">{grossWeightKg} kg</span></>}
                          {volumeWeightKg != null && <><span className="text-gray-400">Volume weight</span><span className="font-medium text-gray-600">{volumeWeightKg} kg</span></>}
                        </div>
                        {adjustmentPhotos.length > 0 && <div className="mt-2 flex gap-2 flex-wrap">{adjustmentPhotos.map((url, i) => <a key={i} href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt={`Bukti ${i+1}`} className="w-14 h-14 object-cover rounded-lg border border-amber-200 hover:opacity-80 transition-opacity" onError={(e) => { e.currentTarget.style.display = 'none'; }} /></a>)}</div>}
                      </div>
                    )}
                    <div className="space-y-4">
                      {sections.map((section, si) => {
                        if (section.type === 'transition') {
                          const ev = section.event!; const cfg = getLionStatus(ev.status_code); const cls = LION_STATUS_CLASSES[cfg.color]; const newResi = extractResi(ev.remarks || '');
                          return (
                            <div key={si} className={`rounded-lg px-4 py-3 border ${cls.badge} space-y-1`}>
                              <div className="flex items-center gap-2"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${cls.badge}`}>{ev.status_code}</span><span className="text-xs font-bold">{cfg.label}</span></div>
                              <p className="text-xs leading-relaxed">{ev.remarks}</p>
                              {newResi && <p className="text-xs font-semibold">Nomor resi baru: <span className="font-mono">{newResi}</span></p>}
                              <p className="text-[10px] opacity-70">{fmtDt(ev.datetime)} · {ev.city}</p>
                            </div>
                          );
                        }
                        const events = section.events!; const jt = section.journeyType!; const jInfo = jLabelMap[jt];
                        return (
                          <div key={si}>
                            {jt && jInfo && <div className={`flex items-center gap-2 mb-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${jInfo.cls}`}>{jInfo.label}</div>}
                            {!jt && si > 0 && (<div className="flex items-center gap-2 mb-3"><div className="flex-1 h-px bg-gray-100" /><span className="text-[10px] text-gray-400 uppercase tracking-widest whitespace-nowrap">Perjalanan Awal</span><div className="flex-1 h-px bg-gray-100" /></div>)}
                            <div className="relative pl-6 border-l-2 border-indigo-100 space-y-4">
                              {events.map((ev: any, idx: number) => {
                                const cfg = getLionStatus(ev.status_code || ev.current_status); const cls = LION_STATUS_CLASSES[cfg.color];
                                const isFirst = idx === 0 && si === 0; const isAdjusted = ev.status_code === 'STT ADJUSTED' || ev.status_code === 'STT ADJUSTED POD';
                                const isPOD = ev.status_code === 'POD'; const isDEL = ev.status_code === 'DEL';
                                const podPhotos: string[] = isPOD ? (ev.attachment?.filter(Boolean) ?? []) : [];
                                const receivedBy = isPOD ? (ev.received_by || ev.proof?.name) : null;
                                return (
                                  <div key={idx} className="relative">
                                    <div className={`absolute -left-[31px] w-4 h-4 rounded-full border-2 border-white ${isFirst ? cls.dot : 'bg-gray-300'}`} />
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${isFirst ? cls.badge : 'bg-gray-50 text-gray-400 border-gray-200'}`}>{ev.status_code}</span>
                                        <span className={`text-xs font-semibold ${isFirst ? 'text-gray-900' : 'text-gray-500'}`}>{cfg.label}</span>
                                        {ev.stt_journey_type && LION_JOURNEY_TYPE[ev.stt_journey_type] && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${isFirst ? LION_STATUS_CLASSES[LION_JOURNEY_TYPE[ev.stt_journey_type].color].badge : 'bg-gray-50 text-gray-400 border-gray-200'}`}>{LION_JOURNEY_TYPE[ev.stt_journey_type].label}</span>}
                                      </div>
                                      <p className={`text-xs leading-relaxed ${isFirst ? 'text-gray-700' : 'text-gray-400'}`}>{ev.remarks}</p>
                                      {(isDEL || isPOD) && ev.courier_name && <p className="text-[10px] text-gray-500">Kurir: <span className="font-medium">{ev.courier_name}</span></p>}
                                      {isPOD && receivedBy && <p className={`text-[10px] ${isFirst ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>Diterima oleh: {receivedBy}</p>}
                                      {isPOD && podPhotos.length > 0 && <div className="flex gap-2 mt-1 flex-wrap">{podPhotos.map((url: string, i: number) => <a key={i} href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt={`Bukti ${i+1}`} className="w-14 h-14 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity" onError={(e) => { e.currentTarget.style.display = 'none'; }} /></a>)}</div>}
                                      {isAdjusted && ev.total_tariff > 0 && <div className="text-[10px] text-amber-600 flex flex-wrap gap-x-3"><span>Tarif baru: <strong>{fmtPrice(ev.total_tariff)}</strong></span>{ev.chargeable_weight && <span>Berat: <strong>{ev.chargeable_weight} kg</strong></span>}{ev.total_volume_weight && <span>Volume: <strong>{ev.total_volume_weight} kg</strong></span>}</div>}
                                      <div className="flex items-center gap-2 text-[11px] text-gray-400"><span>{fmtDt(ev.datetime)}</span>{ev.city && <><span>·</span><span className="font-medium text-gray-500">{ev.city}</span></>}</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {isLionParcelDelivered(lpData.current_status) && (
                      <div className="pt-3 border-t border-dashed border-gray-200 text-xs text-gray-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        <span>Paket telah diterima oleh <span className="font-semibold text-gray-700">{lpData.recipient_name}</span></span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* TAMPILAN TIMELINE TRACKING (Komerce / RajaOngkir) */}
              {trackingData && (trackingData as any).manifest && (
                <div className="bg-white border rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Truck className="w-4 h-4" /> Riwayat Perjalanan Paket
                    </h4>
                    <div className="flex items-center gap-2">
                      {(trackingData as any).delivered && (
                        <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Terkirim
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {(trackingData as any).summary?.courier_name} · {(trackingData as any).summary?.service_code}
                      </span>
                    </div>
                  </div>
                  <div className="relative pl-6 border-l-2 border-indigo-100 space-y-5">
                    {((trackingData as any).manifest as any[]).map((item: any, idx: number) => (
                      <div key={idx} className="relative">
                        <div className={`absolute -left-[31px] w-4 h-4 rounded-full border-2 border-white ${idx === 0 ? 'bg-indigo-600' : 'bg-gray-300'}`} />
                        <p className={`text-xs font-semibold ${idx === 0 ? 'text-indigo-700' : 'text-gray-500'}`}>
                          {item.manifest_date} {item.manifest_time}
                          {item.city_name && <span className="text-gray-400 ml-1">· {item.city_name}</span>}
                        </p>
                        <p className={`text-sm ${idx === 0 ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>{item.manifest_description}</p>
                      </div>
                    ))}
                  </div>
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