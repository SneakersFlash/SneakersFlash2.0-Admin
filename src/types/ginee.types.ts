export type GineeOperationType =
  | 'pull_stock'
  | 'push_order'
  | 'pull_product'
  | 'push_product'
  | 'sync_all';

export type GineeLogStatus = 'success' | 'failed' | 'completed' | 'partial';

export interface GineeOperationStat {
  success: number;
  failed: number;
  lastSuccess: string | null;
}

export interface GineeRecentFailure {
  type: GineeOperationType;
  errorMessage: string;
  payloadSent: Record<string, unknown>;
  createdAt: string;
}

export interface GineeStats {
  period: string;
  summary: Record<GineeOperationType, GineeOperationStat>;
  processedEventsToday: number;
  recentFailures: GineeRecentFailure[];
}

export interface GineeFailedJob {
  name: string;
  data: Record<string, unknown>;
  failedReason: string;
  attemptsMade: number;
}

export interface GineeQueueStatus {
  active: number;
  waiting: number;
  failed: number;
  delayed: number;
  failedJobs: GineeFailedJob[];
}

export interface GineeLog {
  id: string;
  type: GineeOperationType;
  status: GineeLogStatus;
  errorMessage: string | null;
  payloadSent: Record<string, unknown> | null;
  responseReceived: Record<string, unknown> | null;
  createdAt: string;
}

export interface GineeMeta {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
}

export interface GineeLogResponse {
  data: GineeLog[];
  meta: GineeMeta;
}

export interface GetGineeLogsParams {
  type?: GineeOperationType | 'all';
  status?: GineeLogStatus | 'all';
  page?: number;
  limit?: number;
}
