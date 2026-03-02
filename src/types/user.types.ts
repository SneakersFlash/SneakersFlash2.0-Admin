export interface User {
    id: string | number;
    name: string;
    email: string;
    role: string;
    phone: string | null;
    createdAt: string;
}