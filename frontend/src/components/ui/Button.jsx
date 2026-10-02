import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * LogiPredict AI — Enterprise Button Component
 * Supports primary, secondary, outline, ghost, destructive, success, and brand variants
 * with default, hover, active, focus-visible, disabled, and loading states.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = '',
  disabled = false,
  type = 'button',
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    primary:
      'bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700 shadow-xs focus-visible:ring-indigo-400 focus-visible:ring-offset-slate-950',
    brand:
      'bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700 shadow-xs focus-visible:ring-indigo-400 focus-visible:ring-offset-slate-950',
    secondary:
      'bg-slate-800 text-slate-200 hover:bg-slate-700 active:bg-slate-800 border border-slate-700 focus-visible:ring-slate-400 focus-visible:ring-offset-slate-950',
    outline:
      'bg-slate-900 text-slate-200 hover:bg-slate-800 active:bg-slate-900 border border-slate-700 shadow-2xs focus-visible:ring-indigo-400 focus-visible:ring-offset-slate-950',
    ghost:
      'bg-transparent text-slate-400 hover:bg-slate-800/80 active:bg-slate-800 hover:text-slate-100 focus-visible:ring-slate-400 focus-visible:ring-offset-slate-950',
    destructive:
      'bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700 shadow-xs focus-visible:ring-rose-400 focus-visible:ring-offset-slate-950',
    danger:
      'bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700 shadow-xs focus-visible:ring-rose-400 focus-visible:ring-offset-slate-950',
    destructiveOutline:
      'bg-slate-900 text-rose-400 hover:bg-rose-950/40 border border-rose-800/60 focus-visible:ring-rose-400 focus-visible:ring-offset-slate-950',
    success:
      'bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 shadow-xs focus-visible:ring-emerald-400 focus-visible:ring-offset-slate-950',
    subtleBrand:
      'bg-indigo-950/80 text-indigo-300 hover:bg-indigo-900 active:bg-indigo-950 border border-indigo-800/70 focus-visible:ring-indigo-400 focus-visible:ring-offset-slate-950',
  };

  const sizes = {
    xs: 'text-xs px-2.5 py-1 gap-1.5 rounded-md h-7',
    sm: 'text-xs px-3 py-1.5 gap-1.5 rounded-md h-8',
    md: 'text-sm px-4 py-2 gap-2 rounded-lg h-9',
    lg: 'text-base px-5 py-2.5 gap-2.5 rounded-lg h-11',
  };

  const iconSizes = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const isButtonDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isButtonDisabled}
      aria-busy={isLoading}
      className={cn(
        baseStyles,
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        className
      )}
      {...props}
    >
      {isLoading && (
        <Loader2 className={cn('animate-spin shrink-0', iconSizes[size] || 'w-4 h-4')} />
      )}
      {!isLoading && LeftIcon && (
        <LeftIcon className={cn('shrink-0', iconSizes[size] || 'w-4 h-4')} />
      )}
      <span>{isLoading && loadingText ? loadingText : children}</span>
      {!isLoading && RightIcon && (
        <RightIcon className={cn('shrink-0', iconSizes[size] || 'w-4 h-4')} />
      )}
    </button>
  );
}

/**
 * Compact Icon-Only Button
 */
export function IconButton({
  icon: Icon,
  variant = 'ghost',
  size = 'md',
  isLoading = false,
  className = '',
  disabled = false,
  title,
  type = 'button',
  ...props
}) {
  const iconButtonSizes = {
    xs: 'w-7 h-7 p-1 rounded-md',
    sm: 'w-8 h-8 p-1.5 rounded-md',
    md: 'w-9 h-9 p-2 rounded-lg',
    lg: 'w-11 h-11 p-2.5 rounded-lg',
  };

  const iconSizes = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <Button
      variant={variant}
      disabled={disabled}
      isLoading={isLoading}
      type={type}
      title={title}
      aria-label={title}
      className={cn(iconButtonSizes[size] || iconButtonSizes.md, 'px-0 py-0', className)}
      {...props}
    >
      {Icon && !isLoading && <Icon className={iconSizes[size] || 'w-4 h-4'} />}
    </Button>
  );
}

export default Button;
