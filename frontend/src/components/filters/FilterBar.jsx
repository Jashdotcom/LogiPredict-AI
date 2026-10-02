import React from 'react';
import { Filter, RotateCcw, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

/**
 * Enterprise Reusable Filter Bar
 * Provides responsive wrapping for SearchInput, Select dropdowns, DateRangeFilter,
 * and Clear Filters button.
 */
export function FilterBar({
  children,
  searchComponent,
  activeFilterCount = 0,
  onClearFilters,
  className = '',
}) {
  return (
    <div
      className={cn(
        'bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-800 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3',
        className
      )}
    >
      {/* Left side: Search & Dropdown Filter Controls */}
      <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">
        {searchComponent && <div className="flex-1 min-w-[220px]">{searchComponent}</div>}
        {children}
      </div>

      {/* Right side: Active Filters Count and Clear Action */}
      {(activeFilterCount > 0 || onClearFilters) && (
        <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800 shrink-0">
          {activeFilterCount > 0 && (
            <Badge variant="brand" size="xs">
              {activeFilterCount} {activeFilterCount === 1 ? 'Filter' : 'Filters'} Active
            </Badge>
          )}
          {onClearFilters && (
            <Button
              variant="ghost"
              size="xs"
              leftIcon={RotateCcw}
              onClick={onClearFilters}
              disabled={activeFilterCount === 0}
            >
              Reset Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default FilterBar;
