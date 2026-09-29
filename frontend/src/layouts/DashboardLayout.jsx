import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 sticky top-0 z-30 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-brand-600 px-3 py-1.5 rounded flex flex-col justify-center">
            <h1 className="text-white font-bold leading-none tracking-tight">InfraWatch AI</h1>
            <span className="text-[9px] text-brand-100 font-bold tracking-widest uppercase mt-0.5">Project Monitoring</span>
          </div>
        </div>
        
        <div className="hidden md:block">
          <h2 className="text-base font-bold text-slate-700 tracking-tight">Infrastructure Project Monitoring & Early Warning System</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded">Government of India</div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 w-full lg:ml-64 overflow-x-hidden overflow-y-auto bg-slate-50 relative">
          {/* Content Wrapper */}
          <main className="flex-1 p-4 lg:p-8">
            <div className="max-w-[1600px] mx-auto w-full space-y-6">
              {children || <Outlet />}
            </div>
          </main>
          
          {/* Footer */}
          <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500 shrink-0">
            &copy; {new Date().getFullYear()} InfraWatch AI - Project Monitoring and Early Warning System. All rights reserved.
          </footer>
        </div>
      </div>
    </div>
  );
}
