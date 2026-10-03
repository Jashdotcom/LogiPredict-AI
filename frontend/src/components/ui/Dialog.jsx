import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { IconButton } from './Button';

/**
 * Enterprise Accessible Modal / Dialog Component
 */
export function Dialog({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
  className = '',
  closeOnEsc = true,
  closeOnBackdrop = true,
  showCloseButton = true,
  ariaLabel,
}) {
  const dialogRef = useRef(null);

  // Handle ESC key and scroll locking
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && closeOnEsc && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnEsc, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'dialog-title' : undefined}
      aria-label={ariaLabel}
    >
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div
        ref={dialogRef}
        className={cn(
          'relative z-50 w-full bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150',
          maxWidth,
          className
        )}
      >
        {/* Optional Header */}
        {(title || subtitle || showCloseButton) && (
          <div className="flex items-start justify-between p-5 border-b border-slate-800">
            <div className="space-y-0.5 pr-4 min-w-0 flex-1">
              {title && (
                <h3 id="dialog-title" className="text-base font-bold text-slate-100 tracking-tight">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-slate-400">{subtitle}</p>
              )}
            </div>
            {showCloseButton && onClose && (
              <IconButton
                icon={X}
                size="sm"
                variant="ghost"
                title="Close dialog"
                onClick={onClose}
              />
            )}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto max-h-[75vh]">{children}</div>
      </div>
    </div>
  );
}

export const Modal = Dialog;
export default Dialog;
