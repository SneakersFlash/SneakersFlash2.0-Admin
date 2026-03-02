import api from '@/lib/api';
import type { User } from '@/types/user.types';

const UsersService = {
    async getAll(): Promise<User[]> {
        const { data } = await api.get<User[]>('/users');
        return data;
    },

    async getById(id: string | number): Promise<User> {
        const { data } = await api.get<User>(`/users/${id}`);
        return data;
    }
};

export default UsersService;