import React, { useState } from 'react';
import {
  AlertTriangle,
  BellRing,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader } from '../components/ui/Card';
import { PRIORITY_ALERTS } from '../../data/mockDashboardData';
import { getSeverityConfig } from '../../utils/statusHelpers';
import { KPICard } from '../components/dashboard/KpiCard';

export function AlertsPage() {
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [resolvedIds, setResolvedIds] = useState([]);

  const filteredAlerts = PRIORITY_ALERTS.filter((alert) => {
    if (resolvedIds.includes(alert.id)) return false;
    if (filterSeverity === 'all') return true;
    return alert.severity === filterSeverity;
  });

  const handleResolve = (id) => {
    setResolvedIds((prev) => [...prev, id]);
    alert(`Alert ${id} marked as resolved: Automated mitigation workflow dispatched.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Predictive Anomaly & Risk Alerts"
        subtitle="Real-time multi-echelon bottleneck detection, cold-chain temperature excursion alerts, and stockout mitigations."
        breadcrumbs={[{ label: 'Predictive Alerts' }]}
        badge={
          <Badge variant="danger" size="sm" dot dotPulse>
            {4 - resolvedIds.length} Active Anomalies
          </Badge>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setResolvedIds([])}
            disabled={resolvedIds.length === 0}
          >
            Reset Dismissed
          </Button>
        }
      />

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Critical Alerts"
          value={`${Math.max(0, 2 - resolvedIds.filter((id) => id === 'ALT-1049' || id === 'ALT-1047').length)}`}
          change="Immediate action"
          isPositive={false}
          timeframe="stockout & cold chain"
          iconName="AlertOctagon"
          colorScheme="rose"
          status="Urgent"
          statusVariant="danger"
        />
        <KPICard
          title="High Transit Risks"
          value="1"
          change="Expressway bypass"
          isPositive={true}
          timeframe="reroute active"
          iconName="Truck"
          colorScheme="amber"
        />
        <KPICard
          title="Automated Mitigations"
          value="18"
          change="+6 today"
          isPositive={true}
          timeframe="auto-POs & transfers"
          iconName="Zap"
          colorScheme="indigo"
          status="Autonomous"
          statusVariant="brand"
        />
        <KPICard
          title="Mean Time to Resolve (MTTR)"
          value="14.2 min"
          change="-3.5 min"
          isPositive={true}
          timeframe="faster resolution"
          iconName="PackageCheck"
          colorScheme="emerald"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">
            Filter:
          </span>
          {[
            { id: 'all', label: 'All Alerts' },
            { id: 'critical', label: 'Critical' },
            { id: 'high', label: 'High Risk' },
            { id: 'medium', label: 'Medium' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterSeverity(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterSeverity === tab.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500 pr-2 font-medium">
          Showing {filteredAlerts.length} actionable anomalies
        </span>
      </div>

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAlerts.length === 0 ? (
          <div className="col-span-2 p-12 text-center bg-white rounded-xl border border-slate-200">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">All Anomalies Resolved</h3>
            <p className="text-xs text-slate-500 mt-1">
              No active stockout or transit risks require attention at this time.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const config = getSeverityConfig(alert.severity);

            return (
              <Card key={alert.id} className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {alert.sku}
                      </span>
                      <Badge variant={config.variant} size="xs" dot dotPulse={alert.severity === 'critical'}>
                        {config.label}
                      </Badge>
                      <span className="text-xs text-slate-400">• {alert.category}</span>
                    </div>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {alert.timestamp}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug mb-1">
                    {alert.title}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{alert.warehouse}</span>
                  </div>

                  <div className="mt-3 p-2.5 rounded-lg bg-rose-50/80 border border-rose-100 text-xs text-rose-800">
                    <strong>Predicted Impact: </strong>{alert.predictedImpact}
                  </div>

                  <div className="mt-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <strong className="text-indigo-600">Recommended Action: </strong>
                    {alert.recommendedAction}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400">ID: {alert.id}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleResolve(alert.id)}
                    >
                      Execute Mitigation
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

export default AlertsPage;
