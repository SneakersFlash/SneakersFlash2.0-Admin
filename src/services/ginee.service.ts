import api from '@/lib/api';
import type {
  GineeStats,
  GineeQueueStatus,
  GineeLogResponse,
  GetGineeLogsParams,
} from '@/types/ginee.types';

const GineeService = {
  async getStats(): Promise<GineeStats> {
    const { data } = await api.get<GineeStats>('/ginee/stats');
    return data;
  },

  async getQueueStatus(): Promise<GineeQueueStatus> {
    const { data } = await api.get<GineeQueueStatus>('/ginee/queue-status');
    return data;
  },

  async getLogs(params: GetGineeLogsParams = {}): Promise<GineeLogResponse> {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== 'all' && v !== undefined),
    );
    const { data } = await api.get<GineeLogResponse>('/ginee/logs', { params: cleanParams });
    return data;
  },
};

export default GineeService;
