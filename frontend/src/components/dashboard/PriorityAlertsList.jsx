import React from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { PRIORITY_ALERTS } from '../../data/mockDashboardData';
import { getSeverityConfig } from '../../utils/statusHelpers';
import { cn } from '../../utils/cn';
import { Link } from 'react-router-dom';

/**
 * Priority Alerts List for Dashboard Overview
 */
export function PriorityAlertsList({
  alerts = PRIORITY_ALERTS,
  onResolve,
}) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader
        title="Priority Predictive Alerts"
        subtitle="Forward supply chain anomalies requiring operational intervention"
        action={
          <Link to="/alerts">
            <Button variant="ghost" size="xs" rightIcon={ArrowUpRight}>
              View All ({alerts.length})
            </Button>
          </Link>
        }
      />

      <div className="space-y-3 flex-1">
        {alerts.map((alert) => {
          const config = getSeverityConfig(alert.severity);

          return (
            <div
              key={alert.id}
              className={cn(
                'p-3.5 rounded-xl border transition-all duration-150',
                'hover:shadow-xs bg-slate-50/50 hover:bg-white',
                config.border
              )}
            >
              {/* Header row: SKU, Warehouse, Severity */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {alert.sku}
                  </span>
                  <Badge variant={config.variant} size="xs" dot dotPulse={alert.severity === 'critical'}>
                    {config.label}
                  </Badge>
                  <span className="text-[11px] text-slate-400">• {alert.category}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>{alert.timestamp}</span>
                </div>
              </div>

              {/* Alert Title */}
              <h4 className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug">
                {alert.title}
              </h4>

              {/* Location & Impact */}
              <div className="mt-2 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{alert.warehouse}</span>
                </div>
                <p className="text-rose-700 font-medium bg-rose-50/80 px-2 py-1 rounded border border-rose-100 text-[11px]">
                  Impact: {alert.predictedImpact}
                </p>
              </div>

              {/* Recommended Action & Action Button */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-[11px] text-slate-600">
                  <strong className="text-indigo-600 font-medium">Action: </strong>
                  {alert.recommendedAction}
                </p>
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => onResolve && onResolve(alert.id)}
                  >
                    Take Action
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1 text-emerald-600 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          AI Auto-Mitigation: Active
        </span>
        <Link to="/alerts" className="text-indigo-600 hover:text-indigo-700 font-medium">
          Manage alert rules &rarr;
        </Link>
      </div>
    </Card>
  );
}

export default PriorityAlertsList;
