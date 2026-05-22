import api, { getErrorMessage } from '@/lib/api';

export interface LabelProduct {
  sku: string;
  name: string;
  brand: string;
  category: string;
  type: string;
  ritelPrice: number;
  afterDisc: number;
}

export interface LabelSize {
  width: number;
  height: number;
  copies: number;
  rotate: number; // 0 | 90 | 180 | 270 derajat
}

// Endpoint label mengembalikan PDF (blob). Kalau error, body error juga
// berbentuk blob — fungsi ini mengekstrak pesannya jadi teks biasa.
async function extractBlobError(error: unknown): Promise<string> {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (data instanceof Blob) {
    try {
      const json = JSON.parse(await data.text());
      const msg = json.message;
      return Array.isArray(msg)
        ? msg.join(', ')
        : msg || 'Gagal membuat PDF label.';
    } catch {
      return 'Gagal membuat PDF label.';
    }
  }
  return getErrorMessage(error);
}

const LabelsService = {
  /** Cari produk dari data inventory (sheet). */
  async searchProducts(search: string, limit = 100): Promise<LabelProduct[]> {
    const { data } = await api.get<{ total: number; data: LabelProduct[] }>(
      '/labels/products',
      { params: { search, limit } },
    );
    return data.data;
  },

  /** PDF berisi banyak label sekaligus. */
  async getBatchPdf(skus: string[], size: LabelSize): Promise<Blob> {
    try {
      const { data } = await api.post(
        '/labels/batch',
        { skus, ...size },
        { responseType: 'blob' },
      );
      return data as Blob;
    } catch (error) {
      throw new Error(await extractBlobError(error));
    }
  },

  /** PDF satu label untuk satu SKU. */
  async getSinglePdf(sku: string, size: LabelSize): Promise<Blob> {
    try {
      const { data } = await api.get(
        `/labels/sku/${encodeURIComponent(sku)}`,
        { params: size, responseType: 'blob' },
      );
      return data as Blob;
    } catch (error) {
      throw new Error(await extractBlobError(error));
    }
  },
};

export default LabelsService;
