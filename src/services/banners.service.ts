import api from '@/lib/api';
import type { Banner, CreateBannerPayload } from '@/types/cms.types';

const BannersService = {
  // Menggunakan endpoint khusus admin
  async getAllAdmin(): Promise<Banner[]> {
    const { data } = await api.get<Banner[]>('/banners/admin/all');
    return data;
  },

  async create(payload: CreateBannerPayload): Promise<Banner> {
    const { data } = await api.post<Banner>('/banners', payload);
    return data;
  },

  async update(id: string | number, payload: Partial<CreateBannerPayload>): Promise<Banner> {
    const { data } = await api.patch<Banner>(`/banners/${id}`, payload);
    return data;
  },

  async delete(id: string | number): Promise<void> {
    await api.delete(`/banners/${id}`);
  },
};

export default BannersService;