import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes';

/**
 * LogiPredict AI Root Application
 * Uses centralized route configuration from src/routes
 */
export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
