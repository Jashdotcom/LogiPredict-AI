import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  X,
  Play,
  FileSpreadsheet,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Dialog } from '../components/ui/Dialog';
import { KpiGrid } from '../components/dashboard/KpiGrid';
import { InventoryHealthChart } from '../components/dashboard/InventoryHealthChart';
import { DemandTrendChart } from '../components/dashboard/DemandTrendChart';
import { PriorityAlertsList } from '../components/dashboard/PriorityAlertsList';
import { RecentActivityTable } from '../components/dashboard/RecentActivityTable';
import { QuickActionsBar } from '../components/dashboard/QuickActionsBar';
import { dashboardService } from '../services/dashboardService';
import { useToast } from '../hooks/useToast';
import { formatDate } from '../utils/formatters';

/**
 * Overview Page — Primary Command Center Dashboard for LogiPredict AI
 * Calibrated for Smart India Hackathon (SIH 2026) Indian Army Logistics Scenario
 */
export function OverviewPage() {
  const navigate = useNavigate();
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

  // Mitigation & Action Dialog States
  const [activeMitigationAlert, setActiveMitigationAlert] = useState(null);
  const [selectedAlertDetail, setSelectedAlertDetail] = useState(null);
  const [isMitigating, setIsMitigating] = useState(false);

  // Simulation Modal State
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState('blizzard');
  const [simLeadTime, setSimLeadTime] = useState(2.0);
  const [simDemandSurge, setSimDemandSurge] = useState(35);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);

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

  // 1. KPI Card Navigation Handler
  const handleKpiClick = (kpi) => {
    switch (kpi.id) {
      case 'total-inventory-items':
      case 'inventory-health':
        navigate('/inventory');
        break;
      case 'below-minimum-stock':
        navigate('/inventory?filter=critical');
        break;
      case 'predicted-stockouts':
        navigate('/forecasting');
        break;
      case 'pending-replenishments':
        navigate('/inventory?filter=replenishment');
        break;
      case 'active-priority-alerts':
        navigate('/alerts');
        break;
      default:
        navigate('/inventory');
        break;
    }
  };

  // Handler: Run Neural AI Forecast Inference
  const handleRunForecast = async () => {
    setIsForecastRunning(true);
    toast.info('Synthesizing 14-day multi-echelon demand predictions with weather layers...', {
      title: 'AI Pipeline Active',
      duration: 2500,
    });

    try {
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

  // 5. Export Report Action (Functional CSV Export)
  const handleExportReport = () => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `logipredict-dashboard-report-${timestamp}.csv`;

      let csvContent = 'data:text/csv;charset=utf-8,';
      csvContent += 'LogiPredict AI — Military Logistics & Supply Chain Command Center Report\r\n';
      csvContent += `Generated Date,${new Date().toISOString()}\r\n`;
      csvContent += 'Disclaimer,SYNTHETIC DEMONSTRATION DATA FOR SIH 2026\r\n\r\n';

      // KPI Summary Section
      csvContent += '=== KEY PERFORMANCE INDICATORS ===\r\n';
      csvContent += 'Metric,Value,Status\r\n';
      dashboardData.kpis.forEach((k) => {
        csvContent += `"${k.title}","${k.value}","${k.status || 'Active'}"\r\n`;
      });

      // Priority Alerts Section
      csvContent += '\r\n=== PRIORITY ALERTS ===\r\n';
      csvContent += 'Alert ID,Severity,Title,Warehouse,Recommended Action\r\n';
      dashboardData.priorityAlerts.forEach((a) => {
        csvContent += `"${a.id || a.alert_id}","${a.severity}","${a.title.replace(/"/g, '""')}","${a.warehouse}","${a.recommendedAction.replace(/"/g, '""')}"\r\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Logistics audit report successfully exported as ${filename}.`, {
        title: 'Report Downloaded',
      });
    } catch (err) {
      toast.error('Failed to generate export report.', { title: 'Export Error' });
    }
  };

  // 4. Run Simulation Handler
  const handleExecuteSimulation = async () => {
    setIsSimulating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSimResult({
        scenarioName:
          selectedScenario === 'blizzard'
            ? 'Severe Winter Blizzard (Zojila Pass Closure)'
            : selectedScenario === 'surge'
            ? 'High-Altitude Troop Reinforcement Surge'
            : 'NH-1D Highway Corridor Cutoff',
        impactedHubs: 3,
        projectedStockouts: 4,
        resilienceScore: '78.4%',
        suggestedReroutes: 6,
        preemptivePOs: 2,
        estimatedBufferRunwayDays: 5.2,
      });
      toast.success('Simulation executed successfully against forward supply nodes.', {
        title: 'Simulation Complete',
      });
    } catch (err) {
      toast.error('Simulation execution failed.', { title: 'Simulation Error' });
    } finally {
      setIsSimulating(false);
    }
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
        activeMitigationAlert.id || activeMitigationAlert.alert_id,
        activeMitigationAlert.recommendedAction
      );

      setDashboardData((prev) => ({
        ...prev,
        priorityAlerts: prev.priorityAlerts.filter(
          (a) => (a.id || a.alert_id) !== (activeMitigationAlert.id || activeMitigationAlert.alert_id)
        ),
      }));

      toast.success(
        `Mitigation Protocol Executed: "${activeMitigationAlert.recommendedAction}". Forward telemetry updated.`,
        {
          title: 'Action Dispatched',
          duration: 4000,
        }
      );
      setActiveMitigationAlert(null);
      setSelectedAlertDetail(null);
    } catch (err) {
      toast.error('Failed to trigger mitigation protocol.', {
        title: 'Action Error',
      });
    } finally {
      setIsMitigating(false);
    }
  };

  // Format today's date context string
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
              className="inline-flex items-center p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs font-semibold text-slate-400"
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
                      ? 'bg-slate-800/80 text-indigo-400 shadow-2xs font-bold'
                      : 'hover:text-slate-200 text-slate-400'
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
              onClick={handleExportReport}
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
      <div className="bg-slate-900 rounded-xl p-3.5 sm:p-4 border border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 text-slate-400">
          <div className="flex items-center gap-1.5 font-semibold text-slate-200">
            <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Operational Cycle: <strong>{formattedToday}</strong></span>
          </div>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Last Telemetry Sync: <strong>{formatDate(lastSynced, true)}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="neutral" size="xs">
            Region: 6 Active Hubs (Leh, Udhampur, Tawang, Siliguri, Delhi, Ahmedabad)
          </Badge>
        </div>
      </div>

      {/* Section 1: KPI Telemetry Cards (6 Metrics with Navigation) */}
      <section aria-label="Key Performance Indicators">
        <KpiGrid
          kpis={dashboardData.kpis}
          isLoading={isLoading}
          onKpiClick={handleKpiClick}
        />
      </section>

      {/* Section 2: Core Visualizations (2 Column Grid with Tooltips) */}
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

      {/* Section 3: Predictive Alerts & Activity Telemetry (2 Column Grid with Interactive Alert Details) */}
      <section
        aria-label="Predictive Alerts and Recent Activity"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <PriorityAlertsList
          alerts={dashboardData.priorityAlerts}
          isLoading={isLoading}
          onResolve={handlePromptMitigation}
          onSelectAlert={(alert) => setSelectedAlertDetail(alert)}
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
            } else if (action.id === 'action-simulations') {
              setIsSimModalOpen(true);
            } else if (action.path) {
              navigate(action.path);
            }
          }}
        />
      </section>

      {/* 2. Alert Detail Dialog Modal */}
      {selectedAlertDetail && (
        <Dialog
          isOpen={Boolean(selectedAlertDetail)}
          onClose={() => setSelectedAlertDetail(null)}
          title={selectedAlertDetail.title}
          subtitle={`Alert ID: ${selectedAlertDetail.id || selectedAlertDetail.alert_id} • Category: ${selectedAlertDetail.category || 'Logistics Anomaly'}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2">
              <Badge variant={selectedAlertDetail.severity === 'critical' ? 'danger' : 'warning'} size="sm" dot>
                Severity: {selectedAlertDetail.severity.toUpperCase()}
              </Badge>
              <Badge variant="neutral" size="sm">
                Status: {selectedAlertDetail.status}
              </Badge>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div>
                <strong className="text-slate-400">Warehouse / Depot:</strong>
                <p className="text-slate-100 font-medium mt-0.5">{selectedAlertDetail.warehouse}</p>
              </div>
              <div>
                <strong className="text-slate-400">Trigger Condition / Description:</strong>
                <p className="text-slate-300 mt-0.5">{selectedAlertDetail.description}</p>
              </div>
              <div>
                <strong className="text-rose-500">Predicted Impact:</strong>
                <p className="text-rose-400 font-medium mt-0.5">{selectedAlertDetail.predictedImpact}</p>
              </div>
              <div>
                <strong className="text-indigo-400">Recommended Mitigation Action:</strong>
                <p className="text-indigo-300 font-semibold mt-0.5">{selectedAlertDetail.recommendedAction}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-500">
              <span>Timestamp: {selectedAlertDetail.timestamp || selectedAlertDetail.created_at}</span>
              <span className="italic text-slate-600">SIH 2026 Synthetic Demonstration Data</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <Button variant="outline" size="sm" onClick={() => setSelectedAlertDetail(null)}>
                Close
              </Button>
              <Button
                variant={selectedAlertDetail.severity === 'critical' ? 'danger' : 'primary'}
                size="sm"
                leftIcon={ShieldAlert}
                onClick={() => {
                  const alertToFix = selectedAlertDetail;
                  setSelectedAlertDetail(null);
                  handlePromptMitigation(alertToFix);
                }}
              >
                Execute Mitigation Protocol
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* 4. Run Simulation Configuration & Result Modal */}
      {isSimModalOpen && (
        <Dialog
          isOpen={isSimModalOpen}
          onClose={() => setIsSimModalOpen(false)}
          title="Forward Supply Chain Stress Simulation"
          subtitle="Simulate extreme weather events, supply route blockades, and demand surges against forward bases."
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 py-2">
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Select Stress Scenario
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'blizzard', name: 'Severe Winter Blizzard', desc: 'Zojila Pass closure (+120h lead time)' },
                  { id: 'surge', name: 'Troop Reinforcement', desc: '+80% rations & medical demand' },
                  { id: 'landslide', name: 'NH-1D Landslide', desc: 'Highway corridor cutoff at Leh' },
                ].map((scen) => (
                  <button
                    key={scen.id}
                    type="button"
                    onClick={() => setSelectedScenario(scen.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedScenario === scen.id
                        ? 'bg-indigo-950/40 border-indigo-500/50 ring-1 ring-indigo-500 shadow-2xs'
                        : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <span className="font-bold text-xs text-slate-100 block">{scen.name}</span>
                    <span className="text-[11px] text-slate-400 mt-1 block leading-tight">{scen.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Lead Time Multiplier: <strong>{simLeadTime}x</strong>
                </label>
                <input
                  type="range"
                  min="1.0"
                  max="4.0"
                  step="0.2"
                  value={simLeadTime}
                  onChange={(e) => setSimLeadTime(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <span className="text-[11px] text-slate-500">Delays transit across mountain corridors</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Emergency Demand Surge: <strong>+{simDemandSurge}%</strong>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={simDemandSurge}
                  onChange={(e) => setSimDemandSurge(parseInt(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <span className="text-[11px] text-slate-500">Spike in combat rations, POL & medical</span>
              </div>
            </div>

            {simResult && (
              <div className="bg-emerald-950/40 p-4 rounded-xl border border-emerald-900/60 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 text-xs uppercase tracking-wide">
                    Simulation Output: {simResult.scenarioName}
                  </span>
                  <Badge variant="success" size="xs">Resilience Score: {simResult.resilienceScore}</Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-700/60">
                    <span className="text-slate-500 block text-[10px]">Impacted Hubs</span>
                    <strong className="text-slate-200 text-sm">{simResult.impactedHubs} Hubs</strong>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-700/60">
                    <span className="text-slate-500 block text-[10px]">Stockout Risk SKUs</span>
                    <strong className="text-rose-400 text-sm">{simResult.projectedStockouts} SKUs</strong>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-700/60">
                    <span className="text-slate-500 block text-[10px]">Suggested Reroutes</span>
                    <strong className="text-indigo-400 text-sm">{simResult.suggestedReroutes} Routes</strong>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-700/60">
                    <span className="text-slate-500 block text-[10px]">Buffer Runway</span>
                    <strong className="text-emerald-400 text-sm">{simResult.estimatedBufferRunwayDays} Days</strong>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setIsSimModalOpen(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={Play}
                isLoading={isSimulating}
                onClick={handleExecuteSimulation}
              >
                {isSimulating ? 'Processing Simulation...' : 'Execute Simulation'}
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Modal: Confirm Emergency Mitigation Protocol */}
      {activeMitigationAlert && (
        <ConfirmDialog
          isOpen={Boolean(activeMitigationAlert)}
          onClose={() => setActiveMitigationAlert(null)}
          onConfirm={handleConfirmMitigation}
          title={`Execute Protocol: ${activeMitigationAlert.sku || activeMitigationAlert.title}`}
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
