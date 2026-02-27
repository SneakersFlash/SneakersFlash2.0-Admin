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
}