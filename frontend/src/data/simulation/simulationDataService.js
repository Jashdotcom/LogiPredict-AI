/**
 * LogiPredict AI - Client-Side Logistics Simulation Service
 * =========================================================
 * Provides deterministic discrete-event simulation fallback,
 * scenario presets, and before-versus-after comparative metrics
 * for offline and high-resilience operation.
 *
 * Indian Army Forward Supply Chain (SIH 2026)
 */

export const PRESET_SCENARIOS = [
  {
    id: 'SCN-WINTER-01',
    name: 'Severe Winter Blizzard (Zoji La Pass Closure)',
    category: 'Weather Disruption',
    description: 'Heavy snowfall and avalanche risk sever NH-1D at Zoji La Pass (3,528m). Convoy transit halts, requiring bypass corridors and dilating supply delivery to Kargil and Leh by 6-10 days while winter POL fuel heating demands surge by +35%.',
    demand_surge_percentage: 35,
    lead_time_dilation_days: 8,
    inventory_change_percentage: 0,
    route_disruption_preset: 'zoji_la_blizzard',
    severity: 'critical',
    lead_time_label: '+8 Days (Zoji La Blocked)',
    demand_surge_label: '+35% Winter POL Fuel',
    stockout_risk_label: 'High (Kargil & Drass)',
  },
  {
    id: 'SCN-SURGE-02',
    name: 'High-Altitude Forward Reinforcement Surge',
    category: 'Operational Surge',
    description: 'Immediate brigade-level forward troop movement into eastern Ladakh and Siachen sectors. Ammunition consumption accelerates by +75%, combat rations by +60%, with emergency high-altitude medical demands up +40%.',
    demand_surge_percentage: 65,
    lead_time_dilation_days: 2,
    inventory_change_percentage: -15,
    route_disruption_preset: null,
    severity: 'warning',
    lead_time_label: '+2 Days (Convoy Prioritization)',
    demand_surge_label: '+65% Rations & Ammo',
    stockout_risk_label: 'Medium (Siachen & Pangong)',
  },
  {
    id: 'SCN-LANDSLIDE-03',
    name: 'Khardung La Axis Avalanche & Rockfall Blockade',
    category: 'Corridor Cutoff',
    description: 'Catastrophic rockfall closes the direct Khardung La Pass (5,359m) corridor into Nubra Valley and Siachen Base Camp. Convoys must reroute via the unpaved Shyok canyon track, tripling transit times and risking supply exhaustion.',
    demand_surge_percentage: 15,
    lead_time_dilation_days: 12,
    inventory_change_percentage: -10,
    route_disruption_preset: 'khardung_la_landslide',
    severity: 'critical',
    lead_time_label: '+12 Days (Corridor Cutoff)',
    demand_surge_label: '+15% Safety Buffer',
    stockout_risk_label: 'Critical (Nubra & Siachen)',
  },
  {
    id: 'SCN-DELAY-04',
    name: 'Rear Strategic Depot Supply Line Dilation',
    category: 'Supply Chain Bottleneck',
    description: 'National rail freight congestion and supplier bottlenecks delay manufacturer shipments from central ordnance factories to Udhampur Base Depot by 14 days, straining downstream forward FOB inventories.',
    demand_surge_percentage: 10,
    lead_time_dilation_days: 14,
    inventory_change_percentage: -25,
    route_disruption_preset: null,
    severity: 'warning',
    lead_time_label: '+14 Days (Rear Rail Delay)',
    demand_surge_label: '+10% Demand',
    stockout_risk_label: 'High (Depot Level)',
  },
  {
    id: 'SCN-COLDCHAIN-05',
    name: 'High-Altitude Cold-Chain Generator Failure',
    category: 'Equipment Breakdown',
    description: 'Sub-zero generator power failure at forward medical bunkers impairs cold-chain storage for freeze-dried plasma, blood reserves, and temperature-sensitive biologicals, causing immediate 50% stock loss and emergency airlift demand.',
    demand_surge_percentage: 45,
    lead_time_dilation_days: 4,
    inventory_change_percentage: -50,
    route_disruption_preset: null,
    severity: 'critical',
    lead_time_label: '+4 Days (Airlift Mobilization)',
    demand_surge_label: '+45% Emergency Medical',
    stockout_risk_label: 'Critical (Medical FOBs)',
  },
  {
    id: 'SCN-PEACETIME-00',
    name: 'Peacetime Nominal Operational Baseline',
    category: 'Peacetime Baseline',
    description: 'Routine peacetime operational conditions with all mountain passes open, standard lead times (3-5 days), nominal fuel consumption, and full convoy corridor availability.',
    demand_surge_percentage: 0,
    lead_time_dilation_days: 0,
    inventory_change_percentage: 0,
    route_disruption_preset: null,
    severity: 'info',
    lead_time_label: 'Standard (0 Delay)',
    demand_surge_label: 'Nominal (+0%)',
    stockout_risk_label: 'Zero Risk',
  },
];

