import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, FolderKanban, BarChart3, Bell, Upload,
  Cpu, Lightbulb, MessageSquareText, LogOut, Menu, X,
  ChevronRight, Landmark, UserCircle,
} from 'lucide-react';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { to: '/dashboard',                   label: 'Dashboard',         icon: LayoutDashboard },
  { to: '/projects',                    label: 'Projects',          icon: FolderKanban },
  { to: '/risk-analytics',              label: 'Risk Analytics',    icon: BarChart3 },
  { to: '/early-warnings',              label: 'Early Warnings',    icon: Bell },
  { to: '/recommendations',             label: 'Recommendations',   icon: Lightbulb },
  { to: '/model-performance',           label: 'Model Performance', icon: Cpu },
  { to: '/data-upload',                 label: 'Data Upload',       icon: Upload },
  { to: '/ai-assistant',                label: 'AI Assistant',      icon: MessageSquareText },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Logo Area */}
      <div className="px-5 py-4 border-b border-slate-200 bg-brand-50">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-brand-600 rounded">
            <Landmark className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-brand-900 leading-tight">InfraWatch AI</h1>
            <p className="text-[10px] text-brand-600 font-semibold tracking-wider">PROJECT MONITORING</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.filter(item => {
          const canManage = user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_PROJECT_MANAGER';
          if (!canManage && item.to !== '/projects' && item.to !== '/dashboard') {
            return false;
          }
          return true;
        }).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors group',
                isActive
                  ? 'bg-brand-50 text-brand-700 border-l-4 border-brand-600'
                  : 'text-slate-600 hover:text-brand-700 hover:bg-slate-50 border-l-4 border-transparent'
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1">{label}</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* User / Logout */}
      <div className="px-4 pb-4 pt-4 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-white border border-slate-300 flex items-center justify-center shadow-sm">
            <UserCircle className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-700 truncate">{user?.fullName || user?.username || 'User'}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.department || user?.role || 'Administrator'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-600 hover:text-brand-700 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-3 left-3 z-50 lg:hidden p-2 bg-white border border-slate-200 rounded text-slate-600 shadow-sm"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl">
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 fixed left-0 top-0 bottom-0 z-30">
        <SidebarContent />
      </aside>
    </>
  );
}
