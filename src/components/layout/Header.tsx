'use client';

import { usePathname } from 'next/navigation';
import { Menu, Search, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { NAV_ITEMS } from '@/lib/constants';
import { cn } from '@/lib/utils';

// ─── Breadcrumb builder ───────────────────────────────────────────────────────

function getBreadcrumbs(pathname: string) {
  const crumbs = [{ label: 'Dashboard', href: '/dashboard' }];

  const matched = NAV_ITEMS.find(
    (item) =>
      item.href !== '/dashboard' && pathname.startsWith(item.href),
  );

  if (matched) {
    crumbs.push({ label: matched.title, href: matched.href });

    // Sub-page (e.g. /dashboard/products/new or /dashboard/products/[id])
    const segments = pathname.replace(matched.href, '').split('/').filter(Boolean);
    if (segments.length > 0) {
      const sub = segments[0];
      const subLabel =
        sub === 'new'
          ? 'Tambah Baru'
          : sub.length > 20
          ? `Detail`
          : sub.charAt(0).toUpperCase() + sub.slice(1);

      crumbs.push({ label: subLabel, href: pathname });
    }
  }

  return crumbs;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface HeaderProps {
  onMenuToggle: () => void;
  notificationCount?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Header({ onMenuToggle, notificationCount = 0 }: HeaderProps) {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);
  const currentPage = breadcrumbs[breadcrumbs.length - 1];

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 lg:px-6 h-14 flex items-center gap-4">
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden text-gray-600 hover:text-gray-900"
        onClick={onMenuToggle}
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Page title / Breadcrumbs */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <nav className="hidden md:flex items-center gap-2 text-sm text-gray-500">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.href} className="flex items-center gap-2">
              {i > 0 && <span className="text-gray-300">/</span>}
              <span
                className={cn(
                  i === breadcrumbs.length - 1
                    ? 'text-gray-900 font-semibold'
                    : 'text-gray-500',
                )}
              >
                {crumb.label}
              </span>
            </span>
          ))}
        </nav>
        {/* Mobile: just show current page name */}
        <h1 className="md:hidden font-semibold text-gray-900 text-sm truncate">
          {currentPage.label}
        </h1>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Search — hidden on mobile, inline on desktop */}
        <div className="hidden sm:block relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input
            placeholder="Cari..."
            className="pl-8 h-8 w-48 lg:w-64 text-sm bg-gray-50 border-gray-200 focus-visible:ring-gray-300"
          />
        </div>

        {/* Notification bell */}
        <Button
          variant="ghost"
          size="icon"
          className="relative text-gray-600 hover:text-gray-900 hover:bg-gray-100 h-8 w-8"
        >
          <Bell className="w-4 h-4" />
          {notificationCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] bg-red-500 text-white border-2 border-white">
              {notificationCount > 9 ? '9+' : notificationCount}
            </Badge>
          )}
        </Button>
      </div>
    </header>
  );
}
