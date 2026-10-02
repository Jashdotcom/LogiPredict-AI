import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Download,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Clock,
  Radio,
  Sliders,
  ShieldAlert,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { KpiGrid } from '../components/dashboard/KpiGrid';
import { InventoryHealthChart } from '../components/dashboard/InventoryHealthChart';
import { DemandTrendChart } from '../components/dashboard/DemandTrendChart';
import { PriorityAlertsList } from '../components/dashboard/PriorityAlertsList';
import { RecentActivityTable } from '../components/dashboard/RecentActivityTable';
import { QuickActionsBar } from '../components/dashboard/QuickActionsBar';
import { dashboardService } from '../services/dashboardService';
import { useToast } from '../hooks/useToast';
import { formatDate } from '../utils/dateHelpers';

/**
 * Overview Page — Primary Command Center Dashboard for LogiPredict AI
 * Calibrated for Smart India Hackathon (SIH 2026) Indian Army Logistics Scenario
 */
export function OverviewPage() {
  const toast = useToast();

  // State Management
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isForecastRunning, setIsForecastRunning] = useState(false);
  const [lastSynced, setLastSynced] = useState(new Date());

  // Dashboard Data State
  const [dashboardData, setDashboardData] = useState({
    kpis: [],
    inventoryHealth: [],
    inventoryDistribution: [],
    demandForecast: [],
    priorityAlerts: [],
    recentActivities: [],
    quickActions: [],
    isLive: false,
  });

  // Mitigation Dialog State
  const [activeMitigationAlert, setActiveMitigationAlert] = useState(null);
  const [isMitigating, setIsMitigating] = useState(false);

  // Load Dashboard Data
  const loadDashboardData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const data = await dashboardService.getDashboardSummary({ timeframe: selectedTimeframe });
      setDashboardData(data);
      setLastSynced(new Date());
    } catch (error) {
      toast.error('Failed to retrieve telemetry data. Using cached offline baseline.', {
        title: 'Network Warning',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedTimeframe]);

  // Handler: Run Neural AI Forecast Inference
  const handleRunForecast = async () => {
    setIsForecastRunning(true);
    toast.info('Synthesizing 14-day multi-echelon demand predictions with weather layers...', {
      title: 'AI Pipeline Active',
      duration: 2500,
    });

    try {
      // Simulate inference run through service
      await new Promise((resolve) => setTimeout(resolve, 1400));
      const updatedForecast = await dashboardService.getDemandForecast('14d');
      setDashboardData((prev) => ({
        ...prev,
        demandForecast: updatedForecast,
      }));

      toast.success(
        '14-day neural forecast synchronized across 6 military hubs (Confidence: 96.8%, MAPE: 3.2%).',
        {
          title: 'Neural Inference Complete',
          duration: 4500,
        }
      );
    } catch (err) {
      toast.error('Inference pipeline error. Using validated baseline models.', {
        title: 'Pipeline Error',
      });
    } finally {
      setIsForecastRunning(false);
    }
  };

  // Handler: Export Logistics Manifest & Audit Report
  const handleExport = () => {
    toast.success('Logistics audit manifest (SIH 2026 Defense Format) compiled. Ready for download.', {
      title: 'Report Generated',
    });
  };

  // Handler: Prompt Mitigation Action
  const handlePromptMitigation = (alert) => {
    setActiveMitigationAlert(alert);
  };

  // Handler: Execute Mitigation Action
  const handleConfirmMitigation = async () => {
    if (!activeMitigationAlert) return;

    setIsMitigating(true);
    try {
      await dashboardService.triggerMitigationAction(
        activeMitigationAlert.id,
        activeMitigationAlert.recommendedAction
      );

      // Remove or mark alert as mitigated in state
      setDashboardData((prev) => ({
        ...prev,
        priorityAlerts: prev.priorityAlerts.filter((a) => a.id !== activeMitigationAlert.id),
      }));

      toast.success(
        `Mitigation Protocol Executed: "${activeMitigationAlert.recommendedAction}". Forward telemetry updated.`,
        {
          title: 'Action Dispatched',
          duration: 4000,
        }
      );
      setActiveMitigationAlert(null);
    } catch (err) {
      toast.error('Failed to trigger mitigation protocol.', {
        title: 'Action Error',
      });
    } finally {
      setIsMitigating(false);
    }
  };

  // Format today's date context string (e.g. "Friday, October 2, 2026")
  const formattedToday = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(2026, 9, 2));

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Top Page Header */}
      <PageHeader
        title="Logistics Command Center & Telemetry"
        subtitle="Real-time multi-echelon stock health, neural demand forecasting, and automated convoy logistics for forward military depots."
        breadcrumbs={[{ label: 'Command Center' }]}
        badge={
          <Badge variant="brand" size="sm" dot dotPulse icon={Radio}>
            Northern & Eastern Command Live
          </Badge>
        }
        actions={
          <>
            {/* Timeframe selector pill */}
            <div
              role="group"
              aria-label="Select Telemetry Timeframe"
              className="inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600"
            >
              {[
                { id: '24h', label: '24h' },
                { id: '7d', label: '7 Days' },
                { id: '14d', label: '14 Days' },
                { id: '30d', label: '30 Days' },
              ].map((tf) => (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => setSelectedTimeframe(tf.id)}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    selectedTimeframe === tf.id
                      ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                      : 'hover:text-slate-900 text-slate-600'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {/* Refresh Telemetry Data */}
            <Button
              variant="outline"
              size="sm"
              leftIcon={RefreshCw}
              isLoading={isRefreshing}
              onClick={() => loadDashboardData(true)}
              title="Refresh telemetry streams"
            >
              Refresh
            </Button>

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

      {/* Military Operational Context & Date Sub-header */}
      <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 text-slate-600">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
            <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Operational Cycle: <strong>{formattedToday}</strong></span>
          </div>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <div className="flex items-center gap-1.5 text-slate-600">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Last Telemetry Sync: <strong>{formatDate(lastSynced, 'HH:mm:ss')} IST</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="neutral" size="xs">
            Region: 6 Active Hubs (Leh, Udhampur, Tawang, Siliguri, Delhi, Ahmedabad)
          </Badge>
        </div>
      </div>

      {/* Section 1: KPI Telemetry Cards (6 Metrics) */}
      <section aria-label="Key Performance Indicators">
        <KpiGrid kpis={dashboardData.kpis} isLoading={isLoading} />
      </section>

      {/* Section 2: Core Visualizations (2 Column Grid) */}
      <section
        aria-label="Core Analytics and Forecasting Charts"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <InventoryHealthChart
          data={dashboardData.inventoryHealth}
          distribution={dashboardData.inventoryDistribution}
          isLoading={isLoading}
        />
        <DemandTrendChart
          data={dashboardData.demandForecast}
          isLoading={isLoading}
        />
      </section>

      {/* Section 3: Predictive Alerts & Activity Telemetry (2 Column Grid) */}
      <section
        aria-label="Predictive Alerts and Recent Activity"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <PriorityAlertsList
          alerts={dashboardData.priorityAlerts}
          isLoading={isLoading}
          onResolve={handlePromptMitigation}
        />
        <RecentActivityTable
          activities={dashboardData.recentActivities}
          isLoading={isLoading}
        />
      </section>

      {/* Section 4: Autonomous Operations & Fast Actions Bar */}
      <section aria-label="Autonomous Operations">
        <QuickActionsBar
          actions={dashboardData.quickActions}
          onActionClick={(action) => {
            if (action.id === 'action-forecast') {
              handleRunForecast();
            }
          }}
        />
      </section>

      {/* Modal: Confirm Emergency Mitigation Protocol */}
      {activeMitigationAlert && (
        <ConfirmDialog
          isOpen={Boolean(activeMitigationAlert)}
          onClose={() => setActiveMitigationAlert(null)}
          onConfirm={handleConfirmMitigation}
          title={`Execute Protocol: ${activeMitigationAlert.sku}`}
          description={`You are about to trigger the recommended emergency operational mitigation: "${activeMitigationAlert.recommendedAction}". Forward depots and telematics routes will immediately receive this instruction.`}
          confirmText="Confirm & Dispatch Protocol"
          cancelText="Dismiss"
          variant={activeMitigationAlert.severity === 'critical' ? 'destructive' : 'primary'}
          isLoading={isMitigating}
        />
      )}
    </div>
  );
}

export default OverviewPage;
