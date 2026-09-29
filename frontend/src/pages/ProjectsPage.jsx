import React, { useEffect, useState, useMemo } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { projectService } from '../services/api';
import { LoadingState, ErrorState, RiskBadge, StatusBadge, ProgressBar } from '../components/ui/Shared';
import { Search, Filter, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const PAGE_SIZE = 10;

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('projectCode');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ risk: '', status: '', ministry: '', sector: '' });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const riskParam = searchParams.get('risk');
    if (riskParam) setFilters(f => ({ ...f, risk: riskParam }));
  }, [searchParams]);

  useEffect(() => {
    projectService.getAll()
      .then(r => setProjects(r.data?.content || r.data || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Unique filter options
  const ministries = [...new Set(projects.map(p => p.ministryCode || p.ministry?.code).filter(Boolean))];
  const sectors = [...new Set(projects.map(p => p.sectorCode || p.sector?.code).filter(Boolean))];
  const riskLevels = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const statuses = ['ONGOING', 'DELAYED', 'CRITICAL', 'COMPLETED'];

  const filtered = useMemo(() => {
    let data = projects;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(p =>
        p.projectName?.toLowerCase().includes(q) ||
        p.projectCode?.toLowerCase().includes(q) ||
        p.state?.toLowerCase().includes(q)
      );
    }
    if (filters.risk) data = data.filter(p => (p.riskLevel || p.predictions?.[0]?.riskLevel) === filters.risk);
    if (filters.status) data = data.filter(p => p.status === filters.status);
    if (filters.ministry) data = data.filter(p => (p.ministryCode || p.ministry?.code) === filters.ministry);
    if (filters.sector) data = data.filter(p => (p.sectorCode || p.sector?.code) === filters.sector);
    return data;
  }, [projects, search, filters]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
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
      ? (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)
      : <ChevronDown className="w-3 h-3 opacity-30" />
  );

  if (loading) return <AppLayout><LoadingState message="Loading projects..." /></AppLayout>;
  if (error) return <AppLayout><ErrorState message={error} onRetry={() => window.location.reload()} /></AppLayout>;

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Projects</h1>
        <p className="text-slate-400 text-sm mt-1">All monitored infrastructure projects — {sorted.length} of {projects.length}</p>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              id="project-search"
              placeholder="Search by name, code, state..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-slate-500" />
            {[
              { key: 'risk', options: riskLevels, label: 'Risk' },
              { key: 'status', options: statuses, label: 'Status' },
              { key: 'ministry', options: ministries, label: 'Ministry' },
              { key: 'sector', options: sectors, label: 'Sector' },
            ].map(({ key, options, label }) => (
              <select
                key={key}
                value={filters[key]}
                onChange={(e) => { setFilters(f => ({ ...f, [key]: e.target.value })); setPage(1); }}
                className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500/60"
              >
                <option value="">All {label}</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ))}
            {(search || Object.values(filters).some(Boolean)) && (
              <button
                onClick={() => { setSearch(''); setFilters({ risk: '', status: '', ministry: '', sector: '' }); setPage(1); }}
                className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded border border-red-500/20 hover:border-red-400/40 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50">
                {[
                  { label: 'Code', key: 'projectCode' },
                  { label: 'Project Name', key: 'projectName' },
                  { label: 'Ministry', key: 'ministryCode' },
                  { label: 'State', key: 'state' },
                  { label: 'Status', key: 'status' },
                  { label: 'Progress', key: 'physicalProgress' },
                  { label: 'Risk', key: 'riskLevel' },
                  { label: 'Cost (Cr)', key: 'revisedCost' },
                ].map(({ label, key }) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className="text-left text-xs font-medium text-slate-400 px-4 py-3 uppercase tracking-wider cursor-pointer hover:text-slate-200 select-none"
                  >
                    <span className="flex items-center gap-1">
                      {label} <SortIcon col={key} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr><td colSpan={8} className="text-center py-16 text-slate-500">No projects match your criteria</td></tr>
              )}
              {paginated.map((p) => {
                const riskLevel = p.riskLevel || p.predictions?.[0]?.riskLevel || 'LOW';
                return (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/projects/${p.id}`)}
                    className="border-b border-slate-800/50 hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-300">{p.projectCode}</td>
                    <td className="px-4 py-3 text-slate-200 max-w-xs">
                      <div className="truncate font-medium">{p.projectName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{p.district}, {p.state}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{p.ministryCode || p.ministry?.code || '—'}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{p.state}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 w-32">
                      <div className="text-xs text-slate-300 mb-1">{p.physicalProgress?.toFixed(1) || 0}%</div>
                      <ProgressBar
                        value={p.physicalProgress || 0}
                        color={riskLevel === 'LOW' ? 'emerald' : riskLevel === 'MEDIUM' ? 'amber' : 'red'}
                      />
                    </td>
                    <td className="px-4 py-3"><RiskBadge level={riskLevel} /></td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-300">
                      {p.revisedCost ? `₹${p.revisedCost.toLocaleString('en-IN')}` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
            <p className="text-xs text-slate-400">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-40 hover:bg-slate-700 transition-colors text-slate-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = i + Math.max(1, page - 2);
                if (pg > totalPages) return null;
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`w-8 h-8 text-xs rounded-lg transition-colors ${pg === page ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                  >
                    {pg}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-40 hover:bg-slate-700 transition-colors text-slate-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
