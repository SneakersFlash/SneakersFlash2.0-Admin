'use client';

import { useState, useEffect } from 'react';
import {
  User, Mail, Phone, ShieldCheck, Star, MapPin,
  Package, MessageSquare, Heart, Key, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import UsersService from '@/services/users.service';
import { getErrorMessage } from '@/lib/api';
import { toNum } from '@/lib/utils';
import type { UserDetail, AdminUpdateUserPayload } from '@/types/user.types';

const TIER_CONFIG: Record<string, { label: string; className: string }> = {
  basic:   { label: 'Basic',   className: 'bg-gray-100 text-gray-700' },
  advance: { label: 'Advance', className: 'bg-blue-100 text-blue-700' },
  ultimate:{ label: 'Ultimate',className: 'bg-amber-100 text-amber-700' },
};

interface UserDetailModalProps {
  userId: string | number | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export default function UserDetailModal({ userId, isOpen, onClose, onRefresh }: UserDetailModalProps) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tab, setTab] = useState<'info' | 'edit' | 'password'>('info');

  const [form, setForm] = useState<AdminUpdateUserPayload>({});
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (!userId || !isOpen) return;
    setTab('info');
    setForm({});
    setNewPassword('');
    setIsLoading(true);
    UsersService.getById(userId)
      .then((data) => {
        setUser(data);
        setForm({
          name: data.name,
          phone: data.phone ?? '',
          role: data.role,
          customerTier: data.customerTier,
          isActive: data.isActive,
          pointsBalance: toNum(data.pointsBalance),
        });
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [userId, isOpen]);

  if (!isOpen) return null;

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

  const handleSave = async () => {
    if (!user) return;
    try {
      setIsSaving(true);
      await UsersService.update(user.id, form);
      toast.success('Data pengguna berhasil diperbarui');
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user) return;
    if (newPassword.length < 6) return toast.error('Password minimal 6 karakter');
    try {
      setIsSaving(true);
      await UsersService.resetPassword(user.id, newPassword);
      toast.success('Password berhasil direset');
      setNewPassword('');
      setTab('info');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const tierConf = user ? (TIER_CONFIG[user.customerTier] ?? TIER_CONFIG.basic) : TIER_CONFIG.basic;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-lg font-bold">Detail Pengguna</DialogTitle>
        </DialogHeader>

        {isLoading || !user ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {/* Header pengguna */}
            <div className="flex items-center gap-4 py-4">
              <Avatar className="h-14 w-14 border border-gray-200">
                <AvatarFallback className="bg-indigo-50 text-indigo-700 font-bold text-lg">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 text-base truncate">{user.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{user.email}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  {user.role === 'admin' ? (
                    <Badge className="bg-indigo-100 text-indigo-700 border-none text-xs">
                      <ShieldCheck className="w-3 h-3 mr-1" /> Admin
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-600 bg-gray-50 text-xs">Customer</Badge>
                  )}
                  <Badge className={`${tierConf.className} border-none text-xs`}>
                    <Star className="w-3 h-3 mr-1" />{tierConf.label}
                  </Badge>
                  <Badge className={user.isActive ? 'bg-emerald-100 text-emerald-700 border-none text-xs' : 'bg-red-100 text-red-600 border-none text-xs'}>
                    {user.isActive ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Tab navigator */}
            <div className="flex border-b mb-4">
              {(['info', 'edit', 'password'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    tab === t
                      ? 'border-indigo-600 text-indigo-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t === 'info' ? 'Info' : t === 'edit' ? 'Edit Data' : 'Reset Password'}
                </button>
              ))}
            </div>

            {/* Tab: Info */}
            {tab === 'info' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</p>
                    <p className="font-medium text-gray-800">{user.email}</p>
                    {user.emailVerifiedAt && (
                      <p className="text-xs text-emerald-600">Terverifikasi</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" /> Telepon</p>
                    <p className="font-medium text-gray-800">{user.phone || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Total Belanja</p>
                    <p className="font-semibold text-gray-800">Rp {toNum(user.totalSpent).toLocaleString('id-ID')}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Poin</p>
                    <p className="font-semibold text-gray-800">{toNum(user.pointsBalance).toLocaleString('id-ID')} pts</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Bergabung</p>
                    <p className="font-medium text-gray-800">
                      {new Date(user.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">ID Pengguna</p>
                    <p className="font-mono text-xs text-gray-600">{user.id}</p>
                  </div>
                </div>

                <Separator />

                {/* Statistik */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: Package, label: 'Pesanan', value: user._count.orders },
                    { icon: MessageSquare, label: 'Ulasan', value: user._count.reviews },
                    { icon: Heart, label: 'Wishlist', value: user._count.wishlists },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                      <Icon className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-gray-800">{value}</p>
                      <p className="text-xs text-gray-500">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Alamat */}
                {user.addresses.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" /> Alamat ({user.addresses.length})
                      </h4>
                      <div className="space-y-2">
                        {user.addresses.slice(0, 3).map((addr) => (
                          <div key={String(addr.id)} className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-gray-900">{addr.recipientName}</p>
                              {addr.isDefault && (
                                <Badge className="bg-indigo-100 text-indigo-700 border-none text-xs">Utama</Badge>
                              )}
                            </div>
                            <p className="text-gray-600 text-xs">{addr.phone}</p>
                            <p className="text-gray-600 text-xs mt-0.5">{addr.street}, {addr.city}, {addr.province} {addr.postalCode}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Tab: Edit */}
            {tab === 'edit' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-name">Nama</Label>
                    <Input
                      id="edit-name"
                      value={form.name ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-phone">Telepon</Label>
                    <Input
                      id="edit-phone"
                      value={form.phone ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Peran (Role)</Label>
                    <Select value={form.role ?? 'customer'} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tier Pelanggan</Label>
                    <Select value={form.customerTier ?? 'basic'} onValueChange={(v) => setForm((f) => ({ ...f, customerTier: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="advance">Advance</SelectItem>
                        <SelectItem value="ultimate">Ultimate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Status Akun</Label>
                    <Select
                      value={form.isActive ? 'active' : 'inactive'}
                      onValueChange={(v) => setForm((f) => ({ ...f, isActive: v === 'active' }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Aktif</SelectItem>
                        <SelectItem value="inactive">Nonaktif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-points">Poin</Label>
                    <Input
                      id="edit-points"
                      type="number"
                      min={0}
                      value={form.pointsBalance ?? 0}
                      onChange={(e) => setForm((f) => ({ ...f, pointsBalance: Number(e.target.value) }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setTab('info')} disabled={isSaving}>Batal</Button>
                  <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700">
                    {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Simpan Perubahan
                  </Button>
                </div>
              </div>
            )}

            {/* Tab: Reset Password */}
            {tab === 'password' && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                  Password baru akan langsung aktif. Pastikan Anda menginformasikan ke pengguna.
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-password" className="flex items-center gap-1.5">
                    <Key className="w-4 h-4" /> Password Baru
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setTab('info')} disabled={isSaving}>Batal</Button>
                  <Button
                    onClick={handleResetPassword}
                    disabled={isSaving || newPassword.length < 6}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Reset Password
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
