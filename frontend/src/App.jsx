import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import {
  OverviewPage,
  InventoryPage,
  ForecastingPage,
  RoutesPage,
  AlertsPage,
  AnalyticsPage,
  SettingsPage,
  NotFoundPage,
} from './pages';

/**
 * LogiPredict AI Root Application Router
 */
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="forecasting" element={<ForecastingPage />} />
          <Route path="routes" element={<RoutesPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
