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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { FileSpreadsheet, CheckCircle2, Clock, Truck, Layers, ArrowRight } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { SkeletonChart } from '../feedback/Skeleton';
import { formatNumber } from '../../utils/formatters';

const CATEGORY_COLORS = {
  'POL Fuel & Lubricants': '#3b82f6',
  'Ordnance & Ammunition': '#ef4444',
  'Rations & Subsistence': '#10b981',
  'Medical & Cold-Chain': '#a855f7',
  'Engineering & Spares': '#f59e0b',
};

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#ef4444', '#a855f7', '#f59e0b', '#06b6d4'];

/**
 * Custom Tooltip for Requisition Trends
 */
function CustomRequisitionTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const created = payload.find((p) => p.dataKey === 'created_orders')?.value || 0;
    const dispatched = payload.find((p) => p.dataKey === 'dispatched_orders')?.value || 0;
    const delivered = payload.find((p) => p.dataKey === 'delivered_orders')?.value || 0;

    return (
      <div className="bg-[#131b2e] text-white text-xs rounded-xl p-3.5 shadow-xl border border-slate-700 space-y-2 min-w-52 z-50 animate-in fade-in duration-150">
        <p className="font-bold text-slate-100 border-b border-slate-800 pb-1.5 flex items-center justify-between">
          <span>{label}</span>
          <span className="text-[10px] text-blue-400 font-mono">REQUISITION OPS</span>
        </p>

        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between items-center text-blue-400">
            <span>Created Orders:</span>
            <span className="font-bold font-numeric">{created} orders</span>
          </div>
          <div className="flex justify-between items-center text-amber-400">
            <span>Dispatched / In-Transit:</span>
            <span className="font-bold font-numeric">{dispatched} orders</span>
          </div>
          <div className="flex justify-between items-center text-emerald-400">
            <span>Completed / Delivered:</span>
            <span className="font-bold font-numeric">{delivered} orders</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

/**
 * Replenishment Summary & Requisition Lifecycle Component
 */
export function ReplenishmentLifecycleChart({
  replenishmentData,
  isLoading = false,
}) {
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'categories'

  if (isLoading) {
    return <SkeletonChart height={380} />;
  }

  const statusBreakdown = replenishmentData?.status_breakdown || {
    draft: 2,
    submitted: 1,
    approved: 5,
    dispatched: 3,
    in_transit: 3,
    delivered: 28,
    cancelled: 1,
  };

  const trendData = replenishmentData?.requisition_trends || [];
  const fulfillmentRate = replenishmentData?.fulfillment_rate_percentage ?? 96.5;
  const leadTime = replenishmentData?.average_lead_time_days ?? 4.2;
  const totalRequisitions = replenishmentData?.total_requisitions ?? 43;
  const activeOrders = replenishmentData?.active_requisitions ?? 8;

  const categoryVolumes = Object.entries(replenishmentData?.volume_by_category || {}).map(
    ([name, value], index) => ({
      name,
      value: Number(value),
      color: CATEGORY_COLORS[name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    })
  );

  const pipelineStages = [
    { label: 'Draft', count: statusBreakdown.draft || 0, color: 'text-slate-400', bg: 'bg-slate-800/80', border: 'border-slate-700' },
    { label: 'Submitted', count: statusBreakdown.submitted || 0, color: 'text-blue-400', bg: 'bg-blue-950/40', border: 'border-blue-800/50' },
    { label: 'Approved', count: statusBreakdown.approved || 0, color: 'text-indigo-400', bg: 'bg-indigo-950/40', border: 'border-indigo-800/50' },
    { label: 'Dispatched', count: statusBreakdown.dispatched || 0, color: 'text-amber-400', bg: 'bg-amber-950/40', border: 'border-amber-800/50' },
    { label: 'In Transit', count: statusBreakdown.in_transit || 0, color: 'text-purple-400', bg: 'bg-purple-950/40', border: 'border-purple-800/50' },
    { label: 'Delivered', count: statusBreakdown.delivered || 0, color: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-800/50' },
  ];

  return (
    <Card className="flex flex-col h-full">
      <CardHeader
        title="Replenishment Summary & Requisition Lifecycle"
        subtitle="Multi-echelon indent fulfillment status, lead times, and throughput pipeline"
        action={
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'pipeline'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pipeline Velocity
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'categories'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Category Allocation
            </button>
          </div>
        }
      />

      {/* Requisition Status Progression Ribbon */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-3 px-1">
        {pipelineStages.map((stage, idx) => (
          <div
            key={stage.label}
            className={`p-2 rounded-lg border ${stage.bg} ${stage.border} flex flex-col items-center text-center relative`}
          >
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
              {stage.label}
            </span>
            <span className={`text-sm font-bold font-numeric mt-0.5 ${stage.color}`}>
              {stage.count}
            </span>
            {idx < pipelineStages.length - 1 && (
              <ArrowRight className="hidden sm:block absolute -right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600 z-10" />
            )}
          </div>
        ))}
      </div>

      {/* Main Tab Content */}
      {activeTab === 'pipeline' ? (
        <div className="h-64 sm:h-72 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={trendData}
              margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
              barGap={2}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomRequisitionTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }}
              />

              <Bar
                name="Created"
                dataKey="created_orders"
                fill="#3b82f6"
                radius={[3, 3, 0, 0]}
                maxBarSize={14}
              />
              <Bar
                name="Dispatched"
                dataKey="dispatched_orders"
                fill="#f59e0b"
                radius={[3, 3, 0, 0]}
                maxBarSize={14}
              />
              <Bar
                name="Delivered"
                dataKey="delivered_orders"
                fill="#10b981"
                radius={[3, 3, 0, 0]}
                maxBarSize={14}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-64 sm:h-72 items-center px-2">
          <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryVolumes}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryVolumes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [`${formatNumber(val)} units`, name]}
                  contentStyle={{
                    backgroundColor: '#131b2e',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#f8fafc',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {categoryVolumes.map((cat) => (
              <div
                key={cat.name}
                className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-slate-300 font-medium truncate">{cat.name}</span>
                </div>
                <span className="font-bold text-slate-100 font-numeric shrink-0">
                  {formatNumber(cat.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <span className="flex items-center gap-1.5 text-slate-300">
          <Clock className="w-4 h-4 text-blue-400" />
          Mean Order Lead Time: <strong className="text-blue-300 font-numeric">{leadTime} Days</strong>
        </span>
        <span className="flex items-center gap-1.5 text-slate-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Indent Fulfillment: <strong className="text-emerald-300 font-numeric">{fulfillmentRate}%</strong>
        </span>
      </div>
    </Card>
  );
}

export default ReplenishmentLifecycleChart;
