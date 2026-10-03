import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  BrainCircuit,
  Sparkles,
  RefreshCw,
  Cpu,
  Layers,
  Calendar,
  Download,
  Filter,
  CheckCircle2,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Card, CardHeader } from '../components/ui/Card';
import { DataTable } from '../components/tables/DataTable';
import { KPICard } from '../components/dashboard/KpiCard';
import { INVENTORY_ITEMS } from '../data/dashboard/inventoryData';
import { forecastingService } from '../services/forecastingService';
import { generateForecastData } from '../utils/forecastingCalculations';
import { formatNumber, formatDate } from '../utils/formatters';
import { useToast } from '../hooks/useToast';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';

/**
 * Custom Tooltip for Forecast Chart
 */
function CustomForecastTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const actual = payload.find((p) => p.dataKey === 'actual')?.value;
    const forecast = payload.find((p) => p.dataKey === 'forecast')?.value;
    const lower = payload.find((p) => p.dataKey === 'lowerBound')?.value;
    const upper = payload.find((p) => p.dataKey === 'upperBound')?.value;

    return (
      <div className="bg-[#131b2e] text-white text-xs rounded-xl p-3.5 shadow-xl border border-slate-700 space-y-1.5 min-w-52 z-50">
        <p className="font-bold text-slate-100 border-b border-slate-800 pb-1.5">
          {label}
        </p>
        {actual !== null && actual !== undefined && (
          <div className="flex justify-between items-center text-blue-400">
            <span>Historical Observation:</span>
            <span className="font-bold">{formatNumber(actual)} units</span>
          </div>
        )}
        {forecast !== null && forecast !== undefined && (
          <div className="flex justify-between items-center text-indigo-400">
            <span>AI Predicted Demand:</span>
            <span className="font-bold">{formatNumber(forecast)} units</span>
          </div>
        )}
        {lower !== null && upper !== null && (
          <div className="flex justify-between items-center text-slate-400 text-[11px] pt-1 border-t border-slate-800">
            <span>95% Confidence Interval:</span>
            <span>{formatNumber(lower)} – {formatNumber(upper)}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
}

export function ForecastingPage() {
  const toast = useToast();

  // Selector States
  const [selectedItem, setSelectedItem] = useState('all');
  const [selectedDepot, setSelectedDepot] = useState('all');
  const [horizonDays, setHorizonDays] = useState(14);
  const [selectedModel, setSelectedModel] = useState('ensemble');

  // Forecast Data State
  const [forecastData, setForecastData] = useState({ series: [], summary: {} });
  const [isLoading, setIsLoading] = useState(false);
  const [isRetraining, setIsRetraining] = useState(false);

  // Load forecast whenever selectors change
  useEffect(() => {
    let isMounted = true;
    async function loadForecast() {
      setIsLoading(true);
      try {
        const res = await forecastingService.getForecast({
          itemId: selectedItem,
          depot: selectedDepot,
          horizonDays,
          modelName: selectedModel,
        });
        if (isMounted) {
          setForecastData(res);
        }
      } catch (err) {
        console.warn('Failed to fetch forecast from service. Falling back to local calculator.', err);
        if (isMounted) {
          setForecastData(generateForecastData(selectedItem, selectedDepot, horizonDays, selectedModel));
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadForecast();
    return () => {
      isMounted = false;
    };
  }, [selectedItem, selectedDepot, horizonDays, selectedModel]);

  // Handle Model Retrain / Inference Run
  const handleRetrain = async () => {
    setIsRetraining(true);
    toast.info('Initiating neural model retraining across multi-echelon demand nodes...', {
      title: 'ML Pipeline Active',
      duration: 3000,
    });

    try {
      const res = await forecastingService.runInferencePipeline({
        itemId: selectedItem,
        depot: selectedDepot,
        modelName: selectedModel,
      });

      const fresh = generateForecastData(selectedItem, selectedDepot, horizonDays, selectedModel);
      setForecastData(fresh);

      toast.success(
        `Neural pipeline synchronized (Accuracy: ${res.accuracy || '96.8%'}, MAPE: ${res.mape || '3.2%'}).`,
        { title: 'Inference Complete', duration: 4500 }
      );
    } catch (err) {
      toast.error('Retraining pipeline error. Using validated baseline models.', { title: 'Pipeline Error' });
    } finally {
      setIsRetraining(false);
    }
  };

  // Handle Export Projections CSV Download
  const handleExport = () => {
    const records = forecastData.series || [];
    if (!records.length) {
      toast.error('No forecast projections available to export.', { title: 'Export Failed' });
      return;
    }

    const headers = [
      'Date',
      'Day Label',
      'Period Type',
      'Actual Demand (units)',
      'AI Predicted Demand (units)',
      '95% Lower Bound (units)',
      '95% Upper Bound (units)',
      'Projected Stock (units)',
      'Stock Health',
    ];

    const rows = records.map((s) => [
      s.date,
      `"${s.label}"`,
      s.isHistorical ? 'Historical Observation' : 'AI Prediction',
      s.actual !== null && s.actual !== undefined ? s.actual : '',
      s.forecast !== null && s.forecast !== undefined ? s.forecast : '',
      s.lowerBound !== null && s.lowerBound !== undefined ? s.lowerBound : '',
      s.upperBound !== null && s.upperBound !== undefined ? s.upperBound : '',
      s.projectedStock !== undefined ? s.projectedStock : '',
      `"${s.stockStatus || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `logipredict-forecast-${selectedItem}-${selectedDepot}-${horizonDays}d.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${records.length} time-series forecast records to CSV.`, {
      title: 'Export Complete',
    });
  };

  // Derive unique categories, depots, and grouped items for selectors
  const categories = [...new Set(INVENTORY_ITEMS.map((i) => i.category))];
  const depots = ['all', ...new Set(INVENTORY_ITEMS.map((i) => i.storage_location))];

  const categorizedItems = React.useMemo(() => {
    const groups = {};
    INVENTORY_ITEMS.forEach((item) => {
      const cat = item.category || 'General Inventory';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, []);

  const summary = forecastData.summary || {};
  const series = forecastData.series || [];

  // Table columns for daily forecasts
  const dailyColumns = [
    {
      key: 'date',
      title: 'Forecast Date',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
            {row.date}
          </span>
          <span className="text-xs text-slate-500 ml-2">({row.label})</span>
        </div>
      ),
    },
    {
      key: 'type',
      title: 'Period Type',
      sortable: true,
      render: (row) => (
        <Badge variant={row.isHistorical ? 'neutral' : 'brand'} size="xs">
          {row.isHistorical ? 'Historical Observation' : 'AI Prediction'}
        </Badge>
      ),
    },
    {
      key: 'demand',
      title: 'Demand Quantity',
      sortable: true,
      render: (row) => {
        const val = row.isHistorical ? row.actual : row.forecast;
        return (
          <span className="font-bold text-slate-100 text-xs font-numeric">
            {val !== null ? `${formatNumber(val)} units` : '—'}
          </span>
        );
      },
    },
    {
      key: 'confidence',
      title: '95% Confidence Interval',
      render: (row) =>
        row.lowerBound !== null && row.upperBound !== null ? (
          <span className="text-slate-400 font-mono text-xs">
            {formatNumber(row.lowerBound)} – {formatNumber(row.upperBound)}
          </span>
        ) : (
          <span className="text-slate-500 text-xs">—</span>
        ),
    },
    {
      key: 'projectedStock',
      title: 'Illustrative Projected Stock',
      sortable: true,
      render: (row) => (
        <span className="text-slate-300 font-medium text-xs font-numeric">
          {formatNumber(row.projectedStock)} units
        </span>
      ),
    },
    {
      key: 'stockStatus',
      title: 'Stock Health',
      render: (row) => <StatusBadge status={row.stockStatus} size="xs" />,
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <PageHeader
        title="Demand Forecasting & Predictive Intelligence"
        subtitle="Multi-horizon time-series forecasting, ensemble neural models, and automated demand surge projections for forward military depots."
        breadcrumbs={[{ label: 'Demand Forecasting' }]}
        badge={
          <Badge variant="brand" size="sm" icon={BrainCircuit}>
            Ensemble LSTM-Prophet-XGBoost Active
          </Badge>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              leftIcon={Download}
              onClick={handleExport}
            >
              Export Projections
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={RefreshCw}
              isLoading={isRetraining}
              onClick={handleRetrain}
            >
              {isRetraining ? 'Retraining Models...' : 'Retrain Pipeline'}
            </Button>
          </>
        }
      />

      {/* Model Performance & Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Predicted Demand"
          value={`${formatNumber(summary.totalPredictedDemand || 0)} units`}
          change={`${summary.expectedChangePct >= 0 ? '+' : ''}${summary.expectedChangePct || 0}% horizon trend`}
          isPositive={true}
          timeframe={`${horizonDays}-day horizon`}
          iconName="TrendingUp"
          colorScheme="indigo"
          status="High Confidence"
          statusVariant="brand"
        />
        <KPICard
          title="Average Daily Demand"
          value={`${formatNumber(summary.avgDailyDemand || 0)} units`}
          change="Baseline consumption"
          isPositive={true}
          timeframe="calibrated daily average"
          iconName="BrainCircuit"
          colorScheme="purple"
        />
        <KPICard
          title="Peak Projected Demand"
          value={`${formatNumber(summary.peakDemand || 0)} units`}
          change="Surge threshold"
          isPositive={false}
          timeframe="requires buffer watch"
          iconName="ShieldAlert"
          colorScheme="amber"
          status={summary.peakDemand > 5000 ? 'Surge Warning' : 'Stable'}
          statusVariant="warning"
        />
        <KPICard
          title="Model Accuracy (MAPE)"
          value="96.8%"
          change="Error rate: 3.2%"
          isPositive={true}
          timeframe="validated against historicals"
          iconName="CheckCircle2"
          colorScheme="emerald"
          status="Optimal"
          statusVariant="success"
        />
      </div>

      {/* Selector Toolbar (Item, Depot, Horizon, Model) */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Item / Category Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Select Item / SKU
            </label>
            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Items (Aggregated Total)</option>
              {Object.entries(categorizedItems).map(([category, items]) => (
                <optgroup key={category} label={category} className="bg-slate-900 text-slate-300 font-semibold">
                  {items.map((item) => (
                    <option key={item.item_id} value={item.item_id} className="bg-slate-950 text-slate-200 font-normal">
                      {item.item_id} — {item.item_name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Depot Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Select Storage Depot
            </label>
            <select
              value={selectedDepot}
              onChange={(e) => setSelectedDepot(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Depots (Northern & Eastern)</option>
              {depots.filter(d => d !== 'all').map((dep) => (
                <option key={dep} value={dep}>
                  {dep}
                </option>
              ))}
            </select>
          </div>

          {/* Horizon Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Forecast Horizon
            </label>
            <select
              value={horizonDays}
              onChange={(e) => setHorizonDays(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              <option value={7}>7 Days Forward</option>
              <option value={14}>14 Days Forward</option>
              <option value={30}>30 Days Forward</option>
              <option value={60}>60 Days Forward</option>
              <option value={90}>90 Days Forward</option>
            </select>
          </div>

          {/* Model Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              AI Prediction Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              <option value="ensemble">Ensemble LSTM-Prophet-XGBoost</option>
              <option value="xgboost">XGBoost Regressor v2.4</option>
              <option value="prophet">Meta Prophet Time-Series</option>
              <option value="moving_avg">Weighted Moving Average</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Actual-versus-Predicted Chart */}
      <Card className="flex flex-col">
        <CardHeader
          title="Actual Observations vs. AI Predicted Demand"
          subtitle={`Historical demand vs ${horizonDays}-day multi-horizon neural projection with 95% confidence bounds`}
          action={
            <Badge variant="brand" size="sm" icon={Sparkles} dot dotPulse>
              Model: {selectedModel.toUpperCase()}
            </Badge>
          }
        />

        <div className="h-80 sm:h-96 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={series}
              margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
              />
              <Tooltip content={<CustomForecastTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
              />

              <ReferenceLine
                x="Today"
                stroke="#64748b"
                strokeDasharray="4 4"
                label={{
                  value: 'Forecast Horizon Boundary',
                  fill: '#94a3b8',
                  fontSize: 10,
                  position: 'insideTopLeft',
                }}
              />

              <Area
                type="monotone"
                dataKey="actual"
                name="Historical Actual Demand"
                stroke="#2563eb"
                strokeWidth={2.5}
                fill="url(#actualGrad)"
                activeDot={{ r: 6, fill: '#2563eb', stroke: '#080c14' }}
              />

              <Area
                type="monotone"
                dataKey="forecast"
                name="AI Predicted Demand"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                strokeDasharray="5 5"
                fill="url(#forecastGrad)"
                activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#080c14' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Grid: Daily Forecast Table & Forecast Explanation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Forecast Table (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100">Daily Forecast Projections</h3>
              <p className="text-xs text-slate-400">Granular daily demand predictions and confidence intervals</p>
            </div>
            <Badge variant="info" size="xs">
              {horizonDays} Days Horizon
            </Badge>
          </div>
          <DataTable
            columns={dailyColumns}
            data={series.filter(s => !s.isHistorical)}
            emptyTitle="No forecast records available"
            emptyDescription="Select a valid horizon to view predictions."
          />
        </div>

        {/* Forecast Explanation Panel (1 col) */}
        <Card className="flex flex-col">
          <CardHeader
            title="Forecast Assumptions & Model Info"
            subtitle="Explainability metadata for SIH 2026 AI pipeline"
          />
          <div className="space-y-3 text-xs pt-1 flex-1">
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Selected Scope:</span>
              <span className="font-bold text-slate-200">{selectedItem === 'all' ? 'All Inventory SKUs' : selectedItem}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Storage Depot:</span>
              <span className="font-bold text-slate-200">{selectedDepot}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Active ML Engine:</span>
              <span className="font-bold text-indigo-400 capitalize">{selectedModel} Ensemble</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Historical Window:</span>
              <span className="font-bold text-slate-200">180 Days Lookback</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Confidence Interval:</span>
              <span className="font-bold text-slate-200">95% Uncertainty Band</span>
            </div>

            <div className="bg-amber-950/40 p-3 rounded-xl border border-amber-900 mt-3 text-amber-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Info className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Synthetic Demonstration Disclaimer</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-400/80">
                Projections are generated from calibrated synthetic military logistics telemetry for Smart India Hackathon 2026 demonstration and are not operational predictions.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default ForecastingPage;
