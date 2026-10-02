import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  TrendingUp,
  PieChart,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader } from '../components/ui/Card';
import { KPICard } from '../components/dashboard/KpiCard';

const REPORT_TEMPLATES = [
  {
    id: 'REP-01',
    title: 'Forward Stockout Probability & Safety Buffer Audit',
    description: 'Comprehensive risk scoring across all 6 distribution hubs with 14-day stockout probabilities.',
    type: 'PDF / CSV',
    frequency: 'Daily Automated',
    lastGenerated: 'Today, 06:00 AM',
  },
  {
    id: 'REP-02',
    title: 'AI Demand Forecast MAPE & Accuracy Diagnostics',
    description: 'Model error decomposition, residual analysis, and seasonal factor regression audit.',
    type: 'PDF / Interactive',
    frequency: 'Weekly',
    lastGenerated: '28 Sep 2026',
  },
  {
    id: 'REP-03',
    title: 'Dynamic Route Optimization & Fuel Savings Ledger',
    description: 'Fleet mileage, transit bottleneck mitigations, carbon offset, and ₹14.8L cost audit.',
    type: 'CSV / Excel',
    frequency: 'Monthly',
    lastGenerated: '01 Oct 2026',
  },
  {
    id: 'REP-04',
    title: 'SIH 2026 Autonomous Supply Chain Executive Summary',
    description: 'High-level synthesis of resilience metrics, SLA performance, and prototype ROI indicators.',
    type: 'Executive Briefing',
    frequency: 'On Demand',
    lastGenerated: '02 Oct 2026',
  },
];

export function AnalyticsPage() {
  const handleDownloadReport = (title) => {
    alert(`Generating export for: ${title}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Analytics & Strategic Intelligence"
        subtitle="Forward supply chain cost audits, model accuracy diagnostics, and executive compliance reports."
        breadcrumbs={[{ label: 'Analytics' }]}
        badge={
          <Badge variant="brand" size="sm">
            Auditing Engine Active
          </Badge>
        }
        actions={
          <Button variant="primary" size="sm" leftIcon={Download}>
            Export Master Report
          </Button>
        }
      />

      {/* KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Overall Supply Chain Health"
          value="94.8%"
          change="+2.1%"
          isPositive={true}
          timeframe="composite index"
          iconName="PackageCheck"
          colorScheme="emerald"
        />
        <KPICard
          title="Forecast Error Rate (MAPE)"
          value="3.2%"
          change="-0.8%"
          isPositive={true}
          timeframe="low error variance"
          iconName="BrainCircuit"
          colorScheme="indigo"
          status="Optimal"
          statusVariant="success"
        />
        <KPICard
          title="Total Cost Savings (YTD)"
          value="₹1.42 Cr"
          change="+18.5%"
          isPositive={true}
          timeframe="fuel & holding savings"
          iconName="Zap"
          colorScheme="purple"
        />
        <KPICard
          title="Order Fulfillment SLA"
          value="99.1%"
          change="+0.4%"
          isPositive={true}
          timeframe="on-time in-full (OTIF)"
          iconName="TrendingUp"
          colorScheme="blue"
        />
      </div>

      {/* Report Templates Section */}
      <Card>
        <CardHeader
          title="Available Audit & Analytics Reports"
          subtitle="Generate instant on-demand audit files or configure recurring automated distribution"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {REPORT_TEMPLATES.map((rep) => (
            <div
              key={rep.id}
              className="p-4 rounded-xl border border-slate-800 bg-slate-800/40 hover:bg-slate-800/70 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-[11px] font-bold text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                    {rep.id}
                  </span>
                  <Badge variant="neutral" size="xs">
                    {rep.frequency}
                  </Badge>
                </div>

                <h4 className="text-sm font-bold text-slate-100 leading-snug">
                  {rep.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {rep.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Format: <strong className="text-slate-300">{rep.type}</strong></span>
                <Button
                  variant="outline"
                  size="xs"
                  leftIcon={Download}
                  onClick={() => handleDownloadReport(rep.title)}
                >
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default AnalyticsPage;
