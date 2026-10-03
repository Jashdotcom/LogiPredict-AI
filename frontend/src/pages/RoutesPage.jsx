/**
 * LogiPredict AI - Strategic Route Planning & GIS Simulation Page
 * ================================================================
 * Command center interface featuring:
 * - Synthetic disclaimer banner (SIH 2026 protocol)
 * - Fleet & corridor telemetry KPI metrics
 * - Origin / Destination depot selector with strategic presets
 * - Interactive schematic SVG logistics map with layer controls
 * - Route alternative comparison cards with capacity & cost analytics
 * - Non-destructive threat & disruption simulator with 1-click reset
 * - Slide-over drawer with elevation profile and waypoint timeline
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Navigation,
  Sparkles,
  RotateCcw,
  Truck,
  Mountain,
  AlertTriangle,
  Layers,
  Compass,
  Zap,
  Gauge,
  CheckCircle2,
  Activity,
  Filter,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { KPICard } from '../components/dashboard/KpiCard';

// Route Sub-Components
import { SyntheticNoticeBanner } from '../components/routes/SyntheticNoticeBanner';
import { RouteSelectorBar } from '../components/routes/RouteSelectorBar';
import { LogisticsRouteMap } from '../components/routes/LogisticsRouteMap';
import { RouteAlternativeCard } from '../components/routes/RouteAlternativeCard';
import { DisruptionSimulationPanel } from '../components/routes/DisruptionSimulationPanel';
import { RouteDetailDrawer } from '../components/routes/RouteDetailDrawer';

// Services & Formatters
import { routesDataService } from '../data/routes/routesDataService';
import {
  formatPercent,
  formatTransitHours,
  formatDistance,
  formatCurrency,
  formatNumber,
} from '../utils/formatters';

export function RoutesPage() {
  // State Management
  const [locations, setLocations] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Selection & Filtering States
  const [selectedOriginId, setSelectedOriginId] = useState('');
  const [selectedDestinationId, setSelectedDestinationId] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [optimizationCriterion, setOptimizationCriterion] = useState('fastest');

  // Disruption Simulation States
  const [activeDisruption, setActiveDisruption] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Inspection Drawer State
  const [drawerRoute, setDrawerRoute] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Load Initial Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [locs, rts, kp] = await Promise.all([
        routesDataService.getLocations(),
        routesDataService.getRoutes(),
        routesDataService.getKpis(),
      ]);
      setLocations(locs);
      setRoutes(rts);
      setKpis(kp);
      if (rts.length > 0 && !selectedRouteId) {
        setSelectedRouteId(rts[0].route_id);
      }
    } catch (err) {
      console.error('Failed to load logistics routes data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRouteId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Corridor Presets Definition
  const corridorPresets = useMemo(
    () => [
      { id: 'LEH_SIACHEN', origin: 'LOC-LEH-01', dest: 'LOC-SIA-06' },
      { id: 'UDH_SRINAGAR', origin: 'LOC-UDH-02', dest: 'LOC-SRI-03' },
      { id: 'SRI_KARGIL', origin: 'LOC-SRI-03', dest: 'LOC-KRG-04' },
      { id: 'LEH_PANGONG', origin: 'LOC-LEH-01', dest: 'LOC-PNG-08' },
    ],
    []
  );

  // Handle Preset Click
  const handleSelectPreset = (presetKey) => {
    const preset = corridorPresets.find((p) => p.id === presetKey);
    if (preset) {
      setSelectedPresetId(presetKey);
      setSelectedOriginId(preset.origin);
      setSelectedDestinationId(preset.dest);
    }
  };

  // Swap Locations Handlers
  const handleSwapLocations = () => {
    const prevOrigin = selectedOriginId;
    setSelectedOriginId(selectedDestinationId);
    setSelectedDestinationId(prevOrigin);
    setSelectedPresetId(null);
  };

  const handleResetFilters = () => {
    setSelectedOriginId('');
    setSelectedDestinationId('');
    setSelectedPresetId(null);
    setOptimizationCriterion('fastest');
  };

  // Filtered & Optimized Routes List
  const filteredRoutes = useMemo(() => {
    let result = routes;

    if (selectedOriginId && selectedDestinationId && selectedOriginId === selectedDestinationId) {
      return [];
    }

    if (selectedOriginId) {
      result = result.filter((r) => r.origin_location_id === selectedOriginId);
    }
    if (selectedDestinationId) {
      result = result.filter((r) => r.destination_location_id === selectedDestinationId);
    }

    // Apply optimization sorting
    const sorted = [...result];
    switch (optimizationCriterion) {
      case 'shortest':
        sorted.sort((a, b) => a.distance_km - b.distance_km);
        break;
      case 'safest':
        sorted.sort((a, b) => (a.peak_pass_altitude || 0) - (b.peak_pass_altitude || 0));
        break;
      case 'capacity':
        sorted.sort((a, b) => a.capacity_utilization_pct - b.capacity_utilization_pct);
        break;
      case 'fastest':
      default:
        sorted.sort(
          (a, b) =>
            a.current_estimated_transit_hours - b.current_estimated_transit_hours
        );
        break;
    }

    return sorted;
  }, [routes, selectedOriginId, selectedDestinationId, optimizationCriterion]);

  // Selected Route Object
  const currentSelectedRoute = useMemo(() => {
    return routes.find((r) => r.route_id === selectedRouteId) || routes[0] || null;
  }, [routes, selectedRouteId]);

  // Handle Disruption Simulation
  const handleSimulateDisruption = async (simulationParams) => {
    setIsSimulating(true);
    try {
      const response = await routesDataService.simulateDisruption(simulationParams);
      setActiveDisruption(response.simulation);
      // Reload route dataset and KPIs
      const [updatedRoutes, updatedKpis] = await Promise.all([
        routesDataService.getRoutes(),
        routesDataService.getKpis(),
      ]);
      setRoutes(updatedRoutes);
      setKpis(updatedKpis);
    } catch (err) {
      console.error('Disruption simulation failed:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Handle Reset to Pristine Baseline
  const handleResetSimulation = async () => {
    setIsSimulating(true);
    try {
      await routesDataService.resetToPristine();
      setActiveDisruption(null);
      const [freshRoutes, freshKpis] = await Promise.all([
        routesDataService.getRoutes(),
        routesDataService.getKpis(),
      ]);
      setRoutes(freshRoutes);
      setKpis(freshKpis);
    } catch (err) {
      console.error('Reset simulation failed:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Drawer Open Handlers
  const handleInspectRoute = (route) => {
    setDrawerRoute(route);
    setIsDrawerOpen(true);
  };

  const handleSimulateFromCard = (route) => {
    setSelectedRouteId(route.route_id);
    handleSimulateDisruption({
      route_id: route.route_id,
      scenario_name: `Tactical Stress Test on ${route.route_name}`,
      delay_multiplier: 1.6,
      is_blocked: false,
      road_condition: 'High_Altitude_Pass',
      allocated_capacity_delta_mt: 80,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12">
      {/* Top Page Header */}
      <PageHeader
        title="Strategic Route Planning & Dynamic GIS Simulation"
        subtitle="Northern Command forward corridor multi-objective optimization, mountain pass telematics, non-destructive disruption sandbox, and capacity headroom tracking."
        breadcrumbs={[{ label: 'Route Planning' }]}
        badge={
          <Badge variant="brand" size="sm" icon={Compass}>
            {routes.length} Active Corridors Monitored
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={RotateCcw}
              onClick={handleResetSimulation}
            >
              Reset Sandbox
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={Sparkles}
              onClick={() => {
                setOptimizationCriterion('fastest');
                loadData();
              }}
            >
              Recalculate Optimal Convoys
            </Button>
          </div>
        }
      />

      {/* Synthetic Demonstration Disclaimer Banner */}
      <SyntheticNoticeBanner />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Monitored Corridors"
          value={kpis?.total_routes ? `${kpis.total_routes} Routes` : '13 Routes'}
          change="8 Forward Depots"
          isPositive={true}
          timeframe="WGS84 Grid"
          iconName="Navigation"
          colorScheme="blue"
        />

        <KPICard
          title="Fleet Capacity Utilization"
          value={kpis?.average_capacity_utilization_pct ? formatPercent(kpis.average_capacity_utilization_pct) : '76.8%'}
          change="Optimal Headroom"
          isPositive={true}
          timeframe="2,960 MT Total Fleet"
          iconName="Gauge"
          colorScheme="emerald"
          status="Healthy"
          statusVariant="success"
        />

        <KPICard
          title="Average Transit Duration"
          value={kpis?.average_transit_hours ? formatTransitHours(kpis.average_transit_hours) : '6.4h'}
          change="All-Weather Baseline"
          isPositive={true}
          timeframe="Includes Pass Crossings"
          iconName="Clock"
          colorScheme="purple"
        />

        <KPICard
          title="Corridor Hazard Status"
          value={
            kpis?.disrupted_routes_count > 0 || kpis?.delayed_routes_count > 0
              ? `${(kpis?.disrupted_routes_count || 0) + (kpis?.delayed_routes_count || 0)} Hazards`
              : 'All Clear'
          }
          change={
            activeDisruption ? 'Active Simulation' : 'Nominal Transit'
          }
          isPositive={kpis?.disrupted_routes_count === 0}
          timeframe="Avalanche & Landslide Sentinel"
          iconName="AlertTriangle"
          colorScheme={kpis?.disrupted_routes_count > 0 ? 'rose' : 'emerald'}
          status={kpis?.disrupted_routes_count > 0 ? 'Disrupted' : 'Optimal'}
          statusVariant={kpis?.disrupted_routes_count > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* Origin & Destination Hub Selector Bar */}
      <RouteSelectorBar
        locations={locations}
        selectedOriginId={selectedOriginId}
        selectedDestinationId={selectedDestinationId}
        onSelectOrigin={(id) => {
          setSelectedOriginId(id);
          setSelectedPresetId(null);
        }}
        onSelectDestination={(id) => {
          setSelectedDestinationId(id);
          setSelectedPresetId(null);
        }}
        onSwapLocations={handleSwapLocations}
        onResetFilters={handleResetFilters}
        optimizationCriterion={optimizationCriterion}
        onSelectOptimizationCriterion={setOptimizationCriterion}
        corridorPresets={corridorPresets}
        onSelectPreset={handleSelectPreset}
        selectedPresetId={selectedPresetId}
      />

      {/* Main Grid: Interactive Schematic Map & Disruption Simulation */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left / Top: Interactive SVG Schematic Logistics Map */}
        <div className="xl:col-span-8 space-y-4">
          <LogisticsRouteMap
            locations={locations}
            routes={routes}
            selectedRouteId={selectedRouteId}
            onSelectRoute={(r) => setSelectedRouteId(r.route_id)}
            selectedOriginId={selectedOriginId}
            selectedDestinationId={selectedDestinationId}
            onSelectOrigin={(id) => {
              setSelectedOriginId(id);
              setSelectedPresetId(null);
            }}
            onSelectDestination={(id) => {
              setSelectedDestinationId(id);
              setSelectedPresetId(null);
            }}
            activeDisruption={activeDisruption}
          />
        </div>

        {/* Right / Side: Threat & Disruption Sandbox Panel */}
        <div className="xl:col-span-4 space-y-4">
          <DisruptionSimulationPanel
            routes={routes}
            selectedRouteId={selectedRouteId}
            activeDisruption={activeDisruption}
            disruptionPresets={routesDataService.getDisruptionPresets()}
            onSimulateDisruption={handleSimulateDisruption}
            onResetSimulation={handleResetSimulation}
            isSimulating={isSimulating}
          />

          {/* Quick Active Route Overview Box */}
          {currentSelectedRoute && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-cyan-400">
                  Active Selected Corridor
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {currentSelectedRoute.route_id}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">
                  {currentSelectedRoute.route_name}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {currentSelectedRoute.origin_name} &rarr; {currentSelectedRoute.destination_name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Distance</span>
                  <span className="font-mono font-bold text-slate-200">
                    {formatDistance(currentSelectedRoute.distance_km)}
                  </span>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Transit ETA</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {formatTransitHours(currentSelectedRoute.current_estimated_transit_hours)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleInspectRoute(currentSelectedRoute)}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/40 text-xs font-semibold transition-colors"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Open Full Telematics Drawer</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Route Alternatives Comparative Results */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight">
              Route Alternatives & Corridor Telematics
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700">
              {filteredRoutes.length} Available
            </span>
          </div>

          <div className="text-xs text-slate-400">
            Sorted by:{' '}
            <span className="font-semibold text-cyan-300 capitalize font-mono">
              {optimizationCriterion} Criterion
            </span>
          </div>
        </div>

        {/* Alternatives Cards List */}
        {filteredRoutes.length === 0 ? (
          <div className="p-8 rounded-xl border border-slate-800 bg-slate-900/60 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">No Direct Corridors Found</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No direct corridor connects the selected Origin and Destination hubs. Try selecting a different depot or reset filters to inspect all strategic routes.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Show All Corridors</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoutes.map((route, idx) => (
              <RouteAlternativeCard
                key={route.route_id}
                route={route}
                isSelected={selectedRouteId === route.route_id}
                isOptimal={idx === 0}
                onSelect={(r) => setSelectedRouteId(r.route_id)}
                onInspectDetails={handleInspectRoute}
                onSimulateDisruption={handleSimulateFromCard}
              />
            ))}
          </div>
        )}
      </div>

      {/* Slide-Over Inspection Drawer */}
      <RouteDetailDrawer
        isOpen={isDrawerOpen}
        route={drawerRoute}
        onClose={() => setIsDrawerOpen(false)}
        onSelectRoute={(r) => setSelectedRouteId(r.route_id)}
        onSimulateDisruption={(r) => {
          setIsDrawerOpen(false);
          handleSimulateFromCard(r);
        }}
      />
    </div>
  );
}

export default RoutesPage;
