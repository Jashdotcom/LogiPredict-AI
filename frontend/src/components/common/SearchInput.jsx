import React, { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Enterprise Search Input with shortcut chip, clear trigger, and loading indicator.
 */
export function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = 'Search inventory, SKUs, routes, alerts (Press "/" to focus)...',
  shortcut = '/',
  size = 'md',
  className = '',
  autoFocus = false,
  ...props
}) {
  const inputRef = useRef(null);

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: '' } });
    }
    inputRef.current?.focus();
  };

  const sizes = {
    sm: 'h-8 text-xs pl-8 pr-7',
    md: 'h-9 text-sm pl-9 pr-8',
    lg: 'h-10 text-sm pl-10 pr-9',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5 left-2.5',
    md: 'w-4 h-4 left-3',
    lg: 'w-4 h-4 left-3.5',
  };

  return (
    <div className={cn('relative flex items-center w-full max-w-md', className)}>
      <Search
        className={cn(
          'absolute text-slate-400 pointer-events-none transition-colors',
          iconSizes[size] || iconSizes.md
        )}
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          'w-full bg-slate-50/80 hover:bg-slate-100/80 focus:bg-white text-slate-900 placeholder:text-slate-400',
          'border border-slate-200/90 rounded-lg transition-all duration-150',
          'focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-2xs',
          sizes[size] || sizes.md
        )}
        {...props}
      />
      {value ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
          title="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : shortcut ? (
        <div className="absolute right-2.5 hidden sm:flex items-center pointer-events-none">
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
            {shortcut}
          </kbd>
        </div>
      ) : null}
    </div>
  );
}

export default SearchInput;
