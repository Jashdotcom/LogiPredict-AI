import React, { useState } from 'react';
import {
  Route as RouteIcon,
  Navigation,
  MapPin,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Compass,
  Layers,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Card, CardHeader } from '../components/ui/Card';
import { KPICard } from '../components/dashboard/KpiCard';

const MOCK_ROUTES = [
  {
    id: 'RT-1092',
    truck: 'MH-12-AQ-8840',
    origin: 'JNPT Port, Navi Mumbai',
    destination: 'Bengaluru DC',
    eta: '4h 15m',
    progress: 72,
    status: 'Rerouted',
    variant: 'warning',
    driver: 'Rajesh Kumar',
  },
  {
    id: 'RT-1093',
    truck: 'DL-01-BK-4421',
    origin: 'Delhi Central Hub',
    destination: 'Jaipur Logistics Park',
    eta: '1h 30m',
    progress: 88,
    status: 'On Time',
    variant: 'success',
    driver: 'Gurpreet Singh',
  },
  {
    id: 'RT-1094',
    truck: 'TN-09-CX-3109',
    origin: 'Chennai Port',
    destination: 'Hyderabad Central Hub',
    eta: '6h 40m',
    progress: 35,
    status: 'Corridor Cutoff',
    variant: 'danger',
    driver: 'V. Murugan',
  },
  {
    id: 'RT-1095',
    truck: 'GJ-06-DF-9011',
    origin: 'Ahmedabad Cold Hub',
    destination: 'Pune West Hub',
    eta: '3h 10m',
    progress: 60,
    status: 'In Transit',
    variant: 'success',
    driver: 'Pravin Patel',
  },
];

export function RoutesPage() {
  const [selectedRoute, setSelectedRoute] = useState(MOCK_ROUTES[0]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Route Planning & Dynamic GIS Fleet Transit"
        subtitle="Real-time telematics tracking, AI traffic congestion avoidance, and multi-modal route optimization."
        breadcrumbs={[{ label: 'Route Planning' }]}
        badge={
          <Badge variant="brand" size="sm" icon={Navigation}>
            142 Active Consignments
          </Badge>
        }
        actions={
          <Button variant="primary" size="sm" leftIcon={Sparkles}>
            Optimize All Routes
          </Button>
        }
      />

      {/* Fleet KPI Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Active Transit Routes"
          value="142"
          change="+18 routes"
          isPositive={true}
          timeframe="live tracking"
          iconName="Truck"
          colorScheme="blue"
        />
        <KPICard
          title="Fleet On-Time Rate"
          value="98.6%"
          change="+1.4%"
          isPositive={true}
          timeframe="SLA benchmark"
          iconName="PackageCheck"
          colorScheme="emerald"
          status="Optimal"
          statusVariant="success"
        />
        <KPICard
          title="Active Congestion Anomalies"
          value="3 Routes"
          change="-2 resolved"
          isPositive={true}
          timeframe="dynamic rerouting active"
          iconName="AlertOctagon"
          colorScheme="amber"
        />
        <KPICard
          title="Fuel Cost Optimized"
          value="₹14.8L"
          change="-8.4%"
          isPositive={true}
          timeframe="MTD carbon & fuel reduction"
          iconName="Zap"
          colorScheme="purple"
        />
      </div>

      {/* Main Grid: GIS Map Placeholder & Route List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive GIS Map Canvas */}
        <Card className="lg:col-span-2 flex flex-col min-h-[420px]">
          <CardHeader
            title="Live Fleet GIS Command Map"
            subtitle="GPS-enabled vehicle coordinates, corridor bottlenecks, and cold chain telemetry"
            action={
              <Badge variant="success" size="xs" dot dotPulse>
                Telemetry Live (5s poll)
              </Badge>
            }
          />

          {/* Interactive Styled Map Placeholder Container */}
          <div className="relative flex-1 min-h-[300px] rounded-lg bg-slate-900 overflow-hidden border border-slate-800 flex items-center justify-center p-6 text-center">
            {/* Background Grid Lines simulating GIS map */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-60" />

            {/* Simulated Route Line */}
            <div className="absolute inset-x-12 top-1/2 h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-amber-500 rounded-full opacity-70" />

            {/* Route Waypoints */}
            <div className="absolute left-14 top-[44%] flex flex-col items-center">
              <span className="w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-emerald-500/30 animate-pulse" />
              <span className="mt-1 text-[11px] font-bold text-emerald-300 bg-slate-900/90 px-2 py-0.5 rounded border border-emerald-500/40">
                JNPT Port
              </span>
            </div>

            <div className="absolute left-1/2 top-[44%] flex flex-col items-center -translate-x-1/2">
              <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg ring-4 ring-indigo-500/30">
                <Truck className="w-3 h-3" />
              </span>
              <span className="mt-1 text-[11px] font-bold text-white bg-slate-900/90 px-2 py-0.5 rounded border border-indigo-500/40">
                MH-12-AQ (En Route)
              </span>
            </div>

            <div className="absolute right-14 top-[44%] flex flex-col items-center">
              <span className="w-4 h-4 rounded-full bg-indigo-500 ring-4 ring-indigo-500/30" />
              <span className="mt-1 text-[11px] font-bold text-indigo-300 bg-slate-900/90 px-2 py-0.5 rounded border border-indigo-500/40">
                Bengaluru DC
              </span>
            </div>

            {/* Central Overlay Card */}
            <div className="relative z-10 bg-slate-950/85 backdrop-blur-md p-4 rounded-xl border border-slate-800 text-left max-w-sm">
              <div className="flex items-center gap-2 mb-1">
                <Compass className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white">
                  Active GIS Route: {selectedRoute.id} ({selectedRoute.truck})
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-snug">
                {selectedRoute.origin} &rarr; {selectedRoute.destination}
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                <span>Driver: {selectedRoute.driver}</span>
                <span className="text-emerald-400 font-semibold">ETA: {selectedRoute.eta}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Right Column: Active Route Queue */}
        <Card className="flex flex-col">
          <CardHeader
            title="Consignment Transit Queue"
            subtitle="Select a route to track telemetry and corridor status"
          />

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px]">
            {MOCK_ROUTES.map((route) => (
              <div
                key={route.id}
                onClick={() => setSelectedRoute(route)}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  selectedRoute.id === route.id
                    ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-400'
                    : 'bg-slate-50/70 hover:bg-slate-50 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-mono text-xs font-bold text-slate-800">
                    {route.id} • {route.truck}
                  </span>
                  <StatusBadge status={route.status} size="xs" />
                </div>

                <div className="text-xs text-slate-600 space-y-0.5">
                  <p className="truncate font-medium">{route.origin} &rarr; {route.destination}</p>
                </div>

                {/* Progress bar */}
                <div className="mt-2.5">
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                    <span>Progress: {route.progress}%</span>
                    <span>ETA: {route.eta}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${route.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default RoutesPage;
