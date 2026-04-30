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

  async syncFromSheet(id: string | number, payload: { sheetUrl: string; sheetName?: string, skuPrefix?: string }): Promise<{status: string, message: string, warning?: string}> {
    const { data } = await api.post(`/marketing/events/admin/${id}/sync-sheet`, payload);
    return data;
  },
  
  async getEventProducts(eventId: string | number, params?: any): Promise<{ data: any[], meta: any }> {
    const response = await api.get(`/marketing/events/admin/${eventId}/products`, {
      params: params
    });
    return response.data;
  },

  async removeEventProduct(eventId: string | number, variantId: string | number): Promise<void> {
    await api.delete(`/marketing/events/admin/${eventId}/products/${variantId}`);
  },
};

export default CampaignsService;