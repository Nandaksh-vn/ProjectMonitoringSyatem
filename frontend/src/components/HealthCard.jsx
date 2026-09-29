import React from 'react';
import { Activity, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export default function HealthCard({ title, data, loading, error, onRefresh }) {
  const isUp = data?.status === 'UP';

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-slate-100">{title}</h3>
            <p className="text-xs text-slate-400">{data?.service || 'Service Node'}</p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50"
          title="Refresh Health"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="py-6 flex items-center justify-center text-slate-400 text-sm">
          Ping system status...
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Connection Warning</p>
            <p className="text-xs text-rose-400/80 mt-1">{error}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm py-2 border-b border-slate-700/50">
            <span className="text-slate-400">Status</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              isUp ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}>
              {isUp ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              {data?.status || 'UNKNOWN'}
            </span>
          </div>

          {data?.version && (
            <div className="flex items-center justify-between text-sm py-1.5">
              <span className="text-slate-400">Version</span>
              <span className="font-mono text-xs text-slate-200">{data.version}</span>
            </div>
          )}

          {data?.timestamp && (
            <div className="flex items-center justify-between text-sm py-1.5">
              <span className="text-slate-400">Last Checked</span>
              <span className="font-mono text-xs text-slate-400">
                {new Date(data.timestamp).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
