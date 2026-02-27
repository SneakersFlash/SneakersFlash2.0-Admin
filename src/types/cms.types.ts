export type BannerPosition = 'home_top' | 'home_middle' | 'category_page';

export interface Banner {
  id: number | string;
  title: string;
  imageDesktopUrl: string;
  imageMobileUrl?: string | null;
  targetUrl?: string | null;
  position: BannerPosition;
  sortOrder: number;
  isActive: boolean;
  startAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBannerPayload {
  title: string;
  imageDesktopUrl: string;
  imageMobileUrl?: string;
  targetUrl?: string;
  position: BannerPosition;
  sortOrder?: number;
  isActive?: boolean;
}