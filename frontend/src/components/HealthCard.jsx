import React from 'react';
import { Activity, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export default function HealthCard({ title, data, loading, error, onRefresh }) {
  const isUp = data?.status === 'UP';

  return (
    <div className="gov-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded ${isUp ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900">{title}</h3>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{data?.service || 'Service Node'}</p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors disabled:opacity-50"
          title="Refresh Health"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="py-6 flex items-center justify-center text-slate-500 font-medium text-sm">
          Ping system status...
        </div>
      ) : error ? (
        <div className="p-4 rounded bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2 shadow-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <div>
            <p className="font-bold">Connection Warning</p>
            <p className="text-xs text-rose-700 mt-1">{error}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm py-2 border-b border-slate-100">
            <span className="font-semibold text-slate-600">Status</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold uppercase ${
              isUp ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {isUp ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              {data?.status || 'UNKNOWN'}
            </span>
          </div>

          {data?.version && (
            <div className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100">
              <span className="font-semibold text-slate-600">Version</span>
              <span className="font-mono text-xs font-bold text-slate-800">{data.version}</span>
            </div>
          )}

          {data?.timestamp && (
            <div className="flex items-center justify-between text-sm py-1.5">
              <span className="font-semibold text-slate-600">Last Checked</span>
              <span className="font-mono text-xs font-semibold text-slate-500">
                {new Date(data.timestamp).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
