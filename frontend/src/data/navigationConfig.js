/**
 * Navigation Configuration for LogiPredict AI
 */
import {
  LayoutDashboard,
  Boxes,
  TrendingUp,
  Route,
  AlertTriangle,
  BarChart3,
  Settings,
  HelpCircle,
} from 'lucide-react';

export const NAVIGATION_ITEMS = [
  {
    name: 'Overview',
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
    name: 'Predictive Alerts',
    path: '/alerts',
    icon: AlertTriangle,
    badge: '4',
    badgeVariant: 'danger',
    description: 'Anomaly detection and stockout risk warnings',
  },
  {
    name: 'Analytics & Reports',
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
  name: 'Alex Mercer',
  role: 'Lead Supply Chain Strategist',
  organization: 'LogiPredict Ops Hub (India Central)',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  initials: 'AM',
  status: 'online',
};
