/**
 * src/services/vouchers.service.ts
 */
import api from '@/lib/api';
import type {
  Voucher, CreateVoucherDto, BulkCreateVoucherDto,
} from '@/types';
import type { PaginatedResponse, PaginationParams } from '@/types/api.types';

export const VoucherService = {
  async getAll(params?: PaginationParams): Promise<PaginatedResponse<Voucher>> {
    const { data } = await api.get<PaginatedResponse<Voucher>>('/vouchers', { params });
    return data;
  },

  async getById(id: string): Promise<Voucher> {
    const { data } = await api.get<Voucher>(`/vouchers/${id}`);
    return data;
  },

  async create(dto: CreateVoucherDto): Promise<Voucher> {
    const { data } = await api.post<Voucher>('/vouchers', dto);
    return data;
  },

  async bulkCreate(dto: BulkCreateVoucherDto): Promise<Voucher[]> {
    const { data } = await api.post<Voucher[]>('/vouchers/bulk', dto);
    return data;
  },

  async update(id: string, dto: Partial<CreateVoucherDto>): Promise<Voucher> {
    const { data } = await api.patch<Voucher>(`/vouchers/${id}`, dto);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/vouchers/${id}`);
  },

  async deactivate(id: string): Promise<Voucher> {
    const { data } = await api.patch<Voucher>(`/vouchers/${id}`, { status: 'INACTIVE' });
    return data;
  },
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * src/services/campaigns.service.ts
 */
import type { Campaign, CreateCampaignDto } from '@/types';

export const CampaignService = {
  async getAll(params?: PaginationParams): Promise<PaginatedResponse<Campaign>> {
    const { data } = await api.get<PaginatedResponse<Campaign>>('/campaigns', { params });
    return data;
  },

  async getById(id: string): Promise<Campaign> {
    const { data } = await api.get<Campaign>(`/campaigns/${id}`);
    return data;
  },

  async create(dto: CreateCampaignDto): Promise<Campaign> {
    const { data } = await api.post<Campaign>('/campaigns', dto);
    return data;
  },

  async update(id: string, dto: Partial<CreateCampaignDto>): Promise<Campaign> {
    const { data } = await api.patch<Campaign>(`/campaigns/${id}`, dto);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/campaigns/${id}`);
  },

  async publish(id: string): Promise<Campaign> {
    const { data } = await api.patch<Campaign>(`/campaigns/${id}/publish`);
    return data;
  },
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * src/services/inventory.service.ts
 */
import type {
  InventoryItem, StockAdjustmentDto, StockHistory,
} from '@/types';

export const InventoryService = {
  async getAll(params?: { lowStock?: boolean; search?: string }): Promise<InventoryItem[]> {
    const { data } = await api.get<InventoryItem[]>('/inventory', { params });
    return data;
  },

  async adjust(dto: StockAdjustmentDto): Promise<InventoryItem> {
    const { data } = await api.patch<InventoryItem>(
      `/inventory/${dto.variantId}/adjust`,
      { adjustment: dto.adjustment, reason: dto.reason, notes: dto.notes },
    );
    return data;
  },

  async getHistory(variantId: string): Promise<StockHistory[]> {
    const { data } = await api.get<StockHistory[]>(`/inventory/${variantId}/history`);
    return data;
  },
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * src/services/logistics.service.ts
 */
import type {
  ShippingRate, CheckShippingRateDto, PickupRequest,
} from '@/types';

export const LogisticsService = {
  async checkRates(dto: CheckShippingRateDto): Promise<ShippingRate[]> {
    const { data } = await api.post<ShippingRate[]>('/logistics/rates', dto);
    return data;
  },

  async requestPickup(orderId: string): Promise<PickupRequest> {
    const { data } = await api.post<PickupRequest>('/logistics/pickup', { orderId });
    return data;
  },

  async getPickups(params?: PaginationParams): Promise<PaginatedResponse<PickupRequest>> {
    const { data } = await api.get<PaginatedResponse<PickupRequest>>(
      '/logistics/pickups',
      { params },
    );
    return data;
  },

  async trackAWB(awbNumber: string, courier: string): Promise<unknown> {
    const { data } = await api.get(`/logistics/tracking/${awbNumber}`, {
      params: { courier },
    });
    return data;
  },
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * src/services/notifications.service.ts
 */
import type {
  SendNotificationDto, NotificationLog,
} from '@/types';

export const NotificationService = {
  async send(dto: SendNotificationDto): Promise<{ sent: number; failed: number }> {
    const { data } = await api.post('/notifications/send', dto);
    return data;
  },

  async getHistory(params?: PaginationParams): Promise<PaginatedResponse<NotificationLog>> {
    const { data } = await api.get<PaginatedResponse<NotificationLog>>(
      '/notifications/history',
      { params },
    );
    return data;
  },
};
