import React, { useState } from 'react';
import {
  FileText,
  Route,
  Cpu,
  Truck,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Boxes,
} from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { DataTable } from '../tables/DataTable';
import { SkeletonTable } from '../feedback/Skeleton';
import { RECENT_ACTIVITIES } from '../../data/dashboard/dashboardMockData';

// Map activity types to icons and badge variants
const ACTIVITY_TYPE_MAP = {
  reorder: {
    icon: FileText,
    variant: 'brand',
  },
  reroute: {
    icon: Route,
    variant: 'warning',
  },
  model_sync: {
    icon: Cpu,
    variant: 'purple',
  },
  transfer: {
    icon: Boxes,
    variant: 'info',
  },
  delivery: {
    icon: Truck,
    variant: 'success',
  },
};

/**
 * Recent Activity Table for Logistics Command Center
 */
export function RecentActivityTable({
  activities = RECENT_ACTIVITIES,
  isLoading = false,
}) {
  const [filterCategory, setFilterCategory] = useState('all');

  const filteredActivities = activities.filter((act) => {
    if (filterCategory === 'all') return true;
    return act.category.toLowerCase().includes(filterCategory.toLowerCase());
  });

  const columns = [
    {
      key: 'activity',
      title: 'Action / Item',
      sortable: true,
      render: (row) => {
        const typeConfig = ACTIVITY_TYPE_MAP[row.type] || ACTIVITY_TYPE_MAP.delivery;
        const Icon = typeConfig.icon;

        return (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-xs sm:text-sm text-slate-900 block leading-tight">
                {row.activity}
              </span>
              <span className="text-xs text-slate-500 font-normal">
                {row.item}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'category',
      title: 'Domain',
      sortable: true,
      render: (row) => (
        <span className="text-xs font-medium text-slate-600 bg-slate-100/70 px-2 py-0.5 rounded border border-slate-200">
          {row.category}
        </span>
      ),
    },
    {
      key: 'resource',
      title: 'Destination / Corridor',
      sortable: true,
      render: (row) => (
        <span className="text-xs font-mono text-slate-700">
          {row.resource}
        </span>
      ),
    },
    {
      key: 'user',
      title: 'Triggered By',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-slate-600 font-medium">
          {row.user}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} size="xs" />,
    },
    {
      key: 'timestamp',
      title: 'Time',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <Clock className="w-3 h-3" />
          <span>{row.timestamp}</span>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <SkeletonTable rows={5} columns={6} />;
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader
        title="Forward Logistics Telemetry & Activity"
        subtitle="Real-time audit log of automated system triggers, convoy dispatches, and neural model inferences"
        action={
          <div className="flex items-center gap-1">
            {['all', 'replenishment', 'transit', 'inventory'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`px-2 py-1 rounded text-xs font-medium capitalize transition-colors cursor-pointer ${
                  filterCategory === cat
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        }
      />

      <div className="flex-1 overflow-x-auto">
        <DataTable
          columns={columns}
          data={filteredActivities}
          emptyTitle="No recent activities"
          emptyDescription="No logistics events match the selected category filter."
        />
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Showing {filteredActivities.length} recent operational events</span>
        <button
          type="button"
          onClick={() => alert('Exporting full military logistics audit trail (SIH 2026 format)...')}
          className="text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-1 cursor-pointer"
        >
          Export Telemetry Trail <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>
    </Card>
  );
}

export default RecentActivityTable;
