import React from 'react';
import { Badge } from './Badge';

// Comprehensive status-to-variant mapping for military forward supply chain
const STATUS_CONFIG_MAP = {
  // Optimal / Healthy statuses
  healthy: { variant: 'success', label: 'Healthy', dot: true },
  optimal: { variant: 'success', label: 'Optimal', dot: true },
  completed: { variant: 'success', label: 'Completed', dot: false },
  resolved: { variant: 'success', label: 'Resolved', dot: false },
  delivered: { variant: 'success', label: 'Delivered', dot: false },
  'on time': { variant: 'success', label: 'On Time', dot: true },
  'escort cleared': { variant: 'success', label: 'Escort Cleared', dot: true },
  'stocked & verified': { variant: 'success', label: 'Stocked & Verified', dot: false },

  // Warning / Attention statuses
  warning: { variant: 'warning', label: 'Warning', dot: true },
  'low stock': { variant: 'warning', label: 'Low Stock', dot: true },
  'reorder needed': { variant: 'warning', label: 'Reorder Needed', dot: true },
  pending: { variant: 'warning', label: 'Pending', dot: false },
  'in progress': { variant: 'warning', label: 'In Progress', dot: true },
  'rerouted': { variant: 'warning', label: 'Rerouted', dot: true },
  'delayed': { variant: 'warning', label: 'Delayed', dot: true },
  'ready for loading': { variant: 'warning', label: 'Ready for Loading', dot: false },
  'attention': { variant: 'warning', label: 'Attention', dot: true },

  // Critical / Danger statuses
  critical: { variant: 'danger', label: 'Critical', dot: true, dotPulse: true },
  danger: { variant: 'danger', label: 'Danger', dot: true, dotPulse: true },
  'stockout risk': { variant: 'danger', label: 'Stockout Risk', dot: true, dotPulse: true },
  failed: { variant: 'danger', label: 'Failed', dot: false },
  urgent: { variant: 'danger', label: 'Urgent', dot: true, dotPulse: true },
  'congestion alert': { variant: 'danger', label: 'Congestion Alert', dot: true },
  'corridor cutoff': { variant: 'danger', label: 'Corridor Cutoff', dot: true, dotPulse: true },

  // Info / In-Transit statuses
  info: { variant: 'info', label: 'Information', dot: false },
  'in transit': { variant: 'info', label: 'In Transit', dot: true },
  'en route': { variant: 'info', label: 'En Route', dot: true },
  'convoy dispatched': { variant: 'info', label: 'Convoy Dispatched', dot: true },
  'air-drop scheduled': { variant: 'info', label: 'Air-Drop Scheduled', dot: true },
  surplus: { variant: 'info', label: 'Surplus', dot: false },
  acknowledged: { variant: 'info', label: 'Acknowledged', dot: false },

  // AI & Simulation / Neutral
  'ai powered': { variant: 'brand', label: 'AI Powered', dot: false },
  'what-if': { variant: 'purple', label: 'What-If', dot: false },
  neutral: { variant: 'neutral', label: 'Neutral', dot: false },
};

/**
 * Enterprise StatusBadge component that automatically resolves semantic variants,
 * icons, dots, and labels from a status string or props.
 */
export function StatusBadge({
  status,
  label,
  variant,
  size = 'xs',
  dot,
  dotPulse,
  icon,
  className = '',
  ...props
}) {
  const normalizedKey = status ? String(status).toLowerCase().trim() : 'neutral';
  const config = STATUS_CONFIG_MAP[normalizedKey] || {
    variant: variant || 'neutral',
    label: label || status || 'Unknown',
    dot: dot !== undefined ? dot : false,
  };

  const finalVariant = variant || config.variant;
  const finalDot = dot !== undefined ? dot : config.dot;
  const finalPulse = dotPulse !== undefined ? dotPulse : config.dotPulse;
  const displayText = label || (status ? config.label || status : 'Active');

  return (
    <Badge
      variant={finalVariant}
      size={size}
      dot={finalDot}
      dotPulse={finalPulse}
      icon={icon}
      className={className}
      {...props}
    >
      {displayText}
    </Badge>
  );
}

export default StatusBadge;
