import React from 'react';
import Sidebar from './Sidebar';

export default function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#060b18]">
      <Sidebar />
      <main className="flex-1 lg:ml-60 min-h-screen overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
