import { cn } from '../../utils/cn';

/**
 * LogiPredict AI — Enterprise Status Badge Component
 * Supports neutral, brand, success, warning, critical, danger, info (information), and purple variants
 * with dot indicators, pulse animation, custom icons, and size scales.
 */
export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  dotPulse = false,
  pill = true,
  icon: Icon,
  className = '',
  ...props
}) {
  const variants = {
    neutral: {
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
    },
    brand: {
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      dot: 'bg-indigo-400',
    },
    success: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-400',
    },
    warning: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-400',
    },
    critical: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-400',
    },
    danger: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-400',
    },
    info: {
      bg: 'bg-sky-50 text-sky-700 border-sky-200',
      dot: 'bg-sky-400',
    },
    information: {
      bg: 'bg-sky-50 text-sky-700 border-sky-200',
      dot: 'bg-sky-400',
    },
    purple: {
      bg: 'bg-purple-50 text-purple-700 border-purple-200',
      dot: 'bg-purple-400',
    },
  };

  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1 font-medium',
    sm: 'text-xs px-2 py-0.5 gap-1.5 font-medium',
    md: 'text-xs px-2.5 py-0.5 gap-1.5 font-semibold',
    lg: 'text-sm px-3 py-1 gap-2 font-semibold',
  };

  const currentVariant = variants[variant] || variants.neutral;

  return (
    <span
      className={cn(
        'inline-flex items-center border tracking-wide select-none',
        pill ? 'rounded-full' : 'rounded-md',
        currentVariant.bg,
        sizes[size] || sizes.md,
        className
      )}
      {...props}
    >
      {dot && (
        <span className="relative flex h-2 w-2 shrink-0">
          {dotPulse && (
            <span
              className={cn(
                'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                currentVariant.dot
              )}
            />
          )}
          <span
            className={cn('relative inline-flex rounded-full h-2 w-2', currentVariant.dot)}
          />
        </span>
      )}
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{children}</span>
    </span>
  );
}

export default Badge;
