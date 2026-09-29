import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Activity, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PublicLayout({ children }) {
  const { isAuthenticated } = useAuth();
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-brand-600 p-2 rounded-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">InfraWatch AI</h1>
                <p className="text-xs text-slate-500 font-medium">Infrastructure Project Monitoring Portal</p>
              </div>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <Link to="/" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">Home</Link>
              <Link to="/sectors" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">Sectors</Link>
              <Link to="/projects" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">Projects</Link>
              <Link to="/about" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">About</Link>
              <Link to="/reports" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">Reports</Link>
            </nav>

            <div className="flex items-center">
              {isAuthenticated ? (
                <Link to="/dashboard" className="bg-brand-50 hover:bg-brand-100 text-brand-700 px-4 py-2 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 border border-brand-200">
                  <UserCircle className="w-4 h-4" />
                  Profile / Dashboard
                </Link>
              ) : (
                <Link to="/login" className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 rounded-md text-sm font-medium transition-colors shadow-sm">
                  Login / Management
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full">
        {children || <Outlet />}
      </main>

      <footer className="bg-slate-900 text-slate-400 py-12 text-center text-sm">
        <div className="max-w-7xl mx-auto px-4">
          <p>&copy; {new Date().getFullYear()} InfraWatch AI - Infrastructure Project Monitoring & Early Warning System.</p>
          <p className="mt-2 text-xs">A data-driven platform for predictive analytics in public infrastructure.</p>
        </div>
      </footer>
    </div>
  );
}
