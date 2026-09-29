import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, AlertTriangle, ShieldCheck, Map, Activity, CheckCircle, Database } from 'lucide-react';
import { publicService } from '../../services/api';
import { LoadingState } from '../../components/ui/Shared';

export default function HomePage() {
  const [stats, setStats] = useState(null);
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sectors, setSectors] = useState([]);

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const [statsRes, projectsRes, sectorsRes] = await Promise.all([
          publicService.getStats(),
          publicService.getProjects(),
          publicService.getSectors()
        ]);
        setStats(statsRes.data);
        setFeaturedProjects((projectsRes.data || []).slice(0, 6));
        setSectors((sectorsRes.data || []).slice(0, 8)); // Top 8 sectors
      } catch (err) {
        console.error("Failed to load public data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicData();
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {/* Hero Section */}
      <section className="bg-slate-900 text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-500 via-slate-900 to-slate-900"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Infrastructure Project Monitoring <br className="hidden md:block"/>
            <span className="text-brand-400">& Early Warning System</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-10">
            Data-driven monitoring and risk intelligence for infrastructure projects.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/projects" className="bg-brand-500 hover:bg-brand-600 text-white font-medium px-8 py-3 rounded-md transition-colors text-lg shadow-lg">
              Explore Projects
            </Link>
            <Link to="/sectors" className="bg-white/10 hover:bg-white/20 text-white font-medium px-8 py-3 rounded-md transition-colors text-lg backdrop-blur-sm border border-white/20">
              Explore Sectors
            </Link>
            <Link to="/login" className="bg-white text-slate-900 hover:bg-slate-200 font-medium px-8 py-3 rounded-md transition-colors text-lg shadow-lg">
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* Public Statistics */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Portfolio Overview</h2>
            <div className="w-24 h-1 bg-brand-500 mx-auto mt-4 rounded-full"></div>
          </div>
          
          {loading ? (
            <LoadingState message="Loading live portfolio data..." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 border border-slate-200 rounded-xl bg-slate-50 text-center shadow-sm">
                <Database className="w-10 h-10 text-brand-600 mx-auto mb-4" />
                <div className="text-4xl font-extrabold text-slate-900 mb-2">{stats?.totalProjects || 0}</div>
                <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Projects</div>
              </div>
              <div className="p-8 border border-slate-200 rounded-xl bg-slate-50 text-center shadow-sm">
                <Activity className="w-10 h-10 text-amber-500 mx-auto mb-4" />
                <div className="text-4xl font-extrabold text-slate-900 mb-2">{stats?.ongoingProjects || 0}</div>
                <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Ongoing Projects</div>
              </div>
              <div className="p-8 border border-slate-200 rounded-xl bg-slate-50 text-center shadow-sm">
                <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-4" />
                <div className="text-4xl font-extrabold text-slate-900 mb-2">{stats?.completedProjects || 0}</div>
                <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Completed Projects</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Sectors Section */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Key Infrastructure Sectors</h2>
              <div className="w-24 h-1 bg-brand-500 mt-4 rounded-full"></div>
            </div>
            <Link to="/sectors" className="text-brand-600 hover:text-brand-700 font-medium font-bold text-sm">
              View All Sectors &rarr;
            </Link>
          </div>
          
          {loading ? (
            <LoadingState message="Loading sectors..." />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sectors.map(sector => (
                <Link 
                  key={sector.id} 
                  to={`/sectors/${sector.id}`} 
                  className="bg-slate-50 border border-slate-200 p-6 rounded-lg text-center hover:bg-brand-50 hover:border-brand-300 transition-colors"
                >
                  <div className="font-bold text-slate-800">{sector.name}</div>
                </Link>
              ))}
              {sectors.length === 0 && (
                 <div className="col-span-full py-12 text-center text-slate-500 font-medium bg-slate-50 rounded-lg border border-slate-200">
                   No sectors available in the public directory.
                 </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Featured Projects</h2>
              <div className="w-24 h-1 bg-brand-500 mt-4 rounded-full"></div>
            </div>
            <Link to="/projects" className="text-brand-600 hover:text-brand-700 font-medium font-bold text-sm">
              View All Projects &rarr;
            </Link>
          </div>
          
          {loading ? (
            <LoadingState message="Loading projects..." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProjects.map(project => (
                <div key={project.id} className="gov-card p-6 flex flex-col bg-white border border-slate-200 rounded-lg shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-700 rounded border border-slate-200">
                      {project.projectCode}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border ${
                      project.status === 'ON_TRACK' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      project.status === 'DELAYED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      project.status === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {project.status || 'UNKNOWN'}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug line-clamp-2">
                    {project.projectName}
                  </h3>
                  
                  <div className="space-y-2 mb-6 flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">State:</span>
                      <span className="font-semibold text-slate-900">{project.state || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Physical Progress:</span>
                      <span className="font-semibold text-brand-700">{project.physicalProgress || 0}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Financial Progress:</span>
                      <span className="font-semibold text-brand-700">{project.financialProgress || 0}%</span>
                    </div>
                  </div>
                  
                  <Link 
                    to={`/projects/${project.id}`}
                    className="w-full text-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded transition-colors"
                  >
                    View Project
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-white" id="about">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-6">About InfraWatch AI</h2>
          <div className="w-24 h-1 bg-brand-500 mx-auto mb-8 rounded-full"></div>
          <p className="text-lg text-slate-600 leading-relaxed mb-6">
            InfraWatch AI is an infrastructure project monitoring and early-warning platform designed to support project monitoring, risk identification, progress tracking and decision support.
          </p>
          <p className="text-slate-500">
            By aggregating physical and financial data across the infrastructure portfolio, the platform provides authorized administrators with insights necessary to effectively allocate resources and identify structurally significant anomalies before they severely impact regional development timelines.
          </p>
        </div>
      </section>
    </div>
  );
}
