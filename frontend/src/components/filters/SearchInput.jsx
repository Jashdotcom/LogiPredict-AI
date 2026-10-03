import { useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
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
  isLoading = false,
  className = '',
  autoFocus = false,
  ...props
}) {
  const inputRef = useRef(null);

  // Global hotkey handler for shortcut (e.g. "/")
  useEffect(() => {
    if (!shortcut) return;
    const handleKeyDown = (e) => {
      if (
        e.key === shortcut &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        document.activeElement?.tagName !== 'SELECT'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcut]);

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
      {isLoading ? (
        <Loader2
          className={cn(
            'absolute text-indigo-400 animate-spin pointer-events-none',
            iconSizes[size] || iconSizes.md
          )}
        />
      ) : (
        <Search
          className={cn(
            'absolute text-slate-500 pointer-events-none transition-colors',
            iconSizes[size] || iconSizes.md
          )}
        />
      )}
      <input
        ref={inputRef}
        type="text"
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          'w-full bg-slate-50 hover:bg-white focus:bg-white text-slate-800 placeholder:text-slate-500',
          'border border-slate-800 rounded-lg transition-all duration-150',
          'focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 shadow-2xs',
          sizes[size] || sizes.md
        )}
        {...props}
      />
      {value ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 p-0.5 text-slate-500 hover:text-slate-300 rounded cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          title="Clear search"
          aria-label="Clear search text"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : shortcut ? (
        <div className="absolute right-2.5 hidden sm:flex items-center pointer-events-none">
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-500 bg-slate-800 border border-slate-700 rounded shadow-2xs">
            {shortcut}
          </kbd>
        </div>
      ) : null}
    </div>
  );
}

export default SearchInput;
