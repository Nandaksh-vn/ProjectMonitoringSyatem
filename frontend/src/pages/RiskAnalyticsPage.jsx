import React, { useEffect, useState, useMemo } from 'react';
import { projectService, recommendationService, predictionService, alertService } from '../services/api';
import { LoadingState, ErrorState, RiskBadge } from '../components/ui/Shared';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';
import { BarChart3, TrendingUp, AlertTriangle, Lightbulb, ExternalLink, Calendar, IndianRupee, Activity, ArrowLeft } from 'lucide-react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';

const TOOLTIP_STYLE = {
  backgroundColor: '#ffffff', border: '1px solid #e2e8f0',
  borderRadius: 4, color: '#0f172a', fontSize: 12,
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
};
const RISK_COLORS = { CRITICAL: '#dc2626', HIGH: '#ea580c', MEDIUM: '#d97706', LOW: '#059669' };

export default function RiskAnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedProjectId = searchParams.get('projectId') || 'all';

  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Single project state
  const [projectData, setProjectData] = useState(null);
  const [projectPredictions, setProjectPredictions] = useState([]);
  const [projectMonthlyData, setProjectMonthlyData] = useState([]);
  const [projectMilestones, setProjectMilestones] = useState([]);
  const [projectRiskFactors, setProjectRiskFactors] = useState([]);
  const [projectRecommendations, setProjectRecommendations] = useState([]);
  const [singleLoading, setSingleLoading] = useState(false);

  // Load all projects for dropdown and portfolio view
  useEffect(() => {
    projectService.getAll()
      .then(r => setAllProjects(r.data?.content || r.data || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Load single project data when selected
  useEffect(() => {
    if (selectedProjectId !== 'all') {
      setSingleLoading(true);
      Promise.all([
        projectService.getById(selectedProjectId),
        predictionService.getByProject(selectedProjectId),
        projectService.getMonthlyData(selectedProjectId),
        projectService.getMilestones(selectedProjectId),
        projectService.getRiskFactors(selectedProjectId),
        recommendationService.getByProject(selectedProjectId)
      ])
        .then(([proj, preds, monthly, milestones, risks, recs]) => {
          setProjectData(proj.data);
          setProjectPredictions(preds.data);
          setProjectMonthlyData(monthly.data?.reverse() || []); // oldest to newest for charts
          setProjectMilestones(milestones.data || []);
          setProjectRiskFactors(risks.data || []);
          setProjectRecommendations(recs.data || []);
        })
        .catch(e => console.error("Failed to load project details", e))
        .finally(() => setSingleLoading(false));
    }
  }, [selectedProjectId]);

  const handleProjectSelect = (e) => {
    const val = e.target.value;
    if (val === 'all') {
      searchParams.delete('projectId');
    } else {
      searchParams.set('projectId', val);
    }
    setSearchParams(searchParams);
  };

  if (loading) return <LoadingState message="Loading risk intelligence..." />;
  if (error) return <ErrorState message={error} />;

  const renderPortfolioMode = () => {
    const scatterData = allProjects.map(p => {
      const pred = p.predictions?.[0];
      return {
        name: p.projectCode, fullName: p.projectName,
        costOverrun: (((p.revisedCost - p.approvedCost) / (p.approvedCost || 1)) * 100),
        physicalProgress: p.physicalProgress || 0,
        riskLevel: pred?.riskLevel || 'LOW',
        riskScore: pred?.overallRiskScore || 0,
      };
    });

    const riskByMinistry = allProjects.reduce((acc, p) => {
      const m = p.ministryCode || p.ministry?.code || 'OTHER';
      if (!acc[m]) acc[m] = { name: m, CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
      const rl = p.predictions?.[0]?.riskLevel || 'LOW';
      acc[m][rl]++;
      return acc;
    }, {});
    const ministryRiskData = Object.values(riskByMinistry);

    const riskDist = Object.entries(
      allProjects.reduce((acc, p) => {
        const rl = p.predictions?.[0]?.riskLevel || 'LOW';
        acc[rl] = (acc[rl] || 0) + 1;
        return acc;
      }, { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 })
    ).map(([name, value]) => ({ name, value }));

    return (
      <>
        {/* Risk summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {riskDist.map(({ name, value }) => (
            <div key={name} className="bg-white border border-slate-200 p-5 rounded shadow-sm text-center">
              <RiskBadge level={name} />
              <p className="text-3xl font-bold text-slate-900 mt-3">{value}</p>
              <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wide">projects</p>
            </div>
          ))}
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          <div className="bg-white border border-slate-200 p-5 rounded shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Cost Overrun vs Physical Progress</h3>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="physicalProgress" name="Physical Progress" unit="%" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="costOverrun" name="Cost Overrun" unit="%" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <RechartsTooltip contentStyle={TOOLTIP_STYLE} cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e1' }}
                  content={({ payload }) => {
                    if (!payload?.length) return null;
                    const d = payload[0]?.payload;
                    return (
                      <div style={TOOLTIP_STYLE} className="p-3">
                        <p className="font-bold text-slate-800 text-xs mb-2">{d?.fullName}</p>
                        <p className="text-xs text-slate-600 mb-1">Progress: {d?.physicalProgress?.toFixed(1)}%</p>
                        <p className="text-xs text-slate-600 mb-2">Cost Overrun: {d?.costOverrun?.toFixed(1)}%</p>
                        <RiskBadge level={d?.riskLevel} />
                      </div>
                    );
                  }}
                />
                {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(rl => (
                  <Scatter key={rl} name={rl} data={scatterData.filter(d => d.riskLevel === rl)} fill={RISK_COLORS[rl]} />
                ))}
                <Legend formatter={(v) => <span className="text-xs font-semibold text-slate-700">{v}</span>} wrapperStyle={{ paddingTop: '10px' }} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Risk Distribution by Ministry</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ministryRiskData} barSize={24} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <RechartsTooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#f8fafc' }} />
                <Legend formatter={(v) => <span className="text-xs font-semibold text-slate-700">{v}</span>} wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="CRITICAL" stackId="a" fill="#dc2626" />
                <Bar dataKey="HIGH" stackId="a" fill="#ea580c" />
                <Bar dataKey="MEDIUM" stackId="a" fill="#d97706" />
                <Bar dataKey="LOW" stackId="a" fill="#059669" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </>
    );
  };

  const renderSingleProjectMode = () => {
    if (singleLoading) return <LoadingState message="Loading project risk profile..." />;
    if (!projectData) return <ErrorState message="Project not found." />;

    const currentPrediction = projectPredictions?.[0] || {};
    const overallRisk = currentPrediction.overallRiskScore || 0;
    const rLevel = currentPrediction.riskLevel || 'LOW';

    // Category scores derived from stored model output and measured project data.
    // These were previously invented with fixed offsets around the overall score,
    // which made four of the five tiles on this page decorative.
    const costRisk = (Number(currentPrediction.costOverrunProbability) || 0) * 100;
    const scheduleRisk = (Number(currentPrediction.timeOverrunProbability) || 0) * 100;

    // Latest month's planned-vs-actual physical gap, saturating at 25 points.
    const latestMonth = projectMonthlyData[0];
    const progressGapPct = latestMonth
      ? Math.max(
          0,
          (Number(latestMonth.plannedPhysicalProgress) || 0) -
            (Number(latestMonth.actualPhysicalProgress) || 0)
        )
      : 0;
    const progressRisk = Math.min(100, (progressGapPct / 25) * 100);

    // Share of milestones the rules engine has flagged as delayed.
    const milestoneRisk = projectMilestones.length
      ? (projectMilestones.filter(m => m.status === 'DELAYED').length / projectMilestones.length) * 100
      : 0;

    const costGrowthPct = (((projectData.revisedCost - projectData.approvedCost) / projectData.approvedCost) * 100) || 0;
    const scheduleVarianceMonths = Math.round((new Date(projectData.revisedCompletionDate) - new Date(projectData.originalCompletionDate)) / (1000 * 60 * 60 * 24 * 30)) || 0;

    const completedMilestones = projectMilestones.filter(m => m.status === 'COMPLETED').length;
    const delayedMilestones = projectMilestones.filter(m => m.status === 'DELAYED').length;
    const pendingMilestones = projectMilestones.filter(m => m.status === 'PENDING' || m.status === 'IN_PROGRESS').length;

    const trendData = projectMonthlyData.map(d => ({
      month: new Date(d.reportingMonth).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      planned: d.plannedPhysicalProgress,
      actual: d.actualPhysicalProgress
    }));

    return (
      <div className="space-y-6">
        {/* Project Header Info */}
        <div className="bg-white border border-slate-200 p-6 rounded shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-xs font-semibold text-slate-500 mb-1">{projectData.projectCode} • {projectData.state}</div>
              <h2 className="text-xl font-bold text-slate-900">{projectData.projectName}</h2>
            </div>
            <RiskBadge level={rLevel} />
          </div>
          <div className="flex flex-wrap gap-4 text-sm mt-4">
            <span className="flex items-center gap-1.5 text-slate-600"><IndianRupee className="w-4 h-4"/> ₹{projectData.revisedCost} Cr</span>
            <span className="flex items-center gap-1.5 text-slate-600"><Calendar className="w-4 h-4"/> Completion: {new Date(projectData.revisedCompletionDate).toLocaleDateString('en-IN')}</span>
            <span className="flex items-center gap-1.5 text-slate-600"><Activity className="w-4 h-4"/> Status: {projectData.status}</span>
          </div>
          <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-slate-100">
             <button onClick={() => navigate(`/projects/${projectData.id}`)} className="text-xs font-semibold px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded flex items-center gap-1"><ExternalLink className="w-3 h-3"/> View Project Details</button>
             <button onClick={() => navigate(`/early-warnings?projectId=${projectData.id}`)} className="text-xs font-semibold px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> View Early Warnings</button>
          </div>
        </div>

        {/* Risk Scores */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className={`p-4 rounded border ${rLevel === 'CRITICAL' ? 'bg-red-50 border-red-200' : rLevel === 'HIGH' ? 'bg-orange-50 border-orange-200' : rLevel === 'MEDIUM' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <div className="text-xs font-bold text-slate-600 uppercase mb-1">Overall Risk</div>
            <div className={`text-2xl font-black ${rLevel === 'CRITICAL' ? 'text-red-700' : rLevel === 'HIGH' ? 'text-orange-700' : rLevel === 'MEDIUM' ? 'text-amber-700' : 'text-emerald-700'}`}>{overallRisk.toFixed(1)} <span className="text-sm font-semibold opacity-60">/ 100</span></div>
          </div>
          {[
            { label: 'Cost Risk', val: costRisk, src: 'model cost-overrun probability' },
            { label: 'Schedule Risk', val: scheduleRisk, src: 'model schedule-overrun probability' },
            { label: 'Progress Risk', val: progressRisk, src: `latest plan-vs-actual gap ${progressGapPct.toFixed(1)} pts` },
            { label: 'Milestone Risk', val: milestoneRisk, src: 'delayed milestones / total' }
          ].map((r, i) => (
             <div key={i} className="bg-white p-4 rounded border border-slate-200 shadow-sm text-center flex flex-col justify-center">
              <div className="text-xs font-bold text-slate-500 uppercase mb-1">{r.label}</div>
              <div className="text-xl font-bold text-slate-800">{r.val.toFixed(0)} <span className="text-xs text-slate-400">/ 100</span></div>
              <div className="text-[10px] text-slate-400 mt-1 leading-tight">{r.src}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Analysis Blocks */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 p-5 rounded shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-brand-600"/> Project Performance</h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <div className="text-slate-500 text-xs font-semibold mb-0.5">Approved Cost</div>
                  <div className="font-semibold text-slate-800">₹{projectData.approvedCost} Cr</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs font-semibold mb-0.5">Revised Cost</div>
                  <div className="font-semibold text-slate-800">₹{projectData.revisedCost} Cr</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs font-semibold mb-0.5">Cost Growth %</div>
                  <div className={`font-semibold ${costGrowthPct > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{costGrowthPct.toFixed(2)}%</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs font-semibold mb-0.5">Schedule Variance</div>
                  <div className={`font-semibold ${scheduleVarianceMonths > 0 ? 'text-red-600' : 'text-slate-800'}`}>{scheduleVarianceMonths > 0 ? `+${scheduleVarianceMonths} months` : 'On track'}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs font-semibold mb-0.5">Physical Progress</div>
                  <div className="font-semibold text-slate-800">{projectData.physicalProgress}%</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs font-semibold mb-0.5">Financial Progress</div>
                  <div className="font-semibold text-slate-800">{projectData.financialProgress}%</div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Top Risk Factors (SHAP)</h3>
              {projectRiskFactors.length === 0 ? (
                <p className="text-sm text-slate-500">No risk factors recorded for this project.</p>
              ) : (
                <div className="space-y-3">
                  {projectRiskFactors.map(rf => (
                    <div key={rf.id} className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {rf.direction === 'INCREASE_RISK' ? <TrendingUp className="w-4 h-4 text-red-500"/> : <TrendingUp className="w-4 h-4 text-emerald-500 transform rotate-180"/>}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{rf.factorName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{rf.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Chart */}
            <div className="bg-white border border-slate-200 p-5 rounded shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Physical Progress Trend</h3>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                    <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]}/>
                    <RechartsTooltip contentStyle={TOOLTIP_STYLE}/>
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }}/>
                    <Line type="monotone" dataKey="planned" name="Planned %" stroke="#cbd5e1" strokeWidth={2} dot={false} strokeDasharray="4 4"/>
                    <Line type="monotone" dataKey="actual" name="Actual %" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }}/>
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] bg-slate-50 rounded border border-slate-100 text-sm text-slate-500">
                  Historical risk trend is not available for this project.
                </div>
              )}
            </div>

            {/* Recommendations */}
            <div className="bg-white border border-slate-200 p-5 rounded shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-amber-500"/> AI Recommendations</h3>
              {projectRecommendations.length === 0 ? (
                <p className="text-sm text-slate-500">No active recommendations for this project.</p>
              ) : (
                <div className="space-y-4">
                  {projectRecommendations.slice(0,3).map(rec => (
                    <div key={rec.id} className="bg-slate-50 rounded p-3 text-sm border border-slate-100">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${rec.priority === 'URGENT' ? 'bg-red-100 text-red-700' : rec.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                          {rec.priority}
                        </span>
                        <span className="font-semibold text-slate-800">{rec.riskFactor}</span>
                      </div>
                      <p className="text-slate-700 mt-1">{rec.recommendation}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="mb-6">
        <div className="text-xs font-semibold text-slate-500 mb-1 tracking-wide uppercase">Home / Analytics / Risk Analytics</div>
        <h1 className="text-2xl font-bold text-brand-900 flex items-center gap-3">
          <Activity className="w-6 h-6 text-brand-600" />
          Risk Analytics
        </h1>
        <p className="text-slate-600 text-sm mt-1">Portfolio and project-level risk intelligence for infrastructure projects.</p>
      </div>

      {/* PROJECT SELECTION */}
      <div className="bg-white border border-slate-200 p-5 rounded shadow-sm mb-6">
        <label htmlFor="project-select" className="block text-sm font-bold text-slate-800 mb-2">Select Project</label>
        <select 
          id="project-select"
          value={selectedProjectId} 
          onChange={handleProjectSelect}
          className="w-full lg:w-2/3 bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded px-3 py-2 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        >
          <option value="all">-- All Projects (Portfolio Mode) --</option>
          {allProjects.map(p => (
            <option key={p.id} value={p.id}>
              {p.projectCode} — {p.projectName}
            </option>
          ))}
        </select>
      </div>

      {selectedProjectId === 'all' ? renderPortfolioMode() : renderSingleProjectMode()}
    </>
  );
}
