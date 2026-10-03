import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { AlertOctagon, ShieldCheck, AlertTriangle, Building2, Package, Eye } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { SkeletonChart } from '../feedback/Skeleton';
import { formatNumber } from '../../utils/formatters';

/**
 * Custom Tooltip for Stockout Risk Matrix Chart
 */
function CustomStockoutRiskTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const healthy = payload.find((p) => p.dataKey === 'healthy')?.value || 0;
    const lowStock = payload.find((p) => p.dataKey === 'low_stock')?.value || 0;
    const critical = payload.find((p) => p.dataKey === 'critical')?.value || 0;
    const predicted = payload.find((p) => p.dataKey === 'predicted_stockout')?.value || 0;
    const total = healthy + lowStock + critical + predicted;

    return (
      <div className="bg-[#131b2e] text-white text-xs rounded-xl p-3.5 shadow-xl border border-slate-700 space-y-2 min-w-52 z-50 animate-in fade-in duration-150">
        <p className="font-bold text-slate-100 border-b border-slate-800 pb-1.5 flex items-center justify-between">
          <span className="truncate pr-2">{label}</span>
          <span className="text-[10px] text-slate-400 font-mono shrink-0">{total} SKUs</span>
        </p>

        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between items-center text-emerald-400">
            <span>Optimal Stock:</span>
            <span className="font-bold font-numeric">{healthy} items</span>
          </div>
          <div className="flex justify-between items-center text-amber-400">
            <span>Low Stock (Warning):</span>
            <span className="font-bold font-numeric">{lowStock} items</span>
          </div>
          <div className="flex justify-between items-center text-rose-400">
            <span>Critical Deficit:</span>
            <span className="font-bold font-numeric">{critical} items</span>
          </div>
          <div className="flex justify-between items-center text-purple-400">
            <span>Predicted Stockout:</span>
            <span className="font-bold font-numeric">{predicted} items</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

/**
 * Stockout Risk Distribution across Command Nodes Component
 */
export function StockoutRiskMatrixChart({
  riskData,
  isLoading = false,
}) {
  const [viewMode, setViewMode] = useState('depot'); // 'depot' | 'category'
  const [showCriticalDrawer, setShowCriticalDrawer] = useState(false);

  if (isLoading) {
    return <SkeletonChart height={380} />;
  }

  const byDepot = (riskData?.by_depot || []).map((d) => ({
    name: d.depot_name.replace(' Logistics', '').replace(' Supply Depot', '').replace(' Forward', ''),
    fullName: d.depot_name,
    healthy: d.healthy,
    low_stock: d.low_stock,
    critical: d.critical,
    predicted_stockout: d.predicted_stockout,
  }));

  const byCategory = (riskData?.by_category || []).map((c) => ({
    name: c.category.split(' ')[0],
    fullName: c.category,
    healthy: c.healthy,
    low_stock: c.low_stock,
    critical: c.critical,
    predicted_stockout: c.predicted_stockout,
  }));

  const chartData = viewMode === 'depot' ? byDepot : byCategory;
  const criticalItems = riskData?.critical_items || [];
  const healthyCount = riskData?.healthy_count ?? 19;
  const lowStockCount = riskData?.low_stock_count ?? 4;
  const criticalCount = riskData?.critical_count ?? 2;
  const predictedCount = riskData?.predicted_stockout_count ?? 3;
  const totalItems = riskData?.total_items ?? 25;
  const healthyPercentage = riskData?.healthy_percentage ?? 76.0;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader
        title="Stockout Risk Distribution across Command Nodes"
        subtitle="Vulnerability matrix categorizing forward stockpiles by risk severity"
        action={
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('depot')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                viewMode === 'depot'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>By Depot</span>
            </button>
            <button
              onClick={() => setViewMode('category')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                viewMode === 'category'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>By Category</span>
            </button>
          </div>
        }
      />

      {/* Aggregate Health Summary Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 px-1">
        <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/50 flex flex-col">
          <span className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wider">
            Optimal Stock
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-sm font-bold text-emerald-100 font-numeric">{healthyCount}</span>
            <span className="text-[10px] text-emerald-400 font-numeric">({healthyPercentage}%)</span>
          </div>
        </div>

        <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-800/50 flex flex-col">
          <span className="text-[10px] font-semibold text-amber-300 uppercase tracking-wider">
            Low Stock
          </span>
          <span className="text-sm font-bold text-amber-100 font-numeric mt-0.5">
            {lowStockCount} SKUs
          </span>
        </div>

        <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-800/50 flex flex-col">
          <span className="text-[10px] font-semibold text-rose-300 uppercase tracking-wider">
            Critical Deficits
          </span>
          <span className="text-sm font-bold text-rose-100 font-numeric mt-0.5">
            {criticalCount} SKUs
          </span>
        </div>

        <div className="p-2 rounded-lg bg-purple-950/40 border border-purple-800/50 flex flex-col">
          <span className="text-[10px] font-semibold text-purple-300 uppercase tracking-wider">
            Predicted Stockout
          </span>
          <span className="text-sm font-bold text-purple-100 font-numeric mt-0.5">
            {predictedCount} SKUs
          </span>
        </div>
      </div>

      {/* Stacked Risk Distribution Bar Chart */}
      <div className="h-64 sm:h-72 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
            barSize={24}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              interval={0}
              angle={-10}
              textAnchor="end"
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomStockoutRiskTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }}
            />

            <Bar
              name="Optimal"
              dataKey="healthy"
              stackId="a"
              fill="#10b981"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              name="Low Stock"
              dataKey="low_stock"
              stackId="a"
              fill="#f59e0b"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              name="Critical Deficit"
              dataKey="critical"
              stackId="a"
              fill="#ef4444"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              name="Predicted Stockout"
              dataKey="predicted_stockout"
              stackId="a"
              fill="#a855f7"
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Critical SKU Alert Callout */}
      {criticalItems.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5" />
              Critical Stockout Watchlist ({criticalItems.length} SKUs)
            </span>
            <button
              onClick={() => setShowCriticalDrawer(!showCriticalDrawer)}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium underline cursor-pointer"
            >
              {showCriticalDrawer ? 'Hide Details' : 'View SKU Details'}
            </button>
          </div>

          {showCriticalDrawer && (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {criticalItems.map((item) => (
                <div
                  key={item.item_id}
                  className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-semibold text-slate-200 truncate">{item.item_name}</p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {item.location_name} • {item.category}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        item.risk_level === 'Critical'
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                          : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                      }`}
                    >
                      {item.days_coverage}d coverage
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-numeric">
                      {formatNumber(item.current_stock)} / {formatNumber(item.min_threshold)} {item.unit}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-auto pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <span className="flex items-center gap-1.5 text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Sector Stockout Buffer: <strong className="text-emerald-300">Stable</strong>
        </span>
        <span className="text-slate-400 text-[11px]">
          {totalItems} Active Military SKUs Audited
        </span>
      </div>
    </Card>
  );
}

export default StockoutRiskMatrixChart;
