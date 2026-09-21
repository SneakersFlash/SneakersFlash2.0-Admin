import api from '@/lib/api';
import type {
  User,
  UserDetail,
  UserListResponse,
  UserQueryParams,
  AdminUpdateUserPayload,
  GrantPointsPayload,
  GrantPointsResult,
  GrantPointsBulkPayload,
  GrantPointsBulkResult,
  PointsHistory,
  ReversePointsResult,
} from '@/types/user.types';

const UsersService = {
  async getAll(params?: UserQueryParams): Promise<UserListResponse> {
    const { data } = await api.get<UserListResponse>('/users', { params });
    return data;
  },

  async getById(id: string | number): Promise<UserDetail> {
    const { data } = await api.get<UserDetail>(`/users/${id}`);
    return data;
  },

  async update(id: string | number, payload: AdminUpdateUserPayload): Promise<User> {
    const { data } = await api.patch<User>(`/users/${id}`, payload);
    return data;
  },

  async toggleStatus(id: string | number): Promise<User> {
    const { data } = await api.patch<User>(`/users/${id}/toggle-status`);
    return data;
  },

  async resetPassword(id: string | number, newPassword: string): Promise<{ message: string }> {
    const { data } = await api.patch<{ message: string }>(`/users/${id}/reset-password`, { newPassword });
    return data;
  },

  // Tembak poin ke satu user. Berbasis SELISIH, bukan saldo akhir — backend
  // yang menjumlahkan, jadi aman walau user sedang checkout.
  async grantPoints(id: string | number, payload: GrantPointsPayload): Promise<GrantPointsResult> {
    const { data } = await api.post<GrantPointsResult>(`/users/${id}/points`, payload);
    return data;
  },

  async grantPointsBulk(payload: GrantPointsBulkPayload): Promise<GrantPointsBulkResult> {
    const { data } = await api.post<GrantPointsBulkResult>('/users/points/bulk', payload);
    return data;
  },

  async getPointsHistory(id: string | number, limit = 50): Promise<PointsHistory> {
    const { data } = await api.get<PointsHistory>(`/users/${id}/points`, { params: { limit } });
    return data;
  },

  // Tarik balik satu pemberian poin. Backend yang menghitung jumlah kebalikannya,
  // jadi admin tidak perlu mengingat angkanya.
  async reversePoints(txId: string): Promise<ReversePointsResult> {
    const { data } = await api.post<ReversePointsResult>(`/users/points/${txId}/reverse`);
    return data;
  },

  async delete(id: string | number): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(`/users/${id}`);
    return data;
  },
};

export default UsersService;
