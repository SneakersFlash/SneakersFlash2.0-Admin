'use client';

import { useState, useEffect } from 'react';
import {
  User, Mail, Phone, ShieldCheck, Star, MapPin,
  Package, MessageSquare, Heart, Key, Loader2, Sparkles, History, Undo2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import UsersService from '@/services/users.service';
import { getErrorMessage } from '@/lib/api';
import { toNum } from '@/lib/utils';
import type { UserDetail, AdminUpdateUserPayload, PointsHistoryItem } from '@/types/user.types';

const TIPE_POIN: Record<string, string> = {
  earn: 'dari belanja',
  redeem: 'dipakai',
  refund: 'dikembalikan',
  adjustment: 'manual',
};

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
  const [tab, setTab] = useState<'info' | 'edit' | 'password' | 'points' | 'history'>('info');

  const [form, setForm] = useState<AdminUpdateUserPayload>({});
  const [newPassword, setNewPassword] = useState('');

  // Form "Kasih Poin". Dipisah dari `form` di atas karena jalurnya beda:
  // yang ini menambah/mengurangi, bukan menimpa saldo.
  const [pointsAmount, setPointsAmount] = useState<string>('');
  const [pointsNote, setPointsNote] = useState('');

  const [history, setHistory] = useState<PointsHistoryItem[] | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [reversingId, setReversingId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !isOpen) return;
    setTab('info');
    setForm({});
    setNewPassword('');
    setPointsAmount('');
    setPointsNote('');
    setHistory(null);
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

  const handleGrantPoints = async () => {
    if (!user) return;
    const amount = Number(pointsAmount);
    if (!Number.isInteger(amount) || amount === 0)
      return toast.error('Jumlah poin harus bilangan bulat dan tidak boleh 0');
    if (pointsNote.trim().length < 3)
      return toast.error('Alasan wajib diisi minimal 3 karakter');

    try {
      setIsSaving(true);
      const hasil = await UsersService.grantPoints(user.id, {
        amount,
        note: pointsNote.trim(),
      });
      toast.success(
        `${amount > 0 ? 'Ditambah' : 'Dikurangi'} ${Math.abs(amount).toLocaleString('id-ID')} poin. Saldo sekarang ${toNum(hasil.balanceAfter).toLocaleString('id-ID')} pts`,
      );
      setUser({ ...user, pointsBalance: hasil.balanceAfter });
      setForm((f) => ({ ...f, pointsBalance: toNum(hasil.balanceAfter) }));
      setPointsAmount('');
      setPointsNote('');
      setTab('info');
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const muatRiwayat = async (uid: string | number) => {
    setIsLoadingHistory(true);
    try {
      const res = await UsersService.getPointsHistory(uid);
      setHistory(res.items);
      // Saldo ikut disegarkan dari sumber yang sama, supaya angka di kartu Poin
      // maupun form edit tidak berbeda dengan riwayat yang baru dimuat.
      setUser((u) => (u ? { ...u, pointsBalance: res.pointsBalance } : u));
      setForm((f) => ({ ...f, pointsBalance: toNum(res.pointsBalance) }));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const bukaRiwayat = () => {
    setTab('history');
    if (user) muatRiwayat(user.id);
  };

  const batalkan = async (row: PointsHistoryItem) => {
    if (!user) return;
    const aksi = row.amount > 0 ? 'ditarik dari' : 'dikembalikan ke';
    if (!window.confirm(
      `Batalkan perubahan ${Math.abs(row.amount).toLocaleString('id-ID')} poin? Poin akan ${aksi} saldo ${user.name}.`,
    )) return;

    try {
      setReversingId(row.id);
      const res = await UsersService.reversePoints(row.id);
      toast.success(res.message);
      await muatRiwayat(user.id);
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setReversingId(null);
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
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800">{toNum(user.pointsBalance).toLocaleString('id-ID')} pts</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                        onClick={() => setTab('points')}
                      >
                        <Sparkles className="w-3 h-3 mr-1" /> Kasih Poin
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs"
                        onClick={bukaRiwayat}
                      >
                        <History className="w-3 h-3 mr-1" /> Riwayat
                      </Button>
                    </div>
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

            {/* Tab: Riwayat Poin */}
            {tab === 'history' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border bg-gray-50 px-3 py-2">
                  <span className="text-xs text-gray-500">Saldo sekarang</span>
                  <span className="font-semibold text-gray-800">
                    {toNum(user.pointsBalance).toLocaleString('id-ID')} pts
                  </span>
                </div>

                {isLoadingHistory ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : !history || history.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 py-8">
                    Belum ada riwayat poin.
                  </p>
                ) : (
                  <div className="rounded-lg border divide-y max-h-[360px] overflow-y-auto">
                    {history.map((row) => (
                      <div key={row.id} className="px-3 py-2.5 flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={
                                row.amount >= 0
                                  ? 'font-semibold text-emerald-700'
                                  : 'font-semibold text-rose-700'
                              }
                            >
                              {row.amount >= 0 ? '+' : '-'}
                              {Math.abs(row.amount).toLocaleString('id-ID')}
                            </span>
                            <Badge variant="outline" className="text-[10px] text-gray-500">
                              {TIPE_POIN[row.type] ?? row.type}
                            </Badge>
                            {row.isReversed && (
                              <Badge className="bg-gray-100 text-gray-600 border-none text-[10px]">
                                dibatalkan
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 break-words">
                            {row.note || '-'}
                            {row.orderNumber ? ` · ${row.orderNumber}` : ''}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {new Date(row.createdAt).toLocaleString('id-ID', {
                              day: 'numeric', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                            {' · sisa '}
                            {toNum(row.balanceAfter).toLocaleString('id-ID')} pts
                          </p>
                        </div>

                        {row.canReverse && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs flex-shrink-0"
                            onClick={() => batalkan(row)}
                            disabled={reversingId !== null}
                          >
                            {reversingId === row.id ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <Undo2 className="w-3 h-3 mr-1" />
                            )}
                            Batalkan
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-gray-400">
                  Hanya perubahan poin oleh admin yang bisa dibatalkan. Bonus,
                  hadiah game, dan poin dari pesanan tetap mengikuti sumbernya.
                </p>

                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setTab('info')}>Tutup</Button>
                </div>
              </div>
            )}

            {/* Tab: Kasih Poin */}
            {tab === 'points' && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                  Poin <strong>ditambahkan</strong> ke saldo saat ini, bukan menimpa.
                  Isi angka minus untuk menarik kembali poin yang salah tembak.
                </div>

                <div className="flex items-center justify-between rounded-lg border bg-gray-50 px-3 py-2">
                  <span className="text-xs text-gray-500">Saldo sekarang</span>
                  <span className="font-semibold text-gray-800">
                    {toNum(user.pointsBalance).toLocaleString('id-ID')} pts
                  </span>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="grant-amount" className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Jumlah Poin
                  </Label>
                  <Input
                    id="grant-amount"
                    type="number"
                    placeholder="contoh: 50000"
                    value={pointsAmount}
                    onChange={(e) => setPointsAmount(e.target.value)}
                  />
                  {Number(pointsAmount) !== 0 && !isNaN(Number(pointsAmount)) && (
                    <p className="text-xs text-gray-500">
                      Saldo jadi{' '}
                      <strong>
                        {(toNum(user.pointsBalance) + Number(pointsAmount)).toLocaleString('id-ID')} pts
                      </strong>
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="grant-note">Alasan</Label>
                  <Textarea
                    id="grant-note"
                    rows={2}
                    placeholder="contoh: Pemenang giveaway live 21 Sep"
                    value={pointsNote}
                    onChange={(e) => setPointsNote(e.target.value)}
                  />
                  <p className="text-xs text-gray-400">
                    Alasan ikut tercatat di riwayat poin, jangan dikosongkan.
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setTab('info')} disabled={isSaving}>Batal</Button>
                  <Button
                    onClick={handleGrantPoints}
                    disabled={isSaving || !pointsAmount || pointsNote.trim().length < 3}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Tembak Poin
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
