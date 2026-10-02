import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  Sparkles,
  Route,
  Sliders,
  BellRing,
  ArrowRight,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { QUICK_ACTIONS } from '../../data/dashboard/dashboardMockData';
import { cn } from '../../utils/cn';

const ICON_MAP = {
  Boxes,
  Sparkles,
  Route,
  Sliders,
  BellRing,
  ShieldAlert,
  Zap,
};

/**
 * Quick Actions Bar for Command Center operations
 */
export function QuickActionsBar({
  actions = QUICK_ACTIONS,
  onActionClick,
}) {
  const navigate = useNavigate();

  const handleItemClick = (act) => {
    if (onActionClick) {
      onActionClick(act);
    } else if (act.path) {
      navigate(act.path);
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-xl border border-slate-800">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Zap className="w-4 h-4 text-indigo-300" />
            </span>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Autonomous Supply Operations & Fast Actions
            </h3>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Execute emergency inter-depot buffer balancing, run multi-horizon neural demand inferences, plan weather-resilient convoy routes, or inspect active alerts.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-emerald-300 font-mono bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-700/50 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            AI Pipeline: Online (96.8% Accuracy)
          </span>
        </div>
      </div>

      {/* Grid of Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {actions.map((act) => {
          const Icon = ICON_MAP[act.icon] || Sparkles;
          const isPrimary = act.variant === 'primary';

          return (
            <button
              key={act.id}
              type="button"
              onClick={() => handleItemClick(act)}
              className={cn(
                'flex flex-col items-start text-left p-3.5 rounded-xl border transition-all duration-200 group cursor-pointer',
                isPrimary
                  ? 'bg-indigo-600/90 hover:bg-indigo-600 border-indigo-500 shadow-md shadow-indigo-600/20 hover:scale-[1.02]'
                  : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 hover:border-indigo-500/50 hover:shadow-md'
              )}
            >
              <div className="flex items-center justify-between w-full mb-2.5">
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                    isPrimary
                      ? 'bg-white/20 text-white'
                      : 'bg-indigo-500/20 text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <ArrowRight
                  className={cn(
                    'w-4 h-4 transition-transform group-hover:translate-x-1',
                    isPrimary ? 'text-indigo-200' : 'text-slate-400 group-hover:text-indigo-300'
                  )}
                />
              </div>

              <span className="text-xs font-bold text-white group-hover:text-indigo-100 transition-colors">
                {act.label}
              </span>
              <span
                className={cn(
                  'text-[11px] mt-1 line-clamp-2 leading-tight',
                  isPrimary ? 'text-indigo-100' : 'text-slate-400'
                )}
              >
                {act.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default QuickActionsBar;
