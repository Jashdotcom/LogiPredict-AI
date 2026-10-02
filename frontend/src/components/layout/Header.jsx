import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Menu,
  Bell,
  Sparkles,
  Calendar,
  ChevronDown,
  RefreshCw,
  Clock,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { SearchInput } from '../common/SearchInput';
import { IconButton } from '../common/IconButton';
import { NotificationIndicator } from '../common/NotificationIndicator';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { CURRENT_USER } from '../../data/navigationConfig';
import { formatDate } from '../../utils/formatters';
import { cn } from '../../utils/cn';

// Route title dictionary
const ROUTE_TITLES = {
  '/': { title: 'Dashboard', category: 'Command Center' },
  '/inventory': { title: 'Inventory Management', category: 'Stock & Storage' },
  '/forecasting': { title: 'Demand Forecasting', category: 'Predictive Intelligence' },
  '/routes': { title: 'GIS Route Planning', category: 'Fleet & Transit' },
  '/supplies': { title: 'Supply Management', category: 'Forward Logistics' },
  '/alerts': { title: 'Predictive Alerts', category: 'Anomaly Detection' },
  '/reports': { title: 'Analytics & Reports', category: 'Intelligence & Audits' },
  '/analytics': { title: 'Analytics & Reports', category: 'Intelligence & Audits' },
  '/settings': { title: 'Settings', category: 'System Configuration' },
};

/**
 * Enterprise Application Top Navigation Header
 */
export function Header({ onMenuClick }) {
  const location = useLocation();
  const [searchValue, setSearchValue] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  const currentRouteInfo = ROUTE_TITLES[location.pathname] || {
    title: 'Command Center',
    category: 'LogiPredict AI',
  };

  const todayDateString = '02 Oct 2026';

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 transition-colors">
      {/* Left side: Mobile Toggle & Page Context */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open sidebar menu"
          className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Current Module Breadcrumb / Title */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-indigo-600 truncate">
              {currentRouteInfo.category}
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
              {currentRouteInfo.title}
            </h2>
          </div>
        </div>
      </div>

      {/* Middle: Global Search Bar */}
      <div className="hidden lg:flex flex-1 max-w-md mx-4">
        <SearchInput
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search SKUs, batches, routes, warehouses..."
          shortcut="/"
        />
      </div>

      {/* Right side: Live Date Context, Refresh, Notifications & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live Date / Time Badge (Hidden on mobile) */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium">{todayDateString}</span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-emerald-700 font-semibold text-[11px]">Sync Active</span>
        </div>

        {/* Refresh telemetry button */}
        <IconButton
          icon={RefreshCw}
          title="Refresh real-time telemetry"
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className={cn(isRefreshing ? 'animate-spin text-indigo-600' : '')}
        />

        {/* Predictive AI Quick Action (Hidden on smaller screens) */}
        <Link to="/forecasting" className="hidden sm:inline-flex">
          <Button
            variant="subtleBrand"
            size="sm"
            leftIcon={Sparkles}
          >
            Run Forecast
          </Button>
        </Link>

        {/* Notifications */}
        <div className="relative">
          <NotificationIndicator
            count={4}
            hasUrgent={true}
            onClick={() => setShowNotificationMenu(!showNotificationMenu)}
          />

          {/* Quick Notification Dropdown Preview */}
          {showNotificationMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200/90 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">Predictive Alerts</span>
                  <Badge variant="danger" size="xs">4 Urgent</Badge>
                </div>
                <Link
                  to="/alerts"
                  onClick={() => setShowNotificationMenu(false)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View all
                </Link>
              </div>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                <div className="p-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        Stockout Risk: Microcontroller Units
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Pune West Hub — Bay 4B (Depletion in 42h)
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">12 mins ago</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        Transit Delay: Lithium Cells (+14h)
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Expressway landslide clearance in progress
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">38 mins ago</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 px-4 border-t border-slate-100 text-center">
                <Link
                  to="/alerts"
                  onClick={() => setShowNotificationMenu(false)}
                  className="text-xs font-medium text-slate-600 hover:text-indigo-600"
                >
                  Open Anomaly Control Room &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-indigo-100">
              {CURRENT_USER.initials}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
          </div>

          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-800 leading-tight">
              {CURRENT_USER.name}
            </span>
            <span className="text-[10px] text-slate-500 leading-tight">
              {CURRENT_USER.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
