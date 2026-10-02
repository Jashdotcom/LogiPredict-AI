import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes';
import { ToastProvider } from './components/feedback/ToastContext';

/**
 * LogiPredict AI Root Application
 * Uses centralized route configuration from src/routes and global ToastProvider
 */
export function App() {
  return (
    <BrowserRouter>
      <ToastProvider position="top-right">
        <AppRoutes />
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
