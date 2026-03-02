export type InventoryLogType = 'restock' | 'damage' | 'adjustment' | 'order_fulfillment' | 'return';

export interface InventoryLog {
  id: string | number;
  productVariantId: string | number;
  quantityChange: number;
  type: InventoryLogType;
  note: string | null;
  referenceId: string | null;
  createdAt: string;
  variant?: {
    sku: string;
  };
}

export interface CreateInventoryPayload {
  productVariantId: number;
  quantityChange: number;
  type: InventoryLogType;
  note?: string;
  referenceId?: string;
}