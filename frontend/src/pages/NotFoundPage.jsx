import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertOctagon, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';

/**
 * Enterprise 404 Not Found Page
 */
export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="text-center max-w-md bg-slate-900 p-8 sm:p-10 rounded-2xl border border-slate-800 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-800/60 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <AlertOctagon className="w-7 h-7" />
        </div>
        <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
          404 Error
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-1 mb-2">
          Page Not Found
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
          The requested route does not exist or has been relocated to another logistics partition.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/">
            <Button variant="primary" size="sm" leftIcon={Home}>
              Return to Overview
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
