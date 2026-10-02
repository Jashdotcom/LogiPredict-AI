import React from 'react';
import {
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Loader2,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { Skeleton } from '../feedback/Skeleton';

/**
 * Enterprise Reusable Data Table Component
 *
 * @param {Array} columns - Column configuration array [{ key, header, render, sortable, align, width, className }]
 * @param {Array} data - Row data array of objects
 * @param {boolean} isLoading - Loading state flag
 * @param {boolean} isEmpty - Empty data flag
 * @param {string} emptyTitle - Title for empty state
 * @param {string} emptyDescription - Subtitle/description for empty state
 * @param {ReactNode} emptyAction - Optional button/action for empty state
 * @param {boolean} selectable - Enable checkbox row selection
 * @param {Array} selectedRows - Array of selected row IDs/keys
 * @param {function} onSelectRow - (row, isSelected) => void
 * @param {function} onSelectAll - (isSelected) => void
 * @param {string} rowKey - Property to use as unique key (default: 'id')
 * @param {string} sortColumn - Currently sorted column key
 * @param {string} sortDirection - 'asc' | 'desc'
 * @param {function} onSort - (columnKey) => void
 * @param {function} onRowClick - (row) => void
 * @param {boolean} hover - Enable row hover highlights
 * @param {object} pagination - Optional pagination props { currentPage, totalPages, pageSize, totalItems, onPageChange }
 */
export function DataTable({
  columns = [],
  data = [],
  isLoading = false,
  isEmpty = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no records matching your current criteria.',
  emptyAction,
  selectable = false,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  rowKey = 'id',
  sortColumn,
  sortDirection = 'asc',
  onSort,
  onRowClick,
  hover = true,
  pagination,
  className = '',
  tableClassName = '',
}) {
  const isDataEmpty = isEmpty || (!isLoading && (!data || data.length === 0));

  const allSelected =
    data.length > 0 &&
    data.every((row) => selectedRows.includes(row[rowKey] || row.id || row.sku || row.requisitionId));

  const someSelected =
    selectedRows.length > 0 && !allSelected;

  const handleSelectAllChange = (e) => {
    if (onSelectAll) {
      onSelectAll(e.target.checked);
    }
  };

  const getRowId = (row, index) => row[rowKey] || row.id || row.sku || row.requisitionId || index;

  return (
    <div className={cn('w-full bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col', className)}>
      {/* Horizontal Scroll Area */}
      <div className="w-full overflow-x-auto">
        <table className={cn('w-full text-left text-xs sm:text-sm text-slate-600 border-collapse', tableClassName)}>
          {/* Table Header */}
          <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider select-none">
            <tr>
              {selectable && (
                <th className="w-10 px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => el && (el.indeterminate = someSelected)}
                    onChange={handleSelectAllChange}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                    aria-label="Select all rows"
                  />
                </th>
              )}

              {columns.map((col) => {
                const isSorted = sortColumn === col.key;
                const alignmentClass =
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                    ? 'text-center'
                    : 'text-left';

                return (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    className={cn(
                      'px-4 py-3 font-semibold text-slate-600 tracking-wider',
                      alignmentClass,
                      col.sortable ? 'cursor-pointer hover:bg-slate-100/80 transition-colors' : '',
                      col.className || ''
                    )}
                    onClick={() => col.sortable && onSort && onSort(col.key)}
                  >
                    <div className={cn('inline-flex items-center gap-1.5', col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start')}>
                      <span>{col.header || col.title}</span>
                      {col.sortable && (
                        <span className="text-slate-400">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-indigo-600" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-400" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              // Loading Skeleton Rows
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={`skeleton-${rIdx}`} className="animate-pulse">
                  {selectable && (
                    <td className="px-4 py-3.5 text-center">
                      <div className="w-4 h-4 bg-slate-200 rounded mx-auto" />
                    </td>
                  )}
                  {columns.map((col, cIdx) => (
                    <td key={`skeleton-col-${cIdx}`} className="px-4 py-3.5">
                      <Skeleton className="h-4 w-4/5 rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : isDataEmpty ? (
              // Empty State
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="py-12 px-4 text-center">
                  <div className="inline-flex flex-col items-center gap-2 max-w-sm mx-auto">
                    <div className="p-3 bg-slate-100 rounded-full text-slate-400">
                      <Inbox className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-800">{emptyTitle}</h4>
                    <p className="text-xs text-slate-500">{emptyDescription}</p>
                    {emptyAction && <div className="mt-2">{emptyAction}</div>}
                  </div>
                </td>
              </tr>
            ) : (
              // Populated Rows
              data.map((row, index) => {
                const id = getRowId(row, index);
                const isSelected = selectedRows.includes(id);

                return (
                  <tr
                    key={id}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={cn(
                      'transition-colors duration-100',
                      hover ? 'hover:bg-slate-50/80' : '',
                      isSelected ? 'bg-indigo-50/60' : '',
                      onRowClick ? 'cursor-pointer' : ''
                    )}
                  >
                    {selectable && (
                      <td
                        className="w-10 px-4 py-3.5 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => onSelectRow && onSelectRow(row, e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                          aria-label={`Select row ${id}`}
                        />
                      </td>
                    )}

                    {columns.map((col) => {
                      const value = row[col.key];
                      const alignmentClass =
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left';

                      return (
                        <td
                          key={`${id}-${col.key}`}
                          className={cn('px-4 py-3.5 text-slate-700 align-middle', alignmentClass, col.className || '')}
                        >
                          {col.render ? col.render(value, row, index) : value}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Optional Pagination Controls */}
      {pagination && (
        <div className="px-4 py-3 sm:px-6 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            <span>
              Showing{' '}
              <strong className="text-slate-800">
                {pagination.totalItems === 0
                  ? 0
                  : (pagination.currentPage - 1) * pagination.pageSize + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-slate-800">
                {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)}
              </strong>{' '}
              of <strong className="text-slate-800">{pagination.totalItems}</strong> entries
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              disabled={pagination.currentPage <= 1}
              onClick={() => pagination.onPageChange && pagination.onPageChange(pagination.currentPage - 1)}
              leftIcon={ChevronLeft}
            >
              Previous
            </Button>
            <span className="px-2 font-medium text-slate-700">
              Page {pagination.currentPage} of {Math.max(1, pagination.totalPages)}
            </span>
            <Button
              variant="outline"
              size="xs"
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() => pagination.onPageChange && pagination.onPageChange(pagination.currentPage + 1)}
              rightIcon={ChevronRight}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
