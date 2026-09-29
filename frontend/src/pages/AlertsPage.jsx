import React, { useEffect, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { alertService } from '../services/api';
import { LoadingState, ErrorState, RiskBadge } from '../components/ui/Shared';
import { Bell, CheckCircle2, AlertTriangle, Filter } from 'lucide-react';

const SEVERITY_COLOR = {
  CRITICAL: 'border-l-red-500 bg-red-50',
  HIGH: 'border-l-orange-500 bg-orange-50',
  MEDIUM: 'border-l-amber-500 bg-amber-50',
  LOW: 'border-l-emerald-500 bg-emerald-50',
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('UNRESOLVED');
  const [resolving, setResolving] = useState(null);

  const fetchAlerts = () => {
    setLoading(true);
    alertService.getAll()
      .then(r => setAlerts(r.data || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAlerts(); }, []);

  const handleResolve = async (id) => {
    setResolving(id);
    try {
      await alertService.resolve(id);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolvedStatus: true } : a));
    } catch { /* ignore */ } finally {
      setResolving(null);
    }
  };

  const filtered = alerts.filter(a => {
    if (filter === 'ALL') return true;
    if (filter === 'UNRESOLVED') return !a.resolvedStatus;
    if (filter === 'RESOLVED') return a.resolvedStatus;
    return a.severity === filter;
  });

  const unresolvedCount = alerts.filter(a => !a.resolvedStatus).length;

  if (loading) return <AppLayout><LoadingState message="Loading alerts..." /></AppLayout>;
  if (error) return <AppLayout><ErrorState message={error} onRetry={fetchAlerts} /></AppLayout>;

  return (
    <AppLayout>
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-1 tracking-wide uppercase">Home / Early Warnings</div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-brand-600" />
            Alerts &amp; Early Warnings
          </h1>
          <p className="text-slate-600 text-sm mt-1">{unresolvedCount} unresolved alerts requiring attention</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="gov-card p-4 mb-6 bg-slate-50/50 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-2">
           <Filter className="w-4 h-4 text-slate-400" />
           <span className="text-sm font-semibold text-slate-700">Filter by Status:</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {['UNRESOLVED', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'RESOLVED', 'ALL'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded text-sm font-semibold transition-colors border ${filter === f
                ? 'bg-brand-50 border-brand-300 text-brand-700'
                : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Alert cards */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="gov-card text-center py-16 text-slate-500 font-medium">No alerts match your filter</div>
        )}
        {filtered.map((a) => (
          <div
            key={a.id}
            className={`gov-card border-l-4 border-y border-r border-slate-200 p-5 transition-opacity ${SEVERITY_COLOR[a.severity] || ''} ${a.resolvedStatus ? 'opacity-50' : 'shadow-sm'}`}
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <AlertTriangle className={`w-6 h-6 shrink-0 mt-0.5 ${a.severity === 'CRITICAL' ? 'text-red-500' : a.severity === 'HIGH' ? 'text-orange-500' : a.severity === 'MEDIUM' ? 'text-amber-500' : 'text-emerald-500'}`} />
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${a.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' : a.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' : a.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {a.severity}
                    </span>
                    <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-sm">{a.alertType}</span>
                    <span className="text-xs font-semibold text-slate-500">Project #{a.projectId}</span>
                  </div>
                  <p className="font-bold text-slate-900 text-base">{a.title}</p>
                  <p className="text-sm font-medium text-slate-700 mt-1">{a.description}</p>
                  
                  {a.suggestedAction && (
                    <div className="mt-3 text-sm text-amber-800 bg-amber-100/50 border border-amber-200 rounded p-3">
                      <span className="font-bold flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-amber-600" /> Suggested Action:</span>
                      <span className="block mt-1 pl-5 font-medium">{a.suggestedAction}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-200 text-xs font-semibold text-slate-500">
                    {a.triggerValue !== null && <span>Trigger Value: <span className="text-slate-700">{a.triggerValue?.toFixed(2)}</span></span>}
                    {a.thresholdValue !== null && <span>Threshold: <span className="text-slate-700">{a.thresholdValue?.toFixed(2)}</span></span>}
                  </div>
                </div>
              </div>
              <div className="shrink-0 self-start md:self-auto ml-10 md:ml-0">
                {!a.resolvedStatus ? (
                  <button
                    onClick={() => handleResolve(a.id)}
                    disabled={resolving === a.id}
                    className="flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded px-4 py-2 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {resolving === a.id ? 'Resolving...' : 'Mark as Resolved'}
                  </button>
                ) : (
                  <span className="text-sm font-bold text-emerald-600 flex items-center gap-1.5 bg-white border border-emerald-100 px-3 py-1.5 rounded">
                    <CheckCircle2 className="w-4 h-4" /> Resolved
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
