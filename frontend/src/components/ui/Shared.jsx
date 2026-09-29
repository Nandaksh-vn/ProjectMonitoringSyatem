import React from 'react';
import { clsx } from 'clsx';

export function RiskBadge({ level }) {
  const map = {
    CRITICAL: 'risk-critical',
    HIGH: 'risk-high',
    MEDIUM: 'risk-medium',
    LOW: 'risk-low',
  };
  return (
    <span className={clsx('px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider', map[level] || 'bg-slate-700 text-slate-300')}>
      {level || 'N/A'}
    </span>
  );
}

export function StatusBadge({ status }) {
  const map = {
    ONGOING: 'status-ongoing',
    DELAYED: 'status-delayed',
    CRITICAL: 'status-critical',
    COMPLETED: 'status-completed',
  };
  return (
    <span className={clsx('px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider', map[status] || 'bg-slate-700 text-slate-300')}>
      {status || 'N/A'}
    </span>
  );
}

export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={clsx('border-2 border-slate-700 border-t-cyan-400 rounded-full animate-spin', sizes[size])} />
  );
}

export function LoadingState({ message = 'Loading data...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Spinner size="lg" />
      <p className="text-slate-400 text-sm">{message}</p>
    </div>
  );
}

export function EmptyState({ title = 'No data found', subtitle = '', icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      {Icon && <Icon className="w-12 h-12 text-slate-600" />}
      <p className="text-slate-300 font-medium">{title}</p>
      {subtitle && <p className="text-slate-500 text-sm">{subtitle}</p>}
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
        <span className="text-red-400 text-xl">!</span>
      </div>
      <p className="text-red-400 font-medium">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors">
          Retry
        </button>
      )}
    </div>
  );
}

export function Card({ children, className = '' }) {
  return (
    <div className={clsx('bg-slate-900/70 border border-slate-800 rounded-xl', className)}>
      {children}
    </div>
  );
}

export function KpiCard({ title, value, subtitle, icon: Icon, color = 'cyan', trend }) {
  const colorMap = {
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  };
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors animate-slide-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">{value ?? '—'}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={clsx('p-2.5 rounded-lg border', colorMap[color])}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className={clsx('mt-3 text-xs font-medium', trend >= 0 ? 'text-red-400' : 'text-emerald-400')}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% vs last month
        </div>
      )}
    </div>
  );
}

export function ProgressBar({ value, max = 100, color = 'cyan' }) {
  const pct = Math.min(100, ((value / max) * 100).toFixed(1));
  const colorMap = {
    cyan: 'bg-cyan-400',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    red: 'bg-red-400',
    blue: 'bg-blue-400',
  };
  return (
    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
      <div
        className={clsx('h-full rounded-full transition-all duration-700', colorMap[color])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
