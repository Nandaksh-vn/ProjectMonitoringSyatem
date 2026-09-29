import React, { useEffect, useState, useMemo } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { projectService } from '../services/api';
import { LoadingState, ErrorState, RiskBadge, StatusBadge, ProgressBar } from '../components/ui/Shared';
import { Search, Filter, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Download } from 'lucide-react';
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
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-1 tracking-wide uppercase">Home / Projects</div>
          <h1 className="text-2xl font-bold text-slate-900">Project Directory</h1>
          <p className="text-slate-600 text-sm mt-1">All monitored infrastructure projects — {sorted.length} of {projects.length} results</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded hover:bg-slate-50 transition-colors shadow-sm">
          <Download className="w-4 h-4" /> Export Excel
        </button>
      </div>

      {/* Search & Filters */}
      <div className="gov-card p-4 mb-6 bg-slate-50/50">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              id="project-search"
              placeholder="Search by name, code, state..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-white border border-slate-300 rounded px-3 py-2 pl-9 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400" />
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
                className="bg-white border border-slate-300 text-slate-700 text-sm rounded px-3 py-2 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              >
                <option value="">All {label}</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ))}
            {(search || Object.values(filters).some(Boolean)) && (
              <button
                onClick={() => { setSearch(''); setFilters({ risk: '', status: '', ministry: '', sector: '' }); setPage(1); }}
                className="text-sm font-medium text-brand-600 hover:text-brand-800 px-3 py-2 rounded transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="gov-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {[
                  { label: 'Project ID', key: 'projectCode' },
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
                    className="text-left text-xs font-bold text-slate-700 px-5 py-3 uppercase tracking-wide cursor-pointer hover:bg-slate-100 select-none"
                  >
                    <span className="flex items-center gap-1.5">
                      {label} <SortIcon col={key} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr><td colSpan={8} className="text-center py-16 text-slate-500 font-medium">No projects match your criteria</td></tr>
              )}
              {paginated.map((p) => {
                const riskLevel = p.riskLevel || p.predictions?.[0]?.riskLevel || 'LOW';
                return (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/projects/${p.id}`)}
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3 font-mono text-xs font-medium text-slate-600">{p.projectCode}</td>
                    <td className="px-5 py-3 text-slate-900 max-w-xs">
                      <div className="truncate font-semibold">{p.projectName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{p.district}, {p.state}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 text-xs">{p.ministryCode || p.ministry?.code || '—'}</td>
                    <td className="px-5 py-3 text-slate-600 text-xs">{p.state}</td>
                    <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-5 py-3 w-32">
                      <div className="text-xs font-semibold text-slate-700 mb-1.5">{p.physicalProgress?.toFixed(1) || 0}%</div>
                      <ProgressBar
                        value={p.physicalProgress || 0}
                        color={riskLevel === 'LOW' ? 'emerald' : riskLevel === 'MEDIUM' ? 'amber' : 'red'}
                      />
                    </td>
                    <td className="px-5 py-3"><RiskBadge level={riskLevel} /></td>
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-700">
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
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
            <p className="text-sm text-slate-600">
              Showing <span className="font-semibold text-slate-900">{(page - 1) * PAGE_SIZE + 1}</span> to <span className="font-semibold text-slate-900">{Math.min(page * PAGE_SIZE, sorted.length)}</span> of <span className="font-semibold text-slate-900">{sorted.length}</span> results
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded bg-white border border-slate-300 disabled:opacity-50 hover:bg-slate-50 transition-colors text-slate-600"
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
                    className={`w-8 h-8 text-sm rounded font-medium transition-colors border ${pg === page ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {pg}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded bg-white border border-slate-300 disabled:opacity-50 hover:bg-slate-50 transition-colors text-slate-600"
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
