import React from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  HelpCircle,
  Info,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { cn } from '../../utils/cn';

/**
 * Reusable Enterprise Confirmation Dialog
 * Supports destructive, warning, primary, and info variants with loading state,
 * keyboard accessibility, and safe duplicate-submission prevention.
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  description = 'Are you sure you want to proceed with this operation?',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary', // 'primary' | 'destructive' | 'warning' | 'info'
  isLoading = false,
  disabled = false,
  icon: CustomIcon,
  maxWidth = 'max-w-md',
}) {
  const displayDescription = description || message;

  const variantConfigs = {
    primary: {
      buttonVariant: 'primary',
      icon: CheckCircle2,
      iconColor: 'text-indigo-400 bg-indigo-950/80 border-indigo-800/60',
    },
    destructive: {
      buttonVariant: 'destructive',
      icon: AlertOctagon,
      iconColor: 'text-rose-400 bg-rose-950/80 border-rose-800/60',
    },
    warning: {
      buttonVariant: 'primary',
      icon: AlertTriangle,
      iconColor: 'text-amber-400 bg-amber-950/80 border-amber-800/60',
    },
    info: {
      buttonVariant: 'primary',
      icon: Info,
      iconColor: 'text-sky-400 bg-sky-950/80 border-sky-800/60',
    },
  };

  const currentConfig = variantConfigs[variant] || variantConfigs.primary;
  const IconComponent = CustomIcon || currentConfig.icon;

  const handleConfirm = () => {
    if (!isLoading && !disabled && onConfirm) {
      onConfirm();
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={isLoading ? undefined : onClose}
      maxWidth={maxWidth}
      showCloseButton={!isLoading}
      closeOnBackdrop={!isLoading}
      closeOnEsc={!isLoading}
      ariaLabel={title}
    >
      <div className="space-y-4">
        {/* Top: Icon + Title + Description */}
        <div className="flex items-start gap-3.5">
          <div
            className={cn(
              'w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 mt-0.5',
              currentConfig.iconColor
            )}
          >
            <IconComponent className="w-5 h-5" />
          </div>

          <div className="space-y-1 flex-1">
            <h3 className="text-base font-bold text-slate-100 leading-snug">
              {title}
            </h3>
            {displayDescription && (
              <div className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {displayDescription}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading || disabled}
          >
            {cancelText}
          </Button>

          <Button
            variant={currentConfig.buttonVariant}
            size="sm"
            isLoading={isLoading}
            loadingText="Processing..."
            disabled={disabled}
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

export const ConfirmationDialog = ConfirmDialog;
export default ConfirmDialog;
