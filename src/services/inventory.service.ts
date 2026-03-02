import api from '@/lib/api';
import type { InventoryLog, CreateInventoryPayload } from '@/types/inventory.types';

const InventoryService = {
  // Tambah/Kurangi Stok
  async adjustStock(payload: CreateInventoryPayload): Promise<{ message: string; currentStock: number }> {
    const { data } = await api.post('/inventory/adjust', payload);
    return data;
  },

  // Ambil history berdasarkan variant ID
  async getHistory(variantId: string | number): Promise<InventoryLog[]> {
    const { data } = await api.get<InventoryLog[]>(`/inventory/history/${variantId}`);
    return data;
  }
};

export default InventoryService;