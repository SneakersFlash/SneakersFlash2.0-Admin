'use client';

import { useEffect, useState } from 'react';
import { Users, Mail, Phone, Calendar, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import UsersService from '@/services/users.service';
import type { User } from '@/types/user.types';
import PageHeader from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getErrorMessage } from '@/lib/api';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await UsersService.getAll();
      setUsers(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Helper mendapatkan inisial nama
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Manajemen Pengguna" 
        description="Kelola daftar pelanggan dan admin toko."
        icon={Users}
      />

      <Card className="p-0 overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 font-medium">Profil Pengguna</th>
                <th className="px-6 py-4 font-medium">Kontak</th>
                <th className="px-6 py-4 font-medium text-center">Peran (Role)</th>
                <th className="px-6 py-4 font-medium">Bergabung Pada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Memuat data pengguna...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Belum ada pengguna terdaftar.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-gray-200">
                          <AvatarFallback className="bg-gray-100 text-gray-700 font-semibold">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500 font-mono mt-0.5">ID: {user.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 space-y-1.5">
                      <div className="flex items-center text-gray-600 text-xs">
                        <Mail className="w-3.5 h-3.5 mr-2 text-gray-400" />
                        {user.email}
                      </div>
                      <div className="flex items-center text-gray-600 text-xs">
                        <Phone className="w-3.5 h-3.5 mr-2 text-gray-400" />
                        {user.phone || '-'}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      {user.role.toLowerCase() === 'admin' ? (
                        <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none px-2.5 py-0.5">
                          <ShieldCheck className="w-3 h-3 mr-1" /> Admin
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-600 bg-gray-50 px-2.5 py-0.5">
                          Customer
                        </Badge>
                      )}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex items-center text-xs">
                        <Calendar className="w-3.5 h-3.5 mr-2 text-gray-400" />
                        {new Date(user.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}