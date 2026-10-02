import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Boxes,
} from 'lucide-react';
import { NAVIGATION_ITEMS, SECONDARY_NAVIGATION } from '../../data/navigationConfig';
import { cn } from '../../utils/cn';

/**
 * Enterprise Command Sidebar Navigation for LogiPredict AI
 * Aligned with Google Stitch military enterprise dashboard theme.
 */
export function Sidebar({ isOpen, onClose, isMobile = false }) {
  return (
    <aside
      aria-label="Application Command Sidebar"
      className={cn(
        'flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800 transition-all duration-300 select-none z-30',
        isMobile
          ? 'w-72 shadow-2xl fixed inset-y-0 left-0'
          : 'w-64 shrink-0 fixed inset-y-0 left-0 hidden md:flex'
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 shrink-0">
        <NavLink
          to="/"
          onClick={isMobile ? onClose : undefined}
          className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-lg p-1"
          aria-label="LogiPredict AI Command Center Home"
        >
          {/* Logo Mark */}
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 ring-1 ring-white/20 group-hover:scale-105 transition-transform duration-200">
            <Boxes className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                LogiPredict
              </span>
              <span className="text-[11px] font-bold text-indigo-400 bg-indigo-950/80 px-1.5 py-0.2 rounded border border-indigo-700/50">
                AI
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
              Indian Army • SIH 2026
            </span>
          </div>
        </NavLink>
      </div>

      {/* Main Navigation Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
        {/* Primary Command Center Menu */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Command Center</span>
            <span className="text-[9px] font-mono text-slate-500">v1.4</span>
          </div>
          <nav className="space-y-1" aria-label="Main Navigation">
            {NAVIGATION_ITEMS.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={isMobile ? onClose : undefined}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center justify-between px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={cn(
                            'w-4 h-4 shrink-0 transition-colors',
                            isActive
                              ? 'text-white'
                              : 'text-slate-400 group-hover:text-white'
                          )}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={cn(
                            'text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0',
                            item.badgeVariant === 'danger'
                              ? 'bg-rose-500 text-white animate-pulse'
                              : item.badgeVariant === 'purple'
                              ? 'bg-purple-900/80 text-purple-200 border border-purple-700/60'
                              : isActive
                              ? 'bg-indigo-800 text-indigo-200'
                              : 'bg-indigo-950 text-indigo-300 border border-indigo-800/60'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* System & Config Menu */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            System & Engine
          </div>
          <nav className="space-y-1" aria-label="System Settings Navigation">
            {SECONDARY_NAVIGATION.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={isMobile ? onClose : undefined}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center justify-between px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                    )
                  }
                >
                  {({ isActive }) => (
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0 transition-colors',
                          isActive
                            ? 'text-white'
                            : 'text-slate-400 group-hover:text-white'
                        )}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* AI Telemetry Status Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 shrink-0">
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-semibold text-slate-200">
                AI Engine Online
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-1 py-0.2 rounded">
              v1.4-active
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Latency: 28ms</span>
            <span>Sync: Live</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
