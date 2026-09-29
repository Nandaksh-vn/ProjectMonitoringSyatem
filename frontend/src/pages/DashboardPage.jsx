import React, { useEffect, useState, useMemo } from 'react';
import { projectService, alertService } from '../services/api';
import { LoadingState, ErrorState, RiskBadge, StatusBadge, ProgressBar } from '../components/ui/Shared';
import { Activity, AlertTriangle, Search, Filter, ChevronRight, FolderKanban } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend, ScatterChart, Scatter
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const RISK_COLORS = { CRITICAL: '#dc2626', HIGH: '#ea580c', MEDIUM: '#d97706', LOW: '#059669' };

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

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [filters, setFilters] = useState({ sector: '', ministry: '', state: '', status: '', risk: '' });

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

  if (loading) return <LoadingState message="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  // Get selected project details if any
  const selectedProject = projects.find(p => p.id.toString() === selectedProjectId);

  // Filtered projects for the table & summary
  const filteredProjects = projects.filter(p => {
    const q = search.toLowerCase();
    const matchesSearch = !q || p.projectName?.toLowerCase().includes(q) || p.projectCode?.toLowerCase().includes(q) || (p.sectorCode || '').toLowerCase().includes(q) || (p.ministryCode || '').toLowerCase().includes(q);
    
    const rl = p.riskLevel || p.predictions?.[0]?.riskLevel || 'LOW';
    const matchesSector = !filters.sector || (p.sectorCode || p.sector?.code) === filters.sector;
    const matchesMinistry = !filters.ministry || (p.ministryCode || p.ministry?.code) === filters.ministry;
    const matchesState = !filters.state || p.state === filters.state;
    const matchesStatus = !filters.status || p.status === filters.status;
    const matchesRisk = !filters.risk || rl === filters.risk;

    return matchesSearch && matchesSector && matchesMinistry && matchesState && matchesStatus && matchesRisk;
  });

  // KPIs based on filtered projects
  const total = filteredProjects.length;
  const ongoing = filteredProjects.filter(p => p.status === 'ONGOING').length;
  const completed = filteredProjects.filter(p => p.status === 'COMPLETED').length;
  const atRisk = filteredProjects.filter(p => {
    const rl = p.riskLevel || p.predictions?.[0]?.riskLevel || 'LOW';
    return rl === 'HIGH' || p.status === 'DELAYED';
  }).length;
  const critical = filteredProjects.filter(p => {
    const rl = p.riskLevel || p.predictions?.[0]?.riskLevel || 'LOW';
    return rl === 'CRITICAL' || p.status === 'CRITICAL';
  }).length;

  // Chart Data Preparation (Use all projects for portfolio charts so they stay stable)
  const byRisk = projects.reduce((acc, p) => {
    const rl = p.riskLevel || p.predictions?.[0]?.riskLevel || 'LOW';
    acc[rl] = (acc[rl] || 0) + 1;
    return acc;
  }, { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 });
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

  // Cost / Delay Scatter Data
  const trendData = projects.map(p => {
    const approved = p.approvedCost || 1;
    const revised = p.revisedCost || 1;
    const costGrowth = ((revised - approved) / approved) * 100;
    
    const od = new Date(p.originalCompletionDate);
    const rd = new Date(p.revisedCompletionDate);
    const delayMonths = Math.round((rd - od) / (1000 * 60 * 60 * 24 * 30));

    return {
      name: p.projectCode,
      costGrowth,
      delayMonths: delayMonths > 0 ? delayMonths : 0,
      riskLevel: p.predictions?.[0]?.riskLevel || 'LOW'
    };
  });

  // Filter options
  const sectors = [...new Set(projects.map(p => p.sectorCode || p.sector?.code).filter(Boolean))].sort();
  const ministries = [...new Set(projects.map(p => p.ministryCode || p.ministry?.code).filter(Boolean))].sort();
  const states = [...new Set(projects.map(p => p.state).filter(Boolean))].sort();
  const statuses = ['ONGOING', 'DELAYED', 'CRITICAL', 'COMPLETED'];
  const riskLevels = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold text-slate-500 mb-1 tracking-wide uppercase">Home / Dashboard</div>
        <h1 className="text-2xl font-bold text-brand-900">Infrastructure Project Monitoring Dashboard</h1>
        <p className="text-slate-600 text-sm mt-1">Portfolio overview and project-level monitoring.</p>
      </div>

      {/* Project Selection Hero */}
      <div className="bg-white p-6 rounded border border-brand-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><FolderKanban className="w-5 h-5 text-brand-600" /> Search / Select Project</h2>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search project by name, code, sector, ministry..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-3 border border-slate-300 rounded text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-slate-50"
            />
          </div>
          <select 
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            className="md:w-1/3 py-3 px-4 border border-slate-300 rounded text-sm focus:border-brand-500 bg-slate-50 font-medium"
          >
            <option value="">-- Select a specific project --</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.projectCode} - {p.projectName}</option>
            ))}
          </select>
        </div>

        {selectedProject && (
          <div className="mt-6 p-5 border border-brand-100 bg-brand-50 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-slate-500">{selectedProject.projectCode}</span>
                <span className="text-xs font-bold text-slate-500">•</span>
                <span className="text-xs font-bold text-slate-500">{selectedProject.sectorCode || 'Sector N/A'}</span>
                <span className="text-xs font-bold text-slate-500">•</span>
                <span className="text-xs font-bold text-slate-500">{selectedProject.ministryCode || 'Ministry N/A'}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">{selectedProject.projectName}</h3>
              <div className="flex items-center gap-3 mt-3">
                <StatusBadge status={selectedProject.status} />
                <RiskBadge level={selectedProject.predictions?.[0]?.riskLevel || 'LOW'} />
              </div>
            </div>
            <button 
              onClick={() => navigate(`/risk-analytics?projectId=${selectedProject.id}`)}
              className="whitespace-nowrap px-6 py-3 bg-brand-600 text-white font-bold rounded shadow-sm hover:bg-brand-700 transition-colors flex items-center gap-2"
            >
              Analyze Project <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Portfolio Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm text-center">
          <div className="text-2xl font-bold text-brand-700">{total}</div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">Total Projects</div>
        </div>
        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm text-center">
          <div className="text-2xl font-bold text-emerald-600">{ongoing}</div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">Ongoing</div>
        </div>
        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm text-center">
          <div className="text-2xl font-bold text-blue-600">{completed}</div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">Completed</div>
        </div>
        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm text-center">
          <div className="text-2xl font-bold text-amber-500">{atRisk}</div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">At Risk</div>
        </div>
        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm text-center">
          <div className="text-2xl font-bold text-red-600">{critical}</div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">Critical</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="text-sm font-bold text-slate-700 flex items-center gap-1 mr-2"><Filter className="w-4 h-4"/> Filters:</div>
        {[
          { key: 'sector', label: 'Sector', options: sectors },
          { key: 'ministry', label: 'Ministry', options: ministries },
          { key: 'state', label: 'State', options: states },
          { key: 'status', label: 'Status', options: statuses },
          { key: 'risk', label: 'Risk', options: riskLevels },
        ].map(({ key, label, options }) => (
          <select 
            key={key}
            value={filters[key]}
            onChange={e => setFilters(prev => ({...prev, [key]: e.target.value}))}
            className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded px-3 py-1.5 focus:border-brand-500 focus:outline-none min-w-[120px]"
          >
            <option value="">All {label}s</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}
        {Object.values(filters).some(Boolean) && (
          <button onClick={() => setFilters({ sector: '', ministry: '', state: '', status: '', risk: '' })} className="text-sm font-medium text-brand-600 hover:underline">Clear</button>
        )}
      </div>

      {/* Project Table */}
      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
           <h3 className="text-sm font-bold text-slate-800">Filtered Projects List</h3>
        </div>
        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 bg-white border-b border-slate-200 shadow-sm z-10">
              <tr>
                <th className="px-4 py-3 font-bold text-slate-600 uppercase text-[11px] tracking-wide">Project Code</th>
                <th className="px-4 py-3 font-bold text-slate-600 uppercase text-[11px] tracking-wide">Project Name</th>
                <th className="px-4 py-3 font-bold text-slate-600 uppercase text-[11px] tracking-wide">Sector</th>
                <th className="px-4 py-3 font-bold text-slate-600 uppercase text-[11px] tracking-wide">State</th>
                <th className="px-4 py-3 font-bold text-slate-600 uppercase text-[11px] tracking-wide w-24">Progress</th>
                <th className="px-4 py-3 font-bold text-slate-600 uppercase text-[11px] tracking-wide">Cost (Cr)</th>
                <th className="px-4 py-3 font-bold text-slate-600 uppercase text-[11px] tracking-wide">Risk</th>
                <th className="px-4 py-3 font-bold text-slate-600 uppercase text-[11px] tracking-wide">Status</th>
                <th className="px-4 py-3 font-bold text-slate-600 uppercase text-[11px] tracking-wide text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-slate-500 font-medium">No projects match your filters</td></tr>
              ) : (
                filteredProjects.map(p => {
                  const rl = p.predictions?.[0]?.riskLevel || p.riskLevel || 'LOW';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500 font-medium">{p.projectCode}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900 max-w-[200px] truncate" title={p.projectName}>{p.projectName}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{p.sectorCode || '—'}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{p.state}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                           <span className="text-xs font-bold w-8">{p.physicalProgress || 0}%</span>
                           <ProgressBar value={p.physicalProgress || 0} color={rl === 'LOW' ? 'emerald' : rl === 'MEDIUM' ? 'amber' : 'red'} />
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold">₹{p.revisedCost?.toLocaleString('en-IN') || 0}</td>
                      <td className="px-4 py-3"><RiskBadge level={rl} /></td>
                      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3 text-center">
                        <button 
                          onClick={() => navigate(`/risk-analytics?projectId=${p.id}`)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-600 text-xs font-bold rounded transition-colors flex items-center gap-1 mx-auto"
                        >
                          <Activity className="w-3 h-3" /> Analyze
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pt-4">
        
        {/* Risk Distribution Pie */}
        <div className="bg-white border border-slate-200 rounded p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={riskDist} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="value">
                {riskDist.map(entry => <Cell key={entry.name} fill={RISK_COLORS[entry.name] || '#94a3b8'} stroke="#fff" strokeWidth={2} />)}
              </Pie>
              <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
              <Legend formatter={(v) => <span className="text-xs font-medium text-slate-700">{v}</span>} verticalAlign="bottom"/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* By Sector */}
        <div className="bg-white border border-slate-200 rounded p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Projects by Sector</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={sectorData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cost vs Delay Scatter (Trend Alternative) */}
        <div className="bg-white border border-slate-200 rounded p-5 shadow-sm lg:col-span-2 xl:col-span-1">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Cost vs Delay Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
             <ScatterChart margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="delayMonths" name="Delay (Months)" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="costGrowth" name="Cost Growth %" unit="%" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={CUSTOM_TOOLTIP_STYLE} cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e1' }}
                content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0]?.payload;
                  return (
                    <div style={CUSTOM_TOOLTIP_STYLE} className="p-2">
                      <p className="font-bold text-xs mb-1">{d.name}</p>
                      <p className="text-xs">Delay: {d.delayMonths}m</p>
                      <p className="text-xs">Cost Growth: {d.costGrowth.toFixed(1)}%</p>
                    </div>
                  );
                }}
              />
              {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(rl => (
                <Scatter key={rl} name={rl} data={trendData.filter(d => d.riskLevel === rl)} fill={RISK_COLORS[rl]} />
              ))}
              <Legend formatter={(v) => <span className="text-[10px] font-semibold text-slate-700">{v}</span>} wrapperStyle={{ paddingTop: '5px' }} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}
