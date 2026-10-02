import React from 'react';
import {
  Sparkles,
  FileSpreadsheet,
  MapPin,
  Download,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../common/Button';
import { QUICK_ACTIONS } from '../../data/mockDashboardData';
import { cn } from '../../utils/cn';

const ICON_MAP = {
  Sparkles,
  FileSpreadsheet,
  MapPin,
  Download,
};

/**
 * Quick Actions Bar for Command Center operations
 */
export function QuickActionsBar({
  actions = QUICK_ACTIONS,
  onActionClick,
}) {
  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl p-5 sm:p-6 text-white shadow-lg border border-slate-800">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-white tracking-tight">
              LogiPredict AI Autonomous Operations
            </h3>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Execute automated forward supply chain balancing, run neural demand inferences, or generate supplier procurement orders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-indigo-300 font-mono bg-indigo-900/50 px-2.5 py-1 rounded border border-indigo-700/40">
            Engine: Hybrid LSTM-XGBoost
          </span>
        </div>
      </div>

      {/* Grid of Quick Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((act) => {
          const Icon = ICON_MAP[act.icon] || Sparkles;

          return (
            <button
              key={act.id}
              type="button"
              onClick={() => onActionClick && onActionClick(act)}
              className={cn(
                'flex flex-col items-start text-left p-3.5 rounded-lg border transition-all duration-150 group cursor-pointer',
                'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 hover:border-indigo-500/50 hover:shadow-md'
              )}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div className="w-8 h-8 rounded-md bg-indigo-500/20 text-indigo-300 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
              </div>

              <span className="text-xs font-bold text-white group-hover:text-indigo-200 transition-colors">
                {act.label}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                {act.detail || act.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default QuickActionsBar;
