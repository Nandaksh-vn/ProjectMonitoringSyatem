import React, { useEffect, useState } from 'react';
import { recommendationService, projectService, predictionService } from '../services/api';
import { LoadingState, ErrorState } from '../components/ui/Shared';
import { Lightbulb, Filter, Search, Activity, Eye, CheckCircle2, CircleDot, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const PRIORITY_STYLES = {
  URGENT: 'bg-red-50 text-red-700 border-red-200',
  CRITICAL: 'bg-red-50 text-red-700 border-red-200',
  HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function RecommendationsPage() {
  const [recs, setRecs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [latestPredictions, setLatestPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingId, setSavingId] = useState(null);

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    projectId: '', sector: '', risk: '', priority: '', status: 'OPEN'
  });

  const navigate = useNavigate();

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      recommendationService.getAll(),
      projectService.getAll(),
      predictionService.getLatestPerProject()
    ])
      .then(([rRes, pRes, predRes]) => {
        setRecs(rRes.data || []);
        setProjects(pRes.data?.content || pRes.data || []);
        setLatestPredictions(
          (predRes.data || []).reduce((acc, p) => {
            acc[p.projectId] = p;
            return acc;
          }, {})
        );
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const projectMap = projects.reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {});

  const sectors = [...new Set(projects.map(p => p.sectorCode || p.sector?.code).filter(Boolean))].sort();
  const risks = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  const filteredRecs = recs.filter(r => {
    const p = projectMap[r.projectId];
    // Real risk level from the latest prediction, not a hard-coded fallback.
    const pRisk = latestPredictions[r.projectId]?.riskLevel || null;
    const q = search.toLowerCase();

    const matchesSearch = !q || p?.projectName?.toLowerCase().includes(q) || p?.projectCode?.toLowerCase().includes(q) || r.title?.toLowerCase().includes(q);
    const matchesProject = !filters.projectId || r.projectId.toString() === filters.projectId;
    const matchesSector = !filters.sector || (p?.sectorCode || p?.sector?.code) === filters.sector;
    const matchesRisk = !filters.risk || pRisk === filters.risk;
    const matchesPriority = !filters.priority || r.priorityLevel === filters.priority;
    // actionTakenStatus is persisted by PATCH /recommendations/{id}/action.
    const matchesStatus =
      filters.status === 'ALL' ? true
        : filters.status === 'OPEN' ? !r.actionTakenStatus
          : Boolean(r.actionTakenStatus);

    return matchesSearch && matchesProject && matchesSector && matchesRisk && matchesPriority && matchesStatus;
  });

  const recordAction = async (rec, actionTaken) => {
    setSavingId(rec.id);
    try {
      const res = await recommendationService.recordAction(
        rec.id,
        actionTaken,
        actionTaken ? 'Marked actioned from the recommendations screen.' : 'Reopened for review.'
      );
      setRecs(prev => prev.map(r => (r.id === rec.id ? { ...r, ...res.data.recommendation } : r)));
    } catch (e) {
      setError(e.response?.data?.message || 'Could not record the action.');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <LoadingState message="Loading recommendations..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold text-slate-500 mb-1 tracking-wide uppercase">
          <Link to="/dashboard" className="hover:text-brand-600">Home</Link> / Recommendations
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-900 flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-brand-600" /> Recommended Actions
            </h1>
            <p className="text-slate-600 text-sm mt-1">Suggested interventions based on detected project risks.</p>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded p-4 text-sm text-amber-800 flex items-start gap-3 shadow-sm">
        <Lightbulb className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <strong className="block mb-1">Important Notice:</strong>
          These interventions are produced by the threshold rules engine together with model signals — they are
          not free-form generated text. Officers should verify each one against the underlying data before acting.
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-5 rounded border border-slate-200 shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search recommendations by project name, code, or action..." 
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
          <select value={filters.risk} onChange={e => setFilters(prev => ({...prev, risk: e.target.value}))} className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded px-3 py-1.5">
            <option value="">All Project Risks</option>
            {risks.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={filters.priority} onChange={e => setFilters(prev => ({...prev, priority: e.target.value}))} className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded px-3 py-1.5">
            <option value="">All Priorities</option>
            {priorities.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={filters.status} onChange={e => setFilters(prev => ({...prev, status: e.target.value}))} className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded px-3 py-1.5 font-semibold">
            <option value="OPEN">Open Actions</option>
            <option value="ACTIONED">Actioned</option>
            <option value="ALL">All Actions</option>
          </select>
          
          {Object.values(filters).some(v => v !== '' && v !== 'OPEN') && (
            <button onClick={() => setFilters({ projectId: '', sector: '', risk: '', priority: '', status: 'OPEN' })} className="text-sm font-medium text-brand-600 hover:underline">Reset</button>
          )}
        </div>
      </div>

      {/* Cards Layout */}
      {filteredRecs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded p-12 text-center shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-emerald-200 mx-auto mb-3"/>
          <p className="text-lg font-bold text-slate-700">No recommendations are currently available.</p>
          <p className="text-sm text-slate-500 mt-1">There are no suggested interventions matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredRecs.map(r => {
            const p = projectMap[r.projectId];
            const isActioned = Boolean(r.actionTakenStatus);
            const busy = savingId === r.id;
            return (
              <div key={r.id} className={`bg-white border border-slate-200 rounded shadow-sm flex flex-col transition-colors ${isActioned ? 'opacity-75' : 'hover:border-brand-300'}`}>
                {/* Header */}
                <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t flex justify-between items-start gap-4">
                   <div>
                     <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${PRIORITY_STYLES[r.priorityLevel] || PRIORITY_STYLES.LOW}`}>
                          {r.priorityLevel} PRIORITY
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide bg-white border border-slate-200 px-2 py-0.5 rounded">
                          {r.recommendationType || 'GENERAL'}
                        </span>
                     </div>
                     <div className="font-semibold text-slate-900 line-clamp-1" title={p?.projectName}>{p?.projectName || `Project #${r.projectId}`}</div>
                     <div className="text-xs font-mono text-slate-500 mt-0.5">{p?.projectCode}</div>
                   </div>
                   <div className="shrink-0 text-right">
                     <span className={`text-xs font-bold flex items-center gap-1 px-2 py-1 rounded border ${
                       isActioned
                         ? 'bg-slate-100 text-slate-600 border-slate-200'
                         : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                     }`}>
                       {isActioned ? <CircleDot className="w-3.5 h-3.5"/> : <CheckCircle2 className="w-3.5 h-3.5"/>}
                       {isActioned ? 'ACTIONED' : 'OPEN'}
                     </span>
                   </div>
                </div>

                {/* Body */}
                <div className="p-4 flex-1">
                  <div className="mb-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Risk Factor / Issue</h3>
                    <p className="text-sm font-semibold text-slate-800">{r.title}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Recommended Action</h3>
                    <div className="text-sm text-slate-700 bg-brand-50/50 p-3 rounded border border-brand-100 font-medium leading-relaxed">
                      {r.description}
                    </div>
                  </div>
                  {r.actionTakenDetails && (
                    <div className="mt-3 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded p-2">
                      <span className="font-semibold">Recorded:</span> {r.actionTakenDetails}
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 pt-0 mt-auto flex flex-wrap items-center gap-2">
                  <button onClick={() => navigate(`/projects/${r.projectId}`)} className="flex-1 text-xs font-semibold px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded flex items-center justify-center gap-1.5 shadow-sm transition-colors">
                     <Eye className="w-3.5 h-3.5"/> View Project
                  </button>
                  <button onClick={() => navigate(`/risk-analytics?projectId=${r.projectId}`)} className="flex-1 text-xs font-semibold px-3 py-2 bg-brand-50 border border-brand-200 text-brand-700 hover:bg-brand-100 rounded flex items-center justify-center gap-1.5 shadow-sm transition-colors">
                     <Activity className="w-3.5 h-3.5"/> Analyze Risk
                  </button>
                  <button
                    onClick={() => recordAction(r, !isActioned)}
                    disabled={busy}
                    className={`flex-1 text-xs font-semibold px-3 py-2 rounded flex items-center justify-center gap-1.5 shadow-sm transition-colors disabled:opacity-60 ${
                      isActioned
                        ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : isActioned ? <CircleDot className="w-3.5 h-3.5"/> : <CheckCircle2 className="w-3.5 h-3.5"/>}
                    {isActioned ? 'Reopen' : 'Mark actioned'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}
