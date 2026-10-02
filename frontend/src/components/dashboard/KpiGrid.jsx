import React from 'react';
import { KpiCard } from '../common/KpiCard';
import { DASHBOARD_KPIS } from '../../data/mockDashboardData';

/**
 * Grid of telemetry KPI metrics for LogiPredict AI command center
 */
export function KpiGrid({ kpis = DASHBOARD_KPIS, onKpiClick }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {kpis.map((kpi) => (
        <KpiCard
          key={kpi.id}
          title={kpi.title}
          value={kpi.value}
          change={kpi.change}
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
