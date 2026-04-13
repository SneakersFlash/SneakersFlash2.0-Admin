export interface CampaignEvent {
  id: string | number;
  title: string;
  slug: string;
  bannerDesktopUrl?: string | null;
  bannerMobileUrl?: string | null;
  contentHtml?: string | null;
  styleConfig?: Record<string, any> | null;
  startAt: string;
  endAt: string;
  isActive: boolean;
  isTimer: boolean;
  sort: number;
  _count?: {
    eventProducts: number;
  };
}

export interface CreateCampaignPayload {
  title: string;
  slug: string;
  bannerDesktopUrl?: string;
  bannerMobileUrl?: string;
  contentHtml?: string;
  styleConfig?: Record<string, any>;
  startAt: string;
  endAt: string;
  isActive?: boolean;
  isTimer?: boolean;
  sort?: number
}

// --- TAMBAHKAN DI BAWAH FILE ---

export interface PromoCampaign {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  totalBudgetLimit?: number | null;
  totalUsedBudget: number;
  startAt: string;
  endAt: string;
  isActive: boolean;
}

export interface CreatePromoCampaignPayload {
  name: string;
  description?: string;
  totalBudgetLimit?: number;
  startAt: string;
  endAt: string;
  isActive?: boolean;
}