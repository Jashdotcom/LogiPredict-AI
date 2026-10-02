/**
 * Navigation Configuration for LogiPredict AI
 * Centralized navigation items for Command Center sidebar, topbar, and mobile drawer.
 * Aligned with Indian Army forward logistics hierarchy and SIH 2026 specifications.
 */
import {
  LayoutDashboard,
  Boxes,
  TrendingUp,
  Package,
  Route,
  AlertTriangle,
  Sliders,
  BarChart3,
  Settings,
} from 'lucide-react';

export const NAVIGATION_ITEMS = [
  {
    name: 'Overview',
    path: '/',
    icon: LayoutDashboard,
    description: 'Real-time telemetry and executive summary',
  },
  {
    name: 'Inventory',
    path: '/inventory',
    icon: Boxes,
    description: 'Stock levels, safety stocks, and replenishment',
  },
  {
    name: 'Demand Forecasting',
    path: '/forecasting',
    icon: TrendingUp,
    badge: 'AI Powered',
    badgeVariant: 'brand',
    description: 'Predictive time-series demand models & trends',
  },
  {
    name: 'Route Planning',
    path: '/routes',
    icon: Route,
    description: 'GIS tracking, dynamic rerouting & transit ETA',
  },
  {
    name: 'Predictive Alerts',
    path: '/alerts',
    icon: AlertTriangle,
    badge: '4',
    badgeVariant: 'danger',
    description: 'Anomaly detection and stockout risk warnings',
  },
  {
    name: 'Simulations',
    path: '/simulations',
    icon: Sliders,
    badge: 'What-If',
    badgeVariant: 'purple',
    description: 'Monsoon, roadblock, and surge stress simulations',
  },
  {
    name: 'Analytics',
    path: '/analytics',
    icon: BarChart3,
    description: 'Supply chain KPIs, exportable audit reports',
  },
];

export const SECONDARY_NAVIGATION = [
  {
    name: 'Settings',
    path: '/settings',
    icon: Settings,
    description: 'Model parameters, API webhooks, and preferences',
  },
];

export const CURRENT_USER = {
  name: 'Col. Rajesh Verma',
  role: 'Forward Logistics Director',
  organization: 'Indian Army — Central Logistics Hub',
  rank: 'Colonel',
  echelon: 'HQ Northern Command',
  initials: 'RV',
  status: 'online',
};

export default NAVIGATION_ITEMS;
