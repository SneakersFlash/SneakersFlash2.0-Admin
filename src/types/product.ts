export interface Variant {
    id: string;
    sku: string;
    price: number;
    stock: number; // Perhatikan: di API namanya "stock", bukan "stockQuantity"
    imageUrl: string | null;
}

export interface Product {
    id: number;
    name: string;
    slug: string;
    basePrice: number;
    isActive: boolean;
    category?: { name: string };
    brand?: { name: string };
    variants: Variant[];
    
    // Field baru dari API
    availableSizes: string[]; 
    totalStock: number;
}