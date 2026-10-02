import React from 'react';
import {
  FileText,
  Route,
  Cpu,
  Truck,
  CheckCircle,
  Clock,
  ArrowRight,
  Boxes,
} from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { StatusBadge } from '../ui/StatusBadge';
import { SkeletonCard } from '../feedback/Skeleton';
import { RECENT_ACTIVITIES } from '../../data/dashboard/dashboardMockData';
import { cn } from '../../utils/cn';

// Activity Icon and color mapper — dark command-center tokens
const ACTIVITY_CONFIG = {
  reorder: {
    icon: FileText,
    color: 'text-indigo-400 bg-indigo-950/80 border-indigo-800/60',
    badgeVariant: 'brand',
  },
  reroute: {
    icon: Route,
    color: 'text-amber-400 bg-amber-950/80 border-amber-800/60',
    badgeVariant: 'warning',
  },
  model_sync: {
    icon: Cpu,
    color: 'text-purple-400 bg-purple-950/80 border-purple-800/60',
    badgeVariant: 'purple',
  },
  transfer: {
    icon: Boxes,
    color: 'text-blue-400 bg-blue-950/80 border-blue-800/60',
    badgeVariant: 'info',
  },
  delivery: {
    icon: Truck,
    color: 'text-emerald-400 bg-emerald-950/80 border-emerald-800/60',
    badgeVariant: 'success',
  },
};

/**
 * Recent Activity Feed for Supply Chain Telemetry
 */
export function RecentActivityFeed({
  activities = RECENT_ACTIVITIES,
  isLoading = false,
}) {
  if (isLoading) {
    return <SkeletonCard />;
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader
        title="Forward Logistics Feed"
        subtitle="Automated system triggers, route interventions, and stock movements"
        action={
          <Badge variant="neutral" size="xs">
            Live Stream
          </Badge>
        }
      />

      <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-700/60 flex-1">
        {activities.map((activity) => {
          const config = ACTIVITY_CONFIG[activity.type] || ACTIVITY_CONFIG.delivery;
          const Icon = config.icon;

          return (
            <div key={activity.id} className="relative group">
              {/* Timeline marker node */}
              <div
                className={cn(
                  'absolute -left-6 top-0.5 w-6 h-6 rounded-full border flex items-center justify-center transition-transform group-hover:scale-110 shadow-2xs',
                  config.color
                )}
              >
                <Icon className="w-3 h-3" />
              </div>

              {/* Activity Body */}
              <div className="bg-slate-800/40 hover:bg-slate-800/70 p-3 rounded-xl border border-slate-700/60 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-100">
                    {activity.activity}
                  </h4>
                  <StatusBadge status={activity.status} size="xs" />
                </div>

                <p className="text-xs text-slate-400 font-medium mb-1">
                  {activity.item}
                </p>

                <p className="text-[11px] font-mono text-slate-500 mb-2">
                  {activity.resource}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-700/50">
                  <span className="font-medium text-slate-400">
                    By: {activity.user}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {activity.timestamp}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-auto pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span>Showing last 5 telemetry events</span>
        <button
          type="button"
          onClick={() => alert('Exporting full military logistics audit trail...')}
          className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 cursor-pointer"
        >
          View Full Audit Log <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </Card>
  );
}

export default RecentActivityFeed;
