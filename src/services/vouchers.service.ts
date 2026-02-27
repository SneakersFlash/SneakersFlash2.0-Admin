import api from '@/lib/api';
import type { Voucher, CreateVoucherPayload } from '@/types/voucher.types';

const VouchersService = {
  async getAll(): Promise<Voucher[]> {
    const { data } = await api.get<Voucher[]>('/vouchers');
    return data;
  },

  async create(payload: CreateVoucherPayload): Promise<Voucher> {
    const { data } = await api.post<Voucher>('/vouchers', payload);
    return data;
  },

  async update(id: string | number, payload: Partial<CreateVoucherPayload>): Promise<Voucher> {
    const { data } = await api.patch<Voucher>(`/vouchers/${id}`, payload);
    return data;
  },

  async delete(id: string | number): Promise<void> {
    await api.delete(`/vouchers/${id}`);
  }
};

export default VouchersService;