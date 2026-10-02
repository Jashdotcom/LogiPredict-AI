import React from 'react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Sparkles } from 'lucide-react';
import { Card, CardHeader } from '../common/Card';
import { Badge } from '../common/Badge';
import { DEMAND_FORECAST_DATA } from '../../data/mockDashboardData';
import { formatNumber } from '../../utils/formatters';

/**
 * Custom Tooltip for Demand Forecast Chart
 */
function CustomDemandTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const actual = payload.find((p) => p.dataKey === 'actual')?.value;
    const forecast = payload.find((p) => p.dataKey === 'forecast')?.value;
    const lower = payload.find((p) => p.dataKey === 'lowerBound')?.value;
    const upper = payload.find((p) => p.dataKey === 'upperBound')?.value;

    return (
      <div className="bg-slate-900 text-white text-xs rounded-lg p-3 shadow-xl border border-slate-700 space-y-1.5 min-w-48">
        <p className="font-semibold text-slate-200 border-b border-slate-800 pb-1">
          {label}
        </p>
        {actual !== null && actual !== undefined && (
          <div className="flex justify-between items-center text-blue-400">
            <span>Historical Demand:</span>
            <span className="font-bold">{formatNumber(actual)} units</span>
          </div>
        )}
        {forecast && (
          <div className="flex justify-between items-center text-indigo-300">
            <span>AI Predicted Demand:</span>
            <span className="font-bold">{formatNumber(forecast)} units</span>
          </div>
        )}
        {lower && upper && (
          <div className="flex justify-between items-center text-slate-400 text-[10px] pt-0.5">
            <span>95% Confidence:</span>
            <span>{formatNumber(lower)} – {formatNumber(upper)}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
}

/**
 * 14-Day Demand Trend vs AI Predictive Forecast Chart Scaffold
 */
export function DemandTrendChart({ data = DEMAND_FORECAST_DATA }) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader
        title="14-Day Demand Trend vs AI Forecast"
        subtitle="Historical aggregate throughput and next 7-day predictive projection"
        action={
          <Badge variant="brand" size="xs" icon={Sparkles}>
            Neural Time-Series Model
          </Badge>
        }
      />

      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              {/* Historical actual gradient */}
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
              {/* Forecast gradient */}
              <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tickFormatter={(v) => `${v / 1000}k`}
            />
            <Tooltip content={<CustomDemandTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
            />

            {/* Transition marker line between past and future */}
            <ReferenceLine
              x="Day 7 (Sun)"
              stroke="#64748b"
              strokeDasharray="4 4"
              label={{
                value: 'Today (Forecast Horizon)',
                fill: '#475569',
                fontSize: 10,
                position: 'insideTopLeft',
              }}
            />

            {/* Historical line */}
            <Area
              type="monotone"
              dataKey="actual"
              name="Actual Demand"
              stroke="#2563eb"
              strokeWidth={2.5}
              fill="url(#actualGradient)"
              activeDot={{ r: 5, fill: '#2563eb' }}
            />

            {/* Forecast line */}
            <Area
              type="monotone"
              dataKey="forecast"
              name="AI Forecast"
              stroke="#7c3aed"
              strokeWidth={2.5}
              strokeDasharray="5 5"
              fill="url(#forecastGradient)"
              activeDot={{ r: 5, fill: '#7c3aed' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Forecast Horizon: <strong className="text-slate-800">Next 7 Days</strong></span>
        <span className="text-indigo-600 font-medium">+14.2% demand surge projected on Day 13</span>
      </div>
    </Card>
  );
}

export default DemandTrendChart;
