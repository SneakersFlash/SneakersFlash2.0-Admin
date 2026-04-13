export interface Category {
  id: number | string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  parentId?: number | string | null;
  parent?: Category | null;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryPayload {
  name: string;
  imageUrl?: string;
  // Gunakan number atau string tergantung bagaimana id dibaca di frontend
  parentId?: number | string | null; 
}

export interface Brand {
  id: string | number;
  name: string;
  slug: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}


export interface CreateBrandPayload {
  name: string;
  logoUrl?: string;
}

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