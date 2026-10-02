import React from 'react';
import { KPICard } from './KpiCard';
import { DASHBOARD_KPIS } from '../../data/dashboard/dashboardMockData';
import { SkeletonCard } from '../feedback/Skeleton';

/**
 * Grid of telemetry KPI metrics for LogiPredict AI command center (6 KPI cards)
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
      {kpis.map((kpi) => (
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
          onClick={onKpiClick ? () => onKpiClick(kpi) : undefined}
        />
      ))}
    </div>
  );
}

export default KpiGrid;
