/**
 * LogiPredict AI - Status and Badge Utilities
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
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        dot: 'bg-rose-500',
        badgeVariant: 'danger',
      };
    case 'high':
    case 'warning':
      return {
        variant: 'warning',
        label: 'High Risk',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
        badgeVariant: 'warning',
      };
    case 'medium':
      return {
        variant: 'amber',
        label: 'Medium',
        bg: 'bg-yellow-50',
        text: 'text-yellow-800',
        border: 'border-yellow-200',
        dot: 'bg-yellow-500',
        badgeVariant: 'warning',
      };
    case 'low':
      return {
        variant: 'neutral',
        label: 'Low',
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-200',
        dot: 'bg-slate-400',
        badgeVariant: 'neutral',
      };
    case 'success':
    case 'resolved':
    case 'optimal':
      return {
        variant: 'success',
        label: 'Optimal',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
        badgeVariant: 'success',
      };
    case 'info':
    default:
      return {
        variant: 'info',
        label: 'Info',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        dot: 'bg-blue-500',
        badgeVariant: 'info',
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
