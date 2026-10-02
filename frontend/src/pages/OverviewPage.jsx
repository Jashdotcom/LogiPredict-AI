import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  Filter,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { KpiGrid } from '../components/dashboard/KpiGrid';
import { InventoryHealthChart } from '../components/dashboard/InventoryHealthChart';
import { DemandTrendChart } from '../components/dashboard/DemandTrendChart';
import { PriorityAlertsList } from '../components/dashboard/PriorityAlertsList';
import { RecentActivityFeed } from '../components/dashboard/RecentActivityFeed';
import { QuickActionsBar } from '../components/dashboard/QuickActionsBar';

/**
 * Overview Page — Primary Command Center Dashboard for LogiPredict AI
 */
export function OverviewPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [isForecastRunning, setIsForecastRunning] = useState(false);
  const [forecastSuccess, setForecastSuccess] = useState(false);

  const handleRunForecast = () => {
    setIsForecastRunning(true);
    setTimeout(() => {
      setIsForecastRunning(false);
      setForecastSuccess(true);
      setTimeout(() => setForecastSuccess(false), 4000);
    }, 1200);
  };

  const handleExport = () => {
    alert('LogiPredict AI: Executive SIH 2026 audit report compiled. Download initiated.');
  };

  const handleResolveAlert = (alertId) => {
    alert(`Alert ${alertId} action triggered: Emergency replenishment protocol initiated.`);
  };

  const handleQuickAction = (action) => {
    if (action.id === 'action-forecast') {
      handleRunForecast();
    } else {
      alert(`Initiated operation: ${action.label}`);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Top Page Header */}
      <PageHeader
        title="Logistics Command Center"
        subtitle="Autonomous predictive telemetry, multi-echelon inventory health, and neural demand forecasting across all regional distribution nodes."
        badge={
          <Badge variant="brand" size="sm" dot dotPulse icon={Sparkles}>
            AI Forecasting Active
          </Badge>
        }
        actions={
          <>
            {/* Timeframe selector pill */}
            <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600">
              {[
                { id: '24h', label: '24h' },
                { id: '7d', label: '7 Days' },
                { id: '30d', label: '30 Days' },
                { id: 'q4', label: 'Q4 2026' },
              ].map((tf) => (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => setSelectedTimeframe(tf.id)}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    selectedTimeframe === tf.id
                      ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {/* Export Audit Report */}
            <Button
              variant="outline"
              size="sm"
              leftIcon={Download}
              onClick={handleExport}
            >
              Export Report
            </Button>

            {/* Primary Action: Run AI Forecast */}
            <Button
              variant="primary"
              size="sm"
              leftIcon={Sparkles}
              isLoading={isForecastRunning}
              onClick={handleRunForecast}
            >
              {isForecastRunning ? 'Running Inferences...' : 'Run AI Forecast'}
            </Button>
          </>
        }
      />

      {/* Success Notification Banner for AI Inference */}
      {forecastSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-emerald-800 animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-bold">
                Neural Forecast Inference Completed Successfully
              </p>
              <p className="text-xs text-emerald-700">
                Processed 14-day horizon across 6 distribution hubs. Confidence score: 96.8% (MAPE: 3.2%).
              </p>
            </div>
          </div>
          <Badge variant="success" size="xs">
            Model Synced
          </Badge>
        </div>
      )}

      {/* Section 1: KPI Telemetry Cards */}
      <section aria-label="Key Performance Indicators">
        <KpiGrid />
      </section>

      {/* Section 2: Core Visualizations (2 Column Grid) */}
      <section
        aria-label="Core Analytics and Forecasting Charts"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <InventoryHealthChart />
        <DemandTrendChart />
      </section>

      {/* Section 3: Anomaly Alerts & Activity Timeline (2 Column Grid) */}
      <section
        aria-label="Predictive Alerts and Recent Activity"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <PriorityAlertsList onResolve={handleResolveAlert} />
        <RecentActivityFeed />
      </section>

      {/* Section 4: Autonomous Operations & Quick Actions Bar */}
      <section aria-label="Autonomous Actions">
        <QuickActionsBar onActionClick={handleQuickAction} />
      </section>
    </div>
  );
}

export default OverviewPage;
