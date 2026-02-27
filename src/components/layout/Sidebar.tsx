'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, Tag, ShoppingCart, CreditCard,
  Truck, Ticket, Warehouse, Megaphone, Bell, Users, LogOut,
  ChevronRight, X, Handshake, Image as ImageIcon, LogsIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { NAV_GROUPS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// ─── Icon Map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'layout-dashboard': LayoutDashboard,
  'package':          Package,
  'tag':              Tag,
  'shopping-cart':    ShoppingCart,
  'credit-card':      CreditCard,
  'truck':            Truck,
  'ticket':           Ticket,
  'warehouse':        Warehouse,
  'megaphone':        Megaphone,
  'bell':             Bell,
  'users':            Users,
  'handshake':        Handshake,
  'image-icon':       ImageIcon,
  'logs':             LogsIcon,
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  pendingOrdersCount?: number;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

const getInitials = (name: string) => {
  return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Sidebar({
  isOpen = true,
  onClose,
  pendingOrdersCount = 0,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[260px] bg-gray-950 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static',
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 bg-gray-950/50 backdrop-blur-md border-b border-gray-800">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-gray-950 font-bold text-xl leading-none tracking-tighter">S</span>
              <span className="text-gray-950 font-bold text-xl leading-none tracking-tighter">F</span>
            </div>
            <span className="text-white font-bold tracking-tight text-lg">
              Sneaker<span className="text-gray-400">Flash</span>
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation Grouped */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="px-3 mb-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = ICON_MAP[item.icon] || Package;
                  // Handle exact match for dashboard, startswith for others
                  const isActive = item.href === '/dashboard' 
                    ? pathname === '/dashboard' 
                    : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                        isActive
                          ? 'bg-white text-gray-950 shadow-sm'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-4 h-4 flex-shrink-0 transition-colors',
                          isActive ? 'text-gray-950' : 'text-gray-400 group-hover:text-white'
                        )}
                      />
                      <span className="flex-1">{item.title}</span>

                      {/* Optional Badge */}
                      {item.badge === 'pendingOrders' && pendingOrdersCount > 0 && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            'ml-auto h-5 px-1.5 min-w-5 flex items-center justify-center rounded-full text-[10px] font-bold',
                            isActive
                              ? 'bg-gray-900 text-white'
                              : 'bg-indigo-500 text-white border-none'
                          )}
                        >
                          {pendingOrdersCount > 99 ? '99+' : pendingOrdersCount}
                        </Badge>
                      )}

                      {!isActive && (
                        <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-gray-500" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-gray-800 bg-gray-950/50 backdrop-blur-md">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-900/50 border border-gray-800 mb-3">
            <Avatar className="h-9 w-9 border border-gray-700">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback className="bg-gray-800 text-white text-xs font-medium">
                {user?.name ? getInitials(user.name) : 'AD'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user?.name ?? 'Admin'}
              </p>
              <p className="text-[11px] text-gray-400 truncate">
                {user?.email ?? ''}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/20"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>
    </>
  );
}