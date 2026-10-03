import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  X,
  ShieldCheck,
  AlertOctagon,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Cpu,
  Truck,
  TrendingUp,
  Package,
  Layers,
  Sparkles,
  Info,
  Check,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatNumber } from '../../utils/formatters';
import { analyticsDataService } from '../../data/analytics/analyticsDataService';

/**
 * LogiPredict AI — Executive Demo Report Modal (Phase 9.2)
 * Comprehensive Multi-Echelon Supply Chain Readiness & Strategic Intelligence Briefing
 * Headquarters Northern Command, Indian Army Forward Supply Chain (SIH 2026)
 */
export function DemoReportModal({
  isOpen,
  onClose,
  timeframe = '7d',
  selectedDepot = 'all',
  selectedCategory = 'all',
}) {
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'inventory' | 'forecasting' | 'alerts' | 'routes' | 'recommendations'
  const [approvedRecs, setApprovedRecs] = useState({});
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  // Load report data whenever modal opens or filters change
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);

    const fetchReport = async () => {
      try {
        const params = {
          timeframe,
          depot_id: selectedDepot !== 'all' ? selectedDepot : undefined,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
        };
        const data = await analyticsDataService.getDemoReport(params);
        if (isMounted) {
          setReport(data);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[DemoReportModal] Error fetching demo report:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchReport();

    return () => {
      isMounted = false;
    };
  }, [isOpen, timeframe, selectedDepot, selectedCategory]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleOpenHtml = () => {
    const params = {
      timeframe,
      depot_id: selectedDepot !== 'all' ? selectedDepot : undefined,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
    };
    analyticsDataService.openDemoReportHtml(params);
  };

  const handleDownloadJson = () => {
    if (!report) return;
    const jsonString = JSON.stringify(report, null, 2);
    const todayStr = new Date().toISOString().slice(0, 10);
    analyticsDataService.triggerDownload(
      jsonString,
      `logipredict_demo_report_${todayStr}.json`,
      'application/json;charset=utf-8;'
    );
  };

  const handleExportAllCsv = async () => {
    setIsExportingCsv(true);
    try {
      const params = {
        timeframe,
        depot_id: selectedDepot !== 'all' ? selectedDepot : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
      };
      await Promise.all([
        analyticsDataService.downloadInventoryCsv(params),
        analyticsDataService.downloadForecastsCsv(params),
        analyticsDataService.downloadAlertsCsv(params),
      ]);
    } catch (err) {
      console.error('[DemoReportModal] Error exporting CSV telemetry:', err);
    } finally {
      setIsExportingCsv(false);
    }
  };

  const toggleApproveRec = (index) => {
    setApprovedRecs((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const exec = report?.executive_summary || {};
  const inv = report?.inventory_analysis || {};
  const fc = report?.forecasting_analysis || {};
  const alerts = report?.predictive_alerts_summary || {};
  const logistics = report?.logistics_performance || {};
  const recs = report?.strategic_recommendations || [];
  const cert = report?.certification || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* ==================================================================== */}
        {/* Modal Header */}
        {/* ==================================================================== */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-700/60 text-indigo-400 shadow-xs">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  {report?.title || 'HQ Northern Command Master Readiness & Logistics Report'}
                </h3>
                <Badge variant="danger" size="xs">
                  {report?.classification || 'RESTRICTED // FORM 48-A'}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {report?.subtitle || 'Automated Multi-Echelon Telematics & Strategic AI Audit'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={ExternalLink}
              onClick={handleOpenHtml}
              className="hidden md:inline-flex"
            >
              Open Printable HTML
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={Printer}
              onClick={handlePrint}
              className="hidden sm:inline-flex"
            >
              Print
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* Tab Navigation Toolbar */}
        {/* ==================================================================== */}
        <div className="px-4 py-2 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1">
            {[
              { id: 'summary', label: 'Executive Briefing', icon: Sparkles },
              { id: 'inventory', label: 'Inventory Watchlist', icon: Package },
              { id: 'forecasting', label: 'Neural Forecasts', icon: TrendingUp },
              { id: 'alerts', label: 'Anomaly Alerts', icon: AlertOctagon },
              { id: 'routes', label: 'Mountain Corridors', icon: Truck },
              { id: 'recommendations', label: 'Strategic Actions', icon: ShieldCheck, badge: recs.length },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-indigo-900 text-indigo-200'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <span>ID:</span>
            <span className="text-indigo-300 font-bold">{report?.report_id || 'NC-REP-2026-001'}</span>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* Scrollable Report Content Body */}
        {/* ==================================================================== */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-slate-200 text-xs sm:text-sm">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">Synthesizing multi-echelon telemetry & report analytics...</p>
            </div>
          ) : (
            <>
              {/* Synthetic Data Disclaimer Banner */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-start gap-3 text-amber-200/90 text-xs">
                <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5 leading-relaxed">
                  <span className="font-bold text-amber-300 uppercase tracking-wide text-[10px] block">
                    Synthetic Data Protocol Notice (SIH 2026)
                  </span>
                  <p className="text-[11px] sm:text-xs text-amber-200/80">
                    {report?.disclaimer ||
                      'All troop formations, depot coordinates, stock levels, convoy routes, and tactical designations in this report are simulated for demonstration & evaluation purposes under SIH 2026 guidelines.'}
                  </p>
                </div>
              </div>

              {/* Master Header Metadata Card */}
              <div className="border border-slate-700/80 p-4 rounded-xl bg-slate-950/50 space-y-3">
                <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2.5 gap-2">
                  <div>
                    <span className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase block">
                      INDIAN ARMY FORWARD LOGISTICS CORPS
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-white">
                      HQ NORTHERN COMMAND (UDHAMPUR) // LOG-OPS-EVAL
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">AUDIT SERIAL ID</span>
                    <span className="font-mono text-xs font-bold text-indigo-300">
                      {report?.report_id || 'NC-REP-2026-001'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Evaluation Window:</span>
                    <span className="font-semibold text-slate-200">
                      {report?.period || 'Last 7 Days (Standard)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Sector Scope:</span>
                    <span className="font-semibold text-slate-200">
                      {report?.scope || 'Northern Command Forward Echelons (Ladakh)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Depots Audited:</span>
                    <span className="font-semibold text-slate-200">
                      {inv.depots_audited || 6} Strategic Hubs & FOBs
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Report Timestamp:</span>
                    <span className="font-semibold text-slate-200 font-mono text-[11px]">
                      {report?.generated_at ? new Date(report.generated_at).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* ============================================================== */}
              {/* TAB 1: EXECUTIVE BRIEFING SUMMARY */}
              {/* ============================================================== */}
              {activeTab === 'summary' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Executive Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Total SKUs</span>
                      <span className="text-base sm:text-lg font-bold text-white font-numeric">
                        {exec.total_skus_audited || 25}
                      </span>
                      <span className="text-[10px] text-slate-500 block">Strategic Items</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Health Score</span>
                      <span className="text-base sm:text-lg font-bold text-emerald-400 font-numeric">
                        {exec.overall_inventory_health_score || 94.8}%
                      </span>
                      <span className="text-[10px] text-emerald-500/80 block">Optimal Readiness</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Total Valuation</span>
                      <span className="text-base sm:text-lg font-bold text-indigo-400 font-numeric">
                        ₹{exec.total_inventory_valuation_cr || 42.85} Cr
                      </span>
                      <span className="text-[10px] text-slate-500 block">Multi-Echelon Asset</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Forecast Accuracy</span>
                      <span className="text-base sm:text-lg font-bold text-purple-400 font-numeric">
                        {exec.neural_forecast_accuracy_pct || 96.8}%
                      </span>
                      <span className="text-[10px] text-purple-400/80 block">MAPE: 3.2%</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Critical Risks</span>
                      <span className="text-base sm:text-lg font-bold text-rose-400 font-numeric">
                        {exec.critical_stockout_skus || 2} SKUs
                      </span>
                      <span className="text-[10px] text-rose-400/80 block">Requires Resupply</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">On-Time Delivery</span>
                      <span className="text-base sm:text-lg font-bold text-amber-400 font-numeric">
                        {exec.convoy_on_time_delivery_rate || 96.2}%
                      </span>
                      <span className="text-[10px] text-slate-500 block">Mountain Passes</span>
                    </div>
                  </div>

                  {/* Executive Narrative */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Executive Command Synopsis</span>
                    </h5>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Forward supply chain posture across the Northern Command Ladakh Sector remains at a high readiness index
                      of <strong className="text-emerald-400">{exec.overall_inventory_health_score || 94.8}%</strong>.
                      Neural demand forecasting has achieved an operational accuracy benchmark of{' '}
                      <strong className="text-purple-400">{exec.neural_forecast_accuracy_pct || 96.8}%</strong>, mitigating 14 potential stockout
                      scenarios before supply depletion. Immediate logistics intervention is mandated for{' '}
                      <strong className="text-rose-400">{exec.critical_stockout_skus || 2} critical inventory bottlenecks</strong> at Drass FOB and
                      Siachen Base Camp due to impending mountain pass closures and low stock levels.
                    </p>
                  </div>

                  {/* High-Level Overview Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
                      <h6 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Supply Category Allocation</span>
                      </h6>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(inv.category_distribution || {}).map(([cat, count]) => (
                          <div
                            key={cat}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2 text-xs"
                          >
                            <span className="text-slate-300">{cat}</span>
                            <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 font-mono font-bold text-[10px]">
                              {count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
                      <h6 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-purple-400" />
                        <span>AI Engine Diagnostics</span>
                      </h6>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
                          <span className="text-[10px] text-slate-400 block">Model Architecture</span>
                          <span className="font-semibold text-slate-200">Hybrid LSTM-Prophet</span>
                        </div>
                        <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
                          <span className="text-[10px] text-slate-400 block">R-Squared Score</span>
                          <span className="font-semibold text-emerald-400 font-numeric">0.968</span>
                        </div>
                        <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
                          <span className="text-[10px] text-slate-400 block">Mean Absolute Error</span>
                          <span className="font-semibold text-slate-200 font-numeric">142.5 Units</span>
                        </div>
                        <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
                          <span className="text-[10px] text-slate-400 block">Active Alerts Handled</span>
                          <span className="font-semibold text-amber-400 font-numeric">
                            {alerts.active_count || 4} / {alerts.total_alerts || 6}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 2: INVENTORY WATCHLIST */}
              {/* ============================================================== */}
              {activeTab === 'inventory' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                      <AlertOctagon className="w-3.5 h-3.5" />
                      <span>Multi-Echelon Critical Stockout & Warning Watchlist</span>
                    </h5>
                    <Badge variant="neutral" size="xs">
                      {inv.critical_watchlist?.length || 0} Priority SKUs
                    </Badge>
                  </div>

                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                          <th className="p-3">SKU Identifier</th>
                          <th className="p-3">Designation & Description</th>
                          <th className="p-3">Target Depot</th>
                          <th className="p-3 text-right">On-Hand Stock</th>
                          <th className="p-3 text-right">Safety Threshold</th>
                          <th className="p-3 text-right">Days Cover</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {(inv.critical_watchlist || []).map((item, idx) => (
                          <tr key={item.sku || idx} className="hover:bg-slate-900/50 transition-colors">
                            <td className="p-3 font-mono text-[11px] text-indigo-400 font-bold">{item.sku}</td>
                            <td className="p-3 text-slate-200">{item.name}</td>
                            <td className="p-3 text-slate-400">{item.depot}</td>
                            <td className="p-3 text-right font-numeric text-slate-200">
                              {formatNumber(item.on_hand)} {item.unit}
                            </td>
                            <td className="p-3 text-right font-numeric text-slate-400">
                              {formatNumber(item.min_threshold)} {item.unit}
                            </td>
                            <td className="p-3 text-right font-numeric font-bold text-rose-400">
                              {item.days_of_cover}d
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  item.status === 'CRITICAL'
                                    ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                                    : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 3: NEURAL DEMAND FORECASTING */}
              {/* ============================================================== */}
              {activeTab === 'forecasting' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Neural Model Evaluation & Residual Error Analysis</span>
                    </h5>
                    <Badge variant="brand" size="xs">
                      Model: {fc.model_architecture || 'Hybrid LSTM + Prophet'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Mean Absolute Pct Error (MAPE)</span>
                      <span className="text-base font-bold text-purple-400 font-numeric">{fc.mape || 3.2}%</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Mean Absolute Error (MAE)</span>
                      <span className="text-base font-bold text-slate-200 font-numeric">{fc.mae || 142.5}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Root Mean Sq Error (RMSE)</span>
                      <span className="text-base font-bold text-slate-200 font-numeric">{fc.rmse || 185.0}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Regression Score (R²)</span>
                      <span className="text-base font-bold text-emerald-400 font-numeric">{fc.r_squared || 0.968}</span>
                    </div>
                  </div>

                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                          <th className="p-3">Evaluation Date</th>
                          <th className="p-3 text-right">Actual Historical Demand</th>
                          <th className="p-3 text-right">Predicted Model Demand</th>
                          <th className="p-3 text-right">Residual Error</th>
                          <th className="p-3 text-right">Percentage Error</th>
                          <th className="p-3 text-center">Confidence Zone</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {(fc.evaluation_series || []).map((point, idx) => (
                          <tr key={point.date || idx} className="hover:bg-slate-900/50 transition-colors">
                            <td className="p-3 font-semibold text-slate-200">{point.date}</td>
                            <td className="p-3 text-right font-numeric text-slate-300">{formatNumber(point.actual)}</td>
                            <td className="p-3 text-right font-numeric text-purple-300 font-semibold">
                              {formatNumber(point.forecasted)}
                            </td>
                            <td className="p-3 text-right font-numeric text-slate-400">
                              {point.residual > 0 ? `+${point.residual}` : point.residual}
                            </td>
                            <td className="p-3 text-right font-numeric text-emerald-400">{point.error_pct}%</td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-800/60">
                                95% Bound
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 4: PREDICTIVE ANOMALY ALERTS */}
              {/* ============================================================== */}
              {activeTab === 'alerts' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Active Predictive Early Warning & Anomaly Telemetry</span>
                    </h5>
                    <Badge variant="neutral" size="xs">
                      {alerts.active_count || 4} Active Anomalies
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {(alerts.top_alerts || []).map((alert, idx) => (
                      <div
                        key={alert.alert_id || idx}
                        className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-indigo-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              {alert.alert_id}
                            </span>
                            <span className="text-sm font-bold text-white">{alert.type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">{alert.depot}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                alert.severity === 'critical'
                                  ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                                  : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                              }`}
                            >
                              {alert.severity}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 font-medium leading-relaxed">
                          <strong className="text-slate-400">Trigger Condition:</strong> {alert.trigger}
                        </p>

                        <div className="pt-2 border-t border-slate-800/80 flex items-start gap-2 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-emerald-300/90 leading-snug">
                            <strong>Recommended Action:</strong> {alert.action}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 5: MOUNTAIN CORRIDOR TELEMATICS */}
              {/* ============================================================== */}
              {activeTab === 'routes' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Mountain Corridor Telematics & Pass Reliability</span>
                    </h5>
                    <Badge variant="neutral" size="xs">
                      Fleet OTD: {logistics.on_time_delivery_rate || 96.2}%
                    </Badge>
                  </div>

                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                          <th className="p-3">Corridor / Mountain Pass</th>
                          <th className="p-3 text-right">Standard Transit</th>
                          <th className="p-3 text-right">Actual Transit</th>
                          <th className="p-3 text-right">Variance Delay</th>
                          <th className="p-3 text-right">On-Time Rate</th>
                          <th className="p-3 text-center">Corridor Condition</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {(logistics.corridors || []).map((corridor, idx) => (
                          <tr key={corridor.name || idx} className="hover:bg-slate-900/50 transition-colors">
                            <td className="p-3 font-semibold text-slate-200">{corridor.name}</td>
                            <td className="p-3 text-right font-numeric text-slate-400">{corridor.standard_hours}h</td>
                            <td className="p-3 text-right font-numeric text-amber-300 font-semibold">{corridor.actual_hours}h</td>
                            <td className="p-3 text-right font-numeric text-rose-400">+{corridor.delay_hours}h</td>
                            <td className="p-3 text-right font-numeric font-bold text-emerald-400">{corridor.otd_pct}%</td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-300 border border-slate-800">
                                {corridor.status.replace(/_/g, ' ')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 6: STRATEGIC RECOMMENDATIONS (HUMAN-IN-THE-LOOP) */}
              {/* ============================================================== */}
              {activeTab === 'recommendations' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Strategic AI Command Interventions & Human-in-the-Loop Actions</span>
                    </h5>
                    <Badge variant="brand" size="xs">
                      {recs.length} Actionable Recommendations
                    </Badge>
                  </div>

                  <div className="space-y-3.5">
                    {recs.map((rec, idx) => {
                      const isApproved = approvedRecs[idx];
                      return (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border transition-all space-y-3 ${
                            isApproved
                              ? 'bg-emerald-950/30 border-emerald-800/80 shadow-xs'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  rec.priority === 'URGENT'
                                    ? 'bg-rose-950/90 text-rose-300 border border-rose-800/80'
                                    : rec.priority === 'HIGH'
                                    ? 'bg-amber-950/90 text-amber-300 border border-amber-800/80'
                                    : 'bg-blue-950/90 text-blue-300 border border-blue-800/80'
                                }`}
                              >
                                {rec.priority}
                              </span>
                              <Badge variant="neutral" size="xs">
                                {rec.category}
                              </Badge>
                              <h6 className="text-sm font-bold text-white">{rec.title}</h6>
                            </div>

                            <div className="flex items-center gap-2">
                              {rec.requires_human_review && (
                                <Badge variant="warning" size="xs">
                                  Human Sign-off Required
                                </Badge>
                              )}
                              <Button
                                variant={isApproved ? 'success' : 'outline'}
                                size="xs"
                                leftIcon={isApproved ? Check : ShieldCheck}
                                onClick={() => toggleApproveRec(idx)}
                              >
                                {isApproved ? 'Action Signed Off' : 'Approve Intervention'}
                              </Button>
                            </div>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed">{rec.description}</p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase block">Target Logistics Node</span>
                              <span className="font-semibold text-indigo-300">{rec.target_node}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase block">Suggested Command Action</span>
                              <span className="font-semibold text-emerald-300">{rec.suggested_action}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* Digital Certification & Cryptographic Seal */}
              {/* ============================================================== */}
              <div className="border-t border-slate-800 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Algorithmic Integrity & Telematics Verification
                  </span>
                  <p className="text-xs text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{cert.system_engine || 'LogiPredict AI Telematics & Predictive Decision Engine v2.4'}</span>
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono break-all">
                    {cert.hash || 'SHA256:8f4c2b9a71d8e03e5c9a1b4f6d7e8c0a3b2e1f9a8d7c6b5a4e3f2d1c0b9a8f7e'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Certifying Logistics Command Officer
                    </span>
                    <p className="text-xs font-bold text-slate-100 mt-0.5">
                      {cert.certifying_officer || 'Col. V. K. Sharma, SM'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {cert.designation || 'Staff Officer (Logistics), HQ Northern Command'}
                    </p>
                  </div>
                  <p className="text-[10px] text-emerald-400 font-mono font-bold mt-2">
                    [{cert.status || 'DIGITALLY VERIFIED'}]
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ==================================================================== */}
        {/* Modal Footer Controls */}
        {/* ==================================================================== */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={FileSpreadsheet}
              onClick={handleExportAllCsv}
              isLoading={isExportingCsv}
              loadingText="Exporting CSVs..."
            >
              Export Telemetry CSVs
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={Download}
              onClick={handleDownloadJson}
            >
              Export JSON Audit
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={ExternalLink}
              onClick={handleOpenHtml}
            >
              Printable HTML View
            </Button>
          </div>

          <Button variant="primary" size="sm" onClick={onClose}>
            Acknowledge & Close Briefing
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DemoReportModal;
