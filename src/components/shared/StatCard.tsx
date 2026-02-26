import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn, formatPercent } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  trend?: number; // percentage change (positive = up, negative = down)
  trendLabel?: string;
  isLoading?: boolean;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-gray-600',
  iconBgColor = 'bg-gray-100',
  trend,
  trendLabel = 'vs kemarin',
  isLoading = false,
}: StatCardProps) {
  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;
  const isFlat = trend !== undefined && trend === 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          {isLoading ? (
            <div className="mt-2 space-y-2">
              <div className="h-7 w-28 bg-gray-200 rounded animate-pulse" />
              {subtitle && (
                <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
              )}
            </div>
          ) : (
            <>
              <p className="mt-1 text-2xl font-bold text-gray-900 truncate">
                {value}
              </p>
              {subtitle && (
                <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
              )}
            </>
          )}
        </div>

        <div className={cn('p-2.5 rounded-xl flex-shrink-0', iconBgColor)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
      </div>

      {/* Trend indicator */}
      {trend !== undefined && !isLoading && (
        <div className="mt-3 flex items-center gap-1.5">
          {isPositive && (
            <>
              <TrendingUp className="w-3.5 h-3.5 text-green-500" />
              <span className="text-xs font-medium text-green-600">
                +{formatPercent(trend)}
              </span>
            </>
          )}
          {isNegative && (
            <>
              <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              <span className="text-xs font-medium text-red-600">
                {formatPercent(trend)}
              </span>
            </>
          )}
          {isFlat && (
            <>
              <Minus className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">0%</span>
            </>
          )}
          <span className="text-xs text-gray-400">{trendLabel}</span>
        </div>
      )}
    </div>
  );
}
