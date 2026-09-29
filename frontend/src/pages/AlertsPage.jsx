import React, { useEffect, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { alertService } from '../services/api';
import { LoadingState, ErrorState, RiskBadge } from '../components/ui/Shared';
import { Bell, CheckCircle2, AlertTriangle, Filter } from 'lucide-react';

const SEVERITY_COLOR = {
  CRITICAL: 'border-l-red-500 bg-red-500/5',
  HIGH: 'border-l-orange-500 bg-orange-500/5',
  MEDIUM: 'border-l-amber-500 bg-amber-500/5',
  LOW: 'border-l-emerald-500 bg-emerald-500/5',
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
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
              <Bell className="w-6 h-6 text-red-400" />
              Alerts &amp; Early Warnings
            </h1>
            <p className="text-slate-400 text-sm mt-1">{unresolvedCount} unresolved alerts</p>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Filter className="w-4 h-4 text-slate-500" />
        {['UNRESOLVED', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'RESOLVED', 'ALL'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === f
              ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-400'
              : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Alert cards */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-500">No alerts match your filter</div>
        )}
        {filtered.map((a) => (
          <div
            key={a.id}
            className={`border-l-4 border border-slate-800 rounded-xl p-5 transition-opacity ${SEVERITY_COLOR[a.severity] || ''} ${a.resolvedStatus ? 'opacity-50' : ''}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${a.severity === 'CRITICAL' ? 'text-red-400' : a.severity === 'HIGH' ? 'text-orange-400' : a.severity === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'}`} />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold uppercase px-1.5 py-0.5 rounded ${a.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : a.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400' : a.severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {a.severity}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">{a.alertType}</span>
                    <span className="text-xs text-slate-500">Project #{a.projectId}</span>
                  </div>
                  <p className="font-semibold text-slate-200">{a.title}</p>
                  <p className="text-sm text-slate-400 mt-1">{a.description}</p>
                  {a.suggestedAction && (
                    <div className="mt-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                      <span className="font-semibold">Suggested Action: </span>{a.suggestedAction}
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500">
                    {a.triggerValue !== null && <span>Trigger Value: {a.triggerValue?.toFixed(2)}</span>}
                    {a.thresholdValue !== null && <span>Threshold: {a.thresholdValue?.toFixed(2)}</span>}
                  </div>
                </div>
              </div>
              <div className="shrink-0">
                {!a.resolvedStatus ? (
                  <button
                    onClick={() => handleResolve(a.id)}
                    disabled={resolving === a.id}
                    className="flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 hover:border-emerald-400/50 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {resolving === a.id ? 'Resolving...' : 'Resolve'}
                  </button>
                ) : (
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
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
