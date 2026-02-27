import api from '@/lib/api';
import type { CampaignEvent, CreateCampaignPayload } from '@/types/marketing.types';

const CampaignsService = {
  async getAllAdmin(): Promise<CampaignEvent[]> {
    const { data } = await api.get<CampaignEvent[]>('/marketing/events/admin/all');
    return data;
  },

  async create(payload: CreateCampaignPayload): Promise<CampaignEvent> {
    const { data } = await api.post<CampaignEvent>('/marketing/events', payload);
    return data;
  },

  async update(id: string | number, payload: Partial<CreateCampaignPayload>): Promise<CampaignEvent> {
    const { data } = await api.patch<CampaignEvent>(`/marketing/events/${id}`, payload);
    return data;
  },

  async delete(id: string | number): Promise<void> {
    await api.delete(`/marketing/events/${id}`);
  },
};

export default CampaignsService;