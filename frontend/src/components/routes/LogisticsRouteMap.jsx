/**
 * LogiPredict AI - Interactive Schematic SVG Logistics Map
 * ==========================================================
 * Vector-based command center canvas rendering forward military depots,
 * multi-modal corridors, elevation passes, real-time convoy flow,
 * capacity heatmaps, and dynamic disruption overlays.
 *
 * Indian Army Forward Supply Chain (SIH 2026)
 */

import React, { useState, useMemo } from 'react';
import {
  Compass,
  Layers,
  Mountain,
  AlertTriangle,
  Zap,
  RotateCcw,
  Truck,
  Eye,
  Info,
  Maximize2,
  Navigation,
  Shield,
  Activity,
} from 'lucide-react';
import {
  formatTransitHours,
  formatDistance,
  formatPercent,
  formatNumber,
} from '../../utils/formatters';
import {
  getRouteStatusConfig,
  getRoadConditionConfig,
  getCapacityUtilizationConfig,
} from '../../utils/statusHelpers';

export function LogisticsRouteMap({
  locations = [],
  routes = [],
  selectedRouteId = null,
  onSelectRoute = () => {},
  selectedOriginId = null,
  selectedDestinationId = null,
  onSelectOrigin = () => {},
  onSelectDestination = () => {},
  activeDisruption = null,
}) {
  // Layer Visibility Toggles
  const [showPasses, setShowPasses] = useState(true);
  const [showHazards, setShowHazards] = useState(true);
  const [showCapacityHeatmap, setShowCapacityHeatmap] = useState(true);
  const [showConvoyAnimation, setShowConvoyAnimation] = useState(true);

  // Hover Tooltip States
  const [hoveredRoute, setHoveredRoute] = useState(null);
  const [hoveredLocation, setHoveredLocation] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Map Locations by ID for Fast Lookup
  const locationMap = useMemo(() => {
    const map = new Map();
    for (const loc of locations) {
      map.set(loc.location_id, loc);
    }
    return map;
  }, [locations]);

  // Compute Bezier Curve for Route
  const getRoutePath = (route) => {
    const origin = locationMap.get(route.origin_location_id);
    const dest = locationMap.get(route.destination_location_id);
    if (!origin || !dest) return '';

    const x1 = origin.svg_x;
    const y1 = origin.svg_y;
    const x2 = dest.svg_x;
    const y2 = dest.svg_y;

    // Use predefined control offsets or calculate dynamic curvature
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Lateral curve offset based on route ID to prevent overlapping opposite directions
    const curveFactor = route.route_id.endsWith('02') ? -45 : 35;
    const normX = -dy / (dist || 1);
    const normY = dx / (dist || 1);

    const cx1 = x1 + dx * 0.3 + normX * curveFactor;
    const cy1 = y1 + dy * 0.3 + normY * curveFactor;
    const cx2 = x1 + dx * 0.7 + normX * curveFactor;
    const cy2 = y1 + dy * 0.7 + normY * curveFactor;

    return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
  };

  // Get Route Midpoint for Label / Pass Icon
  const getRouteMidpoint = (route) => {
    const origin = locationMap.get(route.origin_location_id);
    const dest = locationMap.get(route.destination_location_id);
    if (!origin || !dest) return { x: 0, y: 0 };

    const x1 = origin.svg_x;
    const y1 = origin.svg_y;
    const x2 = dest.svg_x;
    const y2 = dest.svg_y;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const curveFactor = route.route_id.endsWith('02') ? -45 : 35;
    const normX = -dy / (dist || 1);
    const normY = dx / (dist || 1);

    // Approximate midpoint of cubic Bezier
    const mx = (x1 + x2) / 2 + normX * (curveFactor * 0.75);
    const my = (y1 + y2) / 2 + normY * (curveFactor * 0.75);

    return { x: mx, y: my };
  };

  const handleRouteMouseMove = (e, route) => {
    const rect = e.currentTarget.closest('svg').getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setHoveredRoute(route);
    setHoveredLocation(null);
  };

  const handleLocationMouseMove = (e, loc) => {
    const rect = e.currentTarget.closest('svg').getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setHoveredLocation(loc);
    setHoveredRoute(null);
  };

  const handleLocationClick = (loc) => {
    if (!selectedOriginId || (selectedOriginId && selectedDestinationId)) {
      onSelectOrigin(loc.location_id);
    } else if (selectedOriginId && !selectedDestinationId) {
      if (loc.location_id !== selectedOriginId) {
        onSelectDestination(loc.location_id);
      }
    }
  };

  return (
    <div className="relative flex flex-col rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-3 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
            <Compass className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-wide uppercase font-mono">
              Theater GIS Schematic • Northern Command
            </h3>
            <p className="text-[10px] text-slate-400">
              Interactive 8-Depot Forward Grid • 13 Military Supply Corridors
            </p>
          </div>
        </div>

        {/* Visual Layer Toggles */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setShowPasses((prev) => !prev)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${
              showPasses
                ? 'bg-cyan-950/70 border-cyan-500/60 text-cyan-300'
                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mountain className="w-3 h-3" />
            <span>Passes & Altitudes</span>
          </button>

          <button
            type="button"
            onClick={() => setShowHazards((prev) => !prev)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${
              showHazards
                ? 'bg-amber-950/70 border-amber-500/60 text-amber-300'
                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Weather Hazards</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCapacityHeatmap((prev) => !prev)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${
              showCapacityHeatmap
                ? 'bg-purple-950/70 border-purple-500/60 text-purple-300'
                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>Capacity Load</span>
          </button>

          <button
            type="button"
            onClick={() => setShowConvoyAnimation((prev) => !prev)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${
              showConvoyAnimation
                ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300'
                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Truck className="w-3 h-3" />
            <span>Convoy Flow</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative w-full aspect-[880/600] bg-[#090d16] select-none overflow-hidden">
        <svg
          viewBox="0 0 880 600"
          className="w-full h-full"
          onMouseLeave={() => {
            setHoveredRoute(null);
            setHoveredLocation(null);
          }}
        >
          {/* SVG Definitions for Gradients, Markers, and Filters */}
          <defs>
            {/* Grid Background Pattern */}
            <pattern id="tactical-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="#1e293b"
                strokeWidth="0.75"
                strokeOpacity="0.45"
              />
              <circle cx="0" cy="0" r="1" fill="#334155" opacity="0.6" />
            </pattern>

            {/* Glowing filter for selected routes */}
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="glow-rose" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Directional Arrowheads */}
            <marker
              id="arrow-operational"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
            </marker>

            <marker
              id="arrow-delayed"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
            </marker>

            <marker
              id="arrow-disrupted"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
            </marker>

            <marker
              id="arrow-selected"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
            </marker>
          </defs>

          {/* Background Tactical Grid */}
          <rect width="880" height="600" fill="url(#tactical-grid)" />

          {/* Topographic Sector Background Shading & Sector Labels */}
          <g className="opacity-40" pointerEvents="none">
            {/* Sector North - Siachen/Nubra */}
            <path
              d="M 460 20 L 780 20 L 840 220 L 500 220 Z"
              fill="#0284c7"
              fillOpacity="0.04"
              stroke="#0284c7"
              strokeDasharray="4 6"
              strokeWidth="1"
            />
            <text x="520" y="45" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold" opacity="0.6">
              [SECTOR NORTH — GLACIAL LOGISTICS]
            </text>

            {/* Sector Central - Kargil/Drass */}
            <path
              d="M 120 180 L 460 160 L 480 340 L 140 340 Z"
              fill="#d97706"
              fillOpacity="0.03"
              stroke="#d97706"
              strokeDasharray="4 6"
              strokeWidth="1"
            />
            <text x="160" y="200" fill="#fbbf24" fontSize="10" fontFamily="monospace" fontWeight="bold" opacity="0.6">
              [SECTOR CENTRAL — TRANSIT CORRIDORS]
            </text>

            {/* Sector East - Ladakh / Pangong */}
            <path
              d="M 480 230 L 860 230 L 860 480 L 480 460 Z"
              fill="#8b5cf6"
              fillOpacity="0.03"
              stroke="#8b5cf6"
              strokeDasharray="4 6"
              strokeWidth="1"
            />
            <text x="700" y="260" fill="#a78bfa" fontSize="10" fontFamily="monospace" fontWeight="bold" opacity="0.6">
              [SECTOR EAST — HIGH PLATEAU]
            </text>

            {/* Sector West - Kashmir / Jammu Base */}
            <path
              d="M 40 320 L 320 320 L 320 580 L 40 580 Z"
              fill="#059669"
              fillOpacity="0.03"
              stroke="#059669"
              strokeDasharray="4 6"
              strokeWidth="1"
            />
            <text x="60" y="565" fill="#34d399" fontSize="10" fontFamily="monospace" fontWeight="bold" opacity="0.6">
              [SECTOR SOUTH/WEST — STRATEGIC REAR DEEP BASES]
            </text>
          </g>

          {/* Render Logistics Corridors (Routes) */}
          <g className="routes-layer">
            {routes.map((route) => {
              const pathData = getRoutePath(route);
              if (!pathData) return null;

              const isSelected = selectedRouteId === route.route_id;
              const isHovered = hoveredRoute?.route_id === route.route_id;
              const statusCfg = getRouteStatusConfig(route.status);
              const roadCfg = getRoadConditionConfig(route.road_condition);

              // Determine stroke color and style
              let strokeColor = statusCfg.stroke;
              let strokeWidth = 2.5;
              let strokeDash = 'none';
              let marker = `url(#arrow-${route.status.toLowerCase()})`;

              if (route.is_blocked || route.status === 'disrupted') {
                strokeColor = '#f43f5e';
                strokeDash = '6 6';
                marker = 'url(#arrow-disrupted)';
              } else if (route.status === 'delayed') {
                strokeColor = '#f59e0b';
                strokeDash = '8 4';
                marker = 'url(#arrow-delayed)';
              }

              if (isSelected) {
                strokeColor = '#38bdf8';
                strokeWidth = 4.5;
                marker = 'url(#arrow-selected)';
              } else if (isHovered) {
                strokeWidth = 3.5;
              }

              // Capacity utilization heatmap modifier
              if (showCapacityHeatmap && !isSelected && route.capacity_utilization_pct >= 90) {
                strokeWidth = Math.max(strokeWidth, 3.5);
              }

              return (
                <g key={route.route_id} className="cursor-pointer group">
                  {/* Invisible thick path for easy hover clicking */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="18"
                    onClick={() => onSelectRoute(route)}
                    onMouseMove={(e) => handleRouteMouseMove(e, route)}
                    onMouseLeave={() => setHoveredRoute(null)}
                  />

                  {/* Base corridor path glow for selected/disrupted */}
                  {isSelected && (
                    <path
                      d={pathData}
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="8"
                      strokeOpacity="0.4"
                      filter="url(#glow-cyan)"
                      pointerEvents="none"
                    />
                  )}

                  {route.is_blocked && (
                    <path
                      d={pathData}
                      fill="none"
                      stroke="#e11d48"
                      strokeWidth="6"
                      strokeOpacity="0.3"
                      filter="url(#glow-rose)"
                      pointerEvents="none"
                    />
                  )}

                  {/* Visual Corridor Path */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDash}
                    markerEnd={marker}
                    filter={isSelected ? 'url(#glow-cyan)' : 'none'}
                    className="transition-all duration-200"
                    pointerEvents="none"
                  />

                  {/* Animated Convoy Dot if enabled */}
                  {showConvoyAnimation && !route.is_blocked && (
                    <circle r={isSelected ? 4.5 : 3.5} fill={isSelected ? '#38bdf8' : strokeColor} opacity="0.9">
                      <animateMotion
                        path={pathData}
                        dur={`${Math.max(4, Math.round(route.current_estimated_transit_hours * 1.8))}s`}
                        repeatCount="indefinite"
                        rotate="auto"
                      />
                    </circle>
                  )}
                </g>
              );
            })}
          </g>

          {/* Render Mountain Passes & Road Hazard Icons Layer */}
          <g className="telemetry-markers-layer" pointerEvents="none">
            {routes.map((route) => {
              const mid = getRouteMidpoint(route);
              const isSelected = selectedRouteId === route.route_id;

              return (
                <g key={`marker-${route.route_id}`}>
                  {/* Mountain Pass Marker */}
                  {showPasses && route.peak_pass_name && (
                    <g transform={`translate(${mid.x}, ${mid.y})`}>
                      <rect
                        x="-38"
                        y="-12"
                        width="76"
                        height="24"
                        rx="4"
                        fill="#0f172a"
                        fillOpacity="0.85"
                        stroke={isSelected ? '#38bdf8' : '#334155'}
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="-1"
                        textAnchor="middle"
                        fill="#e2e8f0"
                        fontSize="8.5"
                        fontFamily="sans-serif"
                        fontWeight="600"
                      >
                        {route.peak_pass_name.replace(' Pass', '')}
                      </text>
                      <text
                        x="0"
                        y="8"
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="7"
                        fontFamily="monospace"
                      >
                        {route.peak_pass_altitude}m
                      </text>
                    </g>
                  )}

                  {/* Road Hazard Warning Triangle */}
                  {showHazards && (route.is_blocked || route.road_condition === 'Landslide_Blocked' || route.road_condition === 'Snow_Bound' || route.road_condition === 'Avalanche_Warning') && (
                    <g transform={`translate(${mid.x + 35}, ${mid.y - 12})`}>
                      <polygon
                        points="0,-8 7,5 -7,5"
                        fill="#f43f5e"
                        stroke="#fff"
                        strokeWidth="1"
                        className="animate-pulse"
                      />
                      <text x="0" y="3" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">!</text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* Render Depot Nodes Layer */}
          <g className="depots-layer">
            {locations.map((loc) => {
              const isOrigin = selectedOriginId === loc.location_id;
              const isDest = selectedDestinationId === loc.location_id;
              const isHovered = hoveredLocation?.location_id === loc.location_id;

              let nodeColor = '#0284c7'; // default blue
              let outerRingColor = '#0ea5e9';
              let nodeLabel = loc.name.split(' (')[0].replace(' Logistics Hub', '').replace(' Base Logistics Hub', '').replace(' Staging Depot', '').replace(' Base Camp', ' Base').replace(' Outpost', '');

              if (loc.location_type === 'Corps_HQ') {
                nodeColor = '#6366f1'; // indigo
                outerRingColor = '#818cf8';
              } else if (loc.location_type === 'Forward_Operating_Base') {
                nodeColor = '#10b981'; // emerald
                outerRingColor = '#34d399';
              } else if (loc.location_type === 'Transit_Camp') {
                nodeColor = '#f59e0b'; // amber
                outerRingColor = '#fbbf24';
              }

              if (isOrigin) {
                nodeColor = '#10b981'; // green for origin
                outerRingColor = '#34d399';
              } else if (isDest) {
                nodeColor = '#f43f5e'; // red for dest
                outerRingColor = '#fb7185';
              }

              return (
                <g
                  key={loc.location_id}
                  className="cursor-pointer group"
                  onClick={() => handleLocationClick(loc)}
                  onMouseMove={(e) => handleLocationMouseMove(e, loc)}
                  onMouseLeave={() => setHoveredLocation(null)}
                >
                  {/* Outer Pulsing Aura for Origin / Destination / Hover */}
                  {(isOrigin || isDest || isHovered) && (
                    <circle
                      cx={loc.svg_x}
                      cy={loc.svg_y}
                      r="22"
                      fill="none"
                      stroke={outerRingColor}
                      strokeWidth="2"
                      strokeOpacity="0.5"
                      className="animate-ping"
                    />
                  )}

                  {/* Depot Outer Ring */}
                  <circle
                    cx={loc.svg_x}
                    cy={loc.svg_y}
                    r={isOrigin || isDest ? '14' : '11'}
                    fill="#0b1120"
                    stroke={outerRingColor}
                    strokeWidth={isOrigin || isDest ? '3' : '2'}
                  />

                  {/* Center Node Core */}
                  <circle
                    cx={loc.svg_x}
                    cy={loc.svg_y}
                    r={isOrigin || isDest ? '7' : '5'}
                    fill={nodeColor}
                  />

                  {/* Node Label Badge */}
                  <g transform={`translate(${loc.svg_x}, ${loc.svg_y + 22})`}>
                    <rect
                      x={-nodeLabel.length * 3.6 - 8}
                      y="-9"
                      width={nodeLabel.length * 7.2 + 16}
                      height="18"
                      rx="4"
                      fill="#020617"
                      fillOpacity="0.9"
                      stroke={isOrigin ? '#10b981' : isDest ? '#f43f5e' : '#334155'}
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      fill={isOrigin ? '#34d399' : isDest ? '#fb7185' : '#f1f5f9'}
                      fontSize="9.5"
                      fontFamily="sans-serif"
                      fontWeight="bold"
                    >
                      {nodeLabel}
                    </text>
                  </g>

                  {/* Origin / Destination Tag Flag */}
                  {isOrigin && (
                    <g transform={`translate(${loc.svg_x}, ${loc.svg_y - 20})`}>
                      <rect x="-24" y="-8" width="48" height="15" rx="3" fill="#065f46" stroke="#10b981" strokeWidth="1" />
                      <text x="0" y="3" textAnchor="middle" fill="#a7f3d0" fontSize="8" fontWeight="bold" fontFamily="monospace">ORIGIN</text>
                    </g>
                  )}
                  {isDest && (
                    <g transform={`translate(${loc.svg_x}, ${loc.svg_y - 20})`}>
                      <rect x="-30" y="-8" width="60" height="15" rx="3" fill="#881337" stroke="#f43f5e" strokeWidth="1" />
                      <text x="0" y="3" textAnchor="middle" fill="#fecdd3" fontSize="8" fontWeight="bold" fontFamily="monospace">DESTINATION</text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Dynamic Hover Tooltip: Route Corridor */}
        {hoveredRoute && (
          <div
            className="absolute z-30 pointer-events-none bg-slate-900/95 text-white p-3 rounded-xl border border-slate-700 shadow-2xl backdrop-blur-md min-w-[240px] text-xs space-y-1.5 transition-transform duration-75"
            style={{
              left: Math.min(tooltipPos.x + 14, 600),
              top: Math.min(tooltipPos.y + 14, 450),
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
              <span className="font-mono font-bold text-cyan-300">{hoveredRoute.route_id}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                  hoveredRoute.status === 'operational'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                    : hoveredRoute.status === 'delayed'
                    ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                    : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                }`}
              >
                {hoveredRoute.status}
              </span>
            </div>

            <p className="font-semibold text-slate-100">{hoveredRoute.route_name}</p>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-slate-300">
              <div>
                <span className="text-slate-400 block">Distance:</span>
                <span className="font-mono font-bold">{formatDistance(hoveredRoute.distance_km)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Est. Transit:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatTransitHours(hoveredRoute.current_estimated_transit_hours)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Peak Pass:</span>
                <span className="font-medium text-cyan-300">
                  {hoveredRoute.peak_pass_name || 'Valley Road'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Capacity Load:</span>
                <span className="font-mono font-bold">
                  {formatPercent(hoveredRoute.capacity_utilization_pct)}
                </span>
              </div>
            </div>

            {hoveredRoute.is_blocked && (
              <div className="pt-1.5 border-t border-rose-900/60 text-rose-400 text-[11px] font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>Corridor Blocked — Active Detour Suggested</span>
              </div>
            )}
          </div>
        )}

        {/* Dynamic Hover Tooltip: Depot Node */}
        {hoveredLocation && (
          <div
            className="absolute z-30 pointer-events-none bg-slate-900/95 text-white p-3 rounded-xl border border-slate-700 shadow-2xl backdrop-blur-md min-w-[220px] text-xs space-y-1.5 transition-transform duration-75"
            style={{
              left: Math.min(tooltipPos.x + 14, 620),
              top: Math.min(tooltipPos.y + 14, 450),
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
              <span className="font-mono font-bold text-cyan-300">{hoveredLocation.location_id}</span>
              <span className="text-[10px] text-slate-400 uppercase font-mono">{hoveredLocation.sector}</span>
            </div>

            <p className="font-bold text-slate-100">{hoveredLocation.name}</p>

            <div className="space-y-1 text-[11px] text-slate-300 pt-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Altitude:</span>
                <span className="font-mono font-bold text-cyan-300">{formatNumber(hoveredLocation.altitude_meters)} m ASL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Depot Capacity:</span>
                <span className="font-mono font-bold">{formatNumber(hoveredLocation.total_capacity_metric_tonnes)} MT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Load:</span>
                <span className="font-mono font-bold text-emerald-400">{formatPercent(hoveredLocation.current_utilization_percentage)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-1 text-[10px] text-slate-400">
                <span>Callsign:</span>
                <span className="font-mono text-slate-200">{hoveredLocation.contact_callsign}</span>
              </div>
            </div>

            <div className="pt-1.5 border-t border-slate-800 text-[10px] text-cyan-400 font-semibold">
              Click node to set as Origin / Destination
            </div>
          </div>
        )}
      </div>

      {/* Bottom Map Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900/80 border-t border-slate-800 text-xs text-slate-300">
        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          <span className="text-slate-400 font-semibold uppercase text-[10px] font-mono">Legend:</span>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 rounded bg-emerald-500 inline-block" />
            <span>Operational Corridor</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 rounded bg-amber-500 border-b border-amber-600 inline-block" />
            <span>Delayed Corridor</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 rounded bg-rose-500 border-b-2 border-dotted border-rose-300 inline-block" />
            <span>Disrupted / Blocked</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-cyan-500/40 inline-block" />
            <span>Forward Supply Hub</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/40 inline-block" />
            <span>Origin</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/40 inline-block" />
            <span>Destination</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 font-mono">
          <span>Coordinates Ref: WGS84 • Elevation: Barometric / Radar DEM</span>
        </div>
      </div>
    </div>
  );
}

export default LogisticsRouteMap;
