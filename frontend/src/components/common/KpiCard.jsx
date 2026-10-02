import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  PackageCheck,
  AlertOctagon,
  BrainCircuit,
  Truck,
  BellRing,
  Zap,
  Boxes,
  Layers,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Badge } from './Badge';

// Map icon names to components
const ICON_MAP = {
  PackageCheck,
  AlertOctagon,
  BrainCircuit,
  Truck,
  BellRing,
  Zap,
  Boxes,
  Layers,
  TrendingUp,
};

/**
 * Enterprise KPI Card for command center telemetry
 */
export function KpiCard({
  title,
  value,
  change,
  isPositive = true,
  timeframe = 'vs last period',
  description,
  status,
  statusVariant = 'success',
  icon: IconProp,
  iconName,
  colorScheme = 'indigo',
  className = '',
  onClick,
}) {
  const IconComponent = IconProp || (iconName ? ICON_MAP[iconName] : PackageCheck) || PackageCheck;

  const colorStyles = {
    indigo: {
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      accentGlow: 'hover:border-indigo-200',
    },
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      accentGlow: 'hover:border-emerald-200',
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      accentGlow: 'hover:border-amber-200',
    },
    rose: {
      iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
      accentGlow: 'hover:border-rose-200',
    },
    blue: {
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      accentGlow: 'hover:border-blue-200',
    },
    purple: {
      iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
      accentGlow: 'hover:border-purple-200',
    },
  };

  const currentTheme = colorStyles[colorScheme] || colorStyles.indigo;

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs transition-all duration-200',
        'hover:shadow-md hover:-translate-y-0.5',
        onClick ? 'cursor-pointer' : '',
        currentTheme.accentGlow,
        className
      )}
    >
      {/* Top row: Label & Icon */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">
            {title}
          </p>
        </div>
        <div
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-lg border shrink-0 transition-transform group-hover:scale-105 duration-200',
            currentTheme.iconBg
          )}
        >
          <IconComponent className="w-5 h-5" />
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          {value}
        </span>
        {status && (
          <Badge variant={statusVariant} size="xs" pill>
            {status}
          </Badge>
        )}
      </div>

      {/* Trend & Context */}
      <div className="mt-3 flex items-center gap-1.5 text-xs">
        {change && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 font-semibold px-1.5 py-0.5 rounded',
              isPositive
                ? 'text-emerald-700 bg-emerald-50'
                : 'text-rose-700 bg-rose-50'
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {change}
          </span>
        )}
        {timeframe && (
          <span className="text-slate-500 truncate">{timeframe}</span>
        )}
      </div>

      {/* Optional helper description */}
      {description && (
        <p className="mt-2 text-[11px] text-slate-400 border-t border-slate-100 pt-2 line-clamp-1">
          {description}
        </p>
      )}
    </div>
  );
}

export default KpiCard;
