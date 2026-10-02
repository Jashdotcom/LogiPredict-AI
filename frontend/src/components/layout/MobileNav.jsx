import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { IconButton } from '../common/IconButton';

/**
 * Mobile Navigation Drawer with backdrop and smooth sliding animation.
 */
export function MobileNav({ isOpen, onClose }) {
  // Prevent body scrolling when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer content */}
      <div className="relative z-50 h-full max-w-xs w-full">
        <Sidebar isOpen={isOpen} onClose={onClose} isMobile={true} />
        {/* Close Button Floating on top right outside drawer */}
        <div className="absolute top-3.5 right-[-44px]">
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-slate-800 text-slate-200 hover:text-white flex items-center justify-center border border-slate-700 shadow-md cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default MobileNav;
