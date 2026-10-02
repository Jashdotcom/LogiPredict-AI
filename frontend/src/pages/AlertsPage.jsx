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
import { PRIORITY_ALERTS } from '../data/dashboard/dashboardMockData';
import { getSeverityConfig } from '../utils/statusHelpers';
import { KPICard } from '../components/dashboard/KpiCard';

export function AlertsPage() {
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [resolvedIds, setResolvedIds] = useState([]);

  const filteredAlerts = PRIORITY_ALERTS.filter((alert) => {
    const aid = alert.id || alert.alert_id;
    if (resolvedIds.includes(aid)) return false;
    if (filterSeverity === 'all') return true;
    return alert.severity === filterSeverity;
  });

  const handleResolve = (id) => {
    setResolvedIds((prev) => [...prev, id]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Predictive Anomaly & Risk Alerts"
        subtitle="Real-time multi-echelon bottleneck detection, cold-chain temperature excursion alerts, and stockout mitigations."
        breadcrumbs={[{ label: 'Predictive Alerts' }]}
        badge={
          <Badge variant="danger" size="sm" dot dotPulse>
            {PRIORITY_ALERTS.length - resolvedIds.length} Active Anomalies
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
          value={`${PRIORITY_ALERTS.filter((a) => a.severity === 'critical' && !resolvedIds.includes(a.id || a.alert_id)).length}`}
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
          value={`${PRIORITY_ALERTS.filter((a) => a.severity === 'high' && !resolvedIds.includes(a.id || a.alert_id)).length}`}
          change="Expressway bypass"
          isPositive={true}
          timeframe="reroute active"
          iconName="Truck"
          colorScheme="amber"
        />
        <KPICard
          title="Active Mitigations"
          value={`${resolvedIds.length} resolved`}
          change="Automated dispatch"
          isPositive={true}
          timeframe="autonomous protocols"
          iconName="CheckCircle2"
          colorScheme="emerald"
          status="Secure"
          statusVariant="success"
        />
        <KPICard
          title="Total Telemetry Alerts"
          value={PRIORITY_ALERTS.length.toString()}
          change="Monitored 24/7"
          isPositive={true}
          timeframe="all sectors"
          iconName="BellRing"
          colorScheme="indigo"
        />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Severity Filter:</span>
          {['all', 'critical', 'high', 'warning'].map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                filterSeverity === sev
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500">Showing {filteredAlerts.length} active alerts</span>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => {
          const config = getSeverityConfig(alert.severity);
          const alertId = alert.id || alert.alert_id;

          return (
            <div
              key={alertId}
              className="bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-800 shadow-2xs space-y-3 hover:border-slate-700 transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    {alertId}
                  </span>
                  <Badge variant={config.variant} size="xs" dot>
                    {config.label}
                  </Badge>
                  <span className="text-xs text-slate-500">• {alert.category || 'Supply Chain'}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{alert.timestamp || alert.created_at}</span>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-100">{alert.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{alert.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-800/40 p-3 rounded-lg border border-slate-700/60">
                <div>
                  <span className="text-slate-500 font-semibold block">Warehouse / Depot:</span>
                  <span className="text-slate-300 font-medium">{alert.warehouse}</span>
                </div>
                <div>
                  <span className="text-rose-500 font-semibold block">Predicted Impact:</span>
                  <span className="text-rose-400 font-medium">{alert.predictedImpact}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
                <div className="text-xs text-slate-400">
                  <strong className="text-indigo-400">Mitigation Protocol: </strong>
                  {alert.recommendedAction}
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={CheckCircle2}
                  onClick={() => handleResolve(alertId)}
                >
                  Execute Mitigation Protocol
                </Button>
              </div>
            </div>
          );
        })}

        {filteredAlerts.length === 0 && (
          <div className="bg-slate-900 p-12 rounded-xl border border-slate-800 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-100">No Active Alerts Found</h3>
            <p className="text-xs text-slate-500">All anomalies in this severity bracket have been successfully resolved.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AlertsPage;
