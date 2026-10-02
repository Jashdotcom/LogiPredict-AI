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
import { Card, CardHeader } from '../common/Card';
import { Badge } from '../common/Badge';
import { RECENT_ACTIVITIES } from '../../data/mockDashboardData';
import { cn } from '../../utils/cn';

// Activity Icon and color mapper
const ACTIVITY_CONFIG = {
  reorder: {
    icon: FileText,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    badgeVariant: 'brand',
  },
  reroute: {
    icon: Route,
    color: 'text-amber-600 bg-amber-50 border-amber-100',
    badgeVariant: 'warning',
  },
  model_sync: {
    icon: Cpu,
    color: 'text-purple-600 bg-purple-50 border-purple-100',
    badgeVariant: 'purple',
  },
  transfer: {
    icon: Boxes,
    color: 'text-blue-600 bg-blue-50 border-blue-100',
    badgeVariant: 'info',
  },
  delivery: {
    icon: CheckCircle,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    badgeVariant: 'success',
  },
};

/**
 * Recent Activity Feed for Supply Chain Telemetry
 */
export function RecentActivityFeed({ activities = RECENT_ACTIVITIES }) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader
        title="Forward Logistics Activity"
        subtitle="Automated system triggers, route interventions, and stock movements"
        action={
          <Badge variant="neutral" size="xs">
            Live Stream
          </Badge>
        }
      />

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
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
              <div className="bg-slate-50/70 hover:bg-slate-50 p-3 rounded-lg border border-slate-100 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900">
                    {activity.title}
                  </h4>
                  <Badge variant={config.badgeVariant} size="xs">
                    {activity.status}
                  </Badge>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-2">
                  {activity.detail}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/50">
                  <span className="font-medium text-slate-500">
                    Triggered by: {activity.user}
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

      <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Showing last 5 automated telemetry events</span>
        <button
          type="button"
          className="text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-1 cursor-pointer"
        >
          View Full Audit Log <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </Card>
  );
}

export default RecentActivityFeed;
