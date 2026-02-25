'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { setCookie } from 'cookies-next';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

import api from '@/lib/axios'; // Pastikan path ini sesuai
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

// --- Schema Validasi (Zod) ---
const loginSchema = z.object({
    email: z.string().email({ message: "Email tidak valid" }),
    password: z.string().min(6, { message: "Password minimal 6 karakter" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

  // --- React Hook Form Setup ---
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
        email: '',
        password: '',
        },
    });

    const onSubmit = async (data: LoginFormValues) => {
        setLoading(true);
        try {
        const res = await api.post('/auth/login', data);
        const { access_token, user } = res.data;

        setCookie('token', access_token, { maxAge: 60 * 60 * 24 });
        setCookie('user', JSON.stringify(user), { maxAge: 60 * 60 * 24 });

        toast.success("Login Berhasil", {
            description: `Selamat datang kembali, ${user.name || 'Admin'}.`,
        });

        router.push('/dashboard');
        } catch (err: any) {
        console.error(err);
        toast.error("Akses Ditolak", {
            description: err.response?.data?.message || 'Kredensial tidak valid.',
        });
        } finally {
        setLoading(false);
        }
    };

    return (
        <div className="w-full h-screen lg:grid lg:grid-cols-2 overflow-hidden bg-white">
        
        {/* --- BAGIAN KIRI: BRANDING & VISUAL --- */}
        <div className="hidden lg:flex relative flex-col justify-between p-10 bg-slate-950 text-white h-full">
            {/* Background Pattern / Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-black opacity-80" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
            
            {/* Logo & Brand */}
            <div className="relative z-10 flex items-center gap-3">
            {/* Ganti src dengan path logo kamu yang sebenarnya */}
            <div className="w-auto h-10  overflow-hidden border border-slate-700 shadow-xl">
                <Image 
                src="/images/logosf.jpeg" 
                alt="Logo" 
                width={40} 
                height={40} 
                className="object-cover w-full h-full"
                />
            </div>
            <span className="text-xl font-bold tracking-tight">Admin</span>
            </div>

            {/* Quote / Testimonial / Hero Text */}
            <div className="relative z-10 max-w-md">
            <blockquote className="space-y-2">
                <p className="text-lg font-medium leading-relaxed text-slate-200">
                &ldquo;Control panel yang efisien adalah kunci dari manajemen e-commerce yang sukses. Kelola inventori dan pesanan Anda dengan presisi.&rdquo;
                </p>
                <footer className="text-sm text-slate-400">System Administrator</footer>
            </blockquote>
            </div>

            {/* Footer Copyright */}
            <div className="relative z-10 text-xs text-slate-500">
            &copy; 2026 SneakersFlash Project. All rights reserved.
            </div>
        </div>

        {/* --- BAGIAN KANAN: FORM LOGIN --- */}
        <div className="flex items-center justify-center p-8 bg-white h-full relative">
            <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[380px]"
            >
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Welcome back
                </h1>
                <p className="text-sm text-slate-500">
                Masukkan kredensial admin Anda untuk mengakses dashboard.
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                
                {/* Email Field */}
                <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative group">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                    <Input
                    id="email"
                    placeholder="name@example.com"
                    type="email"
                    className={`pl-10 h-11 transition-all ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    disabled={loading}
                    {...register('email')}
                    />
                </div>
                {errors.email && (
                    <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <a href="#" className="text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline">
                    Lupa password?
                    </a>
                </div>
                <div className="relative group">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                    <Input
                    id="password"
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                    className={`pl-10 h-11 transition-all ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    disabled={loading}
                    {...register('password')}
                    />
                    <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
                    >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                {errors.password && (
                    <p className="text-xs text-red-500">{errors.password.message}</p>
                )}
                </div>

                <Button 
                type="submit" 
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium transition-all"
                disabled={loading}
                >
                {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <span className="flex items-center gap-2">
                    Sign In <ArrowRight className="w-4 h-4" />
                    </span>
                )}
                </Button>
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">
                    Atau
                </span>
                </div>
            </div>
            
            <div className="text-center text-sm text-slate-500">
                Butuh akses tambahan?{' '}
                <a href="#" className="underline underline-offset-4 hover:text-slate-900 font-medium">
                Hubungi Super Admin
                </a>
            </div>

            </motion.div>
        </div>
        </div>
    );
}