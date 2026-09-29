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
  backgroundColor: '#ffffff', border: '1px solid #e2e8f0',
  borderRadius: 4, color: '#0f172a', fontSize: 12,
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
};

// Hardcoded from real training results documented in model_comparison_report.md
const MODEL_DATA = [
  { model: 'Logistic Regression', accuracy: 0.74, precision: 0.71, recall: 0.72, f1: 0.71, auc: 0.79, active: false },
  { model: 'Decision Tree', accuracy: 0.78, precision: 0.76, recall: 0.78, f1: 0.77, auc: 0.77, active: false },
  { model: 'Random Forest', accuracy: 0.86, precision: 0.84, recall: 0.85, f1: 0.84, auc: 0.91, active: false },
  { model: 'XGBoost (CUF)', accuracy: 0.89, precision: 0.87, recall: 0.88, f1: 0.87, auc: 0.94, active: false },
  { model: 'XGBoost (Enhanced)', accuracy: 0.91, precision: 0.89, recall: 0.90, f1: 0.90, auc: 0.96, active: true },
];

const COLORS = ['#94a3b8', '#818cf8', '#0ea5e9', '#f59e0b', '#059669'];

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
        <div className="text-xs font-semibold text-slate-500 mb-1 tracking-wide uppercase">Settings / Model Performance</div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Cpu className="w-6 h-6 text-brand-600" />
          Model Performance
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Real metrics from ML model training experiments — XGBoost Enhanced is the production model
        </p>
      </div>

      {/* ML Service status */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded mb-6 border text-sm font-semibold ${mlHealth ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
        <div className={`w-3 h-3 rounded-full ${mlHealth ? 'bg-emerald-500 pulse-glow' : 'bg-red-500'}`} />
        ML Engine Status: {mlLoading ? 'Checking...' : mlHealth ? `Online — ${mlHealth.model_loaded ? 'Model Loaded Successfully' : 'No model loaded'}` : 'Offline / Unavailable'}
      </div>

      {/* Metric cards for selected */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {['accuracy', 'precision', 'recall', 'f1', 'auc'].map(k => (
          <div key={k} className="gov-card p-4 text-center">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{k === 'auc' ? 'AUC-ROC' : k}</p>
            <p className="text-3xl font-bold text-brand-700">{(MODEL_DATA[selected][k] * 100).toFixed(1)}%</p>
            <p className="text-xs font-semibold text-slate-400 mt-2">{MODEL_DATA[selected].model}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Accuracy vs AUC bar chart */}
        <div className="gov-card p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Model Accuracy vs AUC-ROC Comparison</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} barSize={20} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} axisLine={false} tickLine={false} />
              <YAxis domain={[60, 100]} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} unit="%" axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v}%`]} cursor={{ fill: '#f8fafc' }} />
              <Legend formatter={(v) => <span className="text-xs font-semibold text-slate-700">{v}</span>} wrapperStyle={{ paddingTop: '10px' }} />
              <Bar dataKey="Accuracy" fill="#3b82f6" radius={[2, 2, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.active ? '#059669' : '#3b82f6'} />
                ))}
              </Bar>
              <Bar dataKey="AUC" fill="#6366f1" radius={[2, 2, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.active ? '#10b981' : '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs font-semibold text-slate-500 mt-2 text-center">🟢 Green = Production model (XGBoost Enhanced)</p>
        </div>

        {/* Radar chart */}
        <div className="gov-card p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Multi-metric Radar Comparison</h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }} />
              <PolarRadiusAxis angle={30} domain={[60, 100]} tick={{ fill: '#94a3b8', fontSize: 9 }} />
              {MODEL_DATA.map((m, i) => (
                <Radar
                  key={m.model}
                  name={m.model.split(' ')[0]}
                  dataKey={m.model.split(' ')[0]}
                  stroke={COLORS[i]}
                  fill={COLORS[i]}
                  fillOpacity={m.active ? 0.3 : 0.05}
                  strokeWidth={m.active ? 3 : 1}
                />
              ))}
              <Legend formatter={(v) => <span className="text-xs font-semibold text-slate-700">{v}</span>} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Full comparison table */}
      <div className="gov-card">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 rounded-t">
          <h3 className="text-sm font-bold text-slate-800">Full Model Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-white">
                {['Model', 'Accuracy', 'Precision', 'Recall', 'F1 Score', 'AUC-ROC', 'Status'].map(h => (
                  <th key={h} className="text-left text-xs font-bold text-slate-600 px-5 py-3 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODEL_DATA.map((m, i) => (
                <tr
                  key={m.model}
                  onClick={() => setSelected(i)}
                  className={`border-b border-slate-100 cursor-pointer transition-colors ${selected === i ? 'bg-slate-50' : 'hover:bg-slate-50/50'} ${m.active ? 'border-l-4 border-l-brand-600' : 'border-l-4 border-l-transparent'}`}
                >
                  <td className="px-5 py-3 font-semibold text-slate-900">{m.model}</td>
                  {['accuracy', 'precision', 'recall', 'f1', 'auc'].map(k => (
                    <td key={k} className={`px-5 py-3 font-mono font-bold text-sm ${m.active ? 'text-brand-600' : 'text-slate-700'}`}>
                      {(m[k] * 100).toFixed(1)}%
                    </td>
                  ))}
                  <td className="px-5 py-3">
                    {m.active
                      ? <span className="text-xs font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-1 rounded uppercase">PRODUCTION</span>
                      : <span className="text-xs font-bold text-slate-500 uppercase">Retired</span>}
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
