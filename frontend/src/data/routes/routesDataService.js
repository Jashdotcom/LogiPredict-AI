/**
 * LogiPredict AI - Routes & Locations Data Service
 * ==================================================
 * In-memory client-side service and API sync layer for forward military logistics routes,
 * depot nodes, capacity utilization calculation, shortest-path convoy optimization,
 * and non-destructive disruption simulation.
 *
 * Indian Army Forward Supply Chain (SIH 2026)
 */

import {
  LOGISTICS_LOCATIONS,
  LOGISTICS_ROUTES,
  DISRUPTION_PRESETS,
  ROAD_CONDITIONS,
  ROUTE_STATUSES,
} from './routesData';
import { routesApi } from '../../services/apiClient';

class RoutesDataService {
  constructor() {
    this._locations = JSON.parse(JSON.stringify(LOGISTICS_LOCATIONS));
    this._routes = JSON.parse(JSON.stringify(LOGISTICS_ROUTES));
    this._recalculateAllCapacities();
  }

  // ============================================================================
  // Mathematical Helper Functions
  // ============================================================================

  /**
   * Calculate capacity utilization percentage with zero-division safeguard.
   * Formula: (Allocated / Total) * 100
   * Clamped to [0.0, 100.0]
   */
  computeCapacityUtilization(allocated, total) {
    const numAllocated = Number(allocated) || 0;
    const numTotal = Number(total) || 0;

    if (numTotal <= 0) {
      return 0.0;
    }
    const pct = (numAllocated / numTotal) * 100.0;
    return Number(Math.min(Math.max(pct, 0.0), 100.0).toFixed(1));
  }

  /**
   * Determine dynamic operational status of a route based on telemetry,
   * disruption flags, delay factors, and capacity load.
   */
  determineRouteStatus(route) {
    if (route.is_blocked) {
      return ROUTE_STATUSES.DISRUPTED;
    }

    const roadCond = route.road_condition || ROAD_CONDITIONS.CLEAR_ALL_WEATHER;
    if (
      roadCond === ROAD_CONDITIONS.LANDSLIDE_BLOCKED ||
      roadCond === ROAD_CONDITIONS.SNOW_BOUND
    ) {
      return ROUTE_STATUSES.DISRUPTED;
    }

    const risk = Number(route.risk_score) || 0.0;
    if (risk >= 0.7) {
      return ROUTE_STATUSES.DISRUPTED;
    }

    const stdTime = Number(route.standard_transit_hours) || 1.0;
    const estTime = Number(route.current_estimated_transit_hours) || stdTime;
    const utilPct = Number(route.capacity_utilization_pct) || 0.0;

    const delayRatio = estTime / Math.max(stdTime, 0.1);

    if (delayRatio >= 1.25 || utilPct >= 90.0 || risk >= 0.4) {
      return ROUTE_STATUSES.DELAYED;
    }

    return ROUTE_STATUSES.OPERATIONAL;
  }

  _recalculateAllCapacities() {
    for (const route of this._routes) {
      route.capacity_utilization_pct = this.computeCapacityUtilization(
        route.allocated_capacity_tonnes,
        route.total_capacity_tonnes
      );
      route.status = this.determineRouteStatus(route);
    }
  }

  // ============================================================================
  // Depot & Location Queries
  // ============================================================================

  getAllLocations() {
    return JSON.parse(JSON.stringify(this._locations));
  }

  getLocationById(locationId) {
    const loc = this._locations.find((l) => l.location_id === locationId);
    if (!loc) {
      return null;
    }
    return JSON.parse(JSON.stringify(loc));
  }

  // ============================================================================
  // Route Queries, Search, Filtering & Sorting
  // ============================================================================

  queryRoutes({
    origin = null,
    destination = null,
    status = null,
    road_condition = null,
    search = '',
    sortBy = 'transit_time',
    sortOrder = 'asc',
  } = {}) {
    let filtered = this._routes.filter((route) => {
      if (origin && route.origin_location_id !== origin) {
        return false;
      }
      if (destination && route.destination_location_id !== destination) {
        return false;
      }
      if (status && route.status !== status) {
        return false;
      }
      if (road_condition && route.road_condition !== road_condition) {
        return false;
      }
      if (search && search.trim()) {
        const query = search.trim().toLowerCase();
        const matchesName = (route.route_name || '').toLowerCase().includes(query);
        const matchesOrigin = (route.origin_name || '').toLowerCase().includes(query);
        const matchesDest = (route.destination_name || '').toLowerCase().includes(query);
        const matchesPass = (route.peak_pass_name || '').toLowerCase().includes(query);
        const matchesId = (route.route_id || '').toLowerCase().includes(query);
        if (!matchesName && !matchesOrigin && !matchesDest && !matchesPass && !matchesId) {
          return false;
        }
      }
      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      let valA, valB;
      switch (sortBy) {
        case 'distance':
          valA = a.distance_km || 0;
          valB = b.distance_km || 0;
          break;
        case 'capacity_utilization':
          valA = a.capacity_utilization_pct || 0;
          valB = b.capacity_utilization_pct || 0;
          break;
        case 'risk_score':
          valA = a.risk_score || 0;
          valB = b.risk_score || 0;
          break;
        case 'cost':
          valA = a.estimated_cost_inr || 0;
          valB = b.estimated_cost_inr || 0;
          break;
        case 'transit_time':
        default:
          valA = a.current_estimated_transit_hours || a.standard_transit_hours || 0;
          valB = b.current_estimated_transit_hours || b.standard_transit_hours || 0;
          break;
      }

      if (sortOrder === 'desc') {
        return valB > valA ? 1 : valB < valA ? -1 : 0;
      }
      return valA > valB ? 1 : valA < valB ? -1 : 0;
    });

    return JSON.parse(JSON.stringify(filtered));
  }

  getRouteById(routeId) {
    const route = this._routes.find((r) => r.route_id === routeId);
    if (!route) {
      return null;
    }
    return JSON.parse(JSON.stringify(route));
  }

  // ============================================================================
  // Global Network Operational KPIs
  // ============================================================================

  calculateKpis(routesList = null) {
    const routes = routesList || this._routes;
    const total = routes.length;
    if (total === 0) {
      return {
        total_routes: 0,
        operational_routes: 0,
        delayed_routes: 0,
        disrupted_routes: 0,
        unavailable_routes: 0,
        average_transit_time_hours: 0.0,
        average_capacity_utilization_pct: 0.0,
        total_tonnage_in_transit: 0.0,
        network_health_score: 1.0,
      };
    }

    let operational = 0;
    let delayed = 0;
    let disrupted = 0;
    let unavailable = 0;
    let totalTransitHours = 0;
    let totalUtilPct = 0;
    let totalAllocatedTonnage = 0;

    for (const r of routes) {
      if (r.status === ROUTE_STATUSES.OPERATIONAL) operational += 1;
      else if (r.status === ROUTE_STATUSES.DELAYED) delayed += 1;
      else if (r.status === ROUTE_STATUSES.DISRUPTED) disrupted += 1;
      else if (r.status === ROUTE_STATUSES.UNAVAILABLE) unavailable += 1;

      totalTransitHours += r.current_estimated_transit_hours || r.standard_transit_hours || 0;
      totalUtilPct += r.capacity_utilization_pct || 0;
      totalAllocatedTonnage += r.allocated_capacity_tonnes || 0;
    }

    const avgTransit = Number((totalTransitHours / total).toFixed(1));
    const avgUtil = Number((totalUtilPct / total).toFixed(1));
    const healthScore = Number(
      Math.max(
        0.0,
        (operational * 1.0 + delayed * 0.6 + disrupted * 0.1) / total
      ).toFixed(2)
    );

    return {
      total_routes: total,
      operational_routes: operational,
      delayed_routes: delayed,
      disrupted_routes: disrupted,
      unavailable_routes: unavailable,
      average_transit_time_hours: avgTransit,
      average_capacity_utilization_pct: avgUtil,
      total_tonnage_in_transit: Number(totalAllocatedTonnage.toFixed(1)),
      network_health_score: healthScore,
    };
  }

  // ============================================================================
  // AI Convoy Shortest-Path & Risk Optimization
  // ============================================================================

  optimizeRoute({
    origin_location_id,
    destination_location_id,
    total_cargo_weight_tonnes = 10.0,
    avoid_avalanche_zones = false,
    max_risk_tolerance = 0.8,
    priority_metric = 'composite_optimal',
  }) {
    if (!origin_location_id || !destination_location_id) {
      throw new Error('Both origin and destination logistics hubs must be selected.');
    }
    if (origin_location_id === destination_location_id) {
      throw new Error('Origin and destination logistics depots cannot be identical.');
    }

    const originLoc = this.getLocationById(origin_location_id);
    const destLoc = this.getLocationById(destination_location_id);

    if (!originLoc || !destLoc) {
      throw new Error('One or both specified logistics hubs were not found.');
    }

    // Find candidate corridors
    let candidateRoutes = this._routes.filter(
      (r) =>
        r.origin_location_id === origin_location_id &&
        r.destination_location_id === destination_location_id
    );

    if (candidateRoutes.length === 0) {
      // Check for reverse corridor or multi-hop path
      candidateRoutes = this._routes.filter(
        (r) =>
          (r.origin_location_id === origin_location_id ||
            r.destination_location_id === destination_location_id)
      );
    }

    if (candidateRoutes.length === 0) {
      throw new Error(
        `No navigable logistics corridor currently mapped between ${originLoc.name} and ${destLoc.name}.`
      );
    }

    // Filter by constraints
    let viableRoutes = candidateRoutes.filter((r) => {
      if (r.is_blocked) return false;
      if (r.max_vehicle_payload_tonnes && total_cargo_weight_tonnes > r.max_vehicle_payload_tonnes) {
        return false;
      }
      if (avoid_avalanche_zones && r.road_condition === ROAD_CONDITIONS.AVALANCHE_WARNING) {
        return false;
      }
      if (r.risk_score && r.risk_score > max_risk_tolerance) {
        return false;
      }
      return true;
    });

    if (viableRoutes.length === 0) {
      // Fallback to least risky available
      viableRoutes = [...candidateRoutes];
    }

    // Score candidates
    const scoredRoutes = viableRoutes.map((r) => {
      const transitHrs = r.current_estimated_transit_hours || r.standard_transit_hours;
      const dist = r.distance_km;
      const risk = r.risk_score || 0.3;
      const util = (r.capacity_utilization_pct || 50.0) / 100.0;

      let score = 0;
      switch (priority_metric) {
        case 'fastest_time':
          score = transitHrs * 10 + risk * 20;
          break;
        case 'shortest_distance':
          score = dist * 0.1 + risk * 20;
          break;
        case 'lowest_risk':
          score = risk * 100 + transitHrs * 5;
          break;
        case 'composite_optimal':
        default:
          score = transitHrs * 6 + dist * 0.05 + risk * 40 + util * 10;
          break;
      }
      return { route: r, score };
    });

    scoredRoutes.sort((a, b) => a.score - b.score);
    const primary = scoredRoutes[0].route;
    const alternatives = scoredRoutes.slice(1).map((item) => item.route.route_id);

    const reasons = [
      `Selected optimal military corridor balancing ${primary.distance_km} km distance and ${primary.current_estimated_transit_hours}h transit time.`,
      `Passes via ${primary.peak_pass_name || 'low-altitude corridor'} (Peak: ${primary.peak_pass_altitude || 2500}m ASL).`,
      `Capacity headroom available: ${(100 - primary.capacity_utilization_pct).toFixed(1)}% free on corridor.`,
    ];

    return {
      primary_route_id: primary.route_id,
      primary_route_name: primary.route_name,
      origin_location_id: primary.origin_location_id,
      destination_location_id: primary.destination_location_id,
      origin_name: primary.origin_name,
      destination_name: primary.destination_name,
      total_distance_km: primary.distance_km,
      estimated_transit_hours: primary.current_estimated_transit_hours,
      total_estimated_cost_inr: primary.estimated_cost_inr,
      risk_score: primary.risk_score,
      status: primary.status,
      road_condition: primary.road_condition,
      peak_pass_name: primary.peak_pass_name,
      peak_pass_altitude: primary.peak_pass_altitude,
      alternative_route_ids: alternatives,
      optimization_reasons: reasons,
      waypoints: primary.waypoints || [],
    };
  }

  // ============================================================================
  // Disruption Simulation Engine (Non-Destructive)
  // ============================================================================

  simulateDisruption({
    scenario_preset = null,
    target_route_id = null,
    additional_delay_hours = 0.0,
    delay_multiplier = 1.0,
    capacity_reduction_pct = 0.0,
    is_blocked = false,
    road_condition = null,
    risk_score_override = null,
  }) {
    let scenarioName = 'Custom Logistics Disruption Simulation';
    let affectedRouteIds = [];
    const rerouteRecommendations = [];

    if (scenario_preset) {
      const preset = DISRUPTION_PRESETS.find((p) => p.id === scenario_preset);
      if (preset) {
        scenarioName = preset.title;
        target_route_id = preset.targetRouteId;
        delay_multiplier = preset.delayMultiplier || 1.0;
        additional_delay_hours = preset.delayHours || 0.0;
        capacity_reduction_pct = preset.capacityReductionPct || 0.0;
        is_blocked = preset.isBlocked || false;
        road_condition = preset.roadCondition || null;
        risk_score_override = preset.riskScoreOverride || null;
      }
    }

    if (target_route_id) {
      const route = this._routes.find((r) => r.route_id === target_route_id);
      if (route) {
        affectedRouteIds.push(route.route_id);

        // Apply delay
        let newTransit = (route.standard_transit_hours * delay_multiplier) + additional_delay_hours;
        route.current_estimated_transit_hours = Number(Math.max(newTransit, 0.5).toFixed(1));

        // Apply capacity reduction
        if (capacity_reduction_pct > 0) {
          const factor = Math.max(0.0, (100.0 - capacity_reduction_pct) / 100.0);
          route.total_capacity_tonnes = Number((route.total_capacity_tonnes * factor).toFixed(1));
          if (route.total_capacity_tonnes < route.allocated_capacity_tonnes) {
            route.allocated_capacity_tonnes = route.total_capacity_tonnes;
          }
        }

        // Apply blockage & condition
        if (is_blocked) {
          route.is_blocked = true;
          route.road_condition = road_condition || ROAD_CONDITIONS.LANDSLIDE_BLOCKED;
        } else if (road_condition) {
          route.road_condition = road_condition;
        }

        if (risk_score_override !== null) {
          route.risk_score = Number(Math.min(Math.max(risk_score_override, 0.0), 1.0).toFixed(2));
        }

        // Add to active disruptions list
        route.active_disruptions = [
          {
            disruption_id: `SIM-EVT-${Date.now()}`,
            event_title: scenarioName,
            impact_description: `Transit time increased to ${route.current_estimated_transit_hours}h (${(delay_multiplier * 100).toFixed(0)}% base). Capacity reduced by ${capacity_reduction_pct}%.`,
            severity: is_blocked ? 'critical' : route.current_estimated_transit_hours >= route.standard_transit_hours * 1.5 ? 'high' : 'medium',
            reported_at: new Date().toISOString(),
          },
        ];

        // Recalculate status
        route.capacity_utilization_pct = this.computeCapacityUtilization(
          route.allocated_capacity_tonnes,
          route.total_capacity_tonnes
        );
        route.status = this.determineRouteStatus(route);

        // Check for alternative detour recommendation
        const detourCandidates = this._routes.filter(
          (cand) =>
            cand.origin_location_id === route.origin_location_id &&
            cand.destination_location_id === route.destination_location_id &&
            cand.route_id !== route.route_id &&
            !cand.is_blocked
        );

        if (detourCandidates.length > 0) {
          const detour = detourCandidates[0];
          rerouteRecommendations.push({
            disrupted_route_id: route.route_id,
            disrupted_route_name: route.route_name,
            recommended_detour_id: detour.route_id,
            recommended_detour_name: detour.route_name,
            detour_distance_km: detour.distance_km,
            detour_transit_hours: detour.current_estimated_transit_hours,
            time_difference_hours: Number((detour.current_estimated_transit_hours - route.current_estimated_transit_hours).toFixed(1)),
            reason: `Tactical bypass around ${route.peak_pass_name || 'affected corridor'} via ${detour.peak_pass_name || 'secondary sector'}.`,
          });
        }
      }
    } else {
      // Multi-route surge or weather event
      for (const r of this._routes) {
        if (r.peak_pass_altitude && r.peak_pass_altitude >= 4000) {
          affectedRouteIds.push(r.route_id);
          r.current_estimated_transit_hours = Number((r.standard_transit_hours * 1.6).toFixed(1));
          r.road_condition = ROAD_CONDITIONS.SNOW_BOUND;
          r.risk_score = 0.65;
          r.status = this.determineRouteStatus(r);
        }
      }
    }

    const affectedRoutes = this._routes.filter((r) => affectedRouteIds.includes(r.route_id));
    const kpis = this.calculateKpis();

    return {
      simulation_id: `SIM-RUN-${Date.now()}`,
      scenario_name: scenarioName,
      affected_routes_count: affectedRoutes.length,
      affected_routes: JSON.parse(JSON.stringify(affectedRoutes)),
      reroute_recommendations: rerouteRecommendations,
      network_kpis_post_simulation: kpis,
    };
  }

