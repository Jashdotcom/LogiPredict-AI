import React, { useState, useEffect, useMemo } from 'react';
import {
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  CloudSnow,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Layers,
  BarChart2,
  CheckCircle2,
  Truck,
  PackageCheck,
  Clock,
  Navigation,
  ShieldCheck,
  AlertOctagon,
  ArrowRight,
  Calendar,
  Filter,
  RefreshCw,
  Zap,
  Info,
  ExternalLink,
  ChevronRight,
  Flame,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader } from '../components/ui/Card';
import { KPICard } from '../components/dashboard/KpiCard';
import { simulationApi } from '../services/apiClient';
import {
  PRESET_SCENARIOS,
  MOCK_BASELINES,
  runLocalSimulation,
} from '../data/simulation/simulationDataService';
import { formatNumber } from '../utils/formatters';

/**
 * Custom Tooltip for Simulation Trajectory Graph
 */
function CustomSimulationTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-[#131b2e] text-white text-xs rounded-xl p-3.5 shadow-2xl border border-slate-700 space-y-2 min-w-56 z-50">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
          <span className="font-bold text-slate-100">
            Day {data.day} ({data.date})
          </span>
          {data.unmet_demand > 0 ? (
            <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-1.5 py-0.5 rounded font-bold">
              Stockout Deficit
            </span>
          ) : (
            <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-bold">
              Buffers Safe
            </span>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center text-blue-400">
            <span>Baseline On-Hand:</span>
            <span className="font-bold font-mono">
              {formatNumber(data.baseline_stock)}
            </span>
          </div>
          <div className="flex justify-between items-center text-purple-300">
            <span>Simulated On-Hand:</span>
            <span className="font-bold font-mono">
              {formatNumber(data.simulated_stock)}
            </span>
          </div>
          <div className="flex justify-between items-center text-amber-400/90 text-[11px]">
            <span>Safety Threshold (25%):</span>
            <span className="font-mono">
              {formatNumber(data.safety_threshold)}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-400 text-[11px] pt-1 border-t border-slate-800">
            <span>Simulated Daily Demand:</span>
            <span className="font-mono">
              {formatNumber(data.simulated_demand)}
            </span>
          </div>
          {data.unmet_demand > 0 && (
            <div className="flex justify-between items-center text-rose-400 font-bold text-[11px]">
              <span>Unmet Deficit Today:</span>
              <span className="font-mono">
                {formatNumber(data.unmet_demand)} units
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}

export function SimulationsPage() {
  // State for Presets & Baseline Metadata
  const [presetScenarios, setPresetScenarios] = useState(PRESET_SCENARIOS);
  const [selectedPresetId, setSelectedPresetId] = useState('SCN-WINTER-01');

  // Simulation Parameters State
  const [simulationName, setSimulationName] = useState(
    'Tactical Forward Logistics Disruption Run'
  );
  const [durationDays, setDurationDays] = useState(30);
  const [demandSurgePercentage, setDemandSurgePercentage] = useState(35);
  const [leadTimeDilationDays, setLeadTimeDilationDays] = useState(8);
  const [inventoryChangePercentage, setInventoryChangePercentage] = useState(0);
  const [routeDisruptionPreset, setRouteDisruptionPreset] =
    useState('zoji_la_blizzard');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Execution & Output State
  const [isRunning, setIsRunning] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [isBackendConnected, setIsBackendConnected] = useState(true);
  const [lastExecutedParams, setLastExecutedParams] = useState(null);
  const [activeTab, setActiveTab] = useState('comparison'); // 'comparison' | 'trajectory' | 'recommendations' | 'routes'

  // Load initial baseline / scenarios on mount
  useEffect(() => {
    async function loadScenarios() {
      try {
        const response = await simulationApi.listScenarios();
        if (Array.isArray(response) && response.length > 0) {
          setPresetScenarios(response);
          setIsBackendConnected(true);
        }
      } catch (err) {
        console.warn(
          'Using client-side simulation presets fallback:',
          err.message
        );
        setIsBackendConnected(false);
        setPresetScenarios(PRESET_SCENARIOS);
      }
    }
    loadScenarios();

    // Auto-run initial nominal or winter simulation on mount
    const initialRun = runLocalSimulation({
      simulation_name: 'Initial Tactical Disruption Baseline',
      duration_days: 30,
      demand_surge_percentage: 35,
      lead_time_dilation_days: 8,
      inventory_change_percentage: 0,
      route_disruption_preset: 'zoji_la_blizzard',
      selected_category: 'All',
      scenario_preset: 'SCN-WINTER-01',
    });
    setSimulationResult(initialRun);
    setLastExecutedParams({
      demandSurgePercentage: 35,
      leadTimeDilationDays: 8,
      inventoryChangePercentage: 0,
    });
  }, []);

  // Handle selecting a threat scenario preset
  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setDemandSurgePercentage(preset.demand_surge_percentage ?? 0);
    setLeadTimeDilationDays(preset.lead_time_dilation_days ?? 0);
    setInventoryChangePercentage(preset.inventory_change_percentage ?? 0);
    setRouteDisruptionPreset(preset.route_disruption_preset || 'none');
    setSimulationName(`Sim: ${preset.name}`);
  };

  // Run the Simulation (Backend with Client Fallback)
  const handleRunSimulation = async () => {
    setIsRunning(true);

    const payload = {
      simulation_name:
        simulationName || 'Tactical Forward Disruption Simulation',
      duration_days: Number(durationDays),
      demand_surge_percentage: Number(demandSurgePercentage),
      lead_time_dilation_days: Number(leadTimeDilationDays),
      inventory_change_percentage: Number(inventoryChangePercentage),
      route_disruption_preset:
        routeDisruptionPreset === 'none' ? null : routeDisruptionPreset,
      selected_category: selectedCategory,
      scenario_preset: selectedPresetId,
      random_seed: 42,
    };

    try {
      const result = await simulationApi.runSimulation(payload);
      setSimulationResult(result);
      setIsBackendConnected(true);
    } catch (err) {
      console.warn(
        'Backend simulation call failed, executing local discrete-event model:',
        err.message
      );
      setIsBackendConnected(false);
      // Execute local high-fidelity simulation engine
      const localResult = runLocalSimulation(payload);
      setSimulationResult(localResult);
    } finally {
      setIsRunning(false);
      setLastExecutedParams({
        demandSurgePercentage,
        leadTimeDilationDays,
        inventoryChangePercentage,
      });
    }
  };

  // Reset parameters to peacetime nominal baseline
  const handleReset = () => {
    setSelectedPresetId('SCN-PEACETIME-00');
    setDemandSurgePercentage(0);
    setLeadTimeDilationDays(0);
    setInventoryChangePercentage(0);
    setRouteDisruptionPreset('none');
    setDurationDays(30);
    setSelectedCategory('All');
    setSimulationName('Peacetime Nominal Operational Baseline');

    const nominalResult = runLocalSimulation({
      simulation_name: 'Peacetime Nominal Operational Baseline',
      duration_days: 30,
      demand_surge_percentage: 0,
      lead_time_dilation_days: 0,
      inventory_change_percentage: 0,
      route_disruption_preset: null,
      selected_category: 'All',
      scenario_preset: 'SCN-PEACETIME-00',
    });
    setSimulationResult(nominalResult);
    setLastExecutedParams({
      demandSurgePercentage: 0,
      leadTimeDilationDays: 0,
      inventoryChangePercentage: 0,
    });
  };

  // 7-Dimension Comparative Metrics extracted safely
  const comparison = simulationResult?.comparison || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <PageHeader
        title="Forward Logistics Disruption Simulation Workspace"
        description="Stress-test high-altitude supply chain resilience against multi-factor disruptions, weather blockades, demand surges, and lead time dilations."
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Simulations' },
        ]}
        badge={
          <Badge
            variant={isBackendConnected ? 'purple' : 'neutral'}
            size="sm"
            icon={Sliders}
          >
            {isBackendConnected
              ? 'Discrete-Event Server Engine'
              : 'Local Discrete-Event Fallback'}
          </Badge>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={RotateCcw}
              onClick={handleReset}
              disabled={isRunning}
            >
              Reset Baseline
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={Play}
              isLoading={isRunning}
              loadingText="Simulating Discrete-Event Run..."
              onClick={handleRunSimulation}
            >
              Execute Simulation
            </Button>
          </div>
        }
      />

      {/* Top Level Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Logistics Resilience Score"
          value={
            simulationResult
              ? `${simulationResult.resilience_score}%`
              : '94.2%'
          }
          change={
            simulationResult && simulationResult.resilience_score < 70
              ? 'Severe Strain'
              : 'Nominal Runway'
          }
          trend={
            simulationResult && simulationResult.resilience_score < 75
              ? 'down'
              : 'up'
          }
          timeframe="tactical robustness index"
          iconName="ShieldAlert"
          colorScheme={
            simulationResult && simulationResult.resilience_score < 60
              ? 'rose'
              : simulationResult && simulationResult.resilience_score < 80
              ? 'amber'
              : 'emerald'
          }
          status={
            simulationResult && simulationResult.resilience_score >= 80
              ? 'Robust'
              : simulationResult && simulationResult.resilience_score >= 60
              ? 'Strained'
              : 'Compromised'
          }
          statusVariant={
            simulationResult && simulationResult.resilience_score >= 80
              ? 'success'
              : simulationResult && simulationResult.resilience_score >= 60
              ? 'warning'
              : 'danger'
          }
        />
        <KPICard
          title="Predicted Stockouts"
          value={
            simulationResult
              ? `${simulationResult.summary_metrics?.total_stockout_incidents ?? 0} FOBs`
              : '0 FOBs'
          }
          change={
            simulationResult?.summary_metrics?.total_stockout_incidents > 0
              ? `+${simulationResult.summary_metrics.total_stockout_incidents} critical`
              : 'Zero deficit'
          }
          trend={
            simulationResult?.summary_metrics?.total_stockout_incidents > 0
              ? 'down'
              : 'up'
          }
          timeframe="forward posts at risk"
          iconName="AlertOctagon"
          colorScheme={
            simulationResult?.summary_metrics?.total_stockout_incidents > 0
              ? 'rose'
              : 'indigo'
          }
        />
        <KPICard
          title="Unmet Demand Deficit"
          value={
            simulationResult
              ? `${formatNumber(simulationResult.summary_metrics?.total_unmet_demand_volume ?? 0)}`
              : '0'
          }
          change="Volume deficit"
          trend="down"
          timeframe="units unfulfilled"
          iconName="TrendingDown"
          colorScheme={
            simulationResult?.summary_metrics?.total_unmet_demand_volume > 0
              ? 'rose'
              : 'emerald'
          }
        />
        <KPICard
          title="Fleet Capacity Utilization"
          value={
            simulationResult
              ? `${simulationResult.summary_metrics?.average_fleet_capacity_utilization_percentage ?? 65}%`
              : '65%'
          }
          change={
            simulationResult?.summary_metrics
              ?.average_fleet_capacity_utilization_percentage > 85
              ? 'Near maximum'
              : 'Normal convoy'
          }
          trend="up"
          timeframe="heavy convoy fleet load"
          iconName="Truck"
          colorScheme="purple"
        />
      </div>

      {/* Main Workspace Grid: Controls & Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Disruption Scenario Presets */}
        <Card className="flex flex-col h-full">
          <CardHeader
            title="Threat Scenario Presets"
            subtitle="Select a pre-configured military logistics disruption profile"
          />
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[540px] pr-1">
            {presetScenarios.map((sc) => {
              const isSelected = selectedPresetId === sc.id;
              const isCritical = sc.severity === 'critical';
              const isWarning = sc.severity === 'warning';

              return (
                <div
                  key={sc.id}
                  onClick={() => handleSelectPreset(sc)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-indigo-950/50 border-indigo-500 ring-1 ring-indigo-500 shadow-md shadow-indigo-950/40'
                      : 'bg-slate-800/40 hover:bg-slate-800/80 border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-[11px] font-bold text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {sc.id}
                    </span>
                    <Badge
                      variant={
                        isCritical ? 'danger' : isWarning ? 'warning' : 'neutral'
                      }
                      size="xs"
                    >
                      {sc.category}
                    </Badge>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-slate-100 leading-snug">
                    {sc.name}
                  </h4>

                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {sc.description}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      Delay:{' '}
                      <strong className="text-slate-200">
                        {sc.lead_time_label || `+${sc.lead_time_dilation_days}d`}
                      </strong>
                    </span>
                    <span>
                      Surge:{' '}
                      <strong className="text-purple-300">
                        {sc.demand_surge_label || `+${sc.demand_surge_percentage}%`}
                      </strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Right 2 Columns: Multi-Factor Simulation Controls */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader
            title="Multi-Factor Disruption Controls"
            subtitle="Tune operational parameters to stress-test forward supply chain limits"
            action={
              <Badge variant="brand" size="xs" dot>
                {selectedPresetId}
              </Badge>
            }
          />

          <div className="space-y-6 pt-1 flex-1">
            {/* Control 1: Demand Change Slider (-50% to +150%) */}
            <div className="space-y-2 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <label className="font-semibold text-slate-200">
                    Demand Consumption Shift (% Surge / Reduction)
                  </label>
                </div>
                <span className="font-mono font-bold text-purple-300 bg-purple-950/80 px-2.5 py-0.5 rounded-lg border border-purple-800">
                  {demandSurgePercentage > 0
                    ? `+${demandSurgePercentage}%`
                    : `${demandSurgePercentage}%`}
                </span>
              </div>
              <input
                type="range"
                min="-50"
                max="150"
                step="5"
                value={demandSurgePercentage}
                onChange={(e) =>
                  setDemandSurgePercentage(parseInt(e.target.value, 10))
                }
                className="w-full accent-purple-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>-50% (Troop Drawdown)</span>
                <span>0% (Nominal Peacetime)</span>
                <span>+50% (Winter Build-up)</span>
                <span>+150% (Full Readiness Surge)</span>
              </div>
            </div>

            {/* Control 2: Supply Delay Slider (0 to 30 Days) */}
            <div className="space-y-2 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <label className="font-semibold text-slate-200">
                    Supply Line Dilation (Replenishment Delay in Days)
                  </label>
                </div>
                <span className="font-mono font-bold text-indigo-300 bg-indigo-950/80 px-2.5 py-0.5 rounded-lg border border-indigo-800">
                  +{leadTimeDilationDays} Days (Lead Time: {4 + leadTimeDilationDays}d)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={leadTimeDilationDays}
                onChange={(e) =>
                  setLeadTimeDilationDays(parseInt(e.target.value, 10))
                }
                className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0 Days (Normal Clear Corridors)</span>
                <span>7 Days (Severe Weather Lag)</span>
                <span>14 Days (Rail Bottleneck)</span>
                <span>30 Days (Complete Pass Closure)</span>
              </div>
            </div>

            {/* Control 3: Initial Inventory Change (-50% to +100%) */}
            <div className="space-y-2 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <label className="font-semibold text-slate-200">
                    Initial Forward Inventory Adjustment
                  </label>
                </div>
                <span className="font-mono font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-lg border border-emerald-800">
                  {inventoryChangePercentage > 0
                    ? `+${inventoryChangePercentage}%`
                    : `${inventoryChangePercentage}%`}
                </span>
              </div>
              <input
                type="range"
                min="-50"
                max="100"
                step="5"
                value={inventoryChangePercentage}
                onChange={(e) =>
                  setInventoryChangePercentage(parseInt(e.target.value, 10))
                }
                className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>-50% (Depleted Bunkers)</span>
                <span>0% (Standard Target Buffer)</span>
                <span>+50% (Winter Stocking Complete)</span>
                <span>+100% (Double Forward Stock)</span>
              </div>
            </div>

            {/* Control 4: Route Disruption Preset & Category Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-amber-400" />
                  Strategic Route Disruption Corridor
                </label>
                <select
                  value={routeDisruptionPreset}
                  onChange={(e) => setRouteDisruptionPreset(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="none">None (All Strategic Corridors Open)</option>
                  <option value="zoji_la_blizzard">
                    Zoji La Pass Blizzard (NH-1D Delayed +4.4h)
                  </option>
                  <option value="khardung_la_landslide">
                    Khardung La Avalanche (Pass Cutoff / Shyok Detour)
                  </option>
                  <option value="drass_artillery_threat">
                    Drass Axis Heightened Threat Corridor
                  </option>
                  <option value="winter_pass_closure">
                    All High Passes Closed (Winter Transit Protocol)
                  </option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-blue-400" />
                  Supply Category Filter
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="All">All Categories (25 SKUs)</option>
                  <option value="POL">POL (Diesel, Kerosene, Lubricants)</option>
                  <option value="Ammunition">Ammunition & Ordnance</option>
                  <option value="Rations">Combat Rations & Survival Meals</option>
                  <option value="Medical">High-Altitude Medical & Blood</option>
                  <option value="Cold Weather Gear">Cold Weather & Thermal Gear</option>
                  <option value="Spares">Tactical Vehicle Spares</option>
                </select>
              </div>
            </div>

            {/* Execute Banner */}
            <div className="pt-2 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Duration: <strong className="text-slate-200">{durationDays} Days</strong> | Horizon: Oct 03 - Nov 02, 2026
              </div>
              <Button
                variant="primary"
                size="md"
                leftIcon={Play}
                isLoading={isRunning}
                loadingText="Running Discrete-Event Simulation..."
                onClick={handleRunSimulation}
              >
                Execute Disruption Simulation
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Navigation Tabs for Results */}
      <div className="flex border-b border-slate-800 gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('comparison')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'comparison'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          7-Dimension Comparative Analysis
        </button>
        <button
          onClick={() => setActiveTab('trajectory')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'trajectory'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Stock Runout Trajectory Graph
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'recommendations'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Tactical Recommendations ({simulationResult?.recommendations?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('routes')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'routes'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Navigation className="w-4 h-4" />
          Corridor Route Impacts ({simulationResult?.route_impacts?.length || 0})
        </button>
      </div>

      {/* Tab 1: 7-Dimension Before-Versus-After Comparison */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          {/* Dynamic Impact Summary Callout */}
          <Card>
            <CardHeader
              title="Dynamic Operational Impact Summary"
              subtitle="Causal plain-English assessment synthesized from simulation differentials"
              action={
                <Badge
                  variant={
                    simulationResult?.resilience_score >= 80
                      ? 'success'
                      : simulationResult?.resilience_score >= 60
                      ? 'warning'
                      : 'danger'
                  }
                  size="xs"
                >
                  Resilience: {simulationResult?.resilience_score}%
                </Badge>
              }
            />
            <div className="space-y-2.5">
              {simulationResult?.impact_summary &&
              simulationResult.impact_summary.length > 0 ? (
                simulationResult.impact_summary.map((text, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-200 leading-relaxed"
                  >
                    <div className="p-1 rounded bg-slate-800 text-indigo-400 mt-0.5">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <span>{text}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 py-2">
                  No active disruptions detected. All forward supply lines operating within peacetime nominal limits.
                </div>
              )}
            </div>
          </Card>

          {/* 7-Dimension Comparative Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* 1. Inventory Levels */}
            <ComparisonMetricCard
              title="Ending Inventory Levels"
              dimensionKey="inventory_levels"
              point={comparison.inventory_levels}
              icon={Layers}
              colorScheme="purple"
            />

            {/* 2. Demand Forecasts */}
            <ComparisonMetricCard
              title="Total Demand Consumption"
              dimensionKey="demand_forecasts"
              point={comparison.demand_forecasts}
              icon={TrendingUp}
              colorScheme="purple"
            />

            {/* 3. Stock Coverage Days */}
            <ComparisonMetricCard
              title="Stock Coverage Runway"
              dimensionKey="stock_coverage_days"
              point={comparison.stock_coverage_days}
              icon={PackageCheck}
              colorScheme="emerald"
            />

            {/* 4. Predicted Stockouts */}
            <ComparisonMetricCard
              title="Predicted Stockout Outposts"
              dimensionKey="predicted_stockouts"
              point={comparison.predicted_stockouts}
              icon={AlertOctagon}
              colorScheme="rose"
            />

            {/* 5. Replenishment Requisitions */}
            <ComparisonMetricCard
              title="Required Resupply Orders"
              dimensionKey="replenishment_requisitions"
              point={comparison.replenishment_requisitions}
              icon={FileSpreadsheet}
              colorScheme="indigo"
            />

            {/* 6. Supply Delays (Lead Time) */}
            <ComparisonMetricCard
              title="Convoy Lead Time Delays"
              dimensionKey="supply_delays"
              point={comparison.supply_delays}
              icon={Clock}
              colorScheme="amber"
            />

            {/* 7. Route Travel Times */}
            <ComparisonMetricCard
              title="Corridor Transit Times"
              dimensionKey="route_travel_times"
              point={comparison.route_travel_times}
              icon={Truck}
              colorScheme="blue"
            />
          </div>
        </div>
      )}

      {/* Tab 2: Daily Trajectory Recharts Graph */}
      {activeTab === 'trajectory' && (
        <Card className="flex flex-col">
          <CardHeader
            title="30-Day On-Hand Inventory & Stockout Trajectory"
            subtitle="Comparing baseline daily on-hand drawdown against simulated disruption curve and safety buffer"
            action={
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">
                  Buffer Threshold: <strong className="text-amber-400">25%</strong>
                </span>
              </div>
            }
          />

          <div className="h-80 sm:h-96 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={simulationResult?.daily_trajectories || []}
                margin={{ top: 10, right: 15, left: -5, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="simStockGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="baseStockGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <RechartsTooltip content={<CustomSimulationTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                />

                {/* Safety Buffer Reference Line */}
                <ReferenceLine
                  y={35712}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Safety Stock Threshold (35.7k units)',
                    fill: '#fbbf24',
                    fontSize: 10,
                    position: 'insideTopLeft',
                  }}
                />

                {/* Baseline Inventory Curve */}
                <Line
                  type="monotone"
                  dataKey="baseline_stock"
                  name="Baseline On-Hand Stock"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />

                {/* Simulated Inventory Area Curve */}
                <Area
                  type="monotone"
                  dataKey="simulated_stock"
                  name="Simulated Stock (Stress-Tested)"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  fill="url(#simStockGrad)"
                  activeDot={{ r: 5, fill: '#8b5cf6' }}
                />

                {/* Unmet Demand Volume Bars */}
                <Bar
                  dataKey="unmet_demand"
                  name="Stockout Deficit Volume"
                  fill="#f43f5e"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={16}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
            <span className="flex items-center gap-1.5 text-purple-400 font-medium">
              <TrendingDown className="w-4 h-4 text-purple-400" />
              Drawdown accelerates significantly under +{demandSurgePercentage}% operational surge and +{leadTimeDilationDays}d delay.
            </span>
            <span>Simulation Horizon: 30 Discrete Days</span>
          </div>
        </Card>
      )}

      {/* Tab 3: Actionable Tactical Recommendations */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {simulationResult?.recommendations &&
            simulationResult.recommendations.length > 0 ? (
              simulationResult.recommendations.map((rec, idx) => (
                <Card key={idx} className="p-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {rec.recommendation_id}
                      </span>
                      <Badge
                        variant={
                          rec.urgency === 'Critical'
                            ? 'danger'
                            : rec.urgency === 'High'
                            ? 'warning'
                            : 'brand'
                        }
                        size="xs"
                      >
                        {rec.urgency} Priority
                      </Badge>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-100">
                        {rec.item_name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {rec.rationale}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <div>
                        <span className="text-slate-500 text-[10px] block">Origin Hub</span>
                        <span className="font-semibold text-slate-300">{rec.source_location_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Target Destination</span>
                        <span className="font-semibold text-indigo-400">{rec.target_location_name}</span>
                      </div>
                      <div className="mt-1">
                        <span className="text-slate-500 text-[10px] block">Order Dispatch Day</span>
                        <span className="font-semibold text-slate-300">Day T+{rec.recommended_order_day}</span>
                      </div>
                      <div className="mt-1">
                        <span className="text-slate-500 text-[10px] block">Quantity</span>
                        <span className="font-semibold text-emerald-400">
                          {formatNumber(rec.recommended_quantity)} {rec.unit_of_measurement}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      Est. Arrival: Day T+{rec.estimated_arrival_day}
                    </span>
                    <Button variant="primary" size="xs" rightIcon={ArrowRight}>
                      Approve Requisition
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-2 text-center p-8 text-xs text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800">
                No emergency replenishment or rerouting recommendations required under current parameters.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Route Corridor Impacts & Detours */}
      {activeTab === 'routes' && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Tactical Convoy Corridor Disruption Analysis"
              subtitle="Impact of simulated pass blockades, avalanches, and bypass detours"
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="pb-2.5 px-3">Corridor Name</th>
                    <th className="pb-2.5 px-3">Origin & Destination</th>
                    <th className="pb-2.5 px-3">Baseline Transit</th>
                    <th className="pb-2.5 px-3">Simulated Transit</th>
                    <th className="pb-2.5 px-3">Delay Impact</th>
                    <th className="pb-2.5 px-3">Status</th>
                    <th className="pb-2.5 px-3">Detour Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {simulationResult?.route_impacts &&
                  simulationResult.route_impacts.length > 0 ? (
                    simulationResult.route_impacts.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-100">
                          {r.route_name}
                        </td>
                        <td className="py-3 px-3 text-slate-400">
                          {r.origin_name} &rarr; {r.destination_name}
                        </td>
                        <td className="py-3 px-3 text-slate-300 font-mono">
                          {r.baseline_transit_hours} hrs
                        </td>
                        <td className="py-3 px-3 font-bold font-mono text-purple-300">
                          {r.simulated_transit_hours} hrs
                        </td>
                        <td className="py-3 px-3">
                          {r.delta_hours > 0 ? (
                            <span className="text-rose-400 font-bold font-mono">
                              +{r.delta_hours} hrs (+{r.percentage_change}%)
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-mono">0.0 hrs</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            variant={
                              r.status === 'Disrupted'
                                ? 'danger'
                                : r.status === 'Delayed'
                                ? 'warning'
                                : 'success'
                            }
                            size="xs"
                          >
                            {r.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {r.recommended_detour_name ? (
                            <span className="text-indigo-400 font-medium flex items-center gap-1">
                              <Navigation className="w-3 h-3 text-indigo-400" />
                              {r.recommended_detour_name}
                            </span>
                          ) : (
                            <span className="text-slate-500">Standard Axis</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-6 text-center text-slate-500">
                        No active corridor disruptions modeled.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

/**
 * Helper Component for 7-Dimension Before-Versus-After Comparison Card
 */
function ComparisonMetricCard({ title, point, icon: Icon, colorScheme = 'indigo' }) {
  if (!point) return null;

  const isImproved = point.status === 'improved';
  const isDegraded = point.status === 'degraded';
  const isNeutral = point.status === 'neutral';

  return (
    <Card className="p-4 flex flex-col justify-between hover:border-slate-600 transition-all">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-300">{title}</span>
          </div>
          <Badge
            variant={isImproved ? 'success' : isDegraded ? 'danger' : 'neutral'}
            size="xs"
          >
            {isImproved ? 'Improved' : isDegraded ? 'Degraded' : 'Neutral'}
          </Badge>
        </div>

        {/* Values Comparison: Baseline vs Simulated */}
        <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">
              Baseline
            </span>
            <span className="text-sm font-bold font-mono text-slate-300">
              {formatNumber(point.baseline_value)} {point.unit}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">
              Simulated
            </span>
            <span
              className={`text-sm font-bold font-mono ${
                isDegraded
                  ? 'text-rose-400'
                  : isImproved
                  ? 'text-emerald-400'
                  : 'text-purple-300'
              }`}
            >
              {formatNumber(point.simulated_value)} {point.unit}
            </span>
          </div>
        </div>
      </div>

      {/* Delta & Percentage Change Footer */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-400 text-[11px]">Differential (&Delta;):</span>
        <span
          className={`font-mono font-bold flex items-center gap-1 ${
            point.delta > 0
              ? isDegraded
                ? 'text-rose-400'
                : 'text-emerald-400'
              : point.delta < 0
              ? isDegraded
                ? 'text-rose-400'
                : 'text-emerald-400'
              : 'text-slate-400'
          }`}
        >
          {point.delta > 0 ? `+${point.delta}` : point.delta} {point.unit}
          <span className="text-[10px] font-normal text-slate-400">
            ({point.percentage_change > 0 ? `+${point.percentage_change}%` : `${point.percentage_change}%`})
          </span>
        </span>
      </div>
    </Card>
  );
}

export default SimulationsPage;
