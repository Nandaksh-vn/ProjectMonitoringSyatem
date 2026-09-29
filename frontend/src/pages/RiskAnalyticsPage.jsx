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
  backgroundColor: '#1e293b', border: '1px solid #334155',
  borderRadius: 8, color: '#f1f5f9', fontSize: 12,
};

const RISK_COLORS = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#f59e0b', LOW: '#10b981' };

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-violet-400" />
          Risk Analytics
        </h1>
        <p className="text-slate-400 text-sm mt-1">Portfolio-level risk intelligence and trend analysis</p>
      </div>

      {/* Risk summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {riskDist.map(({ name, value }) => (
          <div key={name} className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 text-center">
            <RiskBadge level={name} />
            <p className="text-3xl font-bold text-slate-100 mt-3">{value}</p>
            <p className="text-xs text-slate-400 mt-1">projects</p>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Cost Overrun vs Progress Scatter */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Cost Overrun vs Physical Progress</h3>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="physicalProgress" name="Physical Progress" unit="%" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis dataKey="costOverrun" name="Cost Overrun" unit="%" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                cursor={{ strokeDasharray: '3 3' }}
                content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0]?.payload;
                  return (
                    <div style={TOOLTIP_STYLE} className="p-3 rounded-lg">
                      <p className="font-semibold text-xs">{d?.fullName}</p>
                      <p className="text-xs">Progress: {d?.physicalProgress?.toFixed(1)}%</p>
                      <p className="text-xs">Cost Overrun: {d?.costOverrun?.toFixed(1)}%</p>
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
              <Legend formatter={(v) => <span className="text-xs text-slate-300">{v}</span>} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Risk by Ministry stacked bar */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Risk Distribution by Ministry</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ministryRiskData} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend formatter={(v) => <span className="text-xs text-slate-300">{v}</span>} />
              <Bar dataKey="CRITICAL" stackId="a" fill="#ef4444" />
              <Bar dataKey="HIGH" stackId="a" fill="#f97316" />
              <Bar dataKey="MEDIUM" stackId="a" fill="#f59e0b" />
              <Bar dataKey="LOW" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Project risk table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl">
        <div className="px-6 py-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-slate-200">Project Risk Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {['Code', 'Project', 'Risk Score', 'Risk Level', 'Cost Overrun%', 'Delay (months)', 'Status'].map(h => (
                  <th key={h} className="text-left text-xs text-slate-400 px-4 py-3 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects
                .sort((a, b) => (b.predictions?.[0]?.overallRiskScore || 0) - (a.predictions?.[0]?.overallRiskScore || 0))
                .map(p => {
                  const pred = p.predictions?.[0];
                  return (
                    <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{p.projectCode}</td>
                      <td className="px-4 py-3 text-slate-200 text-sm font-medium">{p.projectName}</td>
                      <td className="px-4 py-3 font-mono text-slate-200">{pred?.overallRiskScore?.toFixed(1) || '—'}</td>
                      <td className="px-4 py-3"><RiskBadge level={pred?.riskLevel} /></td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-300">
                        {pred?.predictedCostOverrunPct?.toFixed(1) || '—'}%
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-300">
                        {pred?.predictedDelayMonths?.toFixed(0) || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${p.status === 'CRITICAL' ? 'text-red-400' : p.status === 'DELAYED' ? 'text-amber-400' : 'text-emerald-400'}`}>
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
