export type TransactionStatus = 
  | 'settlement' // Berhasil/Lunas
  | 'capture'    // Berhasil (Kartu Kredit)
  | 'pending'    // Menunggu Pembayaran
  | 'deny'       // Ditolak
  | 'cancel'     // Dibatalkan
  | 'expire'     // Kedaluwarsa
  | 'failure'    // Gagal
  | 'refund';    // Dikembalikan

export interface PaymentLog {
    id: string | number;
    orderId: string | number;     // ID Pesanan internal
    transactionId: string;        // ID Transaksi dari Midtrans
    grossAmount: number;
    paymentType: string;          // bank_transfer, gopay, qris, dll.
    transactionStatus: TransactionStatus;
    fraudStatus?: string;
    createdAt: string;
    updatedAt?: string;
    order?: {
        orderNumber: string;
        user?: {
        name: string;
        }
    }
}