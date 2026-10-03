import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { MobileNav } from '../components/layout/MobileNav';

/**
 * AppLayout provides the persistent shell (Sidebar + Header + Main Area)
 * for all routes in LogiPredict AI.
 */
export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f1f6fc] flex text-slate-800 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Desktop Sidebar (Fixed left) */}
      <Sidebar />

      {/* Mobile Navigation Drawer */}
      <MobileNav
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area (Offset by sidebar width on desktop) */}
      <div className="flex-1 flex flex-col md:pl-[202px] min-w-0 transition-all duration-300">
        {/* Sticky Top Header */}
        <Header onMenuClick={() => setMobileMenuOpen(true)} />

        {/* Dynamic Route Content */}
        <main className="flex-1 p-3 max-w-none w-full mx-auto mt-[60px]">
          <Outlet />
        </main>

        {/* Global Enterprise Footer Note */}
        <footer className="hidden py-4 px-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              LogiPredict AI © 2026 — Smart India Hackathon Autonomous Supply Chain Prototype
            </span>
            <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Inference Latency: 28ms
              </span>
              <span>Regional Hub: India Central (HQ)</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default AppLayout;
