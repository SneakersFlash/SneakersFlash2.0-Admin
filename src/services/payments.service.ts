import api from '@/lib/api';
import type { PaymentLogResponse, GetPaymentLogsParams } from '@/types/payment.types';

const PaymentsService = {
  async getAll(params: GetPaymentLogsParams = {}): Promise<PaymentLogResponse> {
    const { data } = await api.get<PaymentLogResponse>('/payment/admin/logs', { params });
    return data;
  },

  async exportLogs(params: Omit<GetPaymentLogsParams, 'page' | 'limit'> = {}): Promise<void> {
    const response = await api.get('/payment/admin/logs/export', {
      params,
      responseType: 'blob',
    });

    const disposition: string = response.headers['content-disposition'] ?? '';
    const filenameMatch = disposition.match(/filename="?([^";\n]+)"?/);
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = filenameMatch?.[1] ?? `payment-logs-${today}.csv`;

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default PaymentsService;
