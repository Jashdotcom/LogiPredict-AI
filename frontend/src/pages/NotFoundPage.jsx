import React from 'react';
import { Link } from 'react-router-dom';
import { AlertOctagon, ArrowLeft, Home } from 'lucide-react';
import { Button } from '../components/common/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="text-center max-w-md bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <AlertOctagon className="w-8 h-8" />
        </div>
        <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
          404 Error
        </span>
        <h1 className="text-2xl font-bold text-slate-900 mt-1 mb-2">
          Page Not Found
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
          The supply chain route or page requested does not exist or has been relocated to another logistics partition.
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
