import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  RefreshCw,
  TrendingUp,
  PieChart,
  ShieldCheck,
  Building2,
  Package,
  Layers,
  Sparkles,
  Printer,
  ChevronDown,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader } from '../components/ui/Card';
import { KPICard } from '../components/dashboard/KpiCard';
import {
  InventoryTrendAnalyticsChart,
  ForecastAccuracyChart,
  StockoutRiskMatrixChart,
  ReplenishmentLifecycleChart,
  CorridorTelematicsChart,
  AuditReportModal,
  DemoReportModal,
} from '../components/analytics';
import {
  analyticsDataService,
  DEPOT_OPTIONS,
  CATEGORY_OPTIONS,
  TIMEFRAME_OPTIONS,
} from '../data/analytics/analyticsDataService';
import { SkeletonCard, SkeletonChart } from '../components/feedback/Skeleton';

const REPORT_TEMPLATES = [
  {
    id: 'REP-01',
    title: 'Forward Inventory Status & Multi-Echelon Stock Telemetry',
    description: 'Comprehensive stock levels, burn rates, days of cover, safety thresholds, and valuation across active filters.',
    type: 'CSV Data Export',
    frequency: 'Live Synchronized',
    lastGenerated: 'Live Query',
    actionKey: 'inventory_csv',
  },
  {
    id: 'REP-02',
    title: 'AI Demand Forecast MAPE & Neural Confidence Intervals',
    description: 'Historical and forward demand projections, residual errors, and 95% upper/lower confidence bounds.',
    type: 'CSV Data Export',
    frequency: '7-Day / 14-Day Horizon',
    lastGenerated: 'Live Inference',
    actionKey: 'forecasts_csv',
  },
  {
    id: 'REP-03',
    title: 'Predictive Anomaly Alerts & Early Warning Log',
    description: 'Critical stockout risks, lead-time spikes, anomaly triggers, and automated intervention actions.',
    type: 'CSV Data Export',
    frequency: 'Continuous Stream',
    lastGenerated: 'Live Telemetry',
    actionKey: 'alerts_csv',
  },
  {
    id: 'REP-04',
    title: 'HQ Northern Command Master Readiness Briefing (Demo Report)',
    description: 'High-level executive briefing combining multi-echelon readiness, neural forecasts, convoy OTD, and human-in-the-loop actions.',
    type: 'Executive Briefing / HTML / PDF',
    frequency: 'On Demand',
    lastGenerated: 'Certified v2.4',
    actionKey: 'demo_report',
  },
];

