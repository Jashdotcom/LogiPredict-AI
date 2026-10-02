import React from 'react';
import {
  ArrowUpRight,
  Clock,
  MapPin,
  CheckCircle2,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { SkeletonCard } from '../feedback/Skeleton';
import { PRIORITY_ALERTS } from '../../data/dashboard/dashboardMockData';
import { getSeverityConfig } from '../../utils/statusHelpers';
import { cn } from '../../utils/cn';

/**
 * Priority Alerts List for Command Center Dashboard
 */
export function PriorityAlertsList({
  alerts = PRIORITY_ALERTS,
  isLoading = false,
  onResolve,
  onSelectAlert,
}) {
  if (isLoading) {
    return <SkeletonCard />;
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader
        title="Active Priority Alerts"
        subtitle="Forward supply chain anomalies requiring immediate operational intervention"
        action={
          <Link to="/alerts">
            <Button variant="ghost" size="xs" rightIcon={ArrowUpRight}>
              View All Alerts ({alerts.length})
            </Button>
          </Link>
        }
      />

      <div className="space-y-3 flex-1">
        {alerts.map((alert) => {
          const config = getSeverityConfig(alert.severity);

          return (
            <div
              key={alert.id || alert.alert_id}
              onClick={() => onSelectAlert && onSelectAlert(alert)}
              className={cn(
                'p-3.5 rounded-xl border transition-all duration-150 cursor-pointer',
                'hover:shadow-xs bg-slate-800/40 hover:bg-slate-800/70',
                alert.severity === 'critical' ? 'border-rose-800/60 bg-rose-950/30' : 'border-slate-700/60'
              )}
            >
              {/* Header row: SKU, Warehouse, Severity */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                    {alert.sku || alert.item_id}
                  </span>
                  <Badge
                    variant={config.variant}
                    size="xs"
                    dot
                    dotPulse={alert.severity === 'critical'}
                  >
                    {config.label}
                  </Badge>
                  <span className="text-[11px] text-slate-500">• {alert.category || 'Anomaly'}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>{alert.timestamp || 'Recent'}</span>
                </div>
              </div>

              {/* Alert Title */}
              <h4 className="text-xs sm:text-sm font-semibold text-slate-100 leading-snug hover:text-indigo-400 transition-colors">
                {alert.title}
              </h4>

              {/* Location & Impact */}
              <div className="mt-2 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{alert.warehouse}</span>
                </div>
                <p className="text-rose-400 font-medium bg-rose-950/60 px-2 py-1 rounded border border-rose-800/60 text-[11px]">
                  <strong>Impact: </strong> {alert.predictedImpact}
                </p>
              </div>

              {/* Recommended Action & Action Button */}
              <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-[11px] text-slate-400">
                  <strong className="text-indigo-400 font-medium">Mitigation: </strong>
                  {alert.recommendedAction}
                </p>
                <div
                  className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant={alert.severity === 'critical' ? 'danger' : 'primary'}
                    size="xs"
                    leftIcon={Zap}
                    onClick={() => onResolve && onResolve(alert)}
                  >
                    Execute Protocol
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1 text-emerald-400 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Autonomous Mitigation: Online
        </span>
        <Link to="/alerts" className="text-indigo-400 hover:text-indigo-300 font-medium">
          Configure safety parameters &rarr;
        </Link>
      </div>
    </Card>
  );
}

export default PriorityAlertsList;
