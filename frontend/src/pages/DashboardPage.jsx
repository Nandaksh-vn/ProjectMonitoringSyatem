import React, { useEffect, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { projectService, alertService, recommendationService } from '../services/api';
import { KpiCard, LoadingState, ErrorState, RiskBadge, StatusBadge, ProgressBar } from '../components/ui/Shared';
import {
  FolderKanban, AlertTriangle, BarChart2, CheckCircle2,
  IndianRupee, TrendingUp, Bell, Activity,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LineChart, Line, CartesianGrid, Legend,
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const RISK_COLORS = {
  CRITICAL: '#dc2626',
  HIGH: '#ea580c',
  MEDIUM: '#d97706',
  LOW: '#059669',
};

const CUSTOM_TOOLTIP_STYLE = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 4,
  color: '#0f172a',
  fontSize: 12,
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
};

export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      projectService.getAll(),
      alertService.getAll(),
    ])
      .then(([pRes, aRes]) => {
        setProjects(pRes.data?.content || pRes.data || []);
        setAlerts(aRes.data || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AppLayout><LoadingState message="Loading dashboard..." /></AppLayout>;
  if (error) return <AppLayout><ErrorState message={error} onRetry={() => window.location.reload()} /></AppLayout>;

  // KPIs
  const total = projects.length;
  const byRisk = projects.reduce((acc, p) => {
    const rl = p.riskLevel || p.predictions?.[0]?.riskLevel || 'LOW';
    acc[rl] = (acc[rl] || 0) + 1;
    return acc;
  }, {});
  const totalApproved = projects.reduce((s, p) => s + (p.approvedCost || 0), 0);
  const totalRevised = projects.reduce((s, p) => s + (p.revisedCost || 0), 0);
  const totalExp = projects.reduce((s, p) => s + (p.currentExpenditure || 0), 0);
  const unresolvedAlerts = alerts.filter(a => !a.resolvedStatus).length;

  // Chart data
  const riskDist = Object.entries(byRisk).map(([name, value]) => ({ name, value }));

  const bySector = projects.reduce((acc, p) => {
    const s = p.sectorCode || p.sector?.code || 'OTHER';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const sectorData = Object.entries(bySector).map(([name, count]) => ({ name, count }));

  const byMinistry = projects.reduce((acc, p) => {
    const m = p.ministryCode || p.ministry?.code || 'OTHER';
    acc[m] = (acc[m] || 0) + 1;
    return acc;
  }, {});
  const ministryData = Object.entries(byMinistry).map(([name, count]) => ({ name, count }));

  const highRisk = projects.filter(p => {
    const rl = p.riskLevel || 'LOW';
    return rl === 'HIGH' || rl === 'CRITICAL';
  });

  const formatCr = (val) => `₹${(val / 1).toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr`;

  return (
    <AppLayout>
      {/* Page header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-slate-500 mb-1 tracking-wide uppercase">Home / Dashboard</div>
            <h1 className="text-2xl font-bold text-slate-900">Infrastructure Project Monitoring Dashboard</h1>
            <p className="text-slate-600 text-sm mt-1">
              Overview of project implementation, cost, schedule, and risk indicators.
            </p>
          </div>
          {/* Action buttons */}
          <div className="flex items-center gap-3">
             <button onClick={() => window.print()} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded hover:bg-slate-50 transition-colors shadow-sm">
               Download PDF
             </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
        <KpiCard title="Total Projects" value={total} icon={FolderKanban} color="blue" />
        <KpiCard title="Critical" value={byRisk.CRITICAL || 0} icon={AlertTriangle} color="red" />
        <KpiCard title="High Risk" value={byRisk.HIGH || 0} icon={TrendingUp} color="orange" />
        <KpiCard title="Medium Risk" value={byRisk.MEDIUM || 0} icon={Activity} color="amber" />
        <KpiCard title="Low Risk" value={byRisk.LOW || 0} icon={CheckCircle2} color="emerald" />
        <KpiCard title="Approved Cost" value={`₹${(totalApproved / 1000).toFixed(0)}K Cr`} icon={IndianRupee} color="blue" />
        <KpiCard title="Active Alerts" value={unresolvedAlerts} icon={Bell} color="red" />
      </div>

      {/* Cost Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {[
          { label: 'Total Approved Cost', value: totalApproved, color: 'text-brand-700', bar: 'blue' },
          { label: 'Total Revised Cost', value: totalRevised, color: 'text-orange-700', bar: 'orange' },
          { label: 'Cumulative Expenditure', value: totalExp, color: 'text-emerald-700', bar: 'emerald' },
        ].map(({ label, value, color, bar }) => (
          <div key={label} className="gov-card p-5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{formatCr(value)}</p>
            <div className="mt-3">
              <ProgressBar value={value} max={totalRevised || 1} color={bar} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Risk Distribution Pie */}
        <div className="gov-card p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Risk Distribution</h3>
          {riskDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={riskDist} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                  {riskDist.map((entry) => (
                    <Cell key={entry.name} fill={RISK_COLORS[entry.name] || '#94a3b8'} stroke="#fff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
                <Legend formatter={(v) => <span className="text-xs font-medium text-slate-700">{v}</span>} verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500 text-sm text-center py-10">No data</p>}
        </div>

        {/* By Sector */}
        <div className="gov-card p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Projects by Sector</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sectorData} barSize={24} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By Ministry */}
        <div className="gov-card p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Projects by Ministry</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ministryData} barSize={20} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} width={70} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="count" fill="#0ea5e9" radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* High-Risk Projects Table */}
      <div className="gov-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50 rounded-t">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            High Risk &amp; Critical Projects
          </h3>
          <button
            onClick={() => navigate('/projects?risk=HIGH')}
            className="text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors"
          >
            View all →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-white">
                {['Project ID', 'Project Name', 'Ministry', 'Sector', 'Risk Score', 'Risk Level', 'Status', 'Alerts'].map(h => (
                  <th key={h} className="text-left text-xs font-bold text-slate-600 px-5 py-3 uppercase tracking-wide bg-slate-50/50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {highRisk.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-slate-500 font-medium">No high-risk projects</td></tr>
              )}
              {highRisk.map((p) => {
                const pred = p.predictions?.[0];
                const projAlerts = alerts.filter(a => a.projectId === p.id && !a.resolvedStatus);
                return (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/projects/${p.id}`)}
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3 font-mono text-xs font-medium text-slate-600">{p.projectCode}</td>
                    <td className="px-5 py-3 text-slate-900 max-w-xs truncate font-semibold">{p.projectName}</td>
                    <td className="px-5 py-3 text-slate-600 text-xs">{p.ministryCode || p.ministry?.code || '—'}</td>
                    <td className="px-5 py-3 text-slate-600 text-xs">{p.sectorCode || p.sector?.code || '—'}</td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-sm font-bold text-slate-800">
                        {pred?.overallRiskScore?.toFixed(1) || p.overallRiskScore?.toFixed(1) || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3"><RiskBadge level={pred?.riskLevel || p.riskLevel} /></td>
                    <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-5 py-3">
                      {projAlerts.length > 0 && (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
                          <Bell className="w-3 h-3" /> {projAlerts.length}
                        </span>
                      )}
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
