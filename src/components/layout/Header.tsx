'use client';

import { usePathname } from 'next/navigation';
import { Menu, Search, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { NAV_GROUPS } from '@/lib/constants'; // 1. Ubah import ke NAV_GROUPS
import { cn } from '@/lib/utils';

// ─── Breadcrumb builder ───────────────────────────────────────────────────────

function getBreadcrumbs(pathname: string) {
  const crumbs = [{ label: 'Dashboard', href: '/dashboard' }];

  // 2. Gabungkan semua item dari dalam grup menjadi satu array datar (flat)
  const allNavItems = NAV_GROUPS.flatMap(group => group.items);

  // 3. Cari kecocokan URL
  const matched = allNavItems.find(
    (item) =>
      item.href !== '/dashboard' && pathname.startsWith(item.href),
  );

  if (matched) {
    crumbs.push({ label: matched.title, href: matched.href });

    // Sub-page (e.g. /dashboard/products/create or /dashboard/products/[id])
    const segments = pathname.replace(matched.href, '').split('/').filter(Boolean);
    if (segments.length > 0) {
      const sub = segments[0];
      const subLabel =
        sub === 'new' || sub === 'create'
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

export default function Header({ onMenuToggle, notificationCount = 0 }: HeaderProps) {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);
  const currentPage = breadcrumbs[breadcrumbs.length - 1];

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {/* Hamburger menu for mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-gray-600 hover:text-gray-900"
          onClick={onMenuToggle}
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Breadcrumbs — visible on desktop */}
        <nav className="hidden md:flex items-center gap-2 text-sm">
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
            <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 flex items-center justify-center bg-red-500 text-white text-[10px] border-2 border-white">
              {notificationCount > 99 ? '99+' : notificationCount}
            </Badge>
          )}
        </Button>
      </div>
    </header>
  );
}