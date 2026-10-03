/**
 * LogiPredict AI - Disruption Simulation Panel
 * =============================================
 * Interactive sandbox allowing logistics officers to inject simulated
 * delays, road blockages, capacity throttles, and weather hazards with
 * instantaneous tactical detour calculations and 1-click pristine reset.
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  Sliders,
  RotateCcw,
  Play,
  ShieldAlert,
  Flame,
  Snowflake,
  CloudLightning,
  Sparkles,
  Zap,
  ArrowRight,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { formatPercent, formatTransitHours } from '../../utils/formatters';

export function DisruptionSimulationPanel({
  routes = [],
  selectedRouteId = '',
  activeDisruption = null,
  disruptionPresets = [],
  onSimulateDisruption = () => {},
  onResetSimulation = () => {},
  isSimulating = false,
}) {
  // Local Form Controls for Custom Disruption Injection
  const [targetRouteId, setTargetRouteId] = useState(selectedRouteId || (routes[0]?.route_id || ''));
  const [selectedPresetKey, setSelectedPresetKey] = useState('');
  const [delayMultiplier, setDelayMultiplier] = useState(1.5);
  const [isBlocked, setIsBlocked] = useState(false);
  const [roadConditionOverride, setRoadConditionOverride] = useState('Landslide_Blocked');
  const [allocatedCapacityDelta, setAllocatedCapacityDelta] = useState(120);

  // Apply Preset
  const handlePresetSelect = (preset) => {
    setSelectedPresetKey(preset.key);
    setTargetRouteId(preset.target_route_id || targetRouteId);
    setDelayMultiplier(preset.delay_multiplier || 1.5);
    setIsBlocked(Boolean(preset.is_blocked));
    setRoadConditionOverride(preset.road_condition || 'Landslide_Blocked');
    setAllocatedCapacityDelta(preset.capacity_surge_mt || 100);
  };

  // Trigger Custom Disruption
  const handleTriggerCustom = (e) => {
    e.preventDefault();
    if (!targetRouteId) return;

    onSimulateDisruption({
      route_id: targetRouteId,
      scenario_name: selectedPresetKey ? disruptionPresets.find(p => p.key === selectedPresetKey)?.title : 'Custom Tactical Stress Test',
      delay_multiplier: Number(delayMultiplier),
      is_blocked: Boolean(isBlocked),
      road_condition: roadConditionOverride,
      allocated_capacity_delta_mt: Number(allocatedCapacityDelta),
    });
  };

  return (
    <div className="rounded-xl border border-amber-500/30 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 p-4 shadow-xl space-y-4">
      {/* Top Banner: Sandbox Header & Reset Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-400">
            <AlertTriangle className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Tactical Disruption Simulator
              </h3>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-600/40">
                SANDBOX
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Inject non-destructive weather & hazard disruptions to evaluate detour elasticity
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onResetSimulation}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Reset Baseline</span>
        </button>
      </div>

      {/* Active Disruption Feedback Banner */}
      {activeDisruption && (
        <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-600/60 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-bold text-rose-200">
                Active Simulation: {activeDisruption.scenario_name}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-rose-900/80 text-rose-300 border border-rose-500/50">
              CORRIDOR: {activeDisruption.route_id}
            </span>
          </div>

          <p className="text-slate-300 text-[11px]">
            {activeDisruption.impact_summary || 'Corridor telemetry modified. Delays and risk indices elevated.'}
          </p>

          {activeDisruption.recommended_detour && (
            <div className="flex items-center gap-2 p-2 rounded bg-slate-900/90 border border-rose-900 text-cyan-300 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>
                <strong>Tactical Detour:</strong> Route {activeDisruption.recommended_detour.route_id} ({activeDisruption.recommended_detour.route_name}) — ETA {formatTransitHours(activeDisruption.recommended_detour.transit_hours)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Presets Grid */}
      <div className="space-y-2">
        <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
          Preset Threat Scenarios
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {disruptionPresets.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => handlePresetSelect(preset)}
              className={`p-2.5 rounded-lg border text-left transition-all space-y-1 ${
                selectedPresetKey === preset.key
                  ? 'bg-amber-950/60 border-amber-500/80 text-amber-200 ring-1 ring-amber-500/40'
                  : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span>{preset.title}</span>
                {preset.is_blocked ? (
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <Snowflake className="w-3.5 h-3.5 text-sky-400" />
                )}
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                {preset.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Simulation Controls Form */}
      <form onSubmit={handleTriggerCustom} className="space-y-3 pt-2 border-t border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Target Corridor */}
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-medium block">
              Target Corridor:
            </label>
            <select
              value={targetRouteId}
              onChange={(e) => setTargetRouteId(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-slate-200 font-medium focus:border-amber-500 focus:outline-none"
            >
              {routes.map((r) => (
                <option key={r.route_id} value={r.route_id}>
                  {r.route_id} — {r.route_name.slice(0, 32)}
                </option>
              ))}
            </select>
          </div>

          {/* Road Condition Override */}
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-medium block">
              Condition Hazard:
            </label>
            <select
              value={roadConditionOverride}
              onChange={(e) => setRoadConditionOverride(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-slate-200 font-medium focus:border-amber-500 focus:outline-none"
            >
              <option value="Landslide_Blocked">Landslide Blockage</option>
              <option value="Snow_Bound">Snow-Bound / Heavy Ice</option>
              <option value="Avalanche_Warning">High Avalanche Risk</option>
              <option value="Monsoon_Vulnerable">Flash Flood / Washout</option>
              <option value="High_Altitude_Pass">Extreme Altitude Storm</option>
            </select>
          </div>

          {/* Delay Factor Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400 font-medium">
              <span>Transit Delay Factor:</span>
              <span className="font-mono text-amber-400 font-bold">{delayMultiplier}x</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.1"
              value={delayMultiplier}
              onChange={(e) => setDelayMultiplier(e.target.value)}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>

          {/* Blockage Toggle & Submit Action */}
          <div className="flex items-center gap-3 pt-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isBlocked}
                onChange={(e) => setIsBlocked(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-rose-500 focus:ring-0 w-4 h-4"
              />
              <span className={isBlocked ? 'text-rose-400 font-bold' : ''}>Complete Closure</span>
            </label>

            <button
              type="submit"
              disabled={isSimulating || !targetRouteId}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isSimulating ? 'Simulating...' : 'Inject Threat'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default DisruptionSimulationPanel;
