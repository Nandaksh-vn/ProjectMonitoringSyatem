import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { publicService } from '../../services/api';
import { Search, Filter } from 'lucide-react';
import { LoadingState } from '../../components/ui/Shared';

export default function ProjectDirectoryPage() {
  const [projects, setProjects] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters
  const [search, setSearch] = useState('');
  const [filterSector, setFilterSector] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialSectorFilter = searchParams.get('sector');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [projRes, secRes] = await Promise.all([
          publicService.getProjects(),
          publicService.getSectors()
        ]);
        let data = projRes.data?.content || projRes.data || [];
        setProjects(data);
        setSectors(secRes.data || []);
        
        if (initialSectorFilter) {
          setFilterSector(initialSectorFilter);
        }
      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [initialSectorFilter]);

  // Derived unique states for filter
  const uniqueStates = Array.from(new Set(projects.map(p => p.state).filter(Boolean))).sort();

  const filteredProjects = projects.filter(p => {
    if (search && !p.projectName?.toLowerCase().includes(search.toLowerCase()) && !p.projectCode?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterSector && p.sectorId?.toString() !== filterSector) return false;
    if (filterState && p.state !== filterState) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="py-12 px-4 max-w-7xl mx-auto min-h-screen">
      <div className="mb-8 border-b border-slate-200 pb-4 flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Project Directory</h1>
          <p className="text-slate-600 mt-2">Public information on monitored infrastructure projects.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 mb-8 flex flex-col md:flex-row gap-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by project name or ID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 text-sm"
          />
        </div>
        <div className="flex flex-wrap md:flex-nowrap gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            <select value={filterSector} onChange={e => setFilterSector(e.target.value)} className="bg-transparent text-sm focus:outline-none text-slate-700 font-medium">
              <option value="">All Sectors</option>
              {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <select value={filterState} onChange={e => setFilterState(e.target.value)} className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-brand-500 font-medium text-slate-700">
            <option value="">All States</option>
            {uniqueStates.map(st => <option key={st} value={st}>{st}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-brand-500 font-medium text-slate-700">
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

      {loading ? <LoadingState message="Loading projects..." /> : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left font-bold text-slate-700 tracking-wider whitespace-nowrap">Project ID</th>
                  <th className="px-6 py-4 text-left font-bold text-slate-700 tracking-wider min-w-[300px]">Project Name</th>
                  <th className="px-6 py-4 text-left font-bold text-slate-700 tracking-wider">State</th>
                  <th className="px-6 py-4 text-left font-bold text-slate-700 tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left font-bold text-slate-700 tracking-wider">Progress</th>
                  <th className="px-6 py-4 text-right font-bold text-slate-700 tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-500 uppercase tracking-wide">{project.projectCode}</td>
                    <td className="px-6 py-4 text-slate-900 font-semibold">{project.projectName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-medium">{project.state || 'N/A'}</td>
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
                      <Link to={`/projects/${project.id}`} className="text-brand-600 hover:text-brand-900 font-bold px-3 py-1.5 rounded bg-brand-50 hover:bg-brand-100 transition-colors inline-block">View Project</Link>
                    </td>
                  </tr>
                ))}
                {filteredProjects.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500 font-medium">No projects match the selected criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
