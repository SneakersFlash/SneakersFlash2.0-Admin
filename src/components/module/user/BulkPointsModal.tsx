'use client';

import { useState } from 'react';
import { Sparkles, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import UsersService from '@/services/users.service';
import { getErrorMessage } from '@/lib/api';
import type { GrantPointsBulkResult } from '@/types/user.types';

interface BulkPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export default function BulkPointsModal({ isOpen, onClose, onRefresh }: BulkPointsModalProps) {
  const [rawList, setRawList] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [hasil, setHasil] = useState<GrantPointsBulkResult | null>(null);

  // Satu penerima per baris. Koma dan titik koma ikut dipecah supaya daftar
  // yang ditempel dari chat atau spreadsheet tidak perlu dirapikan dulu.
  const identifiers = rawList
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const tutup = () => {
    setRawList('');
    setAmount('');
    setNote('');
    setHasil(null);
    onClose();
  };

  const kirim = async () => {
    const jumlah = Number(amount);
    if (identifiers.length === 0) return toast.error('Daftar penerima masih kosong');
    if (!Number.isInteger(jumlah) || jumlah === 0)
      return toast.error('Jumlah poin harus bilangan bulat dan tidak boleh 0');
    if (note.trim().length < 3) return toast.error('Alasan wajib diisi minimal 3 karakter');

    try {
      setIsSending(true);
      const res = await UsersService.grantPointsBulk({
        identifiers,
        amount: jumlah,
        note: note.trim(),
      });
      setHasil(res);
      if (res.totalGagal === 0) {
        toast.success(`${res.totalBerhasil} penerima berhasil dapat poin`);
      } else {
        toast.warning(`${res.totalBerhasil} berhasil, ${res.totalGagal} gagal — cek rinciannya`);
      }
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && tutup()}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" /> Kasih Poin Massal
          </DialogTitle>
        </DialogHeader>

        {hasil ? (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs text-emerald-700">Berhasil</p>
                <p className="text-xl font-bold text-emerald-800">{hasil.totalBerhasil}</p>
              </div>
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                <p className="text-xs text-rose-700">Gagal</p>
                <p className="text-xl font-bold text-rose-800">{hasil.totalGagal}</p>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Kode batch <span className="font-mono">{hasil.batchRef}</span> — ikut tercatat di
              riwayat poin tiap penerima.
            </p>

            {/* Yang gagal ditaruh di atas: itu yang masih perlu ditindaklanjuti. */}
            {hasil.gagal.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-rose-700">Perlu dicek ulang</p>
                <div className="max-h-40 overflow-y-auto rounded-lg border divide-y">
                  {hasil.gagal.map((g, i) => (
                    <div key={i} className="flex items-start gap-2 px-3 py-2 text-sm">
                      <XCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate">{g.identifier}</p>
                        <p className="text-xs text-gray-500">{g.alasan}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasil.berhasil.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-emerald-700">Sudah dapat poin</p>
                <div className="max-h-40 overflow-y-auto rounded-lg border divide-y">
                  {hasil.berhasil.map((b) => (
                    <div key={b.userId} className="flex items-start gap-2 px-3 py-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-800 truncate">{b.name || b.identifier}</p>
                        <p className="text-xs text-gray-500 truncate">{b.email}</p>
                      </div>
                      <span className="text-xs text-gray-600 flex-shrink-0">
                        {Number(b.balanceAfter).toLocaleString('id-ID')} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setHasil(null)}>Kirim Lagi</Button>
              <Button onClick={tutup}>Selesai</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              Poin <strong>ditambahkan</strong> ke saldo masing-masing, bukan menimpa. Penerima yang
              tidak ditemukan dilewati, sisanya tetap diproses.
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bulk-list">Daftar Penerima</Label>
              <Textarea
                id="bulk-list"
                rows={7}
                placeholder={'satu email atau nomor HP per baris\ncontoh:\nbudi@email.com\n081234567890'}
                value={rawList}
                onChange={(e) => setRawList(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Terbaca <strong>{identifiers.length}</strong> penerima.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bulk-amount">Jumlah Poin per Orang</Label>
              <Input
                id="bulk-amount"
                type="number"
                placeholder="contoh: 50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bulk-note">Alasan</Label>
              <Textarea
                id="bulk-note"
                rows={2}
                placeholder="contoh: Pemenang giveaway live 21 Sep"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={tutup} disabled={isSending}>Batal</Button>
              <Button
                onClick={kirim}
                disabled={isSending || identifiers.length === 0 || !amount || note.trim().length < 3}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {isSending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Tembak ke {identifiers.length} Orang
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
