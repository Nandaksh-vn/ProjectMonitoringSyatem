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
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#f59e0b',
  LOW: '#10b981',
};

const CUSTOM_TOOLTIP_STYLE = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 8,
  color: '#f1f5f9',
  fontSize: 12,
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
        // Backend returns Page<Project> with .content array
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
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Executive Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">
              Infrastructure Project Monitoring — AI-Powered Analytics
            </p>
          </div>
          {/* Pipeline indicator */}
          <div className="hidden md:flex items-center gap-1.5 text-[10px] font-mono font-medium">
            {['MONITOR', 'PREDICT', 'EXPLAIN', 'RECOMMEND', 'ALERT'].map((step, i) => (
              <React.Fragment key={step}>
                <span className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded">
                  {step}
                </span>
                {i < 4 && <span className="text-slate-600">→</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
        <KpiCard title="Total Projects" value={total} icon={FolderKanban} color="cyan" />
        <KpiCard title="Critical Risk" value={byRisk.CRITICAL || 0} icon={AlertTriangle} color="red" />
        <KpiCard title="High Risk" value={byRisk.HIGH || 0} icon={TrendingUp} color="orange" />
        <KpiCard title="Medium Risk" value={byRisk.MEDIUM || 0} icon={Activity} color="amber" />
        <KpiCard title="Low Risk" value={byRisk.LOW || 0} icon={CheckCircle2} color="emerald" />
        <KpiCard title="Approved Cost" value={`₹${(totalApproved / 1000).toFixed(0)}K Cr`} icon={IndianRupee} color="blue" />
        <KpiCard title="Active Alerts" value={unresolvedAlerts} icon={Bell} color="red" />
      </div>

      {/* Cost Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Approved Cost', value: totalApproved, color: 'text-blue-400' },
          { label: 'Revised Cost', value: totalRevised, color: 'text-amber-400' },
          { label: 'Current Expenditure', value: totalExp, color: 'text-cyan-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{formatCr(value)}</p>
            <ProgressBar value={value} max={totalRevised || 1} color={color.includes('blue') ? 'blue' : color.includes('amber') ? 'amber' : 'cyan'} />
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Risk Distribution Pie */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Risk Distribution</h3>
          {riskDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={riskDist} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {riskDist.map((entry) => (
                    <Cell key={entry.name} fill={RISK_COLORS[entry.name] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
                <Legend formatter={(v) => <span className="text-xs text-slate-300">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500 text-sm text-center py-10">No data</p>}
        </div>

        {/* By Sector */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Projects by Sector</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sectorData} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By Ministry */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Projects by Ministry</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ministryData} barSize={18} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} width={50} />
              <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="#818cf8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* High-Risk Projects Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            High Risk &amp; Critical Projects
          </h3>
          <button
            onClick={() => navigate('/projects?risk=HIGH')}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            View all →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {['Code', 'Project Name', 'Ministry', 'Sector', 'Risk Score', 'Risk Level', 'Status', 'Alerts'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-slate-400 px-4 py-3 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {highRisk.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-slate-500">No high-risk projects</td></tr>
              )}
              {highRisk.map((p) => {
                const pred = p.predictions?.[0];
                const projAlerts = alerts.filter(a => a.projectId === p.id && !a.resolvedStatus);
                return (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/projects/${p.id}`)}
                    className="border-b border-slate-800/50 hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-300">{p.projectCode}</td>
                    <td className="px-4 py-3 text-slate-200 max-w-xs truncate font-medium">{p.projectName}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{p.ministryCode || p.ministry?.code || '—'}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{p.sectorCode || p.sector?.code || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-bold text-slate-200">
                        {pred?.overallRiskScore?.toFixed(1) || p.overallRiskScore?.toFixed(1) || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3"><RiskBadge level={pred?.riskLevel || p.riskLevel} /></td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3">
                      {projAlerts.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-red-400">
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
