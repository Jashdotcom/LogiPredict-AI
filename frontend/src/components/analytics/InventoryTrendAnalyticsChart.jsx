import React from 'react';
import {
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Layers, ArrowDownRight, ArrowUpRight, ShieldAlert, Sparkles } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { SkeletonChart } from '../feedback/Skeleton';
import { formatNumber } from '../../utils/formatters';

/**
 * Custom Tooltip for Multi-Echelon Inventory Trend Chart
 */
function CustomInventoryTrendTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const totalStock = payload.find((p) => p.dataKey === 'total_stock')?.value;
    const stockIn = payload.find((p) => p.dataKey === 'stock_in')?.value;
    const stockOut = payload.find((p) => p.dataKey === 'stock_out')?.value;
    const safetyThreshold = payload.find((p) => p.dataKey === 'safety_threshold')?.value;
    const netVelocity = payload.find((p) => p.dataKey === 'net_velocity')?.value;

    return (
      <div className="bg-[#131b2e] text-white text-xs rounded-xl p-3.5 shadow-xl border border-slate-700 space-y-2 min-w-56 z-50 animate-in fade-in duration-150">
        <p className="font-bold text-slate-100 border-b border-slate-800 pb-1.5 flex items-center justify-between">
          <span>{label}</span>
          <span className="text-[10px] text-slate-400 font-mono">TELEMETRY</span>
        </p>

        {totalStock !== undefined && (
          <div className="flex justify-between items-center text-indigo-300">
            <span>On-Hand Aggregate:</span>
            <span className="font-bold font-numeric">{formatNumber(totalStock)} units</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80 text-[11px]">
          <div className="flex flex-col text-emerald-400">
            <span className="text-slate-400 text-[10px]">Supply Inflow</span>
            <span className="font-semibold font-numeric">+{formatNumber(stockIn)}</span>
          </div>
          <div className="flex flex-col text-rose-400">
            <span className="text-slate-400 text-[10px]">Depot Outflow</span>
            <span className="font-semibold font-numeric">-{formatNumber(stockOut)}</span>
          </div>
        </div>

        {netVelocity !== undefined && (
          <div className="flex justify-between items-center text-slate-300 text-[11px] pt-1 border-t border-slate-800/80">
            <span>Net Velocity:</span>
            <span
              className={`font-semibold font-numeric ${
                netVelocity >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {netVelocity >= 0 ? `+${formatNumber(netVelocity)}` : formatNumber(netVelocity)} units
            </span>
          </div>
        )}

        {safetyThreshold !== undefined && (
          <div className="flex justify-between items-center text-amber-400 text-[11px]">
            <span>Safety Threshold:</span>
            <span className="font-numeric">{formatNumber(safetyThreshold)} units</span>
          </div>
        )}
      </div>
    );
  }
  return null;
}

/**
 * Multi-Echelon Forward Inventory Trends Chart Component
 */
export function InventoryTrendAnalyticsChart({
  trendsData,
  isLoading = false,
}) {
  if (isLoading) {
    return <SkeletonChart height={380} />;
  }

  const data = trendsData?.data || [];
  const summary = trendsData?.summary || {};
  const resolution = trendsData?.resolution || 'daily';

  return (
    <Card className="flex flex-col h-full">
      <CardHeader
        title="Multi-Echelon Forward Inventory Trends"
        subtitle={`Stock accumulation, replenishment inflows, and consumption velocity (${resolution} telemetry)`}
        action={
          <Badge variant="brand" size="xs" icon={Layers} dot dotPulse>
            Forward Echelon Real-Time
          </Badge>
        }
      />

      {/* Metric Quick Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 px-1">
        <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 flex flex-col">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Inflow
          </span>
          <div className="flex items-center gap-1 mt-0.5 text-emerald-400 font-bold text-sm font-numeric">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+{formatNumber(summary.total_inflow || 0)}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 flex flex-col">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Outflow
          </span>
          <div className="flex items-center gap-1 mt-0.5 text-rose-400 font-bold text-sm font-numeric">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>-{formatNumber(summary.total_outflow || 0)}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 flex flex-col">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Net Change
          </span>
          <div className="flex items-center gap-1 mt-0.5 text-slate-100 font-bold text-sm font-numeric">
            <span
              className={
                (summary.net_change || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }
            >
              {(summary.net_change || 0) >= 0 ? '+' : ''}
              {formatNumber(summary.net_change || 0)}
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 flex flex-col">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Turnover Rate
          </span>
          <div className="flex items-center gap-1 mt-0.5 text-indigo-300 font-bold text-sm font-numeric">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>{((summary.turnover_rate || 0.235) * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Main Composed Chart */}
      <div className="h-72 sm:h-80 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 15, left: -5, bottom: 5 }}
          >
            <defs>
              <linearGradient id="totalStockGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.2} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              yAxisId="stock"
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              yAxisId="flow"
              orientation="right"
              tick={{ fill: '#475569', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomInventoryTrendTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }}
            />

            {/* Safety Stock Reference Line */}
            <ReferenceLine
              yAxisId="stock"
              y={35000}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              label={{
                value: 'Min Safety Reserve (35,000 units)',
                fill: '#d97706',
                fontSize: 10,
                position: 'insideTopLeft',
              }}
            />

            {/* Supply Inflow Bar */}
            <Bar
              yAxisId="flow"
              name="Replenishment Inflow"
              dataKey="stock_in"
              fill="#10b981"
              radius={[3, 3, 0, 0]}
              maxBarSize={16}
              opacity={0.85}
            />

            {/* Outflow Bar */}
            <Bar
              yAxisId="flow"
              name="Consumption Outflow"
              dataKey="stock_out"
              fill="#f43f5e"
              radius={[3, 3, 0, 0]}
              maxBarSize={16}
              opacity={0.7}
            />

            {/* Total On-Hand Stock Area */}
            <Area
              yAxisId="stock"
              type="monotone"
              dataKey="total_stock"
              name="On-Hand Aggregate Stock"
              stroke="#6366f1"
              strokeWidth={2.5}
              fill="url(#totalStockGrad)"
              activeDot={{ r: 5, fill: '#818cf8', stroke: '#1e1b4b', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-auto pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <span className="flex items-center gap-1.5 text-slate-300">
          <ShieldAlert className="w-4 h-4 text-emerald-400" />
          Aggregate Safety Coverage: <strong className="text-emerald-300 font-numeric">4.1× Safety Buffer</strong>
        </span>
        <span className="text-slate-400 font-mono text-[11px]">
          Current Stock: {formatNumber(summary.current_stock || 142850)} units
        </span>
      </div>
    </Card>
  );
}

export default InventoryTrendAnalyticsChart;
