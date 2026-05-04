import api from '@/lib/api';
import type {
  User,
  UserDetail,
  UserListResponse,
  UserQueryParams,
  AdminUpdateUserPayload,
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

  async delete(id: string | number): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(`/users/${id}`);
    return data;
  },
};

export default UsersService;
