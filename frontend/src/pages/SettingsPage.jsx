import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Sliders,
  Cpu,
  Bell,
  Database,
  Key,
  Shield,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card, CardHeader } from '../components/common/Card';

export function SettingsPage() {
  const [isSaved, setIsSaved] = useState(false);
  const [horizon, setHorizon] = useState('14');
  const [confidence, setConfidence] = useState('95');
  const [safetyBuffer, setSafetyBuffer] = useState('25');
  const [autoPO, setAutoPO] = useState(true);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="System Settings & Engine Configuration"
        subtitle="Manage neural model parameters, safety threshold rules, IoT telemetry webhooks, and regional access."
        breadcrumbs={[{ label: 'Settings' }]}
        badge={
          <Badge variant="neutral" size="sm">
            Admin Mode
          </Badge>
        }
        actions={
          <Button variant="primary" size="sm" leftIcon={Save} onClick={handleSave}>
            Save Configuration
          </Button>
        }
      />

      {isSaved && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs sm:text-sm font-semibold animate-in slide-in-from-top duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>System parameters updated across all 6 regional warehouse nodes.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: AI Model Parameters */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title="AI Forecasting Model Parameters"
              subtitle="Fine-tune time-series inference hyperparameters and confidence thresholds"
            />
            <div className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Forecast Time Horizon (Days)
                </label>
                <select
                  value={horizon}
                  onChange={(e) => setHorizon(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="7">7 Days Forward (Short-term High Precision)</option>
                  <option value="14">14 Days Forward (Standard Recommended)</option>
                  <option value="30">30 Days Forward (Monthly Planning)</option>
                  <option value="90">90 Days Forward (Quarterly Macro)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Affects lookahead window in Demand Forecasting and Stockout calculations.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Confidence Interval Level (%)
                </label>
                <input
                  type="number"
                  min="80"
                  max="99"
                  value={confidence}
                  onChange={(e) => setConfidence(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Statistical confidence band used for upper and lower demand bounds.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Minimum Safety Buffer Threshold (%)
                </label>
                <input
                  type="number"
                  min="10"
                  max="50"
                  value={safetyBuffer}
                  onChange={(e) => setSafetyBuffer(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Triggers warning alerts whenever stock levels fall below this percentage of maximum capacity.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Automated Operations & Reorder Rules"
              subtitle="Control autonomous PO generation and inter-hub stock balancing"
            />
            <div className="space-y-4 text-xs sm:text-sm">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPO}
                  onChange={(e) => setAutoPO(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <div>
                  <span className="font-semibold text-slate-800">
                    Enable Autonomous Draft Purchase Order Generation
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Automatically draft POs to Tier-1 suppliers when predicted stockout risk is &lt; 48 hours.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <div>
                  <span className="font-semibold text-slate-800">
                    Dynamic Route Congestion Bypass
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Allow system to propose alternate route waypoints when toll or highway delay exceeds 30 minutes.
                  </p>
                </div>
              </label>
            </div>
          </Card>
        </div>

        {/* Right Column: Node & System Metadata */}
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Connected Hubs (Nodes)"
              subtitle="6 Regional distribution centers registered"
            />
            <div className="space-y-2.5 text-xs">
              {[
                { name: 'Pune West Hub', code: 'PUN-01', status: 'Online' },
                { name: 'Bengaluru Central DC', code: 'BLR-02', status: 'Online' },
                { name: 'Delhi Central Hub', code: 'DEL-01', status: 'Online' },
                { name: 'Ahmedabad Cold Hub', code: 'AMD-03', status: 'Online' },
                { name: 'Chennai Auto Port Hub', code: 'MAA-02', status: 'Online' },
                { name: 'Nagpur Buffer Node', code: 'NAG-01', status: 'Online' },
              ].map((hub) => (
                <div key={hub.code} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div>
                    <span className="font-semibold text-slate-800">{hub.name}</span>
                    <span className="block text-[10px] text-slate-400 font-mono">{hub.code}</span>
                  </div>
                  <Badge variant="success" size="xs" dot>
                    {hub.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="System Build Info"
              subtitle="Prototype metadata for SIH 2026"
            />
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Application:</span>
                <span className="font-bold text-slate-800">LogiPredict AI</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Version:</span>
                <span className="font-mono text-indigo-600">v1.0.0-rc</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Environment:</span>
                <span className="font-medium text-slate-700">Client-Side Prototype</span>
              </div>
              <div className="flex justify-between py-1">
                <span>UI Framework:</span>
                <span className="font-medium text-slate-700">React 19 + Tailwind v4</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
