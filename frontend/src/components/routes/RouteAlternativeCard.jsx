/**
 * LogiPredict AI - Route Alternative Card Component
 * ==================================================
 * High-density operational card displaying corridor telematics,
 * mountain pass altitude, capacity utilization bar, INR cost,
 * waypoints sequence, and interactive action triggers.
 */

import React from 'react';
import {
  Navigation,
  Clock,
  Gauge,
  Mountain,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Shield,
  Activity,
  Layers,
  ArrowRight,
  IndianRupee,
} from 'lucide-react';
import {
  formatDistance,
  formatTransitHours,
  formatPercent,
  formatNumber,
  formatCurrency,
} from '../../utils/formatters';
import {
  getRouteStatusConfig,
  getRoadConditionConfig,
  getCapacityUtilizationConfig,
} from '../../utils/statusHelpers';

export function RouteAlternativeCard({
  route,
  isSelected = false,
  isOptimal = false,
  onSelect = () => {},
  onInspectDetails = () => {},
  onSimulateDisruption = () => {},
}) {
  const statusCfg = getRouteStatusConfig(route.status);
  const roadCfg = getRoadConditionConfig(route.road_condition);
  const capCfg = getCapacityUtilizationConfig(route.capacity_utilization_pct);

  // Time difference vs baseline
  const isDelayed = route.current_estimated_transit_hours > route.baseline_transit_hours * 1.05;
  const delayDiff = route.current_estimated_transit_hours - route.baseline_transit_hours;

  return (
    <div
      className={`relative rounded-xl border transition-all duration-200 overflow-hidden ${
        isSelected
          ? 'bg-slate-900 border-cyan-500 shadow-xl shadow-cyan-950/40 ring-1 ring-cyan-500/50'
          : 'bg-slate-950/80 hover:bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-lg'
      }`}
    >
      {/* Top optimal badge / selection indicator strip */}
      {isOptimal && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-3 py-1 flex items-center justify-between text-white text-[11px] font-bold tracking-wider uppercase font-mono">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Recommended Optimal Route</span>
          </span>
          <span className="text-[10px] opacity-90">Multi-Objective Score: 98.4%</span>
        </div>
      )}

      <div className="p-4 space-y-3.5">
        {/* Header: ID, Name, Status Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-cyan-400 border border-slate-700">
                {route.route_id}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                <span>{statusCfg.label}</span>
              </span>

              {route.is_blocked && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-950 text-rose-300 border border-rose-600 animate-pulse">
                  Blocked
                </span>
              )}
            </div>

            <h4 className="text-sm font-bold text-white tracking-tight">
              {route.route_name}
            </h4>
          </div>

          {/* Road condition chip */}
          <div
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border self-start sm:self-auto ${roadCfg.bg} ${roadCfg.text} ${roadCfg.border}`}
          >
            <Shield className="w-3 h-3" />
            <span>{roadCfg.label}</span>
          </div>
        </div>

        {/* Origin to Destination Nodes Banner */}
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 text-xs text-slate-200">
          <div className="flex-1 font-semibold truncate text-emerald-400">
            {route.origin_name}
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <div className="flex-1 font-semibold truncate text-rose-400 text-right">
            {route.destination_name}
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
          {/* Distance */}
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">
              Distance
            </span>
            <span className="font-mono font-bold text-sm text-slate-100">
              {formatDistance(route.distance_km)}
            </span>
          </div>

          {/* Transit Time */}
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">
              Transit ETA
            </span>
            <div className="flex items-baseline gap-1">
              <span className={`font-mono font-bold text-sm ${isDelayed ? 'text-amber-400' : 'text-emerald-400'}`}>
                {formatTransitHours(route.current_estimated_transit_hours)}
              </span>
              {isDelayed && (
                <span className="text-[10px] text-amber-500 font-mono">
                  (+{formatTransitHours(delayDiff)})
                </span>
              )}
            </div>
          </div>

          {/* Mountain Pass */}
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">
              Peak Pass
            </span>
            <div className="truncate font-medium text-cyan-300" title={route.peak_pass_name}>
              {route.peak_pass_name ? route.peak_pass_name.replace(' Pass', '') : 'Valley Sector'}
            </div>
            {route.peak_pass_altitude > 0 && (
              <span className="text-[10px] text-slate-400 font-mono">
                {formatNumber(route.peak_pass_altitude)} m ASL
              </span>
            )}
          </div>

          {/* Est. Operational Cost */}
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">
              Cost Est.
            </span>
            <span className="font-mono font-bold text-sm text-slate-100">
              {formatCurrency(route.estimated_cost_inr)}
            </span>
          </div>
        </div>

        {/* Capacity Utilization Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
              <Gauge className="w-3 h-3 text-cyan-400" />
              <span>Corridor Capacity Load</span>
            </span>
            <span className={`font-mono font-bold text-xs ${capCfg.textColor}`}>
              {formatPercent(route.capacity_utilization_pct)} ({formatNumber(route.allocated_capacity_metric_tonnes)} / {formatNumber(route.total_capacity_metric_tonnes)} MT)
            </span>
          </div>

          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${capCfg.barColor}`}
              style={{ width: `${Math.min(100, Math.max(0, route.capacity_utilization_pct))}%` }}
            />
          </div>
        </div>

        {/* Waypoints Sequence Chips */}
        {route.waypoints && route.waypoints.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1 pt-1 no-scrollbar">
            <span className="text-[10px] uppercase font-mono text-slate-400 shrink-0">
              Waypoints:
            </span>
            {route.waypoints.map((wp, idx) => (
              <React.Fragment key={idx}>
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[11px] whitespace-nowrap">
                  {wp}
                </span>
                {idx < route.waypoints.length - 1 && (
                  <span className="text-slate-600 text-[10px]">›</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Action Controls Bar */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => onInspectDetails(route)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Inspect Telematics</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSimulateDisruption(route)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 hover:border-amber-500/40 text-xs font-semibold transition-colors"
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Simulate Threat</span>
            </button>

            <button
              type="button"
              onClick={() => onSelect(route)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/50'
                  : 'bg-slate-800 hover:bg-cyan-950 text-slate-200 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40'
              }`}
            >
              <span>{isSelected ? 'Active Selection' : 'Select Corridor'}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RouteAlternativeCard;
