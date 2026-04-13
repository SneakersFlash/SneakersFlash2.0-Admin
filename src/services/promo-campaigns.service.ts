import api from '@/lib/api';
import type { PromoCampaign, CreatePromoCampaignPayload } from '@/types/marketing.types';

const PromoCampaignsService = {
    async getAll(): Promise<PromoCampaign[]> {
        const { data } = await api.get<PromoCampaign[]>('/campaigns');
        return data;
    },

    async getActive(): Promise<PromoCampaign[]> {
        const { data } = await api.get<PromoCampaign[]>('/campaigns/active');
        return data;
    },

    async create(payload: CreatePromoCampaignPayload): Promise<PromoCampaign> {
        const { data } = await api.post<PromoCampaign>('/campaigns', payload);
        return data;
    },

    async update(id: string | number, payload: Partial<CreatePromoCampaignPayload>): Promise<PromoCampaign> {
        const { data } = await api.patch<PromoCampaign>(`/campaigns/${id}`, payload);
        return data;
    },

    async delete(id: string | number): Promise<void> {
        await api.delete(`/campaigns/${id}`);
    },

    async getById(id: string | number): Promise<any> {
        const { data } = await api.get(`/campaigns/${id}`);
        return data;
    },
};

export default PromoCampaignsService;