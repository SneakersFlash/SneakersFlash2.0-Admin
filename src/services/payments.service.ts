import api from '@/lib/api';
import type { PaymentLog } from '@/types/payment.types';

const PaymentsService = {
  async getAll(): Promise<PaymentLog[]> {
    // Note: Jika backend kamu menggunakan path '/payments' (jamak), ganti di bawah ini.
    // Asumsi kita menggunakan path standar NestJS CRUD.
    const { data } = await api.get('/payment');
    
    // Jika backend mereturn objek { data: [...], meta: {...} } (pagination),
    // ubah menjadi return data.data;
    return Array.isArray(data) ? data : data?.data || [];
  },

  async getById(id: string | number): Promise<PaymentLog> {
    const { data } = await api.get<PaymentLog>(`/payment/${id}`);
    return data;
  }
};

export default PaymentsService;