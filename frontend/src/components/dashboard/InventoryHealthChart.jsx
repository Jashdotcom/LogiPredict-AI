import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { SkeletonChart } from '../feedback/Skeleton';
import { INVENTORY_HEALTH_DATA, INVENTORY_DISTRIBUTION_DATA } from '../../data/dashboard/dashboardMockData';

/**
 * Custom Tooltip for Inventory Health Chart
 */
function CustomInventoryTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const current = payload.find((p) => p.dataKey === 'current')?.value;
    const optimal = payload.find((p) => p.dataKey === 'optimal')?.value;
    const safety = payload.find((p) => p.dataKey === 'safetyStock')?.value ?? 30;

    return (
      <div className="bg-slate-900 text-white text-xs rounded-xl p-3.5 shadow-xl border border-slate-700 space-y-1.5 min-w-48 z-50">
        <p className="font-bold text-slate-100 border-b border-slate-800 pb-1.5">
          {label}
        </p>
        <div className="flex justify-between items-center text-indigo-300">
          <span>Current Stock:</span>
          <span className="font-bold">{current}%</span>
        </div>
        <div className="flex justify-between items-center text-slate-300">
          <span>Optimal Target:</span>
          <span className="font-medium">{optimal}%</span>
        </div>
        <div className="flex justify-between items-center text-amber-400">
          <span>Safety Threshold:</span>
          <span className="font-medium">{safety}%</span>
        </div>
        {current < safety && (
          <p className="text-[11px] text-rose-400 font-semibold pt-1 border-t border-slate-800">
            ⚠ Deficit below safety buffer!
          </p>
        )}
      </div>
    );
  }
  return null;
}

/**
 * Inventory Health & Stock Capacity Chart Component
 */
export function InventoryHealthChart({
  data = INVENTORY_HEALTH_DATA,
  distribution = INVENTORY_DISTRIBUTION_DATA,
  isLoading = false,
}) {
  if (isLoading) {
    return <SkeletonChart height={340} />;
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader
        title="Inventory Health & Stock Capacity"
        subtitle="Real-time stock ratio vs safety threshold across key supply categories"
        action={
          <Badge variant="success" size="xs" dot>
            {data.length} Categories Monitored
          </Badge>
        }
      />

      {/* Stock distribution quick summary pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 px-1">
        {distribution.map((item) => (
          <div
            key={item.name}
            className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex flex-col"
          >
            <span className="text-[10px] font-semibold text-slate-500 truncate">
              {item.name.split('(')[0]}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm font-bold text-slate-900">{item.value}%</span>
              <span className="text-[10px] text-slate-400">({item.count.split(' ')[0]})</span>
            </div>
          </div>
        ))}
      </div>

      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
            barGap={6}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="category"
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              interval={0}
              angle={-15}
              textAnchor="end"
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              unit="%"
              domain={[0, 100]}
            />
            <Tooltip content={<CustomInventoryTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }}
            />
            <ReferenceLine
              y={35}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              label={{
                value: 'Safety Baseline (35%)',
                fill: '#d97706',
                fontSize: 10,
                position: 'insideBottomRight',
              }}
            />
            <Bar
              name="Current Stock Level"
              dataKey="current"
              fill="#4f46e5"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              name="Optimal Target"
              dataKey="optimal"
              fill="#cbd5e1"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-auto pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <span className="flex items-center gap-1.5 text-slate-700">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Aggregate Stock Health: <strong className="text-slate-900">94.2% Optimal</strong>
        </span>
        <span className="text-amber-600 font-medium inline-flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          1 Category below safety buffer (ECWCS)
        </span>
      </div>
    </Card>
  );
}

export default InventoryHealthChart;
