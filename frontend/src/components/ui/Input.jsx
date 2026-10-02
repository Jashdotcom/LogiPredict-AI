import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

/**
 * Enterprise Base Input Component
 */
export const Input = forwardRef(function Input(
  {
    type = 'text',
    size = 'md',
    error = false,
    errorMessage,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    className = '',
    disabled = false,
    ...props
  },
  ref
) {
  const sizes = {
    sm: 'h-8 text-xs px-2.5',
    md: 'h-9 text-sm px-3',
    lg: 'h-10 text-sm px-3.5',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-4 h-4',
  };

  return (
    <div className="w-full space-y-1">
      <div className="relative flex items-center">
        {LeftIcon && (
          <div className="absolute left-3 text-slate-400 pointer-events-none">
            <LeftIcon className={iconSizes[size] || iconSizes.md} />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          disabled={disabled}
          className={cn(
            'w-full bg-[#0b0f19] hover:bg-[#131b2e] focus:bg-[#0f172a] text-slate-100 placeholder:text-slate-500',
            'border rounded-lg transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 shadow-2xs',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error
              ? 'border-rose-500 focus:border-rose-400 focus:ring-rose-500/30'
              : 'border-slate-800 focus:border-indigo-500',
            LeftIcon ? 'pl-9' : '',
            RightIcon ? 'pr-9' : '',
            sizes[size] || sizes.md,
            className
          )}
          {...props}
        />
        {RightIcon && (
          <div className="absolute right-3 text-slate-400 pointer-events-none">
            <RightIcon className={iconSizes[size] || iconSizes.md} />
          </div>
        )}
      </div>
      {errorMessage && (
        <p className="text-[11px] font-medium text-rose-400">{errorMessage}</p>
      )}
    </div>
  );
});

export default Input;
