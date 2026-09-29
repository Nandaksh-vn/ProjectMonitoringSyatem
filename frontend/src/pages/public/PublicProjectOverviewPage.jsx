import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { publicService } from '../../services/api';
import { LoadingState } from '../../components/ui/Shared';
import { MapPin, Building, Calendar, DollarSign, Activity, AlertCircle, Clock, Flag, TrendingUp } from 'lucide-react';

export default function PublicProjectOverviewPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicService.getProjectById(id)
      .then(res => setProject(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="py-24"><LoadingState message="Loading project information..." /></div>;
  if (!project) return <div className="py-24 text-center">Project information could not be loaded. Please try again.</div>;

  return (
    <div className="py-12 px-4 max-w-7xl mx-auto min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <Link to="/projects" className="text-brand-600 hover:underline text-sm font-medium">&larr; Back to Directory</Link>
        <Link to="/login" className="text-xs font-bold bg-slate-800 text-white px-3 py-1.5 rounded hover:bg-slate-900 transition-colors">Admin Login</Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-8">
        <div className="p-8 border-b border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide border border-slate-200">{project.projectCode}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase border ${
                        project.status === 'ON_TRACK' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        project.status === 'DELAYED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        (project.status === 'CRITICAL' || project.status === 'AT_RISK') ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
              {project.status || 'ONGOING'}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6">{project.projectName}</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Sector</p>
              <p className="font-semibold text-slate-800 flex items-center gap-2"><Building className="w-4 h-4 text-slate-400"/> {project.sectorCode || 'Infrastructure'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Location</p>
              <p className="font-semibold text-slate-800 flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400"/> {project.district ? `${project.district}, ${project.state}` : (project.state || 'Data not available')}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Ministry</p>
              <p className="font-semibold text-slate-800">{project.ministryId ? `Ministry ID: ${project.ministryId}` : 'Data not available'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Implementing Agency</p>
              <p className="font-semibold text-slate-800">{project.agencyId ? `Agency ID: ${project.agencyId}` : 'Data not available'}</p>
            </div>
          </div>
        </div>

        {/* Project Cost */}
        <div className="p-8 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2"><DollarSign className="w-5 h-5 text-brand-600"/> Project Cost</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm font-medium text-slate-500">Approved Cost</p>
              <p className="text-lg font-bold text-slate-900">{project.approvedCost != null ? `₹${project.approvedCost} Cr` : 'Data not available'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Revised Cost</p>
              <p className="text-lg font-bold text-slate-900">{project.revisedCost != null ? `₹${project.revisedCost} Cr` : 'Data not available'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Current Expenditure</p>
              <p className="text-lg font-bold text-slate-900">{project.currentExpenditure != null ? `₹${project.currentExpenditure} Cr` : 'Data not available'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Cost Growth</p>
              <p className="text-lg font-bold text-slate-900">
                {project.approvedCost && project.revisedCost && project.approvedCost > 0 
                  ? `${(((project.revisedCost - project.approvedCost) / project.approvedCost) * 100).toFixed(1)}%`
                  : 'Data not available'}
              </p>
            </div>
          </div>
        </div>

        {/* Project Schedule */}
        <div className="p-8 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2"><Calendar className="w-5 h-5 text-brand-600"/> Project Schedule</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm font-medium text-slate-500">Original Start Date</p>
              <p className="text-md font-bold text-slate-900">{project.originalStartDate || 'Data not available'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Original Completion</p>
              <p className="text-md font-bold text-slate-900">{project.originalCompletionDate || 'Data not available'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Current/Expected Completion</p>
              <p className="text-md font-bold text-slate-900">{project.revisedCompletionDate || 'Data not available'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Schedule Status</p>
              <p className="text-md font-bold text-slate-900">{project.status === 'DELAYED' ? 'Delayed' : 'On Track'}</p>
            </div>
          </div>
        </div>

        {/* Development Progress & Analysis */}
        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2"><Activity className="w-5 h-5 text-brand-600"/> Project Development Analysis</h2>
          <p className="text-sm text-slate-500 mb-8">Public progress tracking based on reported physical and financial completion metrics.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Physical */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h3 className="font-bold text-slate-900">Physical Progress</h3>
                  <p className="text-xs text-slate-500">Actual site completion</p>
                </div>
                <div className="text-2xl font-extrabold text-brand-700">{project.physicalProgress || 0}%</div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 mb-4">
                <div className="bg-brand-600 h-3 rounded-full" style={{ width: `${project.physicalProgress || 0}%` }}></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Planned Physical Progress:</span>
                <span className="font-bold text-slate-700">Data not available</span>
              </div>
            </div>

            {/* Financial */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h3 className="font-bold text-slate-900">Financial Progress</h3>
                  <p className="text-xs text-slate-500">Expenditure vs Budget</p>
                </div>
                <div className="text-2xl font-extrabold text-emerald-600">{project.financialProgress || 0}%</div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 mb-4">
                <div className="bg-emerald-500 h-3 rounded-full" style={{ width: `${project.financialProgress || 0}%` }}></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Planned Financial Progress:</span>
                <span className="font-bold text-slate-700">Data not available</span>
              </div>
            </div>
          </div>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border border-slate-200 rounded-lg p-5 bg-white">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Flag className="w-4 h-4 text-slate-500"/> Milestones</h3>
              <p className="text-sm text-slate-500 italic py-4 text-center bg-slate-50 rounded">Milestone data is not available for this project.</p>
            </div>
            
            <div className="border border-slate-200 rounded-lg p-5 bg-white">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-slate-500"/> Progress Trend</h3>
              <p className="text-sm text-slate-500 italic py-4 text-center bg-slate-50 rounded">Historical progress data is not available.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-sm text-slate-500 mb-3">Detailed monitoring, risk management, and edit capabilities are restricted to authorized personnel.</p>
        <Link to="/login" className="inline-flex items-center gap-2 bg-slate-800 text-white font-medium px-4 py-2 rounded-md hover:bg-slate-900 transition-colors text-sm">
          Access Management Dashboard
        </Link>
      </div>
    </div>
  );
}
