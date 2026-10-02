import React, { useState } from 'react';
import {
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  CloudSnow,
  TrendingUp,
  AlertTriangle,
  Layers,
  BarChart2,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader } from '../components/ui/Card';
import { KPICard } from '../components/dashboard/KpiCard';
import { FilterBar } from '../components/filters/FilterBar';

const SCENARIOS = [
  {
    id: 'SCN-MONSOON-01',
    name: 'Severe Winter Blizzard (Zojila Pass Closure)',
    category: 'Weather Disruption',
    leadTimeDelta: '+120 hours',
    demandSurge: '+35% POL fuel',
    stockoutRisk: 'High (3 FOBs)',
    severity: 'critical',
  },
  {
    id: 'SCN-SURGE-02',
    name: 'High-Altitude Troop Reinforcement Surge',
    category: 'Operational Surge',
    leadTimeDelta: '+12 hours',
    demandSurge: '+80% Rations & Medical',
    stockoutRisk: 'Medium (1 FOB)',
    severity: 'warning',
  },
  {
    id: 'SCN-ROUTE-03',
    name: 'NH-1D Highway Landslide Corridor Blockade',
    category: 'Corridor Cutoff',
    leadTimeDelta: '+72 hours',
    demandSurge: '+15% Buffer',
    stockoutRisk: 'Critical (Leh Hub)',
    severity: 'critical',
  },
];

