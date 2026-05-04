export type TransactionStatus =
  | 'settlement'
  | 'capture'
  | 'pending'
  | 'deny'
  | 'cancel'
  | 'expire'
  | 'failure'
  | 'refund';

export interface PaymentLog {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  orderStatus: string;
  finalAmount: number;
  paymentType: string;
  transactionId: string;
  transactionStatus: TransactionStatus;
  grossAmount: number | null;
  createdAt: string;
}

export interface PaymentLogMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaymentLogResponse {
  data: PaymentLog[];
  meta: PaymentLogMeta;
}

export interface GetPaymentLogsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  paymentType?: string;
  dateFrom?: string;
  dateTo?: string;
}
