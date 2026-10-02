import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

/**
 * Reusable Enterprise Page Header with breadcrumbs and action bar.
 * Supports both `description` and `subtitle`, and `href` or `path` in breadcrumb items.
 *
 * Example:
 * <PageHeader
 *   title="Inventory Management"
 *   description="Monitor stock levels and inventory health."
 *   breadcrumbs={[
 *     { label: "Dashboard", href: "/" },
 *     { label: "Inventory" }
 *   ]}
 *   badge={<Badge variant="brand">8 Hubs</Badge>}
 *   actions={<Button>Export CSV</Button>}
 * />
 */
export function PageHeader({
  title,
  subtitle,
  description,
  breadcrumbs = [],
  actions,
  badge,
  className = '',
}) {
  const displayDescription = description || subtitle;

  return (
    <div
      className={cn(
        'flex flex-col gap-3 pb-6 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="space-y-1 min-w-0">
        {/* Breadcrumb row */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs text-slate-500 mb-1 flex-wrap"
          >
            <Link
              to="/"
              className="inline-flex items-center gap-1 hover:text-indigo-600 transition-colors focus:outline-none focus-visible:underline"
            >
              <Home className="w-3.5 h-3.5" />
              <span>LogiPredict</span>
            </Link>
            {breadcrumbs.map((crumb, idx) => {
              const targetUrl = crumb.href || crumb.path;
              const isLast = idx === breadcrumbs.length - 1;

              return (
                <React.Fragment key={idx}>
                  <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                  {targetUrl && !isLast ? (
                    <Link
                      to={targetUrl}
                      className="hover:text-indigo-600 transition-colors focus:outline-none focus-visible:underline"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-medium text-slate-800" aria-current={isLast ? 'page' : undefined}>
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        )}

        {/* Title & Badge */}
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          {badge}
        </div>

        {/* Subtitle / Description */}
        {displayDescription && (
          <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
            {displayDescription}
          </p>
        )}
      </div>

      {/* Action buttons slot */}
      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 pt-2 sm:pt-0 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