export function SimulationsPage() {
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0]);
  const [leadTimeMultiplier, setLeadTimeMultiplier] = useState(2.0);
  const [demandSurgePercent, setDemandSurgePercent] = useState(35);
  const [isRunning, setIsRunning] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);

  const handleRunSimulation = () => {
    setIsRunning(true);
    setSimulationResult(null);
    setTimeout(() => {
      setIsRunning(false);
      setSimulationResult({
        impactedHubs: 3,
        projectedStockouts: 4,
        resilienceScore: '78.4%',
        suggestedReroutes: 6,
        preemptivePOs: 2,
        estimatedBufferRunwayDays: 5.2,
      });
    }, 1200);
  };

  const handleReset = () => {
    setLeadTimeMultiplier(1.0);
    setDemandSurgePercent(0);
    setSimulationResult(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Forward Disruption Simulations"
        description="Stress-test forward logistics resilience against weather blockades, sudden operational surges, and route disruptions."
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Simulations' },
        ]}
        badge={
          <Badge variant="purple" size="sm" icon={Sliders}>
            Monte Carlo Engine Active
          </Badge>
        }
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={RotateCcw} onClick={handleReset}>
              Reset Parameters
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={Play}
              isLoading={isRunning}
              loadingText="Simulating 10,000 Runs..."
              onClick={handleRunSimulation}
            >
              Execute Stress Test
            </Button>
          </>
        }
      />

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Simulated Resilience Score"
          value={simulationResult ? simulationResult.resilienceScore : '92.6%'}
          change={simulationResult ? '-14.2%' : '+2.4%'}
          trend={simulationResult ? 'down' : 'up'}
          timeframe="under active scenario"
          iconName="ShieldAlert"
          colorScheme={simulationResult ? 'rose' : 'emerald'}
          status={simulationResult ? 'Degraded' : 'Nominal'}
          statusVariant={simulationResult ? 'danger' : 'success'}
        />
        <KPICard
          title="Predicted Stockout Outposts"
          value={simulationResult ? `${simulationResult.projectedStockouts} FOBs` : '0 FOBs'}
          change={simulationResult ? '+4 at risk' : 'Zero deficit'}
          trend={simulationResult ? 'down' : 'up'}
          timeframe="within 72h window"
          iconName="AlertOctagon"
          colorScheme={simulationResult ? 'rose' : 'indigo'}
        />
        <KPICard
          title="Emergency Reroutes"
          value={simulationResult ? `${simulationResult.suggestedReroutes} Convoys` : '1 Convoy'}
          timeframe="contingency corridors"
          iconName="Truck"
          colorScheme="amber"
          status="Pre-calculated"
          statusVariant="warning"
        />
        <KPICard
          title="Buffer Runway Remaining"
          value={simulationResult ? `${simulationResult.estimatedBufferRunwayDays} Days` : '18.4 Days'}
          change={simulationResult ? '-13.2 days' : 'Nominal'}
          trend={simulationResult ? 'down' : 'up'}
          timeframe="high-altitude survival"
          iconName="PackageCheck"
          colorScheme="purple"
        />
      </div>

      {/* Simulation Controls & Scenario Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Preset Scenarios */}
        <Card className="flex flex-col">
          <CardHeader
            title="Pre-Configured Threat Scenarios"
            subtitle="Select a historical or synthetic disruption profile"
          />
          <div className="space-y-3 flex-1">
            {SCENARIOS.map((sc) => {
              const isSelected = selectedScenario.id === sc.id;
              return (
                <div
                  key={sc.id}
                  onClick={() => setSelectedScenario(sc)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/50 ring-1 ring-indigo-500'
                      : 'bg-slate-800/40 hover:bg-slate-800/70 border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-[11px] font-bold text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      {sc.id}
                    </span>
                    <Badge variant={sc.severity === 'critical' ? 'danger' : 'warning'} size="xs">
                      {sc.category}
                    </Badge>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-100 leading-snug">
                    {sc.name}
                  </h4>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-700/60">
                    <span>Lead Time: <strong className="text-slate-300">{sc.leadTimeDelta}</strong></span>
                    <span>Surge: <strong className="text-indigo-400">{sc.demandSurge}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Middle & Right Column: Interactive Parameter Tuning */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Custom What-If Parameter Sliders"
            subtitle="Adjust variables to evaluate extreme forward supply chain bottlenecks"
            action={
              <Badge variant="brand" size="xs" dot>
                {selectedScenario.name}
              </Badge>
            }
          />

          <div className="space-y-6 pt-2">
            {/* Lead time slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <label className="font-semibold text-slate-300">
                  Transit Lead Time Multiplier
                </label>
                <span className="font-mono font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/60">
                  {leadTimeMultiplier}x (Standard: 1.0x)
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.5"
                value={leadTimeMultiplier}
                onChange={(e) => setLeadTimeMultiplier(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>1.0x (Normal Clear Corridors)</span>
                <span>3.0x (Heavy Snow / Convoy Halts)</span>
                <span>5.0x (Complete Road Cutoff)</span>
              </div>
            </div>

            {/* Demand surge slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <label className="font-semibold text-slate-300">
                  Operational Consumption Surge (% Increase)
                </label>
                <span className="font-mono font-bold text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/60">
                  +{demandSurgePercent}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="150"
                step="5"
                value={demandSurgePercent}
                onChange={(e) => setDemandSurgePercent(parseInt(e.target.value, 10))}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>+0% (Routine Peacetime)</span>
                <span>+50% (Winter Stocking)</span>
                <span>+150% (High Readiness Surge)</span>
              </div>
            </div>

            {/* Simulation Result Callout */}
            {simulationResult ? (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-bold text-slate-100">Monte Carlo Stress Test Output</span>
                  </div>
                  <Badge variant="purple" size="xs">
                    Confidence: 94.2%
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                  <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                    <span className="text-slate-400 text-[10px] block">Impacted FOBs</span>
                    <span className="text-base font-bold text-rose-400">
                      {simulationResult.projectedStockouts}
                    </span>
                  </div>
                  <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                    <span className="text-slate-400 text-[10px] block">Resilience Index</span>
                    <span className="text-base font-bold text-amber-400">
                      {simulationResult.resilienceScore}
                    </span>
                  </div>
                  <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                    <span className="text-slate-400 text-[10px] block">Bypass Corridors</span>
                    <span className="text-base font-bold text-indigo-400">
                      {simulationResult.suggestedReroutes}
                    </span>
                  </div>
                  <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                    <span className="text-slate-400 text-[10px] block">Auto Requisitions</span>
                    <span className="text-base font-bold text-emerald-400">
                      {simulationResult.preemptivePOs}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                  AI Recommendation: Dispatch preemptive fuel convoys from Udhampur Base Depot via alternate bypass corridor B-4 before T-48 hour winter weather window.
                </p>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-slate-800/40 border border-dashed border-slate-700 text-center text-xs text-slate-400">
                Click <strong>"Execute Stress Test"</strong> to run 10,000 Monte Carlo stochastic supply chain iterations under the selected parameters.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default SimulationsPage;