export const MOCK_BASELINES = {
  baseline_metrics: {
    total_skus: 25,
    total_initial_inventory: 142850,
    total_daily_demand: 4820,
    average_coverage_days: 29.6,
    standard_replenishment_lead_time_days: 4.0,
    nominal_stockouts: 0,
    active_routes_count: 9,
    average_corridor_transit_hours: 6.8,
  },
  preset_scenarios: PRESET_SCENARIOS,
  default_parameters: {
    simulation_name: 'Tactical Forward Logistics Scenario',
    duration_days: 30,
    demand_surge_percentage: 0,
    lead_time_dilation_days: 0,
    inventory_change_percentage: 0,
    selected_category: 'All',
    random_seed: 42,
  },
};

/**
 * Execute client-side discrete-event simulation
 */
export function runLocalSimulation(params = {}) {
  const duration = Math.max(7, Math.min(180, Number(params.duration_days) || 30));
  const demandSurge = Number(params.demand_surge_percentage) || 0;
  const leadDilation = Number(params.lead_time_dilation_days) || 0;
  const invChange = Number(params.inventory_change_percentage) || 0;
  const presetKey = params.route_disruption_preset || (params.scenario_preset === 'SCN-WINTER-01' ? 'zoji_la_blizzard' : params.scenario_preset === 'SCN-LANDSLIDE-03' ? 'khardung_la_landslide' : null);

  const demandMult = 1.0 + (demandSurge / 100);
  const stockInitMult = Math.max(0.1, 1.0 + (invChange / 100));

  const baseInitStock = 142850;
  const baseDailyDemand = 4820;
  const simInitStock = baseInitStock * stockInitMult;

  let currentBaseStock = baseInitStock;
  let currentSimStock = simInitStock;

  const dailyTrajectories = [];
  let totalBaseDemand = 0;
  let totalSimDemand = 0;
  let totalUnmet = 0;
  let stockoutCount = 0;

  const startDate = new Date(2026, 9, 3); // Oct 03, 2026

  for (let day = 1; day <= duration; day++) {
    const curDate = new Date(startDate);
    curDate.setDate(startDate.getDate() + (day - 1));
    const dateLabel = curDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const bDemand = baseDailyDemand * (0.95 + ((day % 5) * 0.025));
    const sDemand = bDemand * demandMult;

    // Simulated Scheduled Replenishment inflows
    const baseInflow = (day % 7 === 0) ? baseDailyDemand * 6.5 : 0;
    const simInflowDay = 7 + leadDilation;
    const simInflow = (day % simInflowDay === 0) ? (baseDailyDemand * demandMult * 6.5) : 0;

    currentBaseStock = Math.max(0, currentBaseStock + baseInflow - bDemand);

    let unmetToday = 0;
    if (currentSimStock + simInflow >= sDemand) {
      currentSimStock = (currentSimStock + simInflow) - sDemand;
    } else {
      unmetToday = sDemand - (currentSimStock + simInflow);
      currentSimStock = 0;
      stockoutCount++;
    }

    totalBaseDemand += bDemand;
    totalSimDemand += sDemand;
    totalUnmet += unmetToday;

    dailyTrajectories.push({
      day,
      date: dateLabel,
      baseline_stock: Math.round(currentBaseStock),
      simulated_stock: Math.round(currentSimStock),
      baseline_demand: Math.round(bDemand),
      simulated_demand: Math.round(sDemand),
      safety_threshold: Math.round(baseInitStock * 0.25),
      unmet_demand: Math.round(unmetToday),
    });
  }

  // 7-Dimension Comparative Metrics
  const baseEndingStock = dailyTrajectories[dailyTrajectories.length - 1].baseline_stock;
  const simEndingStock = dailyTrajectories[dailyTrajectories.length - 1].simulated_stock;

  const computePoint = (base, sim, unit, higherIsBetter = true) => {
    const b = Number(base);
    const s = Number(sim);
    const delta = Math.round((s - b) * 100) / 100;
    const pct = Math.abs(b) < 1e-6 ? (s > 0 ? 100 : 0) : Math.round(((s - b) / b) * 1000) / 10;
    let status = 'neutral';
    if (delta !== 0) {
      status = higherIsBetter ? (delta > 0 ? 'improved' : 'degraded') : (delta > 0 ? 'degraded' : 'improved');
    }
    return {
      baseline_value: Math.round(b * 10) / 10,
      simulated_value: Math.round(s * 10) / 10,
      delta,
      percentage_change: pct,
      unit,
      status,
    };
  };

  const baseCoverage = Math.round((baseEndingStock / (totalBaseDemand / duration)) * 10) / 10;
  const simCoverage = Math.round((simEndingStock / (totalSimDemand / duration)) * 10) / 10;
  const baseLead = 4.0;
  const simLead = baseLead + leadDilation;
  const baseTravel = 6.8;
  const simTravel = presetKey === 'khardung_la_landslide' ? 14.5 : presetKey === 'zoji_la_blizzard' ? 11.2 : Math.round((baseTravel + (leadDilation * 0.4)) * 10) / 10;

  const comparison = {
    inventory_levels: computePoint(baseEndingStock, simEndingStock, 'Units', true),
    demand_forecasts: computePoint(totalBaseDemand, totalSimDemand, 'Units', false),
    stock_coverage_days: computePoint(baseCoverage, simCoverage, 'Days', true),
    predicted_stockouts: computePoint(0, stockoutCount > 0 ? Math.min(5, Math.ceil(stockoutCount / 3)) : 0, 'FOBs', false),
    replenishment_requisitions: computePoint(4, 4 + Math.ceil(demandSurge / 25) + Math.ceil(leadDilation / 4), 'Orders', false),
    supply_delays: computePoint(baseLead, simLead, 'Days', false),
    route_travel_times: computePoint(baseTravel, simTravel, 'Hours', false),
  };

  const serviceLevel = Math.max(0, Math.min(100, Math.round(((totalSimDemand - totalUnmet) / (totalSimDemand || 1)) * 1000) / 10));
  const resilienceScore = Math.max(15, Math.min(100, Math.round((serviceLevel * 0.7) - (stockoutCount * 2) - (leadDilation * 1.5))));

  // Dynamic Impact Summary
  const impactSummary = [];
  if (resilienceScore >= 80) {
    impactSummary.push(`Resilience is Robust at ${resilienceScore}% with manageable forward buffer drawdown.`);
  } else if (resilienceScore >= 60) {
    impactSummary.push(`Resilience is Strained at ${resilienceScore}%. Forward outposts face significant buffer exhaustion within 14 days.`);
  } else {
    impactSummary.push(`CRITICAL: Logistics Network Resilience Compromised (${resilienceScore}%). Severe risk of cascading stockouts across high-altitude forward posts.`);
  }

  if (demandSurge > 0) {
    impactSummary.push(`Operational Surge (+${demandSurge}%): Accelerated consumption draws down total stock coverage by ${comparison.stock_coverage_days.delta} days.`);
  }
  if (leadDilation > 0) {
    impactSummary.push(`Supply Line Dilation (+${leadDilation} days): Convoy transit lag delays resupply batches, causing ${Math.round(totalUnmet).toLocaleString()} units of deficit.`);
  }
  if (presetKey === 'khardung_la_landslide') {
    impactSummary.push("Corridor Severance: Khardung La Pass (5,359m) severed by avalanche. Traffic redirected to Shyok River Valley Detour (+7.7h transit).");
  } else if (presetKey === 'zoji_la_blizzard') {
    impactSummary.push("Corridor Delay: Zoji La Pass snow accumulation increases transit time by +4.4h with restricted heavy vehicle clearance.");
  }

  // Recommendations
  const recommendations = [
    {
      recommendation_id: 'REC-DISP-01',
      title: 'Emergency Fuel Resupply',
      item_id: 'SKU-POL-001',
      item_name: 'High-Altitude Diesel Fuel (POL-HAD)',
      category: 'POL',
      source_location_id: 'LOC-UDH-02',
      source_location_name: 'Udhampur Base Depot',
      target_location_id: 'LOC-LEH-01',
      target_location_name: 'Leh Base Logistics Hub',
      recommended_order_day: 1,
      recommended_quantity: Math.round(baseDailyDemand * 8 * demandMult),
      unit_of_measurement: 'Liters',
      estimated_arrival_day: 1 + Math.round(simLead),
      urgency: simCoverage < 10 ? 'Critical' : 'High',
      rationale: `Preemptive dispatch required on Day 1 to safeguard heating and power fuel buffers before corridor dilation takes full effect.`,
      current_inventory: 45000,
      projected_inventory: 12000,
      estimated_impact: 'Avoids total generator failure at 3 forward hubs.',
      assumptions: ['Transit route remains open', 'Current demand surge holds'],
      status: 'pending'
    },
    {
      recommendation_id: 'REC-REROUTE-02',
      title: 'Tactical Rations Reroute',
      item_id: 'CONVOY-LADAKH-03',
      item_name: 'Combat Rations & Cold Weather Medical Kits',
      category: 'Rations',
      source_location_id: 'LOC-SRI-01',
      source_location_name: 'Srinagar Forward Staging Hub',
      target_location_id: 'LOC-KRG-01',
      target_location_name: 'Kargil Forward Operating Base',
      recommended_order_day: 2,
      recommended_quantity: 4500,
      unit_of_measurement: 'Packets',
      estimated_arrival_day: 2 + Math.round(simLead),
      urgency: 'High',
      rationale: `Reroute 4x4 heavy all-terrain tactical convoys via alternate bypass corridor B-4 to circumvent high-altitude pass closures.`,
      current_inventory: 28000,
      projected_inventory: 5000,
      estimated_impact: 'Secures 14-day ration buffer for forward troops.',
      assumptions: ['Alternative corridor B-4 remains passable for 4x4 vehicles'],
      status: 'pending'
    },
  ];

  return {
    simulation_id: `SIM-LOCAL-${Date.now()}`,
    simulation_name: params.simulation_name || 'Tactical Logistics Simulation',
    status: 'completed',
    created_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    parameters: params,
    summary_metrics: {
      total_simulated_days: duration,
      overall_service_level_percentage: serviceLevel,
      resilience_score: resilienceScore,
      total_stockout_incidents: stockoutCount,
      total_unmet_demand_volume: Math.round(totalUnmet),
      total_replenishment_orders_needed: comparison.replenishment_requisitions.simulated_value,
      average_fleet_capacity_utilization_percentage: Math.min(98, Math.round(65 + (demandSurge * 0.2) + (leadDilation * 1.5))),
      critical_bottleneck_route: presetKey === 'khardung_la_landslide' ? 'Khardung La Pass (BLOCKED)' : presetKey === 'zoji_la_blizzard' ? 'Zoji La Corridor (DELAYED)' : 'National Highway 1D',
    },
    comparison,
    impact_summary: impactSummary,
    recommendations,
    route_impacts: [
      {
        route_id: 'RTE-SRI-KRG-01',
        route_name: 'Srinagar-Kargil Axis (Zoji La Pass)',
        origin_name: 'Srinagar Hub',
        destination_name: 'Kargil FOB',
        baseline_transit_hours: 6.5,
        simulated_transit_hours: presetKey === 'zoji_la_blizzard' ? 10.9 : 6.5,
        delta_hours: presetKey === 'zoji_la_blizzard' ? 4.4 : 0,
        percentage_change: presetKey === 'zoji_la_blizzard' ? 67.7 : 0,
        status: presetKey === 'zoji_la_blizzard' ? 'Delayed' : 'Operational',
        is_blocked: false,
      },
      {
        route_id: 'RTE-LEH-SIA-01',
        route_name: 'Leh-Siachen Main Axis (Khardung La Pass)',
        origin_name: 'Leh Hub',
        destination_name: 'Siachen Base Camp',
        baseline_transit_hours: 7.0,
        simulated_transit_hours: presetKey === 'khardung_la_landslide' ? 14.7 : 7.0,
        delta_hours: presetKey === 'khardung_la_landslide' ? 7.7 : 0,
        percentage_change: presetKey === 'khardung_la_landslide' ? 110.0 : 0,
        status: presetKey === 'khardung_la_landslide' ? 'Disrupted' : 'Operational',
        is_blocked: presetKey === 'khardung_la_landslide',
        recommended_detour_id: presetKey === 'khardung_la_landslide' ? 'RTE-LEH-SIA-02' : null,
        recommended_detour_name: presetKey === 'khardung_la_landslide' ? 'Shyok River Valley Detour Track' : null,
      },
    ],
    daily_trajectories: dailyTrajectories,
    resilience_score: resilienceScore,
    execution_time_seconds: 0.15,
  };
}
