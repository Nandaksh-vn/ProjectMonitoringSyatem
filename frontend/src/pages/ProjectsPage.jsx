import React, { useEffect, useState, useMemo } from 'react';
import { projectService } from '../services/api';
import { LoadingState, ErrorState, RiskBadge, StatusBadge, ProgressBar } from '../components/ui/Shared';
import { Search, Filter, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Eye, Activity, Edit2 } from 'lucide-react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PAGE_SIZE = 10;

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('projectCode');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ risk: '', status: '', ministry: '', sector: '', state: '' });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const canManage = user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_PROJECT_MANAGER';

  useEffect(() => {
    const riskParam = searchParams.get('risk');
    if (riskParam) setFilters(f => ({ ...f, risk: riskParam }));
  }, [searchParams]);

  const loadData = () => {
    setLoading(true);
    projectService.getAll()
      .then(r => setProjects(r.data?.content || r.data || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Unique filter options
  const ministries = [...new Set(projects.map(p => p.ministryCode || p.ministry?.code).filter(Boolean))].sort();
  const sectors = [...new Set(projects.map(p => p.sectorCode || p.sector?.code).filter(Boolean))].sort();
  const states = [...new Set(projects.map(p => p.state).filter(Boolean))].sort();
  const riskLevels = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const statuses = ['ONGOING', 'DELAYED', 'CRITICAL', 'COMPLETED'];

  const filtered = useMemo(() => {
    let data = projects;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(p =>
        p.projectName?.toLowerCase().includes(q) ||
        p.projectCode?.toLowerCase().includes(q)
      );
    }
    if (filters.risk) data = data.filter(p => (p.riskLevel || p.predictions?.[0]?.riskLevel || 'LOW') === filters.risk);
    if (filters.status) data = data.filter(p => p.status === filters.status);
    if (filters.ministry) data = data.filter(p => (p.ministryCode || p.ministry?.code) === filters.ministry);
    if (filters.sector) data = data.filter(p => (p.sectorCode || p.sector?.code) === filters.sector);
    if (filters.state) data = data.filter(p => p.state === filters.state);
    return data;
  }, [projects, search, filters]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av = a[sortKey] || '';
      let bv = b[sortKey] || '';
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortAsc]);

  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  const handleSort = (key) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(true); }
    setPage(1);
  };

  const SortIcon = ({ col }) => (
    sortKey === col
      ? (sortAsc ? <ChevronUp className="w-3 h-3 inline-block ml-1" /> : <ChevronDown className="w-3 h-3 inline-block ml-1" />)
      : <ChevronDown className="w-3 h-3 inline-block ml-1 opacity-30" />
  );

  const stats = {
    total: projects.length,
    ongoing: projects.filter(p => p.status === 'ONGOING').length,
    completed: projects.filter(p => p.status === 'COMPLETED').length,
    atRisk: projects.filter(p => p.status === 'DELAYED' || p.riskLevel === 'HIGH').length,
    critical: projects.filter(p => p.status === 'CRITICAL' || p.riskLevel === 'CRITICAL').length,
  };

  if (loading) return <LoadingState message="Loading projects..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  return (
    <>
      <div className="mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-1 tracking-wide uppercase">Home / Projects</div>
          <h1 className="text-2xl font-bold text-brand-900">Projects</h1>
          <p className="text-slate-600 text-sm mt-1">Infrastructure Project Directory and Management</p>
        </div>
        <div className="flex gap-3">
          {canManage && (
            <Link to="/add-project" className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded hover:bg-brand-700 transition-colors shadow-sm">
              + Add New Project
            </Link>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded border border-slate-200 p-4 mb-6 shadow-sm">
        <div className="flex flex-col xl:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by project name / project code"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 pl-9 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="w-4 h-4 text-slate-400 hidden xl:block" />
            {[
              { key: 'sector', options: sectors, label: 'Sector' },
              { key: 'ministry', options: ministries, label: 'Ministry' },
              { key: 'state', options: states, label: 'State' },
              { key: 'status', options: statuses, label: 'Status' },
              { key: 'risk', options: riskLevels, label: 'Risk Level' },
            ].map(({ key, options, label }) => (
              <select
                key={key}
                value={filters[key]}
                onChange={(e) => { setFilters(f => ({ ...f, [key]: e.target.value })); setPage(1); }}
                className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded px-3 py-2 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 min-w-[140px]"
              >
                <option value="">{label}</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ))}
            {(search || Object.values(filters).some(Boolean)) && (
              <button
                onClick={() => { setSearch(''); setFilters({ risk: '', status: '', ministry: '', sector: '', state: '' }); setPage(1); }}
                className="text-sm font-medium text-brand-600 hover:text-brand-800 px-3 py-2 rounded transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm text-center">
          <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
          <div className="text-xs font-semibold text-slate-500 uppercase mt-1">Total Projects</div>
        </div>
        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm text-center">
          <div className="text-2xl font-bold text-emerald-600">{stats.ongoing}</div>
          <div className="text-xs font-semibold text-slate-500 uppercase mt-1">Ongoing</div>
        </div>
        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
          <div className="text-xs font-semibold text-slate-500 uppercase mt-1">Completed</div>
        </div>
        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm text-center">
          <div className="text-2xl font-bold text-amber-500">{stats.atRisk}</div>
          <div className="text-xs font-semibold text-slate-500 uppercase mt-1">At Risk</div>
        </div>
        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm text-center">
          <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
          <div className="text-xs font-semibold text-slate-500 uppercase mt-1">Critical</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100">
                <th onClick={() => handleSort('projectCode')} className="px-4 py-3 font-bold text-slate-700 uppercase text-xs cursor-pointer hover:bg-slate-200 select-none">Code <SortIcon col="projectCode" /></th>
                <th onClick={() => handleSort('projectName')} className="px-4 py-3 font-bold text-slate-700 uppercase text-xs cursor-pointer hover:bg-slate-200 select-none">Project Name <SortIcon col="projectName" /></th>
                <th onClick={() => handleSort('ministryCode')} className="px-4 py-3 font-bold text-slate-700 uppercase text-xs cursor-pointer hover:bg-slate-200 select-none hidden md:table-cell">Ministry <SortIcon col="ministryCode" /></th>
                <th onClick={() => handleSort('sectorCode')} className="px-4 py-3 font-bold text-slate-700 uppercase text-xs cursor-pointer hover:bg-slate-200 select-none hidden md:table-cell">Sector <SortIcon col="sectorCode" /></th>
                <th onClick={() => handleSort('state')} className="px-4 py-3 font-bold text-slate-700 uppercase text-xs cursor-pointer hover:bg-slate-200 select-none hidden lg:table-cell">State <SortIcon col="state" /></th>
                <th onClick={() => handleSort('revisedCost')} className="px-4 py-3 font-bold text-slate-700 uppercase text-xs cursor-pointer hover:bg-slate-200 select-none">App. Cost <SortIcon col="revisedCost" /></th>
                <th onClick={() => handleSort('physicalProgress')} className="px-4 py-3 font-bold text-slate-700 uppercase text-xs cursor-pointer hover:bg-slate-200 select-none w-32">Progress <SortIcon col="physicalProgress" /></th>
                <th onClick={() => handleSort('status')} className="px-4 py-3 font-bold text-slate-700 uppercase text-xs cursor-pointer hover:bg-slate-200 select-none">Status <SortIcon col="status" /></th>
                <th onClick={() => handleSort('riskLevel')} className="px-4 py-3 font-bold text-slate-700 uppercase text-xs cursor-pointer hover:bg-slate-200 select-none">Risk <SortIcon col="riskLevel" /></th>
                <th className="px-4 py-3 font-bold text-slate-700 uppercase text-xs text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr><td colSpan={10} className="text-center py-16 text-slate-500 font-medium bg-white">No projects found.</td></tr>
              )}
              {paginated.map((p) => {
                const riskLevel = p.riskLevel || p.predictions?.[0]?.riskLevel || 'LOW';
                return (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 bg-white">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-600">{p.projectCode}</td>
                    <td className="px-4 py-3 text-slate-900 max-w-[200px] truncate" title={p.projectName}>{p.projectName}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs hidden md:table-cell">{p.ministryCode || '—'}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs hidden md:table-cell">{p.sectorCode || '—'}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs hidden lg:table-cell">{p.state}</td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700 whitespace-nowrap">
                      {p.revisedCost ? `₹${p.revisedCost.toLocaleString('en-IN')} Cr` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700">{p.physicalProgress?.toFixed(1) || 0}%</span>
                      </div>
                      <ProgressBar value={p.physicalProgress || 0} color={riskLevel === 'LOW' ? 'emerald' : riskLevel === 'MEDIUM' ? 'amber' : 'red'} />
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3"><RiskBadge level={riskLevel} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => navigate(`/projects/${p.id}`)} title="View Detail" className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => navigate(`/risk-analytics?projectId=${p.id}`)} title="Analyze" className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"><Activity className="w-4 h-4" /></button>
                        {canManage && (
                          <button onClick={() => navigate(`/projects/${p.id}/edit`)} title="Edit Progress" className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"><Edit2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
            <p className="text-sm text-slate-600">
              Showing <span className="font-semibold text-slate-900">{(page - 1) * PAGE_SIZE + 1}</span> to <span className="font-semibold text-slate-900">{Math.min(page * PAGE_SIZE, sorted.length)}</span> of <span className="font-semibold text-slate-900">{sorted.length}</span> entries
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded border border-slate-300 bg-white disabled:opacity-50 hover:bg-slate-100"><ChevronLeft className="w-4 h-4 text-slate-600" /></button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded border border-slate-300 bg-white disabled:opacity-50 hover:bg-slate-100"><ChevronRight className="w-4 h-4 text-slate-600" /></button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
