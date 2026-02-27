import api from '@/lib/api';
import type { Category, CreateCategoryPayload } from '@/types/master.types';

const CategoriesService = {
    async getAll(): Promise<Category[]> {
        const { data } = await api.get<Category[]>('/categories');
        return data;
    },

    async create(payload: CreateCategoryPayload): Promise<Category> {
        const { data } = await api.post<Category>('/categories', payload);
        return data;
    },

    async update(id: string | number, payload: CreateCategoryPayload): Promise<Category> {
        const { data } = await api.patch<Category>(`/categories/${id}`, payload);
        return data;
    },

    async delete(id: string | number): Promise<void> {
        await api.delete(`/categories/${id}`);
    },
};

export default CategoriesService;