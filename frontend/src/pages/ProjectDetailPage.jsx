import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { projectService, predictionService, alertService, recommendationService } from '../services/api';
import { LoadingState, ErrorState, RiskBadge, StatusBadge, ProgressBar } from '../components/ui/Shared';
import { useAuth } from '../context/AuthContext';
import {
  Activity, AlertTriangle, Lightbulb, Edit2, Calendar, MapPin, Building2,
  CheckCircle2, Clock, IndianRupee, PieChart, TrendingUp
} from 'lucide-react';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_PROJECT_MANAGER';

  const [project, setProject] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      projectService.getById(id),
      projectService.getMonthlyData(id),
      projectService.getMilestones(id),
      predictionService.getByProject(id),
    ])
      .then(([pRes, mRes, msRes, predRes]) => {
        setProject(pRes.data);
        setMonthlyData(mRes.data || []);
        setMilestones(msRes.data || []);
        setPredictions(predRes.data || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingState message="Loading project profile..." />;
  if (error) return <ErrorState message={error} />;
  if (!project) return <ErrorState message="Project not found." />;

  const pred = predictions[0];
  const riskLevel = pred?.riskLevel || project.riskLevel || 'LOW';
  const overallRisk = pred?.overallRiskScore || 0;

  // Derive Cost/Schedule metrics
  const costGrowthPct = project.approvedCost ? (((project.revisedCost - project.approvedCost) / project.approvedCost) * 100) : 0;
  
  const originalStart = new Date(project.originalStartDate);
  const revisedTarget = new Date(project.revisedCompletionDate);
  const originalTarget = new Date(project.originalCompletionDate);
  const today = new Date();
  
  const totalDurationDays = Math.max(1, Math.round((originalTarget - originalStart) / (1000 * 60 * 60 * 24)));
  const elapsedDays = Math.max(0, Math.round((today - originalStart) / (1000 * 60 * 60 * 24)));
  const remainingDays = Math.max(0, Math.round((revisedTarget - today) / (1000 * 60 * 60 * 24)));
  const scheduleStatus = revisedTarget > originalTarget ? 'Delayed' : 'On Track';

  const completedMs = milestones.filter(m => m.status === 'COMPLETED').length;
  const delayedMs = milestones.filter(m => m.status === 'DELAYED').length;
  const pendingMs = milestones.filter(m => m.status === 'PENDING' || m.status === 'IN_PROGRESS').length;

  const costRisk = Math.min(100, Math.max(0, overallRisk + (pred?.predictedCostOverrunPct > 10 ? 15 : -10)));
  const scheduleRisk = Math.min(100, Math.max(0, overallRisk + (pred?.predictedDelayMonths > 6 ? 20 : -5)));
  const progressRisk = Math.min(100, Math.max(0, overallRisk + ((project.physicalProgress < 50) ? 10 : -10)));

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
        <Link to="/dashboard" className="hover:text-brand-600">Home</Link> / <Link to="/projects" className="hover:text-brand-600">Projects</Link> / {project.projectName}
      </div>

      {/* Header */}
      <div className="bg-white p-6 rounded border border-slate-200 shadow-sm flex flex-col xl:flex-row justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">{project.projectCode}</span>
            <StatusBadge status={project.status} />
            <RiskBadge level={riskLevel} />
          </div>
          <h1 className="text-2xl font-bold text-brand-900">{project.projectName}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button onClick={() => navigate(`/risk-analytics?projectId=${project.id}`)} className="px-4 py-2 bg-brand-50 text-brand-700 hover:bg-brand-100 font-semibold text-sm rounded transition-colors flex items-center gap-2 border border-brand-200">
            <Activity className="w-4 h-4"/> Analyze Risk
          </button>
          <button onClick={() => navigate(`/early-warnings?projectId=${project.id}`)} className="px-4 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold text-sm rounded transition-colors flex items-center gap-2 border border-amber-200">
            <AlertTriangle className="w-4 h-4"/> View Early Warnings
          </button>
          <button onClick={() => navigate(`/recommendations?projectId=${project.id}`)} className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-sm rounded transition-colors flex items-center gap-2 border border-emerald-200">
            <Lightbulb className="w-4 h-4"/> View Recommendations
          </button>
          {canManage && (
            <button onClick={() => navigate(`/projects/${project.id}/edit`)} className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-900 font-semibold text-sm rounded transition-colors flex items-center gap-2">
              <Edit2 className="w-4 h-4"/> Edit Project
            </button>
          )}
        </div>
      </div>

      {/* Project Health Overview */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: 'Overall Risk', value: overallRisk.toFixed(1), icon: Activity, color: riskLevel === 'CRITICAL' ? 'red' : riskLevel === 'HIGH' ? 'orange' : riskLevel === 'MEDIUM' ? 'amber' : 'emerald' },
          { label: 'Physical Progress', value: `${project.physicalProgress}%`, icon: TrendingUp, color: 'blue' },
          { label: 'Financial Progress', value: `${project.financialProgress}%`, icon: PieChart, color: 'cyan' },
          { label: 'Cost Growth', value: `${costGrowthPct.toFixed(1)}%`, icon: IndianRupee, color: costGrowthPct > 0 ? 'red' : 'emerald' },
          { label: 'Delayed Milestones', value: delayedMs, icon: AlertTriangle, color: delayedMs > 0 ? 'red' : 'slate' },
          { label: 'Status', value: project.status, icon: CheckCircle2, color: project.status === 'ONGOING' ? 'emerald' : project.status === 'DELAYED' ? 'amber' : 'red' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white p-4 rounded border border-slate-200 shadow-sm text-center flex flex-col items-center">
            <item.icon className={`w-5 h-5 mb-2 text-${item.color}-500`} />
            <div className={`text-xl font-bold text-${item.color}-700`}>{item.value}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Project Information */}
        <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Building2 className="w-4 h-4 text-brand-600"/> Project Information</h3>
          </div>
          <div className="p-5 grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
            <div><div className="text-xs font-semibold text-slate-500 mb-0.5">Project Code</div><div className="font-semibold text-slate-800">{project.projectCode}</div></div>
            <div><div className="text-xs font-semibold text-slate-500 mb-0.5">Ministry</div><div className="font-semibold text-slate-800">{project.ministryCode || project.ministry?.code || '—'}</div></div>
            <div><div className="text-xs font-semibold text-slate-500 mb-0.5">Sector</div><div className="font-semibold text-slate-800">{project.sectorCode || project.sector?.code || '—'}</div></div>
            <div><div className="text-xs font-semibold text-slate-500 mb-0.5">Implementing Agency</div><div className="font-semibold text-slate-800">{project.agencyCode || project.agency?.code || '—'}</div></div>
            <div><div className="text-xs font-semibold text-slate-500 mb-0.5">State</div><div className="font-semibold text-slate-800">{project.state}</div></div>
            <div><div className="text-xs font-semibold text-slate-500 mb-0.5">District</div><div className="font-semibold text-slate-800">{project.district}</div></div>
            <div><div className="text-xs font-semibold text-slate-500 mb-0.5">Approved Cost</div><div className="font-semibold text-slate-800">₹{project.approvedCost?.toLocaleString('en-IN')} Cr</div></div>
            <div><div className="text-xs font-semibold text-slate-500 mb-0.5">Revised Cost</div><div className="font-semibold text-slate-800">₹{project.revisedCost?.toLocaleString('en-IN')} Cr</div></div>
            <div><div className="text-xs font-semibold text-slate-500 mb-0.5">Approval Date</div><div className="font-semibold text-slate-800">{project.approvalDate}</div></div>
            <div><div className="text-xs font-semibold text-slate-500 mb-0.5">Start Date</div><div className="font-semibold text-slate-800">{project.originalStartDate}</div></div>
            <div><div className="text-xs font-semibold text-slate-500 mb-0.5">Completion Date</div><div className="font-semibold text-slate-800">{project.originalCompletionDate}</div></div>
            <div><div className="text-xs font-semibold text-slate-500 mb-0.5">Current Status</div><div className="font-semibold text-slate-800">{project.status}</div></div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Progress */}
          <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-brand-600"/> Progress</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-xs font-semibold text-slate-700">Physical Progress</span>
                  <span className="text-sm font-bold text-slate-900">{project.physicalProgress}%</span>
                </div>
                <ProgressBar value={project.physicalProgress} color="blue" />
              </div>
              <div>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-xs font-semibold text-slate-700">Financial Progress</span>
                  <span className="text-sm font-bold text-slate-900">{project.financialProgress}%</span>
                </div>
                <ProgressBar value={project.financialProgress} color="emerald" />
              </div>
            </div>
          </div>

          {/* Cost */}
          <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><IndianRupee className="w-4 h-4 text-brand-600"/> Cost Performance</h3>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4 text-sm">
              <div><div className="text-xs font-semibold text-slate-500 mb-0.5">Approved Cost</div><div className="font-bold text-slate-800">₹{project.approvedCost?.toLocaleString('en-IN')} Cr</div></div>
              <div><div className="text-xs font-semibold text-slate-500 mb-0.5">Revised Cost</div><div className="font-bold text-slate-800">₹{project.revisedCost?.toLocaleString('en-IN')} Cr</div></div>
              <div><div className="text-xs font-semibold text-slate-500 mb-0.5">Current Expenditure</div><div className="font-bold text-emerald-700">₹{project.currentExpenditure?.toLocaleString('en-IN')} Cr</div></div>
              <div><div className="text-xs font-semibold text-slate-500 mb-0.5">Cost Growth</div><div className={`font-bold ${costGrowthPct > 0 ? 'text-red-600' : 'text-slate-800'}`}>{costGrowthPct.toFixed(1)}%</div></div>
            </div>
          </div>
        </div>

        {/* Schedule & Milestones */}
        <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Calendar className="w-4 h-4 text-brand-600"/> Schedule</h3>
          </div>
          <div className="p-5 grid grid-cols-2 gap-4 text-sm border-b border-slate-100">
             <div><div className="text-xs font-semibold text-slate-500 mb-0.5">Original Start</div><div className="font-bold text-slate-800">{project.originalStartDate}</div></div>
             <div><div className="text-xs font-semibold text-slate-500 mb-0.5">Original Completion</div><div className="font-bold text-slate-800">{project.originalCompletionDate}</div></div>
             <div><div className="text-xs font-semibold text-slate-500 mb-0.5">Elapsed Duration</div><div className="font-bold text-slate-800">{elapsedDays} days</div></div>
             <div><div className="text-xs font-semibold text-slate-500 mb-0.5">Remaining Duration</div><div className="font-bold text-slate-800">{remainingDays} days</div></div>
             <div className="col-span-2"><div className="text-xs font-semibold text-slate-500 mb-0.5">Schedule Status</div><div className={`font-bold ${scheduleStatus === 'Delayed' ? 'text-red-600' : 'text-emerald-600'}`}>{scheduleStatus}</div></div>
          </div>
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-600"/> Milestones</h3>
          </div>
          <div className="p-5 text-sm">
             {milestones.length === 0 ? (
               <div className="text-slate-500 italic">Data not available for this project.</div>
             ) : (
               <div className="flex gap-6">
                 <div><div className="text-xs font-semibold text-slate-500 mb-0.5">Completed</div><div className="text-lg font-bold text-emerald-600">{completedMs}</div></div>
                 <div><div className="text-xs font-semibold text-slate-500 mb-0.5">Pending</div><div className="text-lg font-bold text-blue-600">{pendingMs}</div></div>
                 <div><div className="text-xs font-semibold text-slate-500 mb-0.5">Delayed</div><div className="text-lg font-bold text-red-600">{delayedMs}</div></div>
               </div>
             )}
          </div>
        </div>

        {/* Risk Breakdown */}
        <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Activity className="w-4 h-4 text-brand-600"/> Risk Breakdown</h3>
          </div>
          <div className="p-5">
            {pred ? (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-end mb-1 text-sm">
                    <span className="text-xs font-semibold text-slate-700">Cost Risk</span>
                    <span className="font-bold text-slate-900">{costRisk.toFixed(0)}/100</span>
                  </div>
                  <ProgressBar value={costRisk} color={costRisk > 75 ? 'red' : costRisk > 40 ? 'amber' : 'emerald'} />
                </div>
                <div>
                  <div className="flex justify-between items-end mb-1 text-sm">
                    <span className="text-xs font-semibold text-slate-700">Schedule Risk</span>
                    <span className="font-bold text-slate-900">{scheduleRisk.toFixed(0)}/100</span>
                  </div>
                  <ProgressBar value={scheduleRisk} color={scheduleRisk > 75 ? 'red' : scheduleRisk > 40 ? 'amber' : 'emerald'} />
                </div>
                <div>
                  <div className="flex justify-between items-end mb-1 text-sm">
                    <span className="text-xs font-semibold text-slate-700">Progress Risk</span>
                    <span className="font-bold text-slate-900">{progressRisk.toFixed(0)}/100</span>
                  </div>
                  <ProgressBar value={progressRisk} color={progressRisk > 75 ? 'red' : progressRisk > 40 ? 'amber' : 'emerald'} />
                </div>
                <div className="pt-4 mt-2 border-t border-slate-100">
                  <button onClick={() => navigate(`/risk-analytics?projectId=${project.id}`)} className="w-full py-2 bg-brand-50 text-brand-700 hover:bg-brand-100 font-bold text-sm rounded transition-colors text-center">
                    Open Risk Analysis &rarr;
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 italic">Data not available for this project.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
