import React from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '../../utils/cn';

const DEFAULT_PRESETS = [
  { id: '24h', label: '24h' },
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: 'q4', label: 'Q4 2026' },
];

/**
 * Reusable Date Range & Timeframe Filter Pills
 */
export function DateRangeFilter({
  presets = DEFAULT_PRESETS,
  selected,
  onChange,
  className = '',
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs font-semibold text-slate-400',
        className
      )}
    >
      <div className="flex items-center gap-1 pl-1.5 pr-2 text-slate-500 border-r border-slate-700 mr-1 hidden sm:flex">
        <Calendar className="w-3.5 h-3.5" />
      </div>
      {presets.map((preset) => {
        const id = preset.id || preset.value || preset;
        const label = preset.label || preset.name || preset;
        const isActive = selected === id;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange && onChange(id)}
            className={cn(
              'px-2.5 py-1 rounded-md transition-all cursor-pointer text-xs select-none',
              isActive
                ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                : 'hover:text-slate-200 text-slate-400'
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default DateRangeFilter;
