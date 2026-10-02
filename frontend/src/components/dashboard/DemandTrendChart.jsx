import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Sparkles, TrendingUp } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { SkeletonChart } from '../feedback/Skeleton';
import { DEMAND_FORECAST_DATA } from '../../data/dashboard/dashboardMockData';
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
      <div className="bg-slate-900 text-white text-xs rounded-xl p-3.5 shadow-xl border border-slate-700 space-y-1.5 min-w-52 z-50">
        <p className="font-bold text-slate-100 border-b border-slate-800 pb-1.5">
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
          <div className="flex justify-between items-center text-slate-400 text-[11px] pt-1 border-t border-slate-800">
            <span>95% Confidence Interval:</span>
            <span>{formatNumber(lower)} – {formatNumber(upper)}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
}

/**
 * 14-Day Demand Trend vs AI Predictive Forecast Chart Component
 */
export function DemandTrendChart({
  data = DEMAND_FORECAST_DATA,
  isLoading = false,
}) {
  if (isLoading) {
    return <SkeletonChart height={340} />;
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader
        title="14-Day Demand Trend vs AI Forecast"
        subtitle="7-day historical actuals vs next 7-day predictive projection"
        action={
          <Badge variant="brand" size="xs" icon={Sparkles} dot dotPulse>
            Hybrid LSTM-XGBoost
          </Badge>
        }
      />

      {/* Model accuracy telemetry chips */}
      <div className="flex flex-wrap items-center gap-2 mb-3 px-1 text-xs">
        <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-1 rounded-md font-medium">
          Model Accuracy: <strong>96.8%</strong>
        </span>
        <span className="bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md">
          MAPE: <strong>3.2%</strong>
        </span>
        <span className="bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md">
          Horizon: <strong>14 Days</strong>
        </span>
      </div>

      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              {/* Historical actual gradient */}
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
              </linearGradient>
              {/* Forecast gradient */}
              <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
            />
            <Tooltip content={<CustomDemandTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }}
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

            {/* Historical Actual Line */}
            <Area
              type="monotone"
              dataKey="actual"
              name="Actual Throughput"
              stroke="#2563eb"
              strokeWidth={2.5}
              fill="url(#actualGradient)"
              activeDot={{ r: 5, fill: '#2563eb' }}
            />

            {/* Forecast Line */}
            <Area
              type="monotone"
              dataKey="forecast"
              name="AI Predicted Demand"
              stroke="#7c3aed"
              strokeWidth={2.5}
              strokeDasharray="5 5"
              fill="url(#forecastGradient)"
              activeDot={{ r: 5, fill: '#7c3aed' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-auto pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <span className="flex items-center gap-1.5 text-indigo-700 font-medium">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          +14.2% demand surge projected on Day 13 (Weekend Buffer)
        </span>
        <span className="text-slate-500">Updated: 15 mins ago</span>
      </div>
    </Card>
  );
}

export default DemandTrendChart;
