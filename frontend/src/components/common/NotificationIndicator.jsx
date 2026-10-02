import React from 'react';
import { Bell } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Enterprise Notification Bell with unread counter & urgent alert ping.
 */
export function NotificationIndicator({
  count = 0,
  hasUrgent = false,
  onClick,
  className = '',
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Notifications (${count} unread)`}
      className={cn(
        'relative inline-flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150',
        'text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1',
        className
      )}
    >
      <Bell className="w-4 h-4" />
      {count > 0 && (
        <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center">
          {hasUrgent && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
          )}
          <span className="relative inline-flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full ring-2 ring-white">
            {count > 99 ? '99+' : count}
          </span>
        </span>
      )}
    </button>
  );
}

export default NotificationIndicator;
