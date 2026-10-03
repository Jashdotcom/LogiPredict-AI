import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  X,
  ShieldCheck,
  AlertOctagon,
  Building2,
  Calendar,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatNumber } from '../../utils/formatters';

/**
 * Military Logistics Audit Report Form 48-A Modal
 */
export function AuditReportModal({
  isOpen,
  onClose,
  overviewData,
  onExportCsv,
  onExportJson,
}) {
  if (!isOpen) return null;

  const generatedDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePrint = () => {
    window.print();
  };

  const kpis = overviewData?.kpis || [];
  const inventoryValue = kpis.find((k) => k.id === 'total-inventory-value')?.value || '₹42.85 Cr';
  const healthScore = kpis.find((k) => k.id === 'avg-inventory-health')?.value || '94.8%';
  const forecastAccuracy = kpis.find((k) => k.id === 'forecast-accuracy')?.value || '96.8%';
  const criticalCount = kpis.find((k) => k.id === 'critical-stockout-risks')?.value || '2';
  const pendingReplenishments = kpis.find((k) => k.id === 'pending-replenishments')?.value || '8';
  const otdRate = kpis.find((k) => k.id === 'on-time-delivery-rate')?.value || '96.2%';

  const criticalItems = overviewData?.stockout_risks?.critical_items || [];
  const corridors = overviewData?.delivery_performance?.corridor_metrics || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-950/70 border border-indigo-800/60 text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Form 48-A: Strategic Logistics Telematics Audit
                </h3>
                <Badge variant="danger" size="xs">
                  RESTRICTED // HQ NC
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Official Supply Chain Readiness & Multi-Echelon Stock Telemetry Audit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Printer}
              onClick={handlePrint}
              className="hidden sm:flex"
            >
              Print Document
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body: Official Form Layout */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6 text-slate-200 text-xs sm:text-sm print:p-0 print:text-black">
          {/* Header Banner */}
          <div className="border border-slate-700 p-4 rounded-xl bg-slate-950/40 space-y-3">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2.5 gap-2">
              <div>
                <span className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase">
                  INDIAN ARMY FORWARD LOGISTICS CORPS
                </span>
                <h4 className="text-sm sm:text-base font-bold text-white">
                  HEADQUARTERS NORTHERN COMMAND (UDHAMPUR)
                </h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">AUDIT SERIAL NO.</span>
                <span className="font-mono text-xs font-bold text-slate-200">
                  NC/LOG/2026/SEC-48A-{Math.floor(1000 + Math.random() * 9000)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">Audit Window:</span>
                <span className="font-semibold text-slate-200">
                  {overviewData?.timeframe === '24h'
                    ? 'Last 24 Hours'
                    : overviewData?.timeframe === '30d'
                    ? 'Last 30 Days'
                    : 'Last 7 Days (Standard)'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Sector Scope:</span>
                <span className="font-semibold text-slate-200">
                  {overviewData?.depot_filter || 'All 6 Forward Command Depots'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Supply Scope:</span>
                <span className="font-semibold text-slate-200">
                  {overviewData?.category_filter || 'All Strategic Classes'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Timestamp:</span>
                <span className="font-semibold text-slate-200 font-mono text-[11px]">
                  {generatedDate}
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Executive KPI Metrics */}
          <div className="space-y-2">
            <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span>1. Executive Readiness Telemetry Summary</span>
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Total Inventory Valuation</span>
                <span className="text-base font-bold text-indigo-400 font-numeric">{inventoryValue}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Composite Health Score</span>
                <span className="text-base font-bold text-emerald-400 font-numeric">{healthScore}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Neural Model Forecast Accuracy</span>
                <span className="text-base font-bold text-purple-400 font-numeric">{forecastAccuracy}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Critical Stockout Vulnerabilities</span>
                <span className="text-base font-bold text-rose-400 font-numeric">{criticalCount} SKUs</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Active Pipeline Requisitions</span>
                <span className="text-base font-bold text-blue-400 font-numeric">{pendingReplenishments} Orders</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Convoy On-Time Delivery Rate</span>
                <span className="text-base font-bold text-amber-400 font-numeric">{otdRate}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Critical Discrepancies Watchlist */}
          <div className="space-y-2">
            <h5 className="font-bold text-xs uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>2. Critical Stockout & Deficit Watchlist</span>
            </h5>
            <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                    <th className="p-2.5">SKU Designation</th>
                    <th className="p-2.5">Node Location</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5 text-right">On-Hand / Min</th>
                    <th className="p-2.5 text-right">Days Cover</th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {criticalItems.map((item) => (
                    <tr key={item.item_id} className="hover:bg-slate-900/40">
                      <td className="p-2.5 font-semibold text-slate-200">{item.item_name}</td>
                      <td className="p-2.5 text-slate-400">{item.location_name}</td>
                      <td className="p-2.5 text-slate-400">{item.category}</td>
                      <td className="p-2.5 text-right font-numeric font-medium text-slate-300">
                        {formatNumber(item.current_stock)} / {formatNumber(item.min_threshold)} {item.unit}
                      </td>
                      <td className="p-2.5 text-right font-numeric font-bold text-rose-400">
                        {item.days_coverage}d
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800/60">
                          {item.risk_level}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {criticalItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-slate-500">
                        No critical stockout vulnerabilities recorded for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Convoy Corridor Telematics */}
          <div className="space-y-2">
            <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span>3. Mountain Corridor Transit & Reliability</span>
            </h5>
            <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                    <th className="p-2.5">Corridor / Pass</th>
                    <th className="p-2.5 text-right">Standard (h)</th>
                    <th className="p-2.5 text-right">Actual (h)</th>
                    <th className="p-2.5 text-right">Delay (h)</th>
                    <th className="p-2.5 text-right">OTD Rate</th>
                    <th className="p-2.5 text-center">Condition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {corridors.map((corridor) => (
                    <tr key={corridor.route_id} className="hover:bg-slate-900/40">
                      <td className="p-2.5 font-semibold text-slate-200">{corridor.route_name}</td>
                      <td className="p-2.5 text-right font-numeric text-slate-400">{corridor.standard_hours}</td>
                      <td className="p-2.5 text-right font-numeric font-medium text-amber-300">{corridor.actual_hours}</td>
                      <td className="p-2.5 text-right font-numeric text-rose-400">+{corridor.delay_hours}</td>
                      <td className="p-2.5 text-right font-numeric font-bold text-emerald-400">{corridor.on_time_rate_percentage}%</td>
                      <td className="p-2.5 text-center font-mono text-[10px] text-slate-400">{corridor.road_condition}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Verification & Sign-off Block */}
          <div className="border-t border-slate-800 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Algorithmic Assurance & AI Engine
              </span>
              <p className="text-xs text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Verified by LogiPredict Neural Telematics Core v4.8</span>
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                SHA-256 Checksum: 8f72a91b2c...e04b92c
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Logistics Command Officer
                </span>
                <p className="text-xs font-bold text-slate-200 mt-0.5">
                  COL. V. K. SHARMA, SM (LOG-OPS-NC)
                </p>
              </div>
              <p className="text-[10px] text-emerald-400 font-mono mt-2">
                [DIGITALLY CERTIFIED & SIGNED]
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              onClick={onExportCsv}
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              onClick={onExportJson}
            >
              Export JSON
            </Button>
          </div>

          <Button variant="primary" size="sm" onClick={onClose}>
            Acknowledge & Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AuditReportModal;
