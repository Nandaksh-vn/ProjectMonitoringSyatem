import React, { useEffect, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { mlService } from '../services/api';
import { LoadingState, ErrorState } from '../components/ui/Shared';
import { Cpu, TrendingUp, Target } from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
} from 'recharts';

const TOOLTIP_STYLE = {
  backgroundColor: '#1e293b', border: '1px solid #334155',
  borderRadius: 8, color: '#f1f5f9', fontSize: 12,
};

// Hardcoded from real training results documented in model_comparison_report.md
const MODEL_DATA = [
  { model: 'Logistic Regression', accuracy: 0.74, precision: 0.71, recall: 0.72, f1: 0.71, auc: 0.79, active: false },
  { model: 'Decision Tree', accuracy: 0.78, precision: 0.76, recall: 0.78, f1: 0.77, auc: 0.77, active: false },
  { model: 'Random Forest', accuracy: 0.86, precision: 0.84, recall: 0.85, f1: 0.84, auc: 0.91, active: false },
  { model: 'XGBoost (CUF)', accuracy: 0.89, precision: 0.87, recall: 0.88, f1: 0.87, auc: 0.94, active: false },
  { model: 'XGBoost (Enhanced)', accuracy: 0.91, precision: 0.89, recall: 0.90, f1: 0.90, auc: 0.96, active: true },
];

const COLORS = ['#64748b', '#818cf8', '#06b6d4', '#f59e0b', '#10b981'];

export default function ModelPerformancePage() {
  const [mlHealth, setMlHealth] = useState(null);
  const [mlLoading, setMlLoading] = useState(true);
  const [selected, setSelected] = useState(4); // XGBoost Enhanced

  useEffect(() => {
    mlService.getHealth()
      .then(r => setMlHealth(r.data))
      .catch(() => setMlHealth(null))
      .finally(() => setMlLoading(false));
  }, []);

  const radarData = ['accuracy', 'precision', 'recall', 'f1', 'auc'].map(k => ({
    metric: k.toUpperCase(),
    ...MODEL_DATA.reduce((acc, m, i) => ({ ...acc, [m.model.split(' ')[0]]: (m[k] * 100).toFixed(1) }), {}),
  }));

  const barData = MODEL_DATA.map((m, i) => ({
    name: m.model.length > 18 ? m.model.slice(0, 18) + '…' : m.model,
    Accuracy: (m.accuracy * 100).toFixed(1),
    AUC: (m.auc * 100).toFixed(1),
    active: m.active,
  }));

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <Cpu className="w-6 h-6 text-violet-400" />
          Model Performance
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Real metrics from ML model training experiments — XGBoost Enhanced is the production model
        </p>
      </div>

      {/* ML Service status */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-6 border text-sm ${mlHealth ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-red-500/5 border-red-500/20 text-red-400'}`}>
        <div className={`w-2 h-2 rounded-full ${mlHealth ? 'bg-emerald-400 pulse-glow' : 'bg-red-400'}`} />
        ML Service: {mlLoading ? 'Checking...' : mlHealth ? `Online — ${mlHealth.model_loaded ? 'Model Loaded' : 'No model'}` : 'Offline'}
      </div>

      {/* Metric cards for selected */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {['accuracy', 'precision', 'recall', 'f1', 'auc'].map(k => (
          <div key={k} className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 text-center">
            <p className="text-xs text-slate-400 uppercase mb-2">{k === 'auc' ? 'AUC-ROC' : k}</p>
            <p className="text-2xl font-bold text-cyan-400">{(MODEL_DATA[selected][k] * 100).toFixed(1)}%</p>
            <p className="text-xs text-slate-500 mt-1">{MODEL_DATA[selected].model}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Accuracy vs AUC bar chart */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Model Accuracy vs AUC-ROC Comparison</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 9 }} />
              <YAxis domain={[60, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} unit="%" />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v}%`]} />
              <Legend formatter={(v) => <span className="text-xs text-slate-300">{v}</span>} />
              <Bar dataKey="Accuracy" fill="#06b6d4" radius={[3, 3, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.active ? '#10b981' : '#06b6d4'} />
                ))}
              </Bar>
              <Bar dataKey="AUC" fill="#818cf8" radius={[3, 3, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.active ? '#34d399' : '#818cf8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-slate-500 mt-2 text-center">🟢 Green = Production model (XGBoost Enhanced)</p>
        </div>

        {/* Radar chart */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Multi-metric Radar Comparison</h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1e293b" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[60, 100]} tick={{ fill: '#64748b', fontSize: 8 }} />
              {MODEL_DATA.map((m, i) => (
                <Radar
                  key={m.model}
                  name={m.model.split(' ')[0]}
                  dataKey={m.model.split(' ')[0]}
                  stroke={COLORS[i]}
                  fill={COLORS[i]}
                  fillOpacity={m.active ? 0.2 : 0.05}
                  strokeWidth={m.active ? 2 : 1}
                />
              ))}
              <Legend formatter={(v) => <span className="text-xs text-slate-300">{v}</span>} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Full comparison table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl">
        <div className="px-6 py-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-slate-200">Full Model Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {['Model', 'Accuracy', 'Precision', 'Recall', 'F1 Score', 'AUC-ROC', 'Status'].map(h => (
                  <th key={h} className="text-left text-xs text-slate-400 px-4 py-3 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODEL_DATA.map((m, i) => (
                <tr
                  key={m.model}
                  onClick={() => setSelected(i)}
                  className={`border-b border-slate-800/50 cursor-pointer transition-colors ${selected === i ? 'bg-slate-800/60' : 'hover:bg-slate-800/30'} ${m.active ? 'border-l-2 border-l-emerald-400' : ''}`}
                >
                  <td className="px-4 py-3 font-medium text-slate-200">{m.model}</td>
                  {['accuracy', 'precision', 'recall', 'f1', 'auc'].map(k => (
                    <td key={k} className={`px-4 py-3 font-mono text-sm ${m.active ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {(m[k] * 100).toFixed(1)}%
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    {m.active
                      ? <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">PRODUCTION</span>
                      : <span className="text-xs text-slate-500">Retired</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
