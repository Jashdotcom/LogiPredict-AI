/**
 * LogiPredict AI - Status and Badge Utilities
 * Dark command-center token variants
 */

/**
 * Get color scheme and label for alert severity
 * @param {'critical'|'high'|'medium'|'low'|'info'|string} severity
 */
export function getSeverityConfig(severity) {
  const norm = (severity || '').toLowerCase();
  switch (norm) {
    case 'critical':
      return {
        variant: 'danger',
        label: 'Critical',
        bg: 'bg-rose-950/80',
        text: 'text-rose-400',
        border: 'border-rose-800/60',
        dot: 'bg-rose-500',
        badgeVariant: 'danger',
      };
    case 'high':
    case 'warning':
      return {
        variant: 'warning',
        label: 'High Risk',
        bg: 'bg-amber-950/80',
        text: 'text-amber-400',
        border: 'border-amber-800/60',
        dot: 'bg-amber-500',
        badgeVariant: 'warning',
      };
    case 'medium':
      return {
        variant: 'amber',
        label: 'Medium',
        bg: 'bg-yellow-950/80',
        text: 'text-yellow-400',
        border: 'border-yellow-800/60',
        dot: 'bg-yellow-500',
        badgeVariant: 'warning',
      };
    case 'low':
      return {
        variant: 'neutral',
        label: 'Low',
        bg: 'bg-slate-800',
        text: 'text-slate-300',
        border: 'border-slate-700',
        dot: 'bg-slate-400',
        badgeVariant: 'neutral',
      };
    case 'success':
    case 'resolved':
    case 'optimal':
      return {
        variant: 'success',
        label: 'Optimal',
        bg: 'bg-emerald-950/80',
        text: 'text-emerald-400',
        border: 'border-emerald-800/60',
        dot: 'bg-emerald-500',
        badgeVariant: 'success',
      };
    case 'info':
    default:
      return {
        variant: 'info',
        label: 'Info',
        bg: 'bg-blue-950/80',
        text: 'text-blue-400',
        border: 'border-blue-800/60',
        dot: 'bg-blue-500',
        badgeVariant: 'info',
      };
  }
}

/**
 * Get status configuration for alert lifecycle states
 * @param {'new'|'acknowledged'|'resolved'|string} status
 */
export function getAlertStatusConfig(status) {
  const norm = (status || '').toLowerCase();
  switch (norm) {
    case 'new':
      return {
        variant: 'danger',
        label: 'New Anomaly',
        dot: true,
        dotPulse: true,
        bg: 'bg-rose-950/80',
        text: 'text-rose-400',
        border: 'border-rose-800/60',
      };
    case 'acknowledged':
      return {
        variant: 'warning',
        label: 'Acknowledged',
        dot: true,
        dotPulse: false,
        bg: 'bg-amber-950/80',
        text: 'text-amber-400',
        border: 'border-amber-800/60',
      };
    case 'resolved':
      return {
        variant: 'success',
        label: 'Mitigated / Resolved',
        dot: false,
        dotPulse: false,
        bg: 'bg-emerald-950/80',
        text: 'text-emerald-400',
        border: 'border-emerald-800/60',
      };
    default:
      return {
        variant: 'neutral',
        label: status || 'Unknown',
        dot: false,
        dotPulse: false,
        bg: 'bg-slate-800',
        text: 'text-slate-300',
        border: 'border-slate-700',
      };
  }
}

/**
 * Get status configuration for inventory health
 * @param {number} stockLevel - Percentage or ratio
 * @param {number} [reorderPoint=30]
 */
export function getStockStatus(stockLevel, reorderPoint = 30) {
  if (stockLevel <= 15) {
    return { label: 'Stockout Risk', variant: 'danger', color: 'rose' };
  }
  if (stockLevel <= reorderPoint) {
    return { label: 'Reorder Needed', variant: 'warning', color: 'amber' };
  }
  if (stockLevel > 90) {
    return { label: 'Surplus', variant: 'info', color: 'blue' };
  }
  return { label: 'Healthy', variant: 'success', color: 'emerald' };
}

/**
 * Get status configuration for forward logistics routes
 * @param {'operational'|'delayed'|'disrupted'|'unavailable'|string} status
 */
