/**
 * LogiPredict AI - Synthetic Demonstration Notice Banner
 * =======================================================
 * Transparent disclaimer clarifying that all forward logistics hubs,
 * military convoy routes, mountain pass telemetry, road conditions, and
 * simulation figures are synthetic demonstration models for SIH 2026.
 */

import React, { useState } from 'react';
import { ShieldAlert, Info, ChevronDown, ChevronUp, CheckCircle2, Lock } from 'lucide-react';

export function SyntheticNoticeBanner() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-xl border border-cyan-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 p-3.5 shadow-lg shadow-cyan-950/20">
      {/* Subtle top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500 opacity-80" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left Section: Security tag & core notice */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>

          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-500/50">
                <Lock className="w-2.5 h-2.5" />
                UNCLASSIFIED // DEMO SCENARIO
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-500/50">
                <CheckCircle2 className="w-2.5 h-2.5" />
                SIH 2026 PROTOCOL
              </span>
            </div>

            <p className="text-xs text-slate-300 font-medium">
              <strong className="text-white">Simulated Logistics Network:</strong> All military depot designations, GIS coordinates, convoy corridors, and elevation profiles represent synthetic research models for Northern Command operational research.
            </p>
          </div>
        </div>

        {/* Right Section: Details toggle */}
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:text-cyan-200 bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700/80 transition-colors shrink-0 self-start md:self-auto"
        >
          <Info className="w-3.5 h-3.5" />
          <span>{isExpanded ? 'Hide Parameters' : 'Protocol Parameters'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded Parameters Panel */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1">
              Topographic Model
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Synthesized elevation profiles (1,800m to 5,400m ASL) based on public GIS terrain baselines with seasonal road coefficient adjustments.
            </p>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1">
              Convoy Simulation Engine
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Multi-objective shortest-path algorithm balancing travel duration, payload tonnages, road hazards, and mountain pass risk indices.
            </p>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1">
              Non-Destructive Sandbox
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Simulated disruptions (landslides, blizzards, traffic surges) execute in-memory with instantaneous 1-click restore to pristine baseline.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default SyntheticNoticeBanner;
