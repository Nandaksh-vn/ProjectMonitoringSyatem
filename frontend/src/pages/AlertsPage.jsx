import React, { useEffect, useState } from 'react';
import { alertService, projectService } from '../services/api';
import { LoadingState, ErrorState, StatusBadge } from '../components/ui/Shared';
import { Bell, CheckCircle2, AlertTriangle, Filter, Search, Eye, Activity } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const SEVERITY_COLORS = {
  CRITICAL: 'bg-red-50 text-red-700 border-red-200',
  HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    projectId: '', sector: '', ministry: '', state: '', severity: '', status: 'UNRESOLVED'
  });
  const [resolving, setResolving] = useState(null);

  const navigate = useNavigate();

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      alertService.getAll(),
      projectService.getAll()
    ])
      .then(([aRes, pRes]) => {
        setAlerts(aRes.data || []);
        setProjects(pRes.data?.content || pRes.data || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleResolve = async (id) => {
    setResolving(id);
    try {
      await alertService.resolve(id);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolvedStatus: true } : a));
    } catch { /* ignore */ } finally {
      setResolving(null);
    }
  };

  // Map project data for easier lookup
  const projectMap = projects.reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {});

  // Derive filter options
  const sectors = [...new Set(projects.map(p => p.sectorCode || p.sector?.code).filter(Boolean))].sort();
  const ministries = [...new Set(projects.map(p => p.ministryCode || p.ministry?.code).filter(Boolean))].sort();
  const states = [...new Set(projects.map(p => p.state).filter(Boolean))].sort();
  const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  const filteredAlerts = alerts.filter(a => {
    const p = projectMap[a.projectId];
    const q = search.toLowerCase();
    const matchesSearch = !q || p?.projectName?.toLowerCase().includes(q) || p?.projectCode?.toLowerCase().includes(q) || a.title?.toLowerCase().includes(q);
    
    const matchesProject = !filters.projectId || a.projectId.toString() === filters.projectId;
    const matchesSector = !filters.sector || (p?.sectorCode || p?.sector?.code) === filters.sector;
    const matchesMinistry = !filters.ministry || (p?.ministryCode || p?.ministry?.code) === filters.ministry;
    const matchesState = !filters.state || p?.state === filters.state;
    const matchesSeverity = !filters.severity || a.severity === filters.severity;
    const matchesStatus = filters.status === 'ALL' ? true : filters.status === 'RESOLVED' ? a.resolvedStatus : !a.resolvedStatus;

    return matchesSearch && matchesProject && matchesSector && matchesMinistry && matchesState && matchesSeverity && matchesStatus;
  });

  const unresolvedCount = alerts.filter(a => !a.resolvedStatus).length;

  if (loading) return <LoadingState message="Loading early warnings..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold text-slate-500 mb-1 tracking-wide uppercase">
          <Link to="/dashboard" className="hover:text-brand-600">Home</Link> / Early Warnings
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-900 flex items-center gap-2">
              <Bell className="w-6 h-6 text-brand-600" /> Early Warnings
            </h1>
            <p className="text-slate-600 text-sm mt-1">Projects requiring monitoring attention based on detected risk indicators.</p>
          </div>
          <div className="bg-white px-4 py-2 rounded border border-slate-200 shadow-sm flex items-center gap-2">
             <AlertTriangle className="w-5 h-5 text-red-500"/>
             <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Active Alerts</div>
                <div className="text-lg font-bold text-slate-900 leading-none">{unresolvedCount}</div>
             </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-5 rounded border border-slate-200 shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search alerts by project name, project code, or warning title..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-slate-50"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm font-bold text-slate-700 flex items-center gap-1 mr-2"><Filter className="w-4 h-4"/> Filters:</div>
          
          <select value={filters.projectId} onChange={e => setFilters(prev => ({...prev, projectId: e.target.value}))} className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded px-3 py-1.5 min-w-[150px]">
            <option value="">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.projectCode} - {p.projectName}</option>)}
          </select>
          <select value={filters.sector} onChange={e => setFilters(prev => ({...prev, sector: e.target.value}))} className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded px-3 py-1.5">
            <option value="">All Sectors</option>
            {sectors.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={filters.ministry} onChange={e => setFilters(prev => ({...prev, ministry: e.target.value}))} className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded px-3 py-1.5">
            <option value="">All Ministries</option>
            {ministries.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={filters.state} onChange={e => setFilters(prev => ({...prev, state: e.target.value}))} className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded px-3 py-1.5">
            <option value="">All States</option>
            {states.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={filters.severity} onChange={e => setFilters(prev => ({...prev, severity: e.target.value}))} className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded px-3 py-1.5">
            <option value="">All Severities</option>
            {severities.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={filters.status} onChange={e => setFilters(prev => ({...prev, status: e.target.value}))} className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded px-3 py-1.5 font-semibold">
            <option value="UNRESOLVED">Active Only</option>
            <option value="RESOLVED">Resolved Only</option>
            <option value="ALL">All Statuses</option>
          </select>
          
          {Object.values(filters).some(v => v !== '' && v !== 'UNRESOLVED') && (
            <button onClick={() => setFilters({ projectId: '', sector: '', ministry: '', state: '', severity: '', status: 'UNRESOLVED' })} className="text-sm font-medium text-brand-600 hover:underline">Reset</button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 font-bold text-slate-600 uppercase text-xs tracking-wide">Severity</th>
                <th className="px-5 py-3 font-bold text-slate-600 uppercase text-xs tracking-wide min-w-[200px]">Project</th>
                <th className="px-5 py-3 font-bold text-slate-600 uppercase text-xs tracking-wide min-w-[250px]">Risk Factor</th>
                <th className="px-5 py-3 font-bold text-slate-600 uppercase text-xs tracking-wide">Detected On</th>
                <th className="px-5 py-3 font-bold text-slate-600 uppercase text-xs tracking-wide">Current Status</th>
                <th className="px-5 py-3 font-bold text-slate-600 uppercase text-xs tracking-wide text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <CheckCircle2 className="w-12 h-12 text-emerald-200 mx-auto mb-3"/>
                    <p className="text-lg font-bold text-slate-700">No active early warnings.</p>
                    <p className="text-sm">All projects are operating within expected parameters.</p>
                  </td>
                </tr>
              ) : (
                filteredAlerts.map(a => {
                  const p = projectMap[a.projectId];
                  return (
                    <tr key={a.id} className={`hover:bg-slate-50 transition-colors ${a.resolvedStatus ? 'opacity-60' : ''}`}>
                      <td className="px-5 py-4 align-top">
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${SEVERITY_COLORS[a.severity]}`}>
                          {a.severity}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="font-semibold text-slate-900 mb-0.5">{p?.projectName || `Project #${a.projectId}`}</div>
                        <div className="text-xs font-mono text-slate-500">{p?.projectCode}</div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="font-bold text-slate-800 mb-1">{a.title}</div>
                        <div className="text-xs text-slate-600 line-clamp-2" title={a.description}>{a.description}</div>
                        {a.suggestedAction && (
                           <div className="mt-2 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded font-medium border border-amber-100">
                             Suggested: {a.suggestedAction}
                           </div>
                        )}
                      </td>
                      <td className="px-5 py-4 align-top font-mono text-xs text-slate-600">
                        {a.alertDate ? new Date(a.alertDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-5 py-4 align-top">
                        {a.resolvedStatus ? (
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4"/> Resolved
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4"/> Active
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="flex flex-col gap-2">
                           <button onClick={() => navigate(`/projects/${a.projectId}`)} className="w-full text-xs font-semibold px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded flex items-center justify-center gap-1.5 shadow-sm">
                             <Eye className="w-3.5 h-3.5"/> View Project
                           </button>
                           <button onClick={() => navigate(`/risk-analytics?projectId=${a.projectId}`)} className="w-full text-xs font-semibold px-3 py-1.5 bg-brand-50 border border-brand-200 text-brand-700 hover:bg-brand-100 rounded flex items-center justify-center gap-1.5 shadow-sm">
                             <Activity className="w-3.5 h-3.5"/> Analyze Risk
                           </button>
                           {!a.resolvedStatus && (
                             <button onClick={() => handleResolve(a.id)} disabled={resolving === a.id} className="w-full text-xs font-semibold px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50">
                               <CheckCircle2 className="w-3.5 h-3.5"/> {resolving === a.id ? 'Resolving' : 'Resolve'}
                             </button>
                           )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
