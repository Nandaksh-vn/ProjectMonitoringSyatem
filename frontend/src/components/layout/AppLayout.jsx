import React from 'react';
import Sidebar from './Sidebar';

export default function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 lg:ml-64 min-h-screen overflow-x-hidden">
        {/* Header bar area */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center px-6 sticky top-0 z-20">
          <h2 className="text-lg font-semibold text-brand-900 hidden lg:block">Infrastructure Project Monitoring & Early Warning System</h2>
          <div className="flex-1"></div>
          <div className="text-sm font-medium text-slate-500">Government of India</div>
        </header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-20">
          {children}
        </div>
        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500 mt-auto">
          &copy; {new Date().getFullYear()} InfraWatch AI - Project Monitoring and Early Warning System. All rights reserved.
        </footer>
      </main>
    </div>
  );
}
