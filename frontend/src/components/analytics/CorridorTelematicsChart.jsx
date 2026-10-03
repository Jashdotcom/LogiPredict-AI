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
} from 'recharts';
import { Truck, AlertTriangle, ShieldCheck, MapPin, Gauge } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { SkeletonChart } from '../feedback/Skeleton';

const ROAD_CONDITION_BADGES = {
  Clear_All_Weather: { label: 'Clear Route', variant: 'success' },
  High_Altitude_Pass: { label: 'High Altitude Pass', variant: 'warning' },
  Snow_Bound: { label: 'Snow Bound (Chains Req.)', variant: 'rose' },
  Landslide_Alert: { label: 'Active Slide Risk', variant: 'danger' },
};

/**
 * Custom Tooltip for Corridor Telematics
 */
function CustomCorridorTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const actual = payload.find((p) => p.dataKey === 'actual_hours')?.value;
    const standard = payload.find((p) => p.dataKey === 'standard_hours')?.value;
    const dataObj = payload[0]?.payload || {};
    const delay = dataObj.delay_hours || 0;
    const otd = dataObj.on_time_rate_percentage || 0;
    const convoys = dataObj.total_convoys || 0;

    return (
      <div className="bg-[#131b2e] text-white text-xs rounded-xl p-3.5 shadow-xl border border-slate-700 space-y-2 min-w-56 z-50 animate-in fade-in duration-150">
        <p className="font-bold text-slate-100 border-b border-slate-800 pb-1.5 flex items-center justify-between">
          <span className="truncate pr-2">{dataObj.route_name || label}</span>
          <span className="text-[10px] text-amber-400 font-mono shrink-0">{convoys} Convoys</span>
        </p>

        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between items-center text-slate-300">
            <span>Standard Planned:</span>
            <span className="font-bold font-numeric">{standard} hrs</span>
          </div>
          <div className="flex justify-between items-center text-amber-400">
            <span>Actual Telematics:</span>
            <span className="font-bold font-numeric">{actual} hrs</span>
          </div>
          <div className="flex justify-between items-center text-rose-400">
            <span>Transit Variance:</span>
            <span className="font-bold font-numeric">
              {delay > 0 ? `+${delay} hrs` : `${delay} hrs`}
            </span>
          </div>
          <div className="flex justify-between items-center text-emerald-400 pt-1 border-t border-slate-800">
            <span>On-Time Rate:</span>
            <span className="font-bold font-numeric">{otd}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

/**
 * Convoy Corridor Telematics & Delivery Performance Chart Component
 */
export function CorridorTelematicsChart({
  deliveryData,
  isLoading = false,
}) {
  if (isLoading) {
    return <SkeletonChart height={380} />;
  }

  const corridors = (deliveryData?.corridor_metrics || []).map((c) => ({
    name: c.route_name.split('(')[0].trim(),
    fullName: c.route_name,
    route_id: c.route_id,
    standard_hours: c.standard_hours,
    actual_hours: c.actual_hours,
    delay_hours: c.delay_hours,
    on_time_rate_percentage: c.on_time_rate_percentage,
    total_convoys: c.total_convoys,
    road_condition: c.road_condition,
  }));

  const otdRate = deliveryData?.on_time_delivery_rate_percentage ?? 96.2;
  const avgTransit = deliveryData?.average_transit_hours ?? 6.8;
  const totalDeliveries = deliveryData?.total_deliveries ?? 156;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader
        title="Convoy Corridor Telematics & Delivery Performance"
        subtitle="Himalayan mountain axis transit durations, choke point delays, and on-time reliability"
        action={
          <Badge variant="amber" size="xs" icon={Truck} dot>
            {totalDeliveries} Convoys Audited
          </Badge>
        }
      />

      {/* Corridor Telematics Bar Chart */}
      <div className="h-64 sm:h-72 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={corridors}
            layout="vertical"
            margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
            barCategoryGap={6}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              unit="h"
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              width={110}
            />
            <Tooltip content={<CustomCorridorTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }}
            />

            <Bar
              name="Planned Standard (Hours)"
              dataKey="standard_hours"
              fill="#475569"
              radius={[0, 3, 3, 0]}
              barSize={10}
            />
            <Bar
              name="Actual Telematics (Hours)"
              dataKey="actual_hours"
              fill="#f59e0b"
              radius={[0, 3, 3, 0]}
              barSize={10}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Strategic Mountain Corridor Status Pills */}
      <div className="mt-2 pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {corridors.slice(0, 4).map((corridor) => {
          const badgeCfg = ROAD_CONDITION_BADGES[corridor.road_condition] || {
            label: corridor.road_condition,
            variant: 'secondary',
          };

          return (
            <div
              key={corridor.route_id}
              className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
            >
              <div className="min-w-0 pr-2">
                <p className="font-semibold text-slate-200 truncate">{corridor.fullName}</p>
                <p className="text-[10px] text-slate-400 font-numeric">
                  {corridor.total_convoys} Convoys • {corridor.on_time_rate_percentage}% OTD
                </p>
              </div>
              <Badge variant={badgeCfg.variant} size="xs" className="shrink-0 text-[10px]">
                {badgeCfg.label}
              </Badge>
            </div>
          );
        })}
      </div>

      <div className="mt-auto pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <span className="flex items-center gap-1.5 text-slate-300">
          <Gauge className="w-4 h-4 text-amber-400" />
          Fleet Mean Transit: <strong className="text-amber-300 font-numeric">{avgTransit} Hours</strong>
        </span>
        <span className="flex items-center gap-1.5 text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Convoy Reliability (OTD): <strong className="text-emerald-300 font-numeric">{otdRate}%</strong>
        </span>
      </div>
    </Card>
  );
}

export default CorridorTelematicsChart;