export function getRouteStatusConfig(status) {
  const norm = (status || '').toLowerCase();
  switch (norm) {
    case 'operational':
      return {
        variant: 'success',
        label: 'Operational',
        bg: 'bg-emerald-950/80',
        text: 'text-emerald-400',
        border: 'border-emerald-800/60',
        dot: 'bg-emerald-500',
        stroke: '#10b981', // emerald-500
        badgeVariant: 'success',
      };
    case 'delayed':
      return {
        variant: 'warning',
        label: 'Transit Delayed',
        bg: 'bg-amber-950/80',
        text: 'text-amber-400',
        border: 'border-amber-800/60',
        dot: 'bg-amber-500',
        stroke: '#f59e0b', // amber-500
        badgeVariant: 'warning',
      };
    case 'disrupted':
      return {
        variant: 'danger',
        label: 'Corridor Disrupted',
        bg: 'bg-rose-950/80',
        text: 'text-rose-400',
        border: 'border-rose-800/60',
        dot: 'bg-rose-500',
        stroke: '#f43f5e', // rose-500
        badgeVariant: 'danger',
      };
    case 'unavailable':
    default:
      return {
        variant: 'neutral',
        label: 'Unavailable',
        bg: 'bg-slate-900/80',
        text: 'text-slate-400',
        border: 'border-slate-700/60',
        dot: 'bg-slate-500',
        stroke: '#64748b', // slate-500
        badgeVariant: 'neutral',
      };
  }
}

/**
 * Get visual styling configuration for road condition classifications
 * @param {string} roadCondition
 */
export function getRoadConditionConfig(roadCondition) {
  switch (roadCondition) {
    case 'Clear_All_Weather':
      return {
        label: 'Clear All-Weather',
        text: 'text-emerald-400',
        bg: 'bg-emerald-950/60',
        border: 'border-emerald-800/40',
      };
    case 'High_Altitude_Pass':
      return {
        label: 'High-Altitude Pass',
        text: 'text-cyan-400',
        bg: 'bg-cyan-950/60',
        border: 'border-cyan-800/40',
      };
    case 'Snow_Bound':
      return {
        label: 'Snow-Bound / Icy',
        text: 'text-sky-300',
        bg: 'bg-sky-950/60',
        border: 'border-sky-800/40',
      };
    case 'Avalanche_Warning':
      return {
        label: 'Avalanche Warning',
        text: 'text-rose-400',
        bg: 'bg-rose-950/60',
        border: 'border-rose-800/40',
      };
    case 'Landslide_Blocked':
      return {
        label: 'Landslide Blocked',
        text: 'text-rose-500',
        bg: 'bg-rose-950/80',
        border: 'border-rose-800/80',
      };
    case 'Monsoon_Vulnerable':
      return {
        label: 'Monsoon Vulnerable',
        text: 'text-amber-400',
        bg: 'bg-amber-950/60',
        border: 'border-amber-800/40',
      };
    default:
      return {
        label: roadCondition ? roadCondition.replace(/_/g, ' ') : 'Standard',
        text: 'text-slate-300',
        bg: 'bg-slate-800/60',
        border: 'border-slate-700/40',
      };
  }
}

/**
 * Get color threshold configuration for capacity utilization percentage
 * @param {number} pct - Capacity utilization (0-100)
 */
export function getCapacityUtilizationConfig(pct) {
  const val = Number(pct) || 0;
  if (val >= 90.0) {
    return {
      label: 'Critical / Saturated',
      textColor: 'text-rose-400',
      barColor: 'bg-rose-500',
      badgeVariant: 'danger',
      glow: 'shadow-rose-500/30',
    };
  }
  if (val >= 70.0) {
    return {
      label: 'Elevated Load',
      textColor: 'text-amber-400',
      barColor: 'bg-amber-500',
      badgeVariant: 'warning',
      glow: 'shadow-amber-500/30',
    };
  }
  return {
    label: 'Normal Headroom',
    textColor: 'text-emerald-400',
    barColor: 'bg-emerald-500',
    badgeVariant: 'success',
    glow: 'shadow-emerald-500/30',
  };
}

