// ─── Generic API Response Wrapper ────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─── API Error ───────────────────────────────────────────────────────────────

export interface ApiError {
  message: string | string[];
  error: string;
  statusCode: number;
}
