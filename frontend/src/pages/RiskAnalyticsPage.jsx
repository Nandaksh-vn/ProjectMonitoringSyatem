import React, { useEffect, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { projectService } from '../services/api';
import { LoadingState, ErrorState, RiskBadge } from '../components/ui/Shared';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, BarChart, Bar, Cell, Legend,
} from 'recharts';
import { BarChart3 } from 'lucide-react';

const TOOLTIP_STYLE = {
  backgroundColor: '#ffffff', border: '1px solid #e2e8f0',
  borderRadius: 4, color: '#0f172a', fontSize: 12,
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
};

const RISK_COLORS = { CRITICAL: '#dc2626', HIGH: '#ea580c', MEDIUM: '#d97706', LOW: '#059669' };

export default function RiskAnalyticsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    projectService.getAll()
      .then(r => setProjects(r.data?.content || r.data || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AppLayout><LoadingState /></AppLayout>;
  if (error) return <AppLayout><ErrorState message={error} /></AppLayout>;

  // Data derivations
  const scatterData = projects.map(p => {
    const pred = p.predictions?.[0];
    return {
      name: p.projectCode,
      fullName: p.projectName,
      costOverrun: (((p.revisedCost - p.approvedCost) / (p.approvedCost || 1)) * 100),
      physicalProgress: p.physicalProgress || 0,
      riskLevel: pred?.riskLevel || 'LOW',
      riskScore: pred?.overallRiskScore || 0,
    };
  });

  const riskByMinistry = projects.reduce((acc, p) => {
    const m = p.ministryCode || p.ministry?.code || 'OTHER';
    if (!acc[m]) acc[m] = { name: m, CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    const rl = p.predictions?.[0]?.riskLevel || 'LOW';
    acc[m][rl]++;
    return acc;
  }, {});
  const ministryRiskData = Object.values(riskByMinistry);

  const riskDist = Object.entries(
    projects.reduce((acc, p) => {
      const rl = p.predictions?.[0]?.riskLevel || 'LOW';
      acc[rl] = (acc[rl] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  return (
    <AppLayout>
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-1 tracking-wide uppercase">Home / Analytics</div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-brand-600" />
            Risk Analytics
          </h1>
          <p className="text-slate-600 text-sm mt-1">Portfolio-level risk intelligence and trend analysis</p>
        </div>
      </div>

      {/* Risk summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {riskDist.map(({ name, value }) => (
          <div key={name} className="gov-card p-5 text-center">
            <RiskBadge level={name} />
            <p className="text-3xl font-bold text-slate-900 mt-3">{value}</p>
            <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wide">projects</p>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Cost Overrun vs Progress Scatter */}
        <div className="gov-card p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Cost Overrun vs Physical Progress</h3>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="physicalProgress" name="Physical Progress" unit="%" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="costOverrun" name="Cost Overrun" unit="%" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e1' }}
                content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0]?.payload;
                  return (
                    <div style={TOOLTIP_STYLE} className="p-3">
                      <p className="font-bold text-slate-800 text-xs mb-2">{d?.fullName}</p>
                      <p className="text-xs text-slate-600 font-medium">Progress: {d?.physicalProgress?.toFixed(1)}%</p>
                      <p className="text-xs text-slate-600 font-medium mb-2">Cost Overrun: {d?.costOverrun?.toFixed(1)}%</p>
                      <RiskBadge level={d?.riskLevel} />
                    </div>
                  );
                }}
              />
              {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(rl => (
                <Scatter
                  key={rl}
                  name={rl}
                  data={scatterData.filter(d => d.riskLevel === rl)}
                  fill={RISK_COLORS[rl]}
                />
              ))}
              <Legend formatter={(v) => <span className="text-xs font-semibold text-slate-700">{v}</span>} wrapperStyle={{ paddingTop: '10px' }} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Risk by Ministry stacked bar */}
        <div className="gov-card p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Risk Distribution by Ministry</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ministryRiskData} barSize={24} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#f8fafc' }} />
              <Legend formatter={(v) => <span className="text-xs font-semibold text-slate-700">{v}</span>} wrapperStyle={{ paddingTop: '10px' }} />
              <Bar dataKey="CRITICAL" stackId="a" fill="#dc2626" />
              <Bar dataKey="HIGH" stackId="a" fill="#ea580c" />
              <Bar dataKey="MEDIUM" stackId="a" fill="#d97706" />
              <Bar dataKey="LOW" stackId="a" fill="#059669" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Project risk table */}
      <div className="gov-card">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 rounded-t">
          <h3 className="text-sm font-bold text-slate-800">Project Risk Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-white">
                {['Project ID', 'Project Name', 'Risk Score', 'Risk Level', 'Cost Overrun%', 'Delay (months)', 'Status'].map(h => (
                  <th key={h} className="text-left text-xs font-bold text-slate-600 px-5 py-3 uppercase tracking-wide bg-slate-50/50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects
                .sort((a, b) => (b.predictions?.[0]?.overallRiskScore || 0) - (a.predictions?.[0]?.overallRiskScore || 0))
                .map(p => {
                  const pred = p.predictions?.[0];
                  return (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs font-medium text-slate-600">{p.projectCode}</td>
                      <td className="px-5 py-3 text-slate-900 text-sm font-semibold">{p.projectName}</td>
                      <td className="px-5 py-3 font-mono font-bold text-slate-800">{pred?.overallRiskScore?.toFixed(1) || '—'}</td>
                      <td className="px-5 py-3"><RiskBadge level={pred?.riskLevel} /></td>
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-700">
                        {pred?.predictedCostOverrunPct?.toFixed(1) || '—'}%
                      </td>
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-700">
                        {pred?.predictedDelayMonths?.toFixed(0) || '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${p.status === 'CRITICAL' ? 'bg-red-50 text-red-700 border border-red-200' : p.status === 'DELAYED' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
