export interface Product {
    id: number;
    name: string;
    price: number;
    stock: number;
    category: string;
    image_url: string; // sesuaikan dengan response backend kamu (misal: 'image' atau 'thumbnail')
    status: 'active' | 'draft' | 'archived';
    created_at: string;
}