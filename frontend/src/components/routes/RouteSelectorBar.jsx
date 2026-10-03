/**
 * LogiPredict AI - Route Selector Bar
 * ====================================
 * Strategic Origin & Destination Hub Selectors, Corridor Presets,
 * Multi-Criteria Optimization Switcher, and Safe Swap Mechanics.
 */

import React from 'react';
import {
  ArrowLeftRight,
  MapPin,
  Navigation,
  Sparkles,
  RotateCcw,
  SlidersHorizontal,
  Compass,
  AlertCircle,
} from 'lucide-react';

export function RouteSelectorBar({
  locations = [],
  selectedOriginId = '',
  selectedDestinationId = '',
  onSelectOrigin = () => {},
  onSelectDestination = () => {},
  onSwapLocations = () => {},
  onResetFilters = () => {},
  optimizationCriterion = 'fastest',
  onSelectOptimizationCriterion = () => {},
  corridorPresets = [],
  onSelectPreset = () => {},
  selectedPresetId = null,
}) {
  const isSameLocation = selectedOriginId && selectedDestinationId && selectedOriginId === selectedDestinationId;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl backdrop-blur-md space-y-4">
      {/* Top Row: Origin, Swap, Destination, Reset */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Origin Selector */}
        <div className="md:col-span-4 space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block ring-2 ring-emerald-500/30" />
            <span>Origin Depot (Staging / Base)</span>
          </label>
          <div className="relative">
            <select
              value={selectedOriginId || ''}
              onChange={(e) => onSelectOrigin(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-700/80 px-3.5 py-2.5 text-xs text-slate-100 font-medium focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 transition-colors"
            >
              <option value="">-- All Origin Hubs (Show All) --</option>
              {locations.map((loc) => (
                <option key={loc.location_id} value={loc.location_id}>
                  {loc.name} ({loc.sector} • {loc.altitude_meters}m)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap Button */}
        <div className="md:col-span-1 flex justify-center pt-3 md:pt-4">
          <button
            type="button"
            onClick={onSwapLocations}
            title="Swap Origin and Destination"
            disabled={!selectedOriginId && !selectedDestinationId}
            className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-cyan-300 border border-slate-700 hover:border-cyan-500/50 transition-all shadow-md active:scale-95"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        </div>

        {/* Destination Selector */}
        <div className="md:col-span-4 space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 uppercase tracking-wider font-mono">
            <span className="w-2 h-2 rounded-full bg-rose-400 inline-block ring-2 ring-rose-500/30" />
            <span>Destination Depot (Forward Post)</span>
          </label>
          <div className="relative">
            <select
              value={selectedDestinationId || ''}
              onChange={(e) => onSelectDestination(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-700/80 px-3.5 py-2.5 text-xs text-slate-100 font-medium focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500/40 transition-colors"
            >
              <option value="">-- All Destination Hubs (Show All) --</option>
              {locations.map((loc) => (
                <option key={loc.location_id} value={loc.location_id}>
                  {loc.name} ({loc.sector} • {loc.altitude_meters}m)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Controls: Reset & Quick Filter */}
        <div className="md:col-span-3 flex items-center gap-2 pt-3 md:pt-4">
          <button
            type="button"
            onClick={onResetFilters}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Hubs</span>
          </button>
        </div>
      </div>

      {/* Validation Warning for Identical Origin & Destination */}
      {isSameLocation && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-950/60 border border-amber-600/50 text-amber-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            <strong>Invalid Pair:</strong> Origin and Destination cannot be the same hub. Please select distinct locations.
          </span>
        </div>
      )}

      {/* Strategic Corridor Presets & Multi-Criteria Optimizer Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
        {/* Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
            <Navigation className="w-3 h-3 text-cyan-400" />
            <span>Corridors:</span>
          </span>

          <button
            type="button"
            onClick={() => onSelectPreset('LEH_SIACHEN')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
              selectedPresetId === 'LEH_SIACHEN'
                ? 'bg-cyan-950 border-cyan-500 text-cyan-200'
                : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            Leh ↔ Siachen
          </button>

          <button
            type="button"
            onClick={() => onSelectPreset('UDH_SRINAGAR')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
              selectedPresetId === 'UDH_SRINAGAR'
                ? 'bg-cyan-950 border-cyan-500 text-cyan-200'
                : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            Udhampur ↔ Srinagar
          </button>

          <button
            type="button"
            onClick={() => onSelectPreset('SRI_KARGIL')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
              selectedPresetId === 'SRI_KARGIL'
                ? 'bg-cyan-950 border-cyan-500 text-cyan-200'
                : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            Srinagar ↔ Kargil (Zoji La)
          </button>

          <button
            type="button"
            onClick={() => onSelectPreset('LEH_PANGONG')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
              selectedPresetId === 'LEH_PANGONG'
                ? 'bg-cyan-950 border-cyan-500 text-cyan-200'
                : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            Leh ↔ Pangong (Chang La)
          </button>
        </div>

        {/* Multi-Criteria Optimization Target */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Target Goal:</span>
          </span>

          <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => onSelectOptimizationCriterion('fastest')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                optimizationCriterion === 'fastest'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Fastest ETA
            </button>
            <button
              type="button"
              onClick={() => onSelectOptimizationCriterion('shortest')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                optimizationCriterion === 'shortest'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Shortest KM
            </button>
            <button
              type="button"
              onClick={() => onSelectOptimizationCriterion('safest')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                optimizationCriterion === 'safest'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Lowest Risk
            </button>
            <button
              type="button"
              onClick={() => onSelectOptimizationCriterion('capacity')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                optimizationCriterion === 'capacity'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Max Headroom
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RouteSelectorBar;
