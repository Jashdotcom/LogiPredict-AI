import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer } from '../ui/ToastContainer';

const ToastContext = createContext(null);

export function ToastProvider({ children, position = 'top-right' }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type = 'info', title, message, description, duration = 4000 }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast = { id, type, title, message: message || description, description, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const toast = useCallback(
    (opts) => {
      if (typeof opts === 'string') {
        return addToast({ message: opts, type: 'info' });
      }
      return addToast(opts);
    },
    [addToast]
  );

  toast.success = (message, opts = {}) => addToast({ message, type: 'success', ...opts });
  toast.error = (message, opts = {}) => addToast({ message, type: 'error', ...opts });
  toast.warning = (message, opts = {}) => addToast({ message, type: 'warning', ...opts });
  toast.info = (message, opts = {}) => addToast({ message, type: 'info', ...opts });
  toast.dismiss = removeToast;

  return (
    <ToastContext.Provider value={{ toast, addToast, removeToast, toasts }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} position={position} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback if component is used outside ToastProvider
    return {
      toast: {
        success: (msg) => console.log('[Toast Success]:', msg),
        error: (msg) => console.error('[Toast Error]:', msg),
        warning: (msg) => console.warn('[Toast Warning]:', msg),
        info: (msg) => console.info('[Toast Info]:', msg),
        dismiss: () => {},
      },
      addToast: () => {},
      removeToast: () => {},
      toasts: [],
    };
  }
  return context;
}

export default ToastContext;
