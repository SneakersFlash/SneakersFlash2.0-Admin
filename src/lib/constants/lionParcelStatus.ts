export type LionParcelStatusColor = 'blue' | 'green' | 'orange' | 'red' | 'gray';

export interface LionParcelStatusConfig {
  label:       string;               // Label singkat untuk badge/timeline
  description: string;               // Deskripsi lengkap dalam bahasa Indonesia
  color:       LionParcelStatusColor;
  isFinal:     boolean;              // true = status akhir (tidak berubah lagi)
}

// ─── Tailwind class helper ────────────────────────────────────────────────────
export const LION_STATUS_CLASSES: Record<LionParcelStatusColor, { badge: string; dot: string }> = {
  blue:   { badge: 'bg-blue-50 text-blue-700 border-blue-200',     dot: 'bg-blue-500'   },
  green:  { badge: 'bg-green-50 text-green-700 border-green-200',  dot: 'bg-green-500'  },
  orange: { badge: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  red:    { badge: 'bg-red-50 text-red-700 border-red-200',        dot: 'bg-red-500'    },
  gray:   { badge: 'bg-gray-100 text-gray-600 border-gray-200',    dot: 'bg-gray-400'   },
};

// ─── Status map ───────────────────────────────────────────────────────────────
export const LION_PARCEL_STATUS: Record<string, LionParcelStatusConfig> = {
  // ── Booking & Pickup ──────────────────────────────────────────────────────
  BKD:           { label: 'Terdaftar',         description: 'Paket berhasil didaftarkan di sistem Lion Parcel.',                    color: 'blue',   isFinal: false },
  PUP:           { label: 'Dijemput',           description: 'Paket sudah dijemput kurir dan sedang menuju gudang.',                color: 'blue',   isFinal: false },
  DRPCRT:        { label: 'Drop-Off',           description: 'Paket masuk melalui drop-off di agen.',                               color: 'blue',   isFinal: false },

  // ── Dalam Perjalanan (In-Transit) ─────────────────────────────────────────
  'STI-SC':      { label: 'Di Sub-Konsolidator', description: 'Paket berada di sub-konsolidator kota asal.',                       color: 'blue',   isFinal: false },
  STI:           { label: 'Di Konsolidator',    description: 'Paket berada di konsolidator kota asal.',                            color: 'blue',   isFinal: false },
  'IN-HUB':      { label: 'Masuk Hub',          description: 'Paket sudah tiba di hub Lion Parcel.',                               color: 'blue',   isFinal: false },
  'OUT-HUB':     { label: 'Keluar Hub',         description: 'Paket sudah keluar dari hub, menuju hub berikutnya.',                color: 'blue',   isFinal: false },
  BAGGING:       { label: 'Disortir',           description: 'Paket disortir sesuai kota tujuan.',                                 color: 'blue',   isFinal: false },
  TRANSIT:       { label: 'Dalam Transit',      description: 'Paket tiba di pusat transit.',                                       color: 'blue',   isFinal: false },
  'STI-DEST':    { label: 'Tiba di Tujuan',     description: 'Paket sudah tiba di konsolidator kota tujuan.',                      color: 'blue',   isFinal: false },
  'STI DEST-SC': { label: 'Tiba di Tujuan',     description: 'Paket sudah tiba di sub-konsolidator kota tujuan.',                  color: 'blue',   isFinal: false },
  'STO-SC':      { label: 'Keluar Sub-Konsol',  description: 'Paket diteruskan dari sub-konsolidator ke shuttle.',                 color: 'blue',   isFinal: false },
  HND:           { label: 'Diteruskan',         description: 'Paket diserahkan ke sub-agen atau mitra pengiriman.',                color: 'blue',   isFinal: false },

  // ── Kargo ─────────────────────────────────────────────────────────────────
  'CARGO PLANE': { label: 'Kargo Udara',        description: 'Paket dikirim via jalur udara.',                                    color: 'blue',   isFinal: false },
  'CARGO TRUCK': { label: 'Kargo Darat',        description: 'Paket dikirim via truk.',                                           color: 'blue',   isFinal: false },
  'CARGO TRAIN': { label: 'Kargo Kereta',       description: 'Paket dikirim via kereta.',                                         color: 'blue',   isFinal: false },
  'CARGO SHIP':  { label: 'Kargo Laut',         description: 'Paket dikirim via kapal laut.',                                     color: 'blue',   isFinal: false },
  'PICKUP TRUCK':  { label: 'Diangkut Truk',    description: 'Paket sudah diangkut oleh armada truk.',                            color: 'blue',   isFinal: false },
  'DROPOFF TRUCK': { label: 'Diturunkan Truk',  description: 'Paket sudah diturunkan dari armada truk.',                          color: 'blue',   isFinal: false },

  // ── Proses Pengiriman ke Penerima ─────────────────────────────────────────
  KONDISPATCH:   { label: 'Siap Diantar',       description: 'Paket diserahkan ke kurir untuk pengantaran.',                       color: 'orange', isFinal: false },
  STLDISPATCH:   { label: 'Siap Diantar',       description: 'Paket diserahkan dari shuttle ke kurir.',                           color: 'orange', isFinal: false },
  DEL:           { label: 'Sedang Diantar',     description: 'Kurir sedang dalam perjalanan mengantar paket ke penerima.',         color: 'orange', isFinal: false },

  // ── Selesai ───────────────────────────────────────────────────────────────
  POD:           { label: 'Terkirim',           description: 'Paket telah berhasil diterima oleh penerima.',                       color: 'green',  isFinal: true  },
  'STT ADJUSTED POD': { label: 'Terkirim',      description: 'Pengiriman diperbarui setelah paket dinyatakan diterima.',           color: 'green',  isFinal: true  },

  // ── Masalah & Pengecualian ────────────────────────────────────────────────
  DEX:           { label: 'Gagal Antar',        description: 'Penerima tidak ada, nomor tidak aktif, atau alamat tidak sesuai.',   color: 'red',    isFinal: false },
  SHORTLAND:     { label: 'Tidak Ditemukan',    description: 'Paket tidak berada di lokasi yang seharusnya.',                      color: 'red',    isFinal: false },
  MISROUTE:      { label: 'Salah Rute',         description: 'Paket dikirim ke kota yang salah.',                                  color: 'red',    isFinal: false },
  MISBOOKING:    { label: 'Data Salah',         description: 'Terjadi kesalahan data saat booking.',                               color: 'red',    isFinal: false },
  HAL:           { label: 'Ditahan',            description: 'Paket ditahan sementara di konsolidator tujuan.',                    color: 'orange', isFinal: false },
  ODA:           { label: 'Luar Jangkauan',     description: 'Paket berada di luar area pengiriman.',                              color: 'orange', isFinal: false },
  MISSING:       { label: 'Paket Hilang',       description: 'Paket hilang dalam perjalanan.',                                     color: 'red',    isFinal: false },
  DAMAGE:        { label: 'Paket Rusak',        description: 'Paket mengalami kerusakan selama perjalanan.',                       color: 'red',    isFinal: false },
  'NOT RECEIVE': { label: 'Belum Diterima',     description: 'Paket sudah dikirim tapi belum diterima oleh konsolidator tujuan.',  color: 'red',    isFinal: false },
  OCC:           { label: 'Bea Cukai',          description: 'Paket sedang diperiksa bea cukai.',                                  color: 'orange', isFinal: false },
  'OCC-EXP':     { label: 'Bea Cukai Ekspor',  description: 'Paket dalam proses bea cukai ekspor.',                               color: 'orange', isFinal: false },

  // ── Retur & Batal ─────────────────────────────────────────────────────────
  CNX:           { label: 'Dibatalkan',         description: 'Paket dibatalkan oleh pengirim atau penerima.',                      color: 'red',    isFinal: true  },
  SCRAP:         { label: 'Tidak Bisa Dikirim', description: 'Paket tidak bisa dikirim (alamat/telepon tidak valid).',             color: 'red',    isFinal: true  },
  RTS:           { label: 'Retur ke Pengirim',  description: 'Paket dikembalikan ke alamat pengirim.',                             color: 'red',    isFinal: true  },
  RTSHQ:         { label: 'Retur ke Pusat',     description: 'Paket dikembalikan ke kantor pusat Lion Parcel.',                    color: 'red',    isFinal: true  },
  REROUTE:       { label: 'Dialihkan',          description: 'Paket diarahkan ulang ke alamat yang benar.',                        color: 'orange', isFinal: true  },
  CLAIM:         { label: 'Proses Klaim',       description: 'Paket sedang dalam proses klaim garansi.',                           color: 'red',    isFinal: true  },
  CI:            { label: 'Klaim Internal',     description: 'Klaim internal Lion Parcel sedang diproses.',                        color: 'red',    isFinal: false },

  // ── Internasional ─────────────────────────────────────────────────────────
  INTHND:        { label: 'Ke Vendor Int\'l',   description: 'Paket diserahkan ke vendor internasional.',                          color: 'blue',   isFinal: false },
  'INT-STI':     { label: 'Transit Int\'l',     description: 'Paket diterima vendor internasional di titik transit.',              color: 'blue',   isFinal: false },

  // ── Lain-lain ─────────────────────────────────────────────────────────────
  'STT REMOVE':    { label: 'Dikeluarkan',      description: 'Paket dikeluarkan dari daftar kargo/bagging.',                       color: 'gray',   isFinal: false },
  'STT ADJUSTED':  { label: 'Data Dikoreksi',   description: 'Detail pengiriman telah diperbaiki.',                                color: 'gray',   isFinal: false },
};

// ─── Helper functions ─────────────────────────────────────────────────────────

/** Ambil config status, fallback ke gray jika tidak dikenal */
export function getLionStatus(code: string): LionParcelStatusConfig {
  return LION_PARCEL_STATUS[code] ?? {
    label:       code,
    description: code,
    color:       'gray',
    isFinal:     false,
  };
}

/** Apakah status ini berarti paket sudah diterima? */
export function isLionParcelDelivered(code: string): boolean {
  return ['POD', 'STT ADJUSTED POD'].includes(code);
}

/** Apakah status ini berarti ada masalah/gagal antar? */
export function isLionParcelProblem(code: string): boolean {
  return ['DEX', 'CNX', 'SCRAP', 'RTS', 'RTSHQ', 'MISSING', 'DAMAGE', 'SHORTLAND'].includes(code);
}

export const LION_JOURNEY_TYPE: Record<string, { label: string; color: LionParcelStatusColor }> = {
  'reroute':        { label: 'Dialihkan ke Alamat Baru', color: 'orange' },
  'return':         { label: 'Dikembalikan ke Pengirim',  color: 'red'    },
  'returnhq':       { label: 'Dikembalikan ke LP HQ',     color: 'red'    },
  'cancel':         { label: 'Dibatalkan',                color: 'red'    },
  'return-reroute': { label: 'Retur + Alamat Baru',       color: 'red'    },
};