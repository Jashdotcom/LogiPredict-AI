import React from 'react';
import { KPICard } from './KpiCard';
import { DASHBOARD_KPIS } from '../../data/dashboard/dashboardMockData';
import { SkeletonCard } from '../feedback/Skeleton';

// IDs of KPI cards that should be clickable and navigate somewhere
const NAVIGABLE_KPI_IDS = new Set([
  'total-inventory-items',
  'inventory-health',
  'below-minimum-stock',
  'predicted-stockouts',
  'pending-replenishments',
  'active-priority-alerts',
]);

/**
 * Grid of telemetry KPI metrics for LogiPredict AI command center (6 KPI cards)
 *
 * Props:
 *   kpis       — KPI data array
 *   isLoading  — skeleton loading state
 *   onKpiClick — callback(kpi) for navigable KPI cards; if omitted, cards are non-interactive
 */
export function KpiGrid({ kpis = DASHBOARD_KPIS, isLoading = false, onKpiClick }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {Array.from({ length: 6 }).map((_, idx) => (
          <SkeletonCard key={idx} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {kpis.map((kpi) => {
        const isNavigable = onKpiClick && NAVIGABLE_KPI_IDS.has(kpi.id);
        return (
          <KPICard
            key={kpi.id}
            title={kpi.title}
            value={kpi.value}
            unit={kpi.unit}
            change={kpi.change}
            trend={kpi.trend}
            isPositive={kpi.isPositive}
            timeframe={kpi.timeframe}
            description={kpi.description}
            status={kpi.status}
            statusVariant={kpi.statusVariant}
            iconName={kpi.iconName}
            colorScheme={kpi.colorScheme}
            onClick={isNavigable ? () => onKpiClick(kpi) : undefined}
          />
        );
      })}
    </div>
  );
}

export default KpiGrid;
