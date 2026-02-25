import axios from 'axios';
import { getCookie, deleteCookie } from 'cookies-next'; // Tambah deleteCookie
import { toast } from 'sonner'; // Import toast untuk notifikasi

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor Request: Pasang Token
api.interceptors.request.use((config) => {
    const token = getCookie('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor Response: Handle Error & Auto Logout
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Jika Token Expired atau Tidak Valid (401)
        if (error.response?.status === 401) {
        
        // 1. Bersihkan jejak (Hapus cookie)
        deleteCookie('token');
        deleteCookie('user');

        // 2. Redirect ke Login (Hanya jika di browser)
        if (typeof window !== 'undefined') {
            // Cek agar tidak looping redirect di halaman login sendiri
            if (window.location.pathname !== '/') {
            // Opsional: Tampilkan alert/toast sebelum pindah (tapi karena window.location itu hard reload, toast mungkin gak sempat muncul lama)
            alert("Sesi Anda telah berakhir. Silakan login kembali."); 
            window.location.href = '/';
            }
        }
        }
        return Promise.reject(error);
    }
);

export default api;