/**
 * LogiPredict AI - Phase 7.1 Frontend Route Planning & Simulation Validation Tests
 * =================================================================================
 * Comprehensive test suite validating:
 * 1. 8 Strategic military logistics hubs & SVG coordinate geometry
 * 2. 13 Forward corridors with mountain passes and waypoints
 * 3. Mathematical capacity utilization with zero-division safeguard
 * 4. Multi-objective corridor sorting and filtering
 * 5. Non-destructive threat & disruption simulation engine
 * 6. Tactical detour generation for blocked corridors
 * 7. 1-Click pristine state reset
 * 8. Status and telematics formatting utilities
 */

import { routesDataService } from '../routesDataService';
import {
  formatTransitHours,
  formatPercent,
  formatDistance,
  formatCurrency,
  formatNumber,
} from '../../../utils/formatters';
import {
  getRouteStatusConfig,
  getRoadConditionConfig,
  getCapacityUtilizationConfig,
} from '../../../utils/statusHelpers';

describe('Phase 7.1 Strategic Route Planning & Telematics Test Suite', () => {
  beforeEach(async () => {
    // Ensure clean pristine baseline before each test
    await routesDataService.resetToPristine();
  });

  describe('1. Military Logistics Hubs & Spatial Nodes Integrity', () => {
    it('should provide at least 8 forward command hubs with valid WGS84 & SVG coords', async () => {
      const locations = await routesDataService.getLocations();
      expect(locations.length).toBeGreaterThanOrEqual(8);

      const expectedIds = [
        'LOC-LEH-01',
        'LOC-UDH-02',
        'LOC-SRI-03',
        'LOC-KRG-04',
        'LOC-DRS-05',
        'LOC-SIA-06',
        'LOC-NBR-07',
        'LOC-PNG-08',
      ];

      expectedIds.forEach((expectedId) => {
        const hub = locations.find((l) => l.location_id === expectedId);
        expect(hub).toBeDefined();
        expect(hub.name).toBeTruthy();
        expect(hub.sector).toBeTruthy();
        expect(typeof hub.latitude).toBe('number');
        expect(typeof hub.longitude).toBe('number');
        expect(typeof hub.altitude_meters).toBe('number');
        expect(typeof hub.svg_x).toBe('number');
        expect(typeof hub.svg_y).toBe('number');
        expect(hub.svg_x).toBeGreaterThanOrEqual(0);
        expect(hub.svg_x).toBeLessThanOrEqual(880);
        expect(hub.svg_y).toBeGreaterThanOrEqual(0);
        expect(hub.svg_y).toBeLessThanOrEqual(600);
      });
    });
  });

  describe('2. Forward Corridors Dataset & Route Telematics', () => {
    it('should provide 13 synthetic high-altitude corridors with valid waypoints and passes', async () => {
      const routes = await routesDataService.getRoutes();
      expect(routes.length).toBeGreaterThanOrEqual(13);

      routes.forEach((route) => {
        expect(route.route_id).toMatch(/^RTE-[A-Z]{3}-[A-Z]{3}-\d{2}$/);
        expect(route.distance_km).toBeGreaterThan(0);
        expect(route.current_estimated_transit_hours).toBeGreaterThan(0);
        expect(route.baseline_transit_hours).toBeGreaterThan(0);
        expect(route.total_capacity_metric_tonnes).toBeGreaterThan(0);
        expect(route.allocated_capacity_metric_tonnes).toBeGreaterThanOrEqual(0);
        expect(route.capacity_utilization_pct).toBeGreaterThanOrEqual(0);
        expect(route.capacity_utilization_pct).toBeLessThanOrEqual(100);
        expect(Array.isArray(route.waypoints)).toBe(true);
        expect(route.waypoints.length).toBeGreaterThanOrEqual(2);
        expect(route.estimated_cost_inr).toBeGreaterThan(0);
      });
    });
  });

  describe('3. Mathematical Capacity Utilization & Zero-Division Safeguard', () => {
    it('should compute exact capacity utilization percentage', () => {
      const util1 = routesDataService.computeCapacityUtilization(180, 240);
      expect(util1).toBe(75);

      const util2 = routesDataService.computeCapacityUtilization(240, 240);
      expect(util2).toBe(100);
    });

    it('should safely handle 0 total capacity without throwing NaN or infinity', () => {
      const zeroDiv = routesDataService.computeCapacityUtilization(50, 0);
      expect(zeroDiv).toBe(0);
      expect(Number.isNaN(zeroDiv)).toBe(false);
      expect(Number.isFinite(zeroDiv)).toBe(true);
    });

    it('should clamp negative and over-capacity numbers within [0, 100]', () => {
      const negative = routesDataService.computeCapacityUtilization(-20, 100);
      expect(negative).toBe(0);

      const overflow = routesDataService.computeCapacityUtilization(350, 200);
      expect(overflow).toBe(100);
    });
  });

  describe('4. Origin & Destination Filtering and Optimization Criteria', () => {
    it('should correctly filter corridors by origin and destination hubs', async () => {
      const filtered = await routesDataService.getRoutes({
        origin: 'LOC-SRI-03',
        destination: 'LOC-KRG-04',
      });
      expect(filtered.length).toBeGreaterThanOrEqual(1);
      filtered.forEach((r) => {
        expect(r.origin_location_id).toBe('LOC-SRI-03');
        expect(r.destination_location_id).toBe('LOC-KRG-04');
      });
    });

    it('should return empty list when origin and destination are identical', async () => {
      const filtered = await routesDataService.getRoutes({
        origin: 'LOC-LEH-01',
        destination: 'LOC-LEH-01',
      });
      expect(filtered.length).toBe(0);
    });
  });

  describe('5. Disruption Simulation Engine & Tactical Detours', () => {
    it('should apply simulated delay factor and change route status to delayed', async () => {
      const result = await routesDataService.simulateDisruption({
        route_id: 'RTE-UDH-SRI-01',
        scenario_name: 'Heavy Monsoon Landslide on NH-44',
        delay_multiplier: 1.8,
        is_blocked: false,
        road_condition: 'Monsoon_Vulnerable',
        allocated_capacity_delta_mt: 50,
      });

      expect(result.success).toBe(true);
      expect(result.simulation.route_id).toBe('RTE-UDH-SRI-01');

      const updatedRoutes = await routesDataService.getRoutes();
      const target = updatedRoutes.find((r) => r.route_id === 'RTE-UDH-SRI-01');
      expect(target).toBeDefined();
      expect(target.current_estimated_transit_hours).toBeCloseTo(7.2 * 1.8, 1);
      expect(target.status).toBe('delayed');
    });

    it('should trigger road blockage and recommend tactical bypass detour', async () => {
      const result = await routesDataService.simulateDisruption({
        route_id: 'RTE-LEH-SIA-01',
        scenario_name: 'Khardung La Avalanche Blockage',
        delay_multiplier: 2.5,
        is_blocked: true,
        road_condition: 'Landslide_Blocked',
        allocated_capacity_delta_mt: 60,
      });

      expect(result.success).toBe(true);
      expect(result.simulation.recommended_detour).toBeDefined();
      expect(result.simulation.recommended_detour.route_id).toBe('RTE-LEH-SIA-02');

      const updatedRoutes = await routesDataService.getRoutes();
      const target = updatedRoutes.find((r) => r.route_id === 'RTE-LEH-SIA-01');
      expect(target.is_blocked).toBe(true);
      expect(target.status).toBe('disrupted');
    });
  });

  describe('6. Pristine State Reset Rollback Engine', () => {
    it('should restore all modified corridors and KPIs back to pristine baseline', async () => {
      // 1. Inject disruption
      await routesDataService.simulateDisruption({
        route_id: 'RTE-SRI-KRG-01',
        scenario_name: 'Zoji La Heavy Blizzard',
        delay_multiplier: 2.0,
        is_blocked: true,
      });

      let kpis = await routesDataService.getKpis();
      expect(kpis.disrupted_routes_count).toBeGreaterThan(0);

      // 2. Trigger Pristine Reset
      const resetRes = await routesDataService.resetToPristine();
      expect(resetRes.success).toBe(true);

      // 3. Verify clean state
      kpis = await routesDataService.getKpis();
      expect(kpis.disrupted_routes_count).toBe(0);
      expect(kpis.operational_routes_count).toBe(kpis.total_routes);

      const allRoutes = await routesDataService.getRoutes();
      allRoutes.forEach((r) => {
        expect(r.is_blocked).toBe(false);
        expect(r.status).toBe('operational');
        expect(r.current_estimated_transit_hours).toBe(r.baseline_transit_hours);
      });
    });
  });

  describe('7. Status Helpers and Formatters Verification', () => {
    it('should format transit hours into clear hours format', () => {
      expect(formatTransitHours(6.5)).toBe('6.5h');
      expect(formatTransitHours(0)).toBe('0.0h');
      expect(formatTransitHours(null)).toBe('—');
    });

    it('should format percentages with precision', () => {
      expect(formatPercent(76.842)).toBe('76.8%');
      expect(formatPercent(100)).toBe('100.0%');
      expect(formatPercent(null)).toBe('—');
    });

    it('should format distance in kilometers', () => {
      expect(formatDistance(204)).toBe('204 km');
      expect(formatDistance(435.5)).toBe('435.5 km');
    });

    it('should format operational costs in INR', () => {
      const formatted = formatCurrency(28500);
      expect(formatted).toMatch(/₹\s?28,500/);
    });

    it('should return appropriate status styling classes', () => {
      const op = getRouteStatusConfig('operational');
      expect(op.label).toBe('Operational');
      expect(op.text).toContain('emerald');

      const del = getRouteStatusConfig('delayed');
      expect(del.label).toBe('Delayed');
      expect(del.text).toContain('amber');

      const dis = getRouteStatusConfig('disrupted');
      expect(dis.label).toBe('Disrupted');
      expect(dis.text).toContain('rose');
    });

    it('should return appropriate capacity utilization styling colors', () => {
      const greenCap = getCapacityUtilizationConfig(60);
      expect(greenCap.barColor).toContain('emerald');

      const amberCap = getCapacityUtilizationConfig(85);
      expect(amberCap.barColor).toContain('amber');

      const redCap = getCapacityUtilizationConfig(95);
      expect(redCap.barColor).toContain('rose');
    });
  });
});
