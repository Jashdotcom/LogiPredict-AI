import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Enterprise Form Select Component
 */
export const Select = forwardRef(function Select(
  {
    label,
    options = [],
    value,
    onChange,
    placeholder = 'Select option...',
    size = 'md',
    error = false,
    errorMessage,
    disabled = false,
    className = '',
    selectClassName = '',
    id,
    ...props
  },
  ref
) {
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  const sizes = {
    sm: 'h-8 text-xs px-2.5 pr-8',
    md: 'h-9 text-sm px-3 pr-9',
    lg: 'h-10 text-sm px-3.5 pr-10',
  };

  return (
    <div className={cn('w-full space-y-1', className)}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <select
          id={selectId}
          ref={ref}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={cn(
            'w-full appearance-none bg-[#0b0f19] hover:bg-[#131b2e] focus:bg-[#0f172a] text-slate-100',
            'border rounded-lg transition-all duration-150 cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 shadow-2xs font-medium',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error
              ? 'border-rose-500 focus:border-rose-400 focus:ring-rose-500/30'
              : 'border-slate-800 focus:border-indigo-500',
            sizes[size] || sizes.md,
            selectClassName
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="text-slate-500 bg-[#0b0f19]">
              {placeholder}
            </option>
          )}
          {options.map((opt) => {
            const optVal = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={optVal} value={optVal} className="bg-[#0b0f19] text-slate-100">
                {optLabel}
              </option>
            );
          })}
        </select>
        <div className="absolute right-3 pointer-events-none text-slate-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
      {errorMessage && (
        <p className="text-[11px] font-medium text-rose-400">{errorMessage}</p>
      )}
    </div>
  );
});

export default Select;
