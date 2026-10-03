/**
 * LogiPredict AI - Route Detail Slide-Over Drawer
 * ===============================================
 * Deep telematics inspection drawer rendering synthetic elevation profiles,
 * vehicle class limits, military pass telemetry, waypoint timelines,
 * and tactical mitigation advisories.
 */

import React from 'react';
import {
  X,
  Navigation,
  Mountain,
  Gauge,
  Shield,
  Truck,
  AlertTriangle,
  Clock,
  Compass,
  FileText,
  Activity,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
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

export function RouteDetailDrawer({
  isOpen = false,
  route = null,
  onClose = () => {},
  onSelectRoute = () => {},
  onSimulateDisruption = () => {},
}) {
  if (!isOpen || !route) return null;

  const statusCfg = getRouteStatusConfig(route.status);
  const roadCfg = getRoadConditionConfig(route.road_condition);
  const capCfg = getCapacityUtilizationConfig(route.capacity_utilization_pct);

  // Elevation Profile synthetic visualization
  const elevationData = [
    { label: route.origin_name?.split(' ')[0] || 'Origin', alt: 2200 },
    { label: 'Valley Entry', alt: 2800 },
    { label: route.peak_pass_name?.replace(' Pass', '') || 'Mid-Pass', alt: route.peak_pass_altitude || 3600 },
    { label: 'Descent Sector', alt: 3100 },
    { label: route.destination_name?.split(' ')[0] || 'Dest', alt: 3500 },
  ];

  const maxAlt = Math.max(...elevationData.map((d) => d.alt), 5600);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-cyan-400">
                    {route.route_id}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                    <span>{statusCfg.label}</span>
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  {route.route_name}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-slate-300">
            {/* Origin -> Destination Flow Card */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono text-emerald-400 block font-semibold">
                  Origin Hub
                </span>
                <span className="font-bold text-slate-100 text-sm">{route.origin_name}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-600" />
              <div className="text-right">
                <span className="text-[10px] uppercase font-mono text-rose-400 block font-semibold">
                  Destination Hub
                </span>
                <span className="font-bold text-slate-100 text-sm">{route.destination_name}</span>
              </div>
            </div>

            {/* Core Telematics Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                  Corridor Distance
                </span>
                <span className="font-mono font-bold text-base text-white">
                  {formatDistance(route.distance_km)}
                </span>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                  Transit Duration
                </span>
                <span className="font-mono font-bold text-base text-emerald-400">
                  {formatTransitHours(route.current_estimated_transit_hours)}
                </span>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                  Peak Pass Altitude
                </span>
                <span className="font-mono font-bold text-base text-cyan-300">
                  {route.peak_pass_altitude ? `${formatNumber(route.peak_pass_altitude)} m` : 'Valley'}
                </span>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                  Operational Cost
                </span>
                <span className="font-mono font-bold text-base text-white">
                  {formatCurrency(route.estimated_cost_inr)}
                </span>
              </div>
            </div>

            {/* Synthetic Elevation Profile Visualization */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                  <Mountain className="w-4 h-4 text-cyan-400" />
                  <span>Terrain & Elevation Profile</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Peak: {route.peak_pass_name || 'Standard Gradient'}
                </span>
              </div>

              {/* Bar Chart Representation */}
              <div className="h-28 flex items-end justify-between gap-2 pt-4 px-2 bg-slate-950 rounded-lg border border-slate-800/80">
                {elevationData.map((pt, idx) => {
                  const heightPct = Math.round((pt.alt / maxAlt) * 100);
                  const isPeak = pt.alt === route.peak_pass_altitude;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <span className="text-[9px] font-mono text-slate-400">{pt.alt}m</span>
                      <div
                        className={`w-full rounded-t transition-all duration-300 ${
                          isPeak
                            ? 'bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-lg shadow-cyan-500/30'
                            : 'bg-slate-800'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className="text-[9px] text-slate-400 truncate w-full text-center">
                        {pt.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Capacity & Vehicle Restrictions */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                  <Gauge className="w-4 h-4 text-cyan-400" />
                  <span>Capacity Load & Fleet Telematics</span>
                </div>
                <span className={`text-xs font-mono font-bold ${capCfg.textColor}`}>
                  {formatPercent(route.capacity_utilization_pct)} Load
                </span>
              </div>

              <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden">
                <div
                  className={`h-full rounded-full ${capCfg.barColor}`}
                  style={{ width: `${Math.min(100, Math.max(0, route.capacity_utilization_pct))}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div className="space-y-1">
                  <span className="text-slate-400 block text-[11px]">Allocated vs Total Capacity:</span>
                  <span className="font-mono font-bold text-slate-200">
                    {formatNumber(route.allocated_capacity_metric_tonnes)} / {formatNumber(route.total_capacity_metric_tonnes)} MT
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 block text-[11px]">Authorized Fleet Classes:</span>
                  <span className="font-medium text-slate-200">
                    ALS 4x4, TATRA 6x6/8x8, Armored Shuttles
                  </span>
                </div>
              </div>
            </div>

            {/* Sequential Waypoint Timeline */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Sequential Waypoint Checkpoints</span>
              </div>

              <div className="relative pl-4 space-y-3 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {route.waypoints && route.waypoints.map((wp, idx) => (
                  <div key={idx} className="relative flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 ring-4 ring-slate-950 absolute -left-4" />
                    <div className="flex-1 flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <span className="font-medium text-slate-200 text-xs">{wp}</span>
                      <span className="text-[10px] font-mono text-slate-400">Stage {idx + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tactical Mitigation & Road Notes */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                <Shield className="w-4 h-4" />
                <span>Operational Directives & Mitigation Notes</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Maintain strict convoy echelon spacing of 50 meters through high-altitude avalanche hazard zones. Ensure recovery vehicles and anti-skid tire chains are mounted at pass staging checkpoints.
              </p>
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onSimulateDisruption(route)}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 hover:border-amber-500/40 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Simulate Threat</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectRoute(route);
                onClose();
              }}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-950/50 transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Select Active Route</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RouteDetailDrawer;
