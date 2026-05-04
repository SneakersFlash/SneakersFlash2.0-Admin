'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Users, Mail, Phone, Calendar, ShieldCheck, Star,
  Search, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight, Trash2, Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import UsersService from '@/services/users.service';
import type { User, UserQueryParams, UserListMeta } from '@/types/user.types';
import PageHeader from '@/components/shared/PageHeader';
import UserDetailModal from '@/components/module/user/UserDetailModal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getErrorMessage } from '@/lib/api';
import { toNum } from '@/lib/utils';

const TIER_CONFIG: Record<string, { label: string; className: string }> = {
  basic:    { label: 'Basic',    className: 'bg-gray-100 text-gray-700' },
  advance:  { label: 'Advance',  className: 'bg-blue-100 text-blue-700' },
  ultimate: { label: 'Ultimate', className: 'bg-amber-100 text-amber-700' },
};

const ITEMS_PER_PAGE = 20;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<UserListMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const [selectedUserId, setSelectedUserId] = useState<string | number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [togglingId, setTogglingId] = useState<string | number | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: UserQueryParams = {
        page,
        limit: ITEMS_PER_PAGE,
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
        ...(tierFilter && { tier: tierFilter }),
        ...(statusFilter !== '' && { isActive: statusFilter === 'active' }),
      };
      const result = await UsersService.getAll(params);
      setUsers(result.data);
      setMeta(result.meta);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [page, search, roleFilter, tierFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, tierFilter, statusFilter]);

  const handleToggleStatus = async (user: User) => {
    try {
      setTogglingId(user.id);
      await UsersService.toggleStatus(user.id);
      toast.success(`${user.name} ${user.isActive ? 'dinonaktifkan' : 'diaktifkan'}`);
      fetchUsers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      setIsDeleting(true);
      await UsersService.delete(confirmDelete.id);
      toast.success(`${confirmDelete.name} berhasil dihapus`);
      setConfirmDelete(null);
      fetchUsers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

  const totalPages = meta?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Pengguna"
        description="Kelola daftar pelanggan dan admin toko."
        icon={Users}
      />

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Cari nama, email, atau telepon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter || 'all'} onValueChange={(v) => setRoleFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Semua Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Role</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tierFilter || 'all'} onValueChange={(v) => setTierFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Semua Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tier</SelectItem>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="advance">Advance</SelectItem>
              <SelectItem value="ultimate">Ultimate</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="inactive">Nonaktif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 font-medium">Profil Pengguna</th>
                <th className="px-6 py-4 font-medium">Kontak</th>
                <th className="px-6 py-4 font-medium text-center">Role & Tier</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium">Statistik</th>
                <th className="px-6 py-4 font-medium">
                  <Calendar className="w-3.5 h-3.5 inline mr-1" />Bergabung
                </th>
                <th className="px-6 py-4 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                    Memuat data pengguna...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                    Tidak ada pengguna yang sesuai filter.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const tierConf = TIER_CONFIG[user.customerTier] ?? TIER_CONFIG.basic;
                  return (
                    <tr key={String(user.id)} className="hover:bg-gray-50/50 transition-colors">

                      {/* Profil */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-gray-200">
                            <AvatarFallback className="bg-gray-100 text-gray-700 font-semibold">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-gray-900">{user.name}</div>
                            <div className="text-xs text-gray-400 font-mono mt-0.5">#{String(user.id)}</div>
                          </div>
                        </div>
                      </td>

                      {/* Kontak */}
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

                      {/* Role & Tier */}
                      <td className="px-6 py-4 text-center space-y-1.5">
                        {user.role === 'admin' ? (
                          <Badge className="bg-indigo-100 text-indigo-700 border-none px-2 py-0.5 block w-fit mx-auto">
                            <ShieldCheck className="w-3 h-3 mr-1 inline" />Admin
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600 bg-gray-50 block w-fit mx-auto">
                            Customer
                          </Badge>
                        )}
                        <Badge className={`${tierConf.className} border-none px-2 py-0.5 block w-fit mx-auto`}>
                          <Star className="w-3 h-3 mr-1 inline" />{tierConf.label}
                        </Badge>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        <Badge
                          className={
                            user.isActive
                              ? 'bg-emerald-100 text-emerald-700 border-none'
                              : 'bg-red-100 text-red-600 border-none'
                          }
                        >
                          {user.isActive ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </td>

                      {/* Statistik */}
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-600 space-y-0.5">
                          <div>{user.totalOrder ?? 0} pesanan</div>
                          <div className="font-medium text-gray-800">
                            Rp {toNum(user.totalSpent).toLocaleString('id-ID')}
                          </div>
                          <div className="text-gray-400">{toNum(user.pointsBalance).toLocaleString('id-ID')} pts</div>
                        </div>
                      </td>

                      {/* Tanggal bergabung */}
                      <td className="px-6 py-4 text-gray-600 text-xs">
                        {new Date(user.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </td>

                      {/* Aksi */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-indigo-600"
                            title="Lihat detail"
                            onClick={() => { setSelectedUserId(user.id); setIsDetailOpen(true); }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${user.isActive ? 'text-gray-500 hover:text-amber-600' : 'text-amber-600 hover:text-amber-700'}`}
                            title={user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                            disabled={togglingId === user.id}
                            onClick={() => handleToggleStatus(user)}
                          >
                            {user.isActive
                              ? <ToggleRight className="w-4 h-4" />
                              : <ToggleLeft className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-red-600"
                            title="Hapus pengguna"
                            onClick={() => setConfirmDelete(user)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.total > 0 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/30">
            <p className="text-xs text-gray-500">
              Menampilkan {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, meta.total)} dari {meta.total} pengguna
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <span className="text-xs text-gray-600 px-1">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* User Detail Modal */}
      <UserDetailModal
        userId={selectedUserId}
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedUserId(null); }}
        onRefresh={fetchUsers}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}
        title="Hapus Pengguna"
        description={`Anda yakin ingin menghapus "${confirmDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
