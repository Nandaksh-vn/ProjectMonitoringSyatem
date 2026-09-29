import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, FolderKanban, BarChart3, Bell, Upload,
  Cpu, Lightbulb, MessageSquareText, LogOut, Menu, X,
  ChevronRight, HardHat, Shield,
} from 'lucide-react';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { to: '/',              label: 'Dashboard',         icon: LayoutDashboard },
  { to: '/projects',      label: 'Projects',           icon: FolderKanban },
  { to: '/risk-analytics',label: 'Risk Analytics',     icon: BarChart3 },
  { to: '/alerts',        label: 'Alerts & Warnings',  icon: Bell },
  { to: '/recommendations',label:'AI Recommendations', icon: Lightbulb },
  { to: '/model-performance',label:'Model Performance',icon: Cpu },
  { to: '/data-upload',   label: 'Data Upload',        icon: Upload },
  { to: '/ai-assistant',  label: 'AI Assistant',       icon: MessageSquareText },
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
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
            <HardHat className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 leading-tight">InfraWatch AI</h1>
            <p className="text-[10px] text-slate-500 font-mono">MONITORING SYSTEM</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
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
      <div className="px-3 pb-4 border-t border-slate-800 pt-3">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.fullName || user?.username || 'User'}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.department || user?.role || ''}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
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
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-slate-800 rounded-lg text-slate-300"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-slate-950 border-r border-slate-800">
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-slate-950 border-r border-slate-800 fixed left-0 top-0 bottom-0 z-30">
        <SidebarContent />
      </aside>
    </>
  );
}