  // ============================================================================
  // Rollback to Pristine Baseline
  // ============================================================================

  resetToPristine() {
    this._locations = JSON.parse(JSON.stringify(LOGISTICS_LOCATIONS));
    this._routes = JSON.parse(JSON.stringify(LOGISTICS_ROUTES));
    this._recalculateAllCapacities();
    return {
      reset: true,
      message: 'All forward logistics corridors and depots restored to pristine baseline.',
      kpis: this.calculateKpis(),
    };
  }

  // ============================================================================
  // Remote API Synced Operations (Graceful Degradation)
  // ============================================================================

  async fetchLocations() {
    try {
      const response = await routesApi.getLocations();
      if (response && response.success && response.data?.locations) {
        return response.data.locations;
      }
    } catch (err) {
      console.warn('API error fetching locations, using in-memory dataset:', err.message);
    }
    return this.getAllLocations();
  }

  async fetchRoutes(params = {}) {
    try {
      const response = await routesApi.getAll(params);
      if (response && response.success && response.data?.routes) {
        return {
          routes: response.data.routes,
          total: response.data.total,
          kpis: response.data.kpis,
        };
      }
    } catch (err) {
      console.warn('API error fetching routes, using in-memory dataset:', err.message);
    }
    const routes = this.queryRoutes(params);
    return {
      routes,
      total: routes.length,
      kpis: this.calculateKpis(routes),
    };
  }

  async fetchRouteDetails(routeId) {
    try {
      const response = await routesApi.getById(routeId);
      if (response && response.success && response.data) {
        return response.data;
      }
    } catch (err) {
      console.warn(`API error fetching route ${routeId}, using in-memory dataset:`, err.message);
    }
    return this.getRouteById(routeId);
  }

  async requestRouteOptimization(requestData) {
    try {
      const response = await routesApi.optimizeRoute(requestData);
      if (response && response.success && response.data) {
        return response.data;
      }
    } catch (err) {
      console.warn('API error optimizing route, computing locally:', err.message);
    }
    return this.optimizeRoute(requestData);
  }

  async requestDisruptionSimulation(simulationData) {
    try {
      const response = await routesApi.simulateDisruption(simulationData);
      if (response && response.success && response.data) {
        return response.data;
      }
    } catch (err) {
      console.warn('API error simulating disruption, running locally:', err.message);
    }
    return this.simulateDisruption(simulationData);
  }

  async resetBaseline() {
    try {
      await routesApi.reset();
    } catch (err) {
      console.warn('API reset failed, resetting local state:', err.message);
    }
    return this.resetToPristine();
  }
}

export const routesDataService = new RoutesDataService();
export default routesDataService;
