import api from '@/lib/api';

// ─── Tipe ─────────────────────────────────────────────────────────────────────

export interface AttributionRow {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  visits: number;
  orders: number;
  paidOrders: number;
  revenue: number;
}

export interface AttributionReport {
  rows: AttributionRow[];
  total: Pick<AttributionRow, 'visits' | 'orders' | 'paidOrders' | 'revenue'>;
  campaigns: string[];
}

export interface AttributionQuery {
  from?: string;
  to?: string;
  campaign?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const attributionService = {
  async report(query: AttributionQuery): Promise<AttributionReport> {
    const { data } = await api.get<AttributionReport>('/admin/attribution/report', {
      params: query,
    });
    return data;
  },
};
