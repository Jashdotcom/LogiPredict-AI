import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2, Inbox } from 'lucide-react';

/**
 * LogiPredict AI — Enterprise Table Components
 * Reusable table primitives supporting striped rows, sticky headers, loading,
 * empty states, and responsive horizontal overflow.
 */

export function Table({ children, className = '', ...props }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full text-left text-xs sm:text-sm text-slate-300 border-collapse', className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = '', ...props }) {
  return (
    <thead className={cn('bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold text-[11px] uppercase tracking-wider', className)} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '', ...props }) {
  return (
    <tbody className={cn('divide-y divide-slate-800/60 bg-slate-900', className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '', isSelected = false, hover = true, ...props }) {
  return (
    <tr
      className={cn(
        'transition-colors duration-100',
        hover ? 'hover:bg-slate-800/50' : '',
        isSelected ? 'bg-indigo-950/40' : '',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className = '', ...props }) {
  return (
    <th className={cn('px-4 py-3 text-left font-semibold text-slate-400 select-none', className)} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = '', ...props }) {
  return (
    <td className={cn('px-4 py-3 text-slate-300 align-middle', className)} {...props}>
      {children}
    </td>
  );
}

export function TableCaption({ children, className = '', ...props }) {
  return (
    <caption className={cn('mt-3 text-xs text-slate-500 text-center', className)} {...props}>
      {children}
    </caption>
  );
}

export function TableLoadingState({ message = 'Loading records...', rows = 3 }) {
  return (
    <tbody>
      <tr>
        <td colSpan={100} className="py-12 text-center text-slate-400">
          <div className="inline-flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            <span className="text-xs font-medium text-slate-400">{message}</span>
          </div>
        </td>
      </tr>
    </tbody>
  );
}

export function TableEmptyState({ title = 'No records found', description = 'No data available matching the current filters.', action }) {
  return (
    <tbody>
      <tr>
        <td colSpan={100} className="py-12 text-center">
          <div className="inline-flex flex-col items-center gap-2 max-w-sm mx-auto">
            <div className="p-3 bg-slate-800 rounded-full text-slate-400">
              <Inbox className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
            <p className="text-xs text-slate-500">{description}</p>
            {action && <div className="mt-2">{action}</div>}
          </div>
        </td>
      </tr>
    </tbody>
  );
}

export default Table;
