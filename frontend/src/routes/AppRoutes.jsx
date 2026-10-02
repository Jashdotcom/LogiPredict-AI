import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { ROUTES_CONFIG } from './routesConfig';

/**
 * AppRoutes dynamically constructs the application routes
 * from the centralized ROUTES_CONFIG table.
 */
export function AppRoutes() {
  const mainRoutes = ROUTES_CONFIG.filter((r) => r.path !== '*');
  const notFoundRoute = ROUTES_CONFIG.find((r) => r.path === '*');

  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        {mainRoutes.map((route) => {
          if (route.path === '/') {
            return <Route key="root" index element={route.element} />;
          }
          // Strip leading slash for nested route path
          const cleanPath = route.path.startsWith('/') ? route.path.slice(1) : route.path;
          return <Route key={route.path} path={cleanPath} element={route.element} />;
        })}
        {notFoundRoute && (
          <Route path="*" element={notFoundRoute.element} />
        )}
      </Route>
    </Routes>
  );
}

export default AppRoutes;
