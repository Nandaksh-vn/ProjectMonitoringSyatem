import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { publicService } from '../../services/api';
import { LoadingState } from '../../components/ui/Shared';
import { Map, Activity, CheckCircle, Database, Filter } from 'lucide-react';

export default function PublicSectorDetailPage() {
  const { id } = useParams();
  const [sector, setSector] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterState, setFilterState] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sectorsRes, projectsRes] = await Promise.all([
          publicService.getSectors(),
          publicService.getProjects()
        ]);
        
        const allSectors = sectorsRes.data || [];
        const allProjects = projectsRes.data || [];
        
        const matchedSector = allSectors.find(s => s.id.toString() === id);
        setSector(matchedSector);
        
        if (matchedSector) {
          const sectorProjects = allProjects.filter(p => p.sectorId === matchedSector.id);
          setProjects(sectorProjects);
        }
      } catch (err) {
        console.error("Failed to load sector data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Derived stats
  const stats = useMemo(() => {
    let ongoing = 0, completed = 0, atRisk = 0;
    const states = new Set();
    
    projects.forEach(p => {
      const status = (p.status || '').toUpperCase();
      if (status === 'COMPLETED') completed++;
      else ongoing++;
      
      if (status === 'AT_RISK' || status === 'CRITICAL') atRisk++;
      
      if (p.state) states.add(p.state);
    });
    
    return {
      total: projects.length,
      ongoing,
      completed,
      atRisk,
      statesCount: states.size,
      statesList: Array.from(states)
    };
  }, [projects]);

  // Apply filters
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (filterState && p.state !== filterState) return false;
      if (filterStatus && p.status !== filterStatus) return false;
      return true;
    });
  }, [projects, filterState, filterStatus]);

  if (loading) return <div className="py-24"><LoadingState message="Loading sector data..." /></div>;
  if (!sector) return <div className="py-24 text-center text-slate-500">Sector not found in public directory.</div>;

  return (
    <div className="py-12 px-4 max-w-7xl mx-auto min-h-screen">
      <div className="mb-6">
        <Link to="/sectors" className="text-brand-600 hover:underline text-sm font-medium">&larr; Back to Sectors</Link>
      </div>

      <div className="mb-10 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{sector.name}</h1>
        <p className="text-slate-600 mt-2 text-lg">Detailed public monitoring overview for all {sector.name.toLowerCase()} infrastructure projects.</p>
      </div>

      {/* Sector Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <Database className="w-8 h-8 text-brand-600 mb-3" />
          <div className="text-3xl font-extrabold text-slate-900">{stats.total}</div>
          <div className="text-sm font-bold text-slate-500 uppercase tracking-wide mt-1">Total Projects</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <Activity className="w-8 h-8 text-amber-500 mb-3" />
          <div className="text-3xl font-extrabold text-slate-900">{stats.ongoing}</div>
          <div className="text-sm font-bold text-slate-500 uppercase tracking-wide mt-1">Ongoing</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <CheckCircle className="w-8 h-8 text-emerald-600 mb-3" />
          <div className="text-3xl font-extrabold text-slate-900">{stats.completed}</div>
          <div className="text-sm font-bold text-slate-500 uppercase tracking-wide mt-1">Completed</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <Map className="w-8 h-8 text-purple-600 mb-3" />
          <div className="text-3xl font-extrabold text-slate-900">{stats.statesCount}</div>
          <div className="text-sm font-bold text-slate-500 uppercase tracking-wide mt-1">States Covered</div>
        </div>
      </div>

      {/* Filters & Projects Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-10">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-bold text-slate-900">Project Directory</h2>
          
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select 
                value={filterState} 
                onChange={(e) => setFilterState(e.target.value)}
                className="bg-white border border-slate-300 rounded px-3 py-1.5 text-sm font-medium focus:ring-brand-500 focus:border-brand-500"
              >
                <option value="">All States</option>
                {stats.statesList.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white border border-slate-300 rounded px-3 py-1.5 text-sm font-medium focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="">All Statuses</option>
              <option value="ONGOING">ONGOING</option>
              <option value="ON_TRACK">ON TRACK</option>
              <option value="DELAYED">DELAYED</option>
              <option value="AT_RISK">AT RISK</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-slate-700 tracking-wider bg-slate-50/50">Project</th>
                <th className="px-6 py-4 text-left font-bold text-slate-700 tracking-wider bg-slate-50/50">State</th>
                <th className="px-6 py-4 text-left font-bold text-slate-700 tracking-wider bg-slate-50/50">Status</th>
                <th className="px-6 py-4 text-left font-bold text-slate-700 tracking-wider bg-slate-50/50">Progress</th>
                <th className="px-6 py-4 text-right font-bold text-slate-700 tracking-wider bg-slate-50/50">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900 mb-1">{project.projectName}</div>
                    <div className="text-xs font-bold text-slate-500 tracking-wide uppercase">{project.projectCode}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-700 font-medium">{project.state || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs font-bold rounded uppercase tracking-wider border ${
                      project.status === 'ON_TRACK' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      project.status === 'DELAYED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      (project.status === 'CRITICAL' || project.status === 'AT_RISK') ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {project.status || 'ONGOING'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-200 rounded-full h-1.5">
                        <div className="bg-brand-600 h-1.5 rounded-full" style={{ width: `${project.physicalProgress || 0}%` }}></div>
                      </div>
                      <span className="text-xs font-bold text-slate-700">{project.physicalProgress || 0}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Link to={`/projects/${project.id}`} className="text-brand-600 hover:text-brand-900 font-bold px-3 py-1.5 rounded bg-brand-50 hover:bg-brand-100 transition-colors">View Project</Link>
                  </td>
                </tr>
              ))}
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">No projects match the selected filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
