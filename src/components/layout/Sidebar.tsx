'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, Tag, ShoppingCart, CreditCard,
  Truck, Ticket, Warehouse, Megaphone, Bell, Users, LogOut,
  ChevronRight, X,
  Icon,
  LogsIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { NAV_ITEMS } from '@/lib/constants';
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
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  pendingOrdersCount?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Sidebar({
  isOpen = true,
  onClose,
  pendingOrdersCount = 0,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-64 bg-gray-900 text-white z-40 flex flex-col',
          'transform transition-transform duration-300 ease-in-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-gray-900" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">SneakersFlash</p>
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden text-gray-400 hover:text-white hover:bg-gray-800 h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = ICON_MAP[item.icon];
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);

            // Only show badge count for items that have a badge key
            const badgeCount =
              item.badge === 'pendingOrders' ? pendingOrdersCount : 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                  'transition-all duration-150 group',
                  isActive
                    ? 'bg-white text-gray-900'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800',
                )}
              >
                {Icon && (
                  <Icon
                    className={cn(
                      'w-4 h-4 flex-shrink-0',
                      isActive ? 'text-gray-900' : 'text-gray-500 group-hover:text-white',
                    )}
                  />
                )}
                <span className="flex-1">{item.title}</span>
                {badgeCount > 0 && (
                  <Badge
                    className={cn(
                      'text-xs h-5 min-w-5 px-1.5',
                      isActive
                        ? 'bg-gray-900 text-white'
                        : 'bg-orange-500 text-white',
                    )}
                  >
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </Badge>
                )}
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                )}
              </Link>
            );
          })}
          <Separator className="bg-gray-800 mb-2" />
          <div className="flex items-center justify-between p-5 border-b border-gray-800">
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
          <Link
            key={'dashboard/ginee-logs'}
            href={'dashboard/ginee-logs'}
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
              'transition-all duration-150 group bg-white text-gray-900'
            )}
          >
              <LogsIcon
                className={cn(
                  'w-4 h-4 flex-shrink-0 text-gray-900',
                )}
              />
            <span className="flex-1">Ginee Logs</span>
          </Link>
        </nav>


        {/* User Profile & Logout */}
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-800 mb-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback className="bg-gray-600 text-white text-xs">
                {user?.name ? getInitials(user.name) : 'AD'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.name ?? 'Admin'}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user?.email ?? ''}
              </p>
            </div>
          </div>

          <Separator className="bg-gray-800 mb-2" />

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}