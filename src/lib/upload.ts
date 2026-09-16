import api, { MAX_UPLOAD_MB } from './api';

const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

/**
 * Satu-satunya jalan unggah gambar ke backend (`/media/upload` → ImageKit).
 *
 * Dulu enam modal menyalin fungsi ini masing-masing, jadi perbaikan batas ukuran
 * harus ditempel enam kali dan pasti ada yang kelewat. Ukuran dicek DI SINI,
 * sebelum berkas dikirim: kalau tidak, nginx yang menolak (413 dengan badan HTML)
 * dan admin cuma melihat "Request failed with status code 413" — persis kebingungan
 * yang bikin banner kampanye ditempel lewat link Nextcloud, 16 Sep 2026.
 */
export async function uploadImage(file: File): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    throw new Error(
      `Ukuran file ${mb} MB melebihi batas ${MAX_UPLOAD_MB} MB. Kompres dulu gambarnya.`,
    );
  }

  const uploadData = new FormData();
  uploadData.append('file', file);

  const { data } = await api.post('/media/upload', uploadData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  if (data.url) {
    return data.url.startsWith('http') ? data.url : `${baseUrl}${data.url}`;
  }
  if (data.filename) return `${baseUrl}/uploads/${data.filename}`;
  return `${baseUrl}/uploads/${data}`;
}

export { MAX_UPLOAD_MB };
