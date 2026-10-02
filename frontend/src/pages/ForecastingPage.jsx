import React, { useState } from 'react';
import {
  TrendingUp,
  BrainCircuit,
  Sparkles,
  RefreshCw,
  Cpu,
  Layers,
  Calendar,
  Download,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader } from '../components/ui/Card';
import { DemandTrendChart } from '../components/dashboard/DemandTrendChart';
import { KPICard } from '../components/dashboard/KpiCard';

export function ForecastingPage() {
  const [isTraining, setIsTraining] = useState(false);

  const handleRetrain = () => {
    setIsTraining(true);
    setTimeout(() => {
      setIsTraining(false);
      alert('Ensemble neural models retrained with latest sales signals.');
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Demand Forecasting & Predictive Intelligence"
        subtitle="Multi-horizon time-series forecasting, festival demand surge modeling, and automated safety stock recalibration."
        breadcrumbs={[{ label: 'Demand Forecasting' }]}
        badge={
          <Badge variant="brand" size="sm" icon={BrainCircuit}>
            Ensemble AI Active
          </Badge>
        }
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={Download}>
              Export Projections
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={RefreshCw}
              isLoading={isTraining}
              onClick={handleRetrain}
            >
              {isTraining ? 'Training Models...' : 'Retrain Pipeline'}
            </Button>
          </>
        }
      />

      {/* Model Performance KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Overall Model Accuracy"
          value="96.8%"
          change="+1.2%"
          isPositive={true}
          timeframe="MAPE: 3.2% error rate"
          iconName="BrainCircuit"
          colorScheme="indigo"
          status="High Confidence"
          statusVariant="brand"
        />
        <KPICard
          title="Projected Peak Demand"
          value="6,950 units"
          change="+14.2%"
          isPositive={true}
          timeframe="Day 13 (Sat) surge"
          iconName="TrendingUp"
          colorScheme="purple"
        />
        <KPICard
          title="Active Model Pipeline"
          value="Hybrid v1.4"
          timeframe="LSTM + Prophet + XGBoost"
          iconName="Zap"
          colorScheme="blue"
          status="Operational"
          statusVariant="success"
        />
        <KPICard
          title="Lead Time Variance"
          value="± 4.2 hrs"
          change="-1.1h"
          isPositive={true}
          timeframe="transit window accuracy"
          iconName="PackageCheck"
          colorScheme="emerald"
        />
      </div>

      {/* Main Interactive Forecast Chart */}
      <DemandTrendChart />

      {/* Forecast Explainability & Feature Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Feature Importance & Seasonality Drivers"
            subtitle="Key causal indicators weighted in the neural forecasting engine"
          />
          <div className="space-y-3 pt-2">
            {[
              { factor: 'Historical 90-Day Consumption Trend', weight: '38%', impact: 'High Base' },
              { factor: 'Regional Festival & Holiday Seasonality (Diwali/Q4)', weight: '26%', impact: 'Positive Surge' },
              { factor: 'Weather & Monsoon Logistics Disruption Risk', weight: '18%', impact: 'Buffer Added' },
              { factor: 'E-commerce Promotional Campaign Uplift', weight: '12%', impact: 'Flash Demand' },
              { factor: 'Macro Supply Chain Fuel Price Indices', weight: '6%', impact: 'Cost Weight' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-xs sm:text-sm font-medium text-slate-800">{item.factor}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-indigo-600">{item.weight}</span>
                  <Badge variant="neutral" size="xs">{item.impact}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Model Hyperparameters"
            subtitle="Configured parameters for SIH 2026 prototype"
          />
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Forecast Horizon:</span>
              <span className="font-semibold text-slate-800">14 Days Forward</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Confidence Band:</span>
              <span className="font-semibold text-slate-800">95% Interval</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Lookback Window:</span>
              <span className="font-semibold text-slate-800">180 Days</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Optimization Goal:</span>
              <span className="font-semibold text-slate-800">Min Stockout + Min Holding</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Auto-Retrain Interval:</span>
              <span className="font-semibold text-slate-800">Every 6 Hours</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default ForecastingPage;
