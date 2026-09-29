import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { publicService } from '../../services/api';
import { LoadingState } from '../../components/ui/Shared';

const ICONS = ['🛣️', '⚡', '💧', '🚆', '⛏️', '🏙️', '📡', '🏥'];

export default function SectorDirectoryPage() {
  const [sectors, setSectors] = useState([]);
  const [sectorStats, setSectorStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSectors = async () => {
      try {
        const [sectorsRes, projectsRes] = await Promise.all([
          publicService.getSectors(),
          publicService.getProjects()
        ]);
        
        const allSectors = sectorsRes.data || [];
        const allProjects = projectsRes.data || [];
        
        const statsMap = {};
        allSectors.forEach(s => {
          statsMap[s.id] = { total: 0, ongoing: 0, completed: 0, atRisk: 0 };
        });
        
        allProjects.forEach(p => {
          if (p.sectorId && statsMap[p.sectorId]) {
            statsMap[p.sectorId].total += 1;
            
            const status = (p.status || '').toUpperCase();
            if (status === 'COMPLETED') {
              statsMap[p.sectorId].completed += 1;
            } else {
              statsMap[p.sectorId].ongoing += 1;
            }
            
            if (status === 'AT_RISK' || status === 'CRITICAL') {
              statsMap[p.sectorId].atRisk += 1;
            }
          }
        });
        
        setSectors(allSectors);
        setSectorStats(statsMap);
      } catch (err) {
        console.error("Failed to load sectors", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSectors();
  }, []);

  return (
    <div className="py-12 px-4 max-w-7xl mx-auto min-h-screen">
      <div className="mb-8 border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Infrastructure Sectors</h1>
        <p className="text-slate-600 mt-2">Browse monitored projects categorized by national infrastructure sectors.</p>
      </div>

      {loading ? (
        <LoadingState message="Loading sectors..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sectors.map((sector, index) => {
            const stats = sectorStats[sector.id] || { total: 0, ongoing: 0, completed: 0, atRisk: 0 };
            return (
              <div key={sector.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-brand-300 transition-all flex flex-col">
                <div className="p-6 flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-4xl bg-slate-50 w-16 h-16 rounded-xl flex items-center justify-center border border-slate-100">
                      {ICONS[index % ICONS.length]}
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{sector.name}</h2>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4 border-t border-b border-slate-100 py-4">
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Ongoing</div>
                      <div className="text-lg font-semibold text-brand-700">{stats.ongoing}</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Completed</div>
                      <div className="text-lg font-semibold text-emerald-600">{stats.completed}</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">High Risk</div>
                      <div className="text-lg font-semibold text-red-600">{stats.atRisk}</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total</div>
                      <div className="text-lg font-semibold text-slate-800">{stats.total}</div>
                    </div>
                  </div>
                </div>
                
                <Link 
                  to={`/sectors/${sector.id}`}
                  className="bg-slate-50 hover:bg-brand-50 border-t border-slate-200 text-center py-4 text-brand-700 font-bold text-sm transition-colors block"
                >
                  View Sector Details &rarr;
                </Link>
              </div>
            );
          })}
          {sectors.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 font-medium bg-slate-50 rounded-lg border border-slate-200">
              No sectors available in the public directory.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
