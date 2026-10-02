import React from 'react';
import { Toast } from './Toast';
import { cn } from '../../utils/cn';

/**
 * Container holding active floating toasts in fixed corner.
 */
export function ToastContainer({
  toasts = [],
  onDismiss,
  position = 'top-right', // 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  className = '',
}) {
  if (!toasts || toasts.length === 0) return null;

  const positions = {
    'top-right': 'top-5 right-5',
    'top-left': 'top-5 left-5',
    'bottom-right': 'bottom-5 right-5',
    'bottom-left': 'bottom-5 left-5',
  };

  return (
    <aside
      aria-label="Notifications"
      className={cn(
        'fixed z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0',
        positions[position] || positions['top-right'],
        className
      )}
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            description={toast.description}
            onDismiss={onDismiss}
          />
        </div>
      ))}
    </aside>
  );
}

export default ToastContainer;