export function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState('7d');
  const [selectedDepot, setSelectedDepot] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [overviewData, setOverviewData] = useState(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  // Individual export loading states
  const [exportingType, setExportingType] = useState(null); // 'inventory' | 'forecasts' | 'alerts' | null


  // Data fetching handler
  const fetchAnalyticsOverview = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const params = {
        timeframe,
        depot_id: selectedDepot !== 'all' ? selectedDepot : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        start_date: timeframe === 'custom' && customStartDate ? customStartDate : undefined,
        end_date: timeframe === 'custom' && customEndDate ? customEndDate : undefined,
      };

      const data = await analyticsDataService.getOverview(params);
      setOverviewData(data);
    } catch (err) {
      console.error('[AnalyticsPage] Failed to load analytics overview:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [timeframe, selectedDepot, selectedCategory, customStartDate, customEndDate]);

  useEffect(() => {
    fetchAnalyticsOverview();
  }, [fetchAnalyticsOverview]);

  // Phase 9.2 Specialized CSV Export Handlers
  const handleDownloadInventoryCsv = async () => {
    setExportingType('inventory');
    try {
      await analyticsDataService.downloadInventoryCsv({
        timeframe,
        depot_id: selectedDepot !== 'all' ? selectedDepot : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
      });
    } catch (err) {
      console.error('[AnalyticsPage] Failed to export inventory CSV:', err);
    } finally {
      setExportingType(null);
    }
  };

  const handleDownloadForecastsCsv = async () => {
    setExportingType('forecasts');
    try {
      await analyticsDataService.downloadForecastsCsv({
        timeframe,
        depot_id: selectedDepot !== 'all' ? selectedDepot : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
      });
    } catch (err) {
      console.error('[AnalyticsPage] Failed to export forecasts CSV:', err);
    } finally {
      setExportingType(null);
    }
  };

  const handleDownloadAlertsCsv = async () => {
    setExportingType('alerts');
    try {
      await analyticsDataService.downloadAlertsCsv({
        depot_id: selectedDepot !== 'all' ? selectedDepot : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
      });
    } catch (err) {
      console.error('[AnalyticsPage] Failed to export alerts CSV:', err);
    } finally {
      setExportingType(null);
    }
  };

  // General Export handlers
  const handleExportCsv = () => {
    if (!overviewData) return;
    const csvContent = analyticsDataService.exportToCsv(overviewData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `logipredict_analytics_${timeframe}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJson = () => {
    if (!overviewData) return;
    const jsonContent = analyticsDataService.exportToJson(overviewData);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `logipredict_analytics_${timeframe}_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTemplate = (template) => {
    if (template.actionKey === 'inventory_csv') {
      handleDownloadInventoryCsv();
    } else if (template.actionKey === 'forecasts_csv') {
      handleDownloadForecastsCsv();
    } else if (template.actionKey === 'alerts_csv') {
      handleDownloadAlertsCsv();
    } else if (template.actionKey === 'demo_report' || template.id === 'REP-04') {
      setIsDemoModalOpen(true);
    } else if (template.type.includes('JSON')) {
      handleExportJson();
    } else {
      handleExportCsv();
    }
  };

  const kpiList = overviewData?.kpis || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <PageHeader
        title="Executive Analytics & Strategic Intelligence"
        subtitle="Forward supply chain cost audits, multi-echelon telemetry, neural forecast diagnostics, and military compliance reports."
        breadcrumbs={[{ label: 'Analytics' }]}
        badge={
          <Badge variant="brand" size="sm" icon={Sparkles} dot dotPulse>
            Northern Command AI Auditing Active
          </Badge>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={() => fetchAnalyticsOverview(true)}
              disabled={isRefreshing}
              className={isRefreshing ? 'animate-spin' : ''}
            >
              Refresh
            </Button>
            <Button
              variant="brand"
              size="sm"
              icon={Sparkles}
              onClick={() => setIsDemoModalOpen(true)}
            >
              Master Demo Briefing
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={FileText}
              onClick={() => setIsAuditModalOpen(true)}
            >
              Form 48-A Audit
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={FileSpreadsheet}
              onClick={handleDownloadInventoryCsv}
              isLoading={exportingType === 'inventory'}
              loadingText="Inventory..."
            >
              Inventory CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={FileSpreadsheet}
              onClick={handleDownloadForecastsCsv}
              isLoading={exportingType === 'forecasts'}
              loadingText="Forecasts..."
            >
              Forecasts CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={FileSpreadsheet}
              onClick={handleDownloadAlertsCsv}
              isLoading={exportingType === 'alerts'}
              loadingText="Alerts..."
            >
              Alerts CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              onClick={handleExportJson}
            >
              Export JSON
            </Button>
          </div>
        }
      />

      {/* Control Bar: Timeframe, Echelon Depots & Category Filters */}
      <Card className="p-3 sm:p-4 bg-slate-900/90 border border-slate-800">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Timeframe selector pills */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 overflow-x-auto">
            {TIMEFRAME_OPTIONS.map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  timeframe === tf.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Custom Date Range Picker (visible only when timeframe is custom) */}
          {timeframe === 'custom' && (
            <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
              <Calendar className="w-4 h-4 text-slate-400 ml-1" />
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1"
                placeholder="Start Date"
              />
              <span className="text-slate-500 text-xs">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1"
                placeholder="End Date"
              />
            </div>
          )}

          {/* Depot & Category Select Dropdowns */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={selectedDepot}
                onChange={(e) => setSelectedDepot(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 bg-slate-950/90 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-medium text-slate-200 appearance-none cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              >
                {DEPOT_OPTIONS.map((depot) => (
                  <option key={depot.id} value={depot.id} className="bg-slate-900 text-slate-200">
                    {depot.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative flex-1 sm:w-52">
              <Package className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 bg-slate-950/90 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-medium text-slate-200 appearance-none cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-slate-900 text-slate-200">
                    {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </Card>

      {/* 6 Core Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          kpiList.map((kpi) => (
            <KPICard
              key={kpi.id}
              title={kpi.title}
              value={kpi.value}
              change={kpi.change}
              isPositive={kpi.is_positive ?? kpi.isPositive}
              timeframe={kpi.timeframe}
              description={kpi.description}
              status={kpi.status}
              statusVariant={kpi.status_variant ?? kpi.statusVariant}
              iconName={kpi.icon_name ?? kpi.iconName}
              colorScheme={kpi.color_scheme ?? kpi.colorScheme}
            />
          ))
        )}
      </div>

      {/* Row 1: Multi-Echelon Inventory Trends & Demand Forecast Accuracy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InventoryTrendAnalyticsChart
          trendsData={overviewData?.inventory_trends}
          isLoading={isLoading}
        />
        <ForecastAccuracyChart
          accuracyData={overviewData?.forecast_accuracy}
          isLoading={isLoading}
        />
      </div>

      {/* Row 2: Stockout Risk Matrix & Replenishment Lifecycle */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StockoutRiskMatrixChart
          riskData={overviewData?.stockout_risks}
          isLoading={isLoading}
        />
        <ReplenishmentLifecycleChart
          replenishmentData={overviewData?.replenishment_summary}
          isLoading={isLoading}
        />
      </div>

      {/* Row 3: Convoy Corridor Telematics Full Width */}
      <div>
        <CorridorTelematicsChart
          deliveryData={overviewData?.delivery_performance}
          isLoading={isLoading}
        />
      </div>

      {/* Available Audit & Analytics Reports Section */}
      <Card>
        <CardHeader
          title="Standard Military Logistics Audit Reports & Data Packages"
          subtitle="Generate instant on-demand telemetry records, automated PDF/CSV audits, or HQ Northern Command briefing packages"
          action={
            <Badge variant="brand" size="xs" icon={ShieldCheck}>
              Verified Form 48-A Compliant
            </Badge>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {REPORT_TEMPLATES.map((rep) => (
            <div
              key={rep.id}
              className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/60 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-[11px] font-bold text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {rep.id}
                  </span>
                  <Badge variant="neutral" size="xs">
                    {rep.frequency}
                  </Badge>
                </div>

                <h4 className="text-sm font-bold text-slate-100 leading-snug">
                  {rep.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {rep.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>
                  Format: <strong className="text-slate-300">{rep.type}</strong>
                </span>
                <Button
                  variant="outline"
                  size="xs"
                  leftIcon={Download}
                  onClick={() => handleDownloadTemplate(rep)}
                >
                  Generate
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Form 48-A Military Audit Modal */}
      <AuditReportModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        overviewData={overviewData}
        onExportCsv={handleExportCsv}
        onExportJson={handleExportJson}
      />

      {/* Master Demo Report Modal (Phase 9.2) */}
      <DemoReportModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        timeframe={timeframe}
        selectedDepot={selectedDepot}
        selectedCategory={selectedCategory}
      />
    </div>
  );
}

export default AnalyticsPage;
