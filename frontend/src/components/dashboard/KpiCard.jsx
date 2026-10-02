import React from 'react';
import {
  Boxes,
  PackageCheck,
  AlertOctagon,
  ShieldAlert,
  FileSpreadsheet,
  BellRing,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  Zap,
  Truck,
  Activity,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

// Icon Map for dynamic icon lookup
const ICON_MAP = {
  Boxes,
  PackageCheck,
  AlertOctagon,
  ShieldAlert,
  FileSpreadsheet,
  BellRing,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Zap,
  Truck,
  Activity,
};

// Dark command-center color scheme styles
const COLOR_SCHEMES = {
  indigo: {
    iconBg: 'bg-indigo-950/80 text-indigo-400 border-indigo-800/60',
    accentBorder: 'hover:border-indigo-700/60',
    badgeVariant: 'brand',
  },
  emerald: {
    iconBg: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60',
    accentBorder: 'hover:border-emerald-700/60',
    badgeVariant: 'success',
  },
  amber: {
    iconBg: 'bg-amber-950/80 text-amber-400 border-amber-800/60',
    accentBorder: 'hover:border-amber-700/60',
    badgeVariant: 'warning',
  },
  rose: {
    iconBg: 'bg-rose-950/80 text-rose-400 border-rose-800/60',
    accentBorder: 'hover:border-rose-700/60',
    badgeVariant: 'danger',
  },
  blue: {
    iconBg: 'bg-blue-950/80 text-blue-400 border-blue-800/60',
    accentBorder: 'hover:border-blue-700/60',
    badgeVariant: 'info',
  },
  purple: {
    iconBg: 'bg-purple-950/80 text-purple-400 border-purple-800/60',
    accentBorder: 'hover:border-purple-700/60',
    badgeVariant: 'purple',
  },
};

/**
 * Reusable KPI Card Component
 */
export function KPICard({
  title,
  value,
  unit,
  change,
  trend,
  isPositive = true,
  timeframe,
  description,
  status,
  statusVariant,
  iconName = 'Boxes',
  colorScheme = 'indigo',
  onClick,
  className,
}) {
  const IconComponent = typeof iconName === 'string' ? ICON_MAP[iconName] || Boxes : iconName;
  const colors = COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES.indigo;

  // Compute trend arrow icon & color
  let TrendIcon = Minus;
  let trendColor = 'text-slate-400 bg-slate-800 border-slate-700';

  if (trend === 'up' || (change && change.startsWith('+'))) {
    TrendIcon = ArrowUpRight;
    trendColor = isPositive ? 'text-emerald-400 bg-emerald-950/80 border-emerald-800/60' : 'text-rose-400 bg-rose-950/80 border-rose-800/60';
  } else if (trend === 'down' || (change && change.startsWith('-'))) {
    TrendIcon = ArrowDownRight;
    trendColor = isPositive ? 'text-emerald-400 bg-emerald-950/80 border-emerald-800/60' : 'text-rose-400 bg-rose-950/80 border-rose-800/60';
  }

  return (
    <Card
      onClick={onClick}
      hoverable={Boolean(onClick)}
      className={cn(
        'relative overflow-hidden transition-all duration-200',
        colors.accentBorder,
        onClick && 'cursor-pointer select-none',
        className
      )}
    >
      {/* Top row: Title + Icon */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
            {title}
          </p>
          {status && (
            <div className="mt-1">
              <Badge variant={statusVariant || colors.badgeVariant} size="xs">
                {status}
              </Badge>
            </div>
          )}
        </div>

        <div
          className={cn(
            'w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs',
            colors.iconBg
          )}
        >
          <IconComponent className="w-5 h-5" />
        </div>
      </div>

      {/* Main value display */}
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100 font-numeric">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {unit}
          </span>
        )}
      </div>

      {/* Bottom row: Change indicator + timeframe */}
      {(change || description || timeframe) && (
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs gap-2">
          {change && (
            <div
              className={cn(
                'inline-flex items-center gap-1 font-semibold text-[11px] px-1.5 py-0.5 rounded border',
                trendColor
              )}
            >
              <TrendIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{change}</span>
            </div>
          )}
          <span className="text-slate-400 text-[11px] truncate text-right">
            {timeframe || description}
          </span>
        </div>
      )}
    </Card>
  );
}

export { KPICard as KpiCard };
export default KPICard;
