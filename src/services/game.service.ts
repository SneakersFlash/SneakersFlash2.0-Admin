import api, { getErrorMessage } from '@/lib/api';

// ─── Tipe ─────────────────────────────────────────────────────────────────────

export interface GameSummary {
  totalMain: number;
  mainHariIni: number;
  pemainUnik: number;
  sampaiPuncak: number;
  persenSampaiPuncak: number;
  totalPoinDibagikan: number;
  klaim: {
    total: number;
    belumVerifikasi: number;
    terverifikasi: number;
    selesai: number;
  };
}

export type GameOutcome =
  | 'points'
  | 'apparel_won'
  | 'already_won'
  | 'no_prize'
  | null;

export interface GamePlayRow {
  id: string;
  playDate: string;
  startedAt: string;
  finishedAt: string | null;
  boxes: number;
  reachedTop: boolean;
  durationMs: number | null;
  outcome: GameOutcome;
  pointsAwarded: number;
  user: { id: string; name: string | null; email: string };
  prize: { slotIndex: number; label: string; kind: string } | null;
  claim: { code: string; status: string } | null;
}

export interface GameWinnerRow {
  id: string;
  code: string;
  status: 'pending_verification' | 'verified' | 'fulfilled' | 'expired';
  createdAt: string;
  emailSentAt: string | null;
  verifiedAt: string | null;
  fulfilledAt: string | null;
  tokenExpiresAt: string;
  adminNote: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
  prize: { slotIndex: number; label: string; kind: string };
}

export interface GamePrizeRow {
  id: string;
  slotIndex: number;
  kind: 'points' | 'apparel' | 'sneaker';
  label: string;
  pointsAmount: number | null;
  productId: string | null;
  weight: number;
  peluangPersen: number;
  stock: number;
  isGimmick: boolean;
  winnableFrom: string | null;
  winnableUntil: string | null;
  forceNextWin: boolean;
  isActive: boolean;
  sudahDimenangkan: number;
}

export interface UpdatePrizePayload {
  label?: string;
  weight?: number;
  stock?: number;
  isActive?: boolean;
  isGimmick?: boolean;
  forceNextWin?: boolean;
  /** null menghapus batas jadwalnya. */
  winnableFrom?: string | null;
  winnableUntil?: string | null;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const gameService = {
  async summary(): Promise<GameSummary> {
    try {
      const { data } = await api.get<GameSummary>('/admin/game/summary');
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e));
    }
  },

  async plays(params?: {
    page?: number;
    limit?: number;
    outcome?: string;
    q?: string;
  }): Promise<{
    data: GamePlayRow[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    try {
      const { data } = await api.get('/admin/game/plays', { params });
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e));
    }
  },

  async winners(status?: string): Promise<GameWinnerRow[]> {
    try {
      const { data } = await api.get<GameWinnerRow[]>('/admin/game/winners', {
        params: status ? { status } : undefined,
      });
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e));
    }
  },

  async prizes(): Promise<GamePrizeRow[]> {
    try {
      const { data } = await api.get<GamePrizeRow[]>('/admin/game/prizes');
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e));
    }
  },

  /**
   * Backend mengembalikan SELURUH daftar hadiah, bukan satu baris yang diubah:
   * peluang tiap juring dihitung dari total bobot, jadi mengubah satu bobot
   * menggeser angka persen semua juring lain.
   */
  async updatePrize(
    id: string,
    payload: UpdatePrizePayload,
  ): Promise<GamePrizeRow[]> {
    try {
      const { data } = await api.patch<GamePrizeRow[]>(
        `/admin/game/prizes/${id}`,
        payload,
      );
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e));
    }
  },

  async fulfillClaim(id: string, catatan?: string): Promise<GameWinnerRow[]> {
    try {
      const { data } = await api.post<GameWinnerRow[]>(
        `/admin/game/claims/${id}/fulfill`,
        catatan ? { catatan } : {},
      );
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e));
    }
  },
};
