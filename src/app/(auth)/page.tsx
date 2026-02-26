'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ─── Validation Schema ────────────────────────────────────────────────────────

const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email wajib diisi')
        .email('Format email tidak valid'),
    password: z
        .string()
        .min(6, 'Password minimal 6 karakter'),
    });

    type LoginFormValues = z.infer<typeof loginSchema>;

    // ─── Component ────────────────────────────────────────────────────────────────

    export default function LoginPage() {
    const { login } = useAuth();
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });

    const onSubmit = async (values: LoginFormValues) => {
        try {
        await login(values);
        } catch (error) {
        toast.error(getErrorMessage(error));
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black px-4">
        {/* Background pattern */}
        <div
            className="absolute inset-0 opacity-5"
            style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
        />

        <div className="relative w-full max-w-md">
            {/* Card */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-8">
            {/* Logo & Title */}
            <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-black rounded-xl shadow-lg">
                <ShoppingBag className="w-7 h-7 text-white" />
                </div>
                <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    SneakersFlash
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Admin Panel — Masuk ke akun Anda
                </p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Email */}
                <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email
                </Label>
                <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@sneakersflash.com"
                    {...register('email')}
                    className={errors.email ? 'border-red-400 focus-visible:ring-red-300' : ''}
                />
                {errors.email && (
                    <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                </Label>
                <div className="relative">
                    <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...register('password')}
                    className={
                        errors.password
                        ? 'border-red-400 focus-visible:ring-red-300 pr-10'
                        : 'pr-10'
                    }
                    />
                    <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                    >
                    {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                    ) : (
                        <Eye className="w-4 h-4" />
                    )}
                    </button>
                </div>
                {errors.password && (
                    <p className="text-xs text-red-500">{errors.password.message}</p>
                )}
                </div>

                {/* Submit */}
                <Button
                type="submit"
                className="w-full bg-black hover:bg-gray-800 text-white font-medium h-11 transition-colors"
                disabled={isSubmitting}
                >
                {isSubmitting ? (
                    <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memproses...
                    </>
                ) : (
                    'Masuk'
                )}
                </Button>
            </form>

            {/* Footer */}
            <p className="text-center text-xs text-gray-400">
                Akses terbatas untuk administrator SneakersFlash
            </p>
            </div>
        </div>
        </div>
    );
    }
