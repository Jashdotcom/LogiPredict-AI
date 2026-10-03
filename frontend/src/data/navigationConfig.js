/**
 * Navigation Configuration for LogiPredict AI
 * Centralized navigation items for Command Center sidebar, topbar, and mobile drawer.
 * Aligned with Indian Army forward logistics hierarchy and SIH 2026 specifications.
 */
import {
  LayoutDashboard,
  Boxes,
  TrendingUp,
  Route,
  AlertTriangle,
  Sliders,
  BarChart3,
  Settings,
  Truck,
} from 'lucide-react';

export const NAVIGATION_ITEMS = [
  {
    name: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
    description: 'Real-time telemetry and executive summary',
  },
  {
    name: 'Inventory Management',
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
    name: 'Risk Analysis',
    path: '/alerts',
    icon: AlertTriangle,
    badge: '4',
    badgeVariant: 'danger',
    description: 'Anomaly detection and stockout risk warnings',
  },
  {
    name: 'Shipments & Fleet',
    path: '/supplies',
    icon: Truck,
    description: 'Forward unit requisitions, convoy manifests, and fleet supplies',
  },
  {
    name: 'Simulations',
    path: '/simulations',
    icon: Sliders,
    badge: 'What-If',
    badgeVariant: 'purple',
    description: 'Weather, roadblock, and demand surge scenarios',
  },
  {
    name: 'Reports & Analytics',
    path: '/analytics',
    icon: BarChart3,
    description: 'Supply chain KPIs, exportable audit reports',
  },
];

export const SECONDARY_NAVIGATION = [
  {
    name: 'System Settings',
    path: '/settings',
    icon: Settings,
    description: 'Model parameters, API webhooks, and preferences',
  },
];

export const CURRENT_USER = {
  name: 'Lt. Col. A. Sharma',
  role: 'Command Centre',
  organization: 'Indian Army — Central Logistics Hub',
  rank: 'Colonel',
  echelon: 'HQ Northern Command',
  initials: 'AS',
  status: 'online',
};

export default NAVIGATION_ITEMS;
