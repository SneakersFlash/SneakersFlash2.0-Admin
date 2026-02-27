import api from '@/lib/api';
import type { Brand, CreateBrandPayload } from '@/types/master.types';

const BrandsService = {
  async getAll(): Promise<Brand[]> {
    const { data } = await api.get<Brand[]>('/brands');
    return data;
  },

  async create(payload: CreateBrandPayload): Promise<Brand> {
    const { data } = await api.post<Brand>('/brands', payload);
    return data;
  },

  async update(id: string | number, payload: CreateBrandPayload): Promise<Brand> {
    const { data } = await api.patch<Brand>(`/brands/${id}`, payload);
    return data;
  },

  async delete(id: string | number): Promise<void> {
    await api.delete(`/brands/${id}`);
  },
};

export default BrandsService;