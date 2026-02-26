'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  LogOut, 
  Layers,
  ChevronRight,
  Logs
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { deleteCookie } from 'cookies-next';

const menuItems = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Ginee Logs', href: '/dashboard/ginee-logs', icon: Logs },
  { title: 'Products', href: '/dashboard/products', icon: Package },
  { title: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
  { title: 'Customers', href: '/dashboard/customers', icon: Users },
  { title: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    deleteCookie('token');
    deleteCookie('user');
    router.push('/');
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-800 bg-slate-950 text-white transition-transform">
      {/* Brand / Logo Section */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-800/60">
        <div className="relative h-8 w-15 overflow-hidden">
           {/* Pastikan file ini ada di public/images/logosf.jpeg */}
           <Image 
             src="/images/logosf.jpeg" 
             alt="Logo" 
             fill
             className="object-cover"
           />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Admin Panel</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex h-full flex-col justify-between px-3 py-4">
        <nav className="space-y-1">
          <div className="px-3 py-2 text-xs font-semibold uppercase text-slate-500">
            Main Menu
          </div>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn("h-4 w-4", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
                  {item.title}
                </div>
                {isActive && <ChevronRight className="h-3 w-3 opacity-50" />}
              </Link>
            );
          })}
        </nav>

        {/* User / Logout Section */}
        <div className="mb-6 border-t border-slate-800 pt-4">
          <button 
            onClick={handleLogout}
            className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout Session
          </button>
        </div>
      </div>
    </aside>
  );
}