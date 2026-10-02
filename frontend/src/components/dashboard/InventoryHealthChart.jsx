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
import { Card, CardHeader } from '../common/Card';
import { Badge } from '../common/Badge';
import { INVENTORY_HEALTH_DATA } from '../../data/mockDashboardData';

/**
 * Custom Tooltip for Inventory Health Chart
 */
function CustomInventoryTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const current = payload.find((p) => p.dataKey === 'current')?.value;
    const optimal = payload.find((p) => p.dataKey === 'optimal')?.value;
    const reorder = payload.find((p) => p.dataKey === 'reorderLevel')?.value;

    return (
      <div className="bg-slate-900 text-white text-xs rounded-lg p-3 shadow-xl border border-slate-700 space-y-1.5 min-w-44">
        <p className="font-semibold text-slate-200 border-b border-slate-800 pb-1">
          {label}
        </p>
        <div className="flex justify-between items-center text-emerald-400">
          <span>Current Stock:</span>
          <span className="font-bold">{current}%</span>
        </div>
        <div className="flex justify-between items-center text-indigo-300">
          <span>Optimal Target:</span>
          <span className="font-medium">{optimal}%</span>
        </div>
        <div className="flex justify-between items-center text-amber-400">
          <span>Reorder Threshold:</span>
          <span className="font-medium">{reorder}%</span>
        </div>
      </div>
    );
  }
  return null;
}

/**
 * Inventory Health & Stock Distribution Chart Scaffold
 */
export function InventoryHealthChart({ data = INVENTORY_HEALTH_DATA }) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader
        title="Inventory Health & Stock Capacity"
        subtitle="Real-time stock ratio vs safety threshold across primary SKU categories"
        action={
          <Badge variant="success" size="xs" dot>
            6 Categories Monitored
          </Badge>
        }
      />

      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
            barGap={6}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="category"
              tick={{ fill: '#64748b', fontSize: 11 }}
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
              wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
            />
            <ReferenceLine
              y={30}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              label={{
                value: 'Min Safety Line (30%)',
                fill: '#d97706',
                fontSize: 10,
                position: 'insideBottomRight',
              }}
            />
            <Bar
              name="Current Level"
              dataKey="current"
              fill="#4f46e5"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Bar
              name="Optimal Target"
              dataKey="optimal"
              fill="#cbd5e1"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Average SKU Stock Level: <strong className="text-slate-800">80.8%</strong></span>
        <span className="text-amber-600 font-medium">1 Category near safety buffer</span>
      </div>
    </Card>
  );
}

export default InventoryHealthChart;
