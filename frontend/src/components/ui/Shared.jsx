import React from 'react';
import { clsx } from 'clsx';
import { AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

export function RiskBadge({ level }) {
  const map = {
    CRITICAL: 'risk-critical',
    HIGH: 'risk-high',
    MEDIUM: 'risk-medium',
    LOW: 'risk-low',
  };
  return (
    <span className={clsx('px-2 py-0.5 rounded text-xs font-bold uppercase', map[level] || 'bg-slate-100 text-slate-700 border border-slate-200')}>
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
    <span className={clsx('px-2 py-0.5 rounded text-xs font-bold uppercase', map[status] || 'bg-slate-100 text-slate-700 border border-slate-200')}>
      {status || 'N/A'}
    </span>
  );
}

export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={clsx('border-2 border-slate-200 border-t-brand-600 rounded-full animate-spin', sizes[size])} />
  );
}

export function LoadingState({ message = 'Loading data...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Spinner size="lg" />
      <p className="text-slate-500 text-sm font-medium">{message}</p>
    </div>
  );
}

export function EmptyState({ title = 'No data found', subtitle = '', icon: Icon = FileText }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-white border border-slate-200 rounded p-8">
      {Icon && <Icon className="w-12 h-12 text-slate-400" />}
      <p className="text-slate-700 font-semibold">{title}</p>
      {subtitle && <p className="text-slate-500 text-sm">{subtitle}</p>}
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-white border border-red-200 rounded p-8">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-2">
        <AlertCircle className="text-red-500 w-6 h-6" />
      </div>
      <p className="text-red-600 font-semibold">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 px-5 py-2 text-sm bg-brand-600 hover:bg-brand-700 text-white font-medium rounded transition-colors">
          Retry
        </button>
      )}
    </div>
  );
}

export function Card({ children, className = '' }) {
  return (
    <div className={clsx('gov-card', className)}>
      {children}
    </div>
  );
}

export function KpiCard({ title, value, subtitle, icon: Icon, color = 'blue', trend }) {
  const colorMap = {
    cyan: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    red: 'text-red-600 bg-red-50 border-red-200',
    orange: 'text-orange-600 bg-orange-50 border-orange-200',
    amber: 'text-amber-600 bg-amber-50 border-amber-200',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    blue: 'text-brand-600 bg-brand-50 border-brand-200',
    violet: 'text-violet-600 bg-violet-50 border-violet-200',
  };
  return (
    <div className="gov-card p-5 hover:border-brand-300 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-800">{value ?? '—'}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={clsx('p-2.5 rounded border', colorMap[color] || colorMap.blue)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className={clsx('mt-3 text-xs font-semibold', trend >= 0 ? 'text-red-600' : 'text-emerald-600')}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% vs last month
        </div>
      )}
    </div>
  );
}

export function ProgressBar({ value, max = 100, color = 'blue' }) {
  const pct = Math.min(100, ((value / max) * 100).toFixed(1));
  const colorMap = {
    cyan: 'bg-cyan-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    blue: 'bg-brand-500',
  };
  return (
    <div className="w-full bg-slate-100 border border-slate-200 rounded-sm h-2.5 overflow-hidden">
      <div
        className={clsx('h-full transition-all duration-700', colorMap[color] || colorMap.blue)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
