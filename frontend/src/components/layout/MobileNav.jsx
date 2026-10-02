import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Sidebar } from './Sidebar';

/**
 * Mobile Navigation Drawer with backdrop, Escape key handling, and smooth overlay.
 */
export function MobileNav({ isOpen, onClose }) {
  // Prevent body scrolling when mobile drawer is open and listen for Escape key
  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = 'unset';
      return;
    }

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Menu"
      className="fixed inset-0 z-50 md:hidden"
    >
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer content */}
      <div className="relative z-50 h-full max-w-xs w-full animate-in slide-in-from-left duration-200">
        <Sidebar isOpen={isOpen} onClose={onClose} isMobile={true} />

        {/* Close Button Floating on top right outside drawer */}
        <div className="absolute top-3.5 right-[-44px]">
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-slate-800 text-slate-200 hover:text-white flex items-center justify-center border border-slate-700 shadow-md cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default MobileNav;
