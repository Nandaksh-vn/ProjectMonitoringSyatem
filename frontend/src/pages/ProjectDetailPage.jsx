import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { projectService, predictionService, alertService, recommendationService } from '../services/api';
import { LoadingState, ErrorState, RiskBadge, StatusBadge, ProgressBar, Card } from '../components/ui/Shared';
import {
  ArrowLeft, CalendarDays, IndianRupee, Activity, MapPin,
  CheckCircle2, Clock, AlertTriangle, Lightbulb, TrendingUp,
  Building2, ChevronRight,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, Legend, BarChart, Bar,
} from 'recharts';

const TOOLTIP_STYLE = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 8,
  color: '#f1f5f9',
  fontSize: 12,
};

function SectionHeader({ icon: Icon, title, color = 'text-cyan-400' }) {
  return (
    <div className={`flex items-center gap-2 mb-4 ${color}`}>
      <Icon className="w-4 h-4" />
      <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
    </div>
  );
}

function InfoRow({ label, value, mono = false }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-800/60 last:border-0">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`text-xs font-medium text-slate-200 ${mono ? 'font-mono' : ''}`}>{value ?? '—'}</span>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [riskFactors, setRiskFactors] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [projAlerts, setProjAlerts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      projectService.getById(id),
      projectService.getMonthlyData(id),
      projectService.getMilestones(id),
      predictionService.getByProject(id),
      alertService.getByProject(id),
      recommendationService.getByProject(id),
    ])
      .then(([pRes, mRes, msRes, predRes, aRes, rRes]) => {
        setProject(pRes.data);
        setMonthlyData((mRes.data || []).sort((a, b) => new Date(a.reportingMonth) - new Date(b.reportingMonth)));
        setMilestones(msRes.data || []);
        const preds = predRes.data || [];
        setPredictions(preds);
        if (preds.length > 0) {
          predictionService.getRiskFactors(preds[0].id)
            .then(r => setRiskFactors(r.data || []))
            .catch(() => {});
        }
        setProjAlerts(aRes.data || []);
        setRecommendations(rRes.data || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <AppLayout><LoadingState message="Loading project details..." /></AppLayout>;
  if (error) return <AppLayout><ErrorState message={error} /></AppLayout>;
  if (!project) return <AppLayout><ErrorState message="Project not found" /></AppLayout>;

  const pred = predictions[0];
  const riskLevel = pred?.riskLevel || project.riskLevel || 'LOW';
  const riskBorderMap = { CRITICAL: 'border-l-red-500', HIGH: 'border-l-orange-500', MEDIUM: 'border-l-amber-500', LOW: 'border-l-emerald-500' };

  return (
    <AppLayout>
      {/* Back button + header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </button>
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">{project.projectCode}</span>
              <StatusBadge status={project.status} />
              <RiskBadge level={riskLevel} />
            </div>
            <h1 className="text-xl font-bold text-slate-100">{project.projectName}</h1>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{project.district}, {project.state}</span>
              <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{project.ministryCode || project.ministry?.code}</span>
              <span className="flex items-center gap-1"><Activity className="w-3 h-3" />{project.sectorCode || project.sector?.code}</span>
            </div>
          </div>
          {/* Risk Score */}
          {pred && (
            <div className={`bg-slate-900/70 border-l-4 ${riskBorderMap[riskLevel]} border border-slate-800 rounded-xl p-5 min-w-48 text-center`}>
              <p className="text-xs text-slate-400 mb-1">Overall Risk Score</p>
              <p className="text-4xl font-bold text-slate-100">{pred.overallRiskScore?.toFixed(1)}</p>
              <RiskBadge level={riskLevel} />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="xl:col-span-2 space-y-6">

          {/* Progress cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Physical Progress', value: project.physicalProgress, color: 'cyan' },
              { label: 'Financial Progress', value: project.financialProgress, color: 'blue' },
              { label: 'Cost Overrun Risk', value: pred ? `${(pred.costOverrunProbability * 100).toFixed(0)}%` : '—', color: 'amber', raw: true },
              { label: 'Delay Risk', value: pred ? `${(pred.timeOverrunProbability * 100).toFixed(0)}%` : '—', color: 'red', raw: true },
            ].map(({ label, value, color, raw }) => (
              <div key={label} className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-2">{label}</p>
                <p className="text-xl font-bold text-slate-100">{raw ? value : `${value?.toFixed(1) || 0}%`}</p>
                {!raw && <ProgressBar value={value || 0} color={color} />}
              </div>
            ))}
          </div>

          {/* Monthly Progress Chart */}
          {monthlyData.length > 0 && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
              <SectionHeader icon={Activity} title="Monthly Progress — Planned vs Actual" />
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="reportingMonth" tick={{ fill: '#94a3b8', fontSize: 10 }}
                    tickFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, n) => [`${v?.toFixed(1)}%`, n]} />
                  <Legend formatter={(v) => <span className="text-xs text-slate-300">{v}</span>} />
                  <Line type="monotone" dataKey="plannedPhysicalProgress" name="Planned %" stroke="#818cf8" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="actualPhysicalProgress" name="Actual %" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Expenditure Chart */}
          {monthlyData.length > 0 && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
              <SectionHeader icon={IndianRupee} title="Monthly Expenditure Trend" />
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="reportingMonth" tick={{ fill: '#94a3b8', fontSize: 10 }}
                    tickFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { month: 'short' })} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="monthlyExpenditure" name="Expenditure (Cr)" stroke="#06b6d4" fill="url(#expGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Milestones */}
          {milestones.length > 0 && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
              <SectionHeader icon={CheckCircle2} title="Milestone Status" />
              <div className="space-y-2">
                {milestones.map((m) => {
                  const statusColor = m.status === 'COMPLETED' ? 'text-emerald-400' :
                    m.status === 'DELAYED' ? 'text-red-400' : 'text-amber-400';
                  return (
                    <div key={m.id} className="flex items-center gap-3 py-2.5 border-b border-slate-800/50 last:border-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${m.status === 'COMPLETED' ? 'bg-emerald-400' : m.status === 'DELAYED' ? 'bg-red-400' : 'bg-amber-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200 truncate">{m.milestoneName}</p>
                        <p className="text-xs text-slate-500">Planned: {m.plannedDate} {m.delayDays > 0 && `· Delay: ${m.delayDays}d`}</p>
                      </div>
                      <span className={`text-xs font-medium ${statusColor}`}>{m.status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Alerts */}
          {projAlerts.length > 0 && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
              <SectionHeader icon={AlertTriangle} title="Active Alerts" color="text-red-400" />
              <div className="space-y-3">
                {projAlerts.map((a) => (
                  <div key={a.id} className="flex gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-300">{a.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{a.description}</p>
                      {a.suggestedAction && (
                        <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                          <ChevronRight className="w-3 h-3" /> {a.suggestedAction}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Project Info */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
            <SectionHeader icon={Building2} title="Project Information" />
            <InfoRow label="Agency" value={project.agencyCode || project.agency?.code} />
            <InfoRow label="Approval Date" value={project.approvalDate} />
            <InfoRow label="Original Start" value={project.originalStartDate} />
            <InfoRow label="Original Completion" value={project.originalCompletionDate} />
            <InfoRow label="Revised Completion" value={project.revisedCompletionDate} />
          </div>

          {/* Cost Summary */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
            <SectionHeader icon={IndianRupee} title="Cost Summary" />
            <InfoRow label="Approved Cost" value={`₹${project.approvedCost?.toLocaleString('en-IN')} Cr`} mono />
            <InfoRow label="Revised Cost" value={`₹${project.revisedCost?.toLocaleString('en-IN')} Cr`} mono />
            <InfoRow label="Current Expenditure" value={`₹${project.currentExpenditure?.toLocaleString('en-IN')} Cr`} mono />
            {project.approvedCost > 0 && (
              <div className="mt-3">
                <p className="text-xs text-slate-400 mb-1">Cost Overrun</p>
                <p className={`text-lg font-bold ${((project.revisedCost - project.approvedCost) / project.approvedCost * 100) > 10 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {(((project.revisedCost - project.approvedCost) / project.approvedCost) * 100).toFixed(1)}%
                </p>
              </div>
            )}
          </div>

          {/* AI Predictions */}
          {pred && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
              <SectionHeader icon={TrendingUp} title="AI Predictions" color="text-violet-400" />
              <InfoRow label="Cost Overrun Probability" value={`${(pred.costOverrunProbability * 100).toFixed(1)}%`} mono />
              <InfoRow label="Predicted Cost Overrun" value={`${pred.predictedCostOverrunPct?.toFixed(1)}%`} mono />
              <InfoRow label="Delay Probability" value={`${(pred.timeOverrunProbability * 100).toFixed(1)}%`} mono />
              <InfoRow label="Predicted Delay" value={`${pred.predictedDelayMonths?.toFixed(0)} months`} mono />
              <InfoRow label="Model Version" value={pred.modelVersion?.version || 'v2.0.0'} />
            </div>
          )}

          {/* SHAP Risk Factors */}
          {riskFactors.length > 0 && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
              <SectionHeader icon={Activity} title="Risk Factor Analysis (SHAP)" color="text-amber-400" />
              <div className="space-y-3">
                {riskFactors.map((rf) => (
                  <div key={rf.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 truncate">{rf.factorName}</span>
                      <span className={`font-mono ml-2 shrink-0 ${rf.direction === 'INCREASE_RISK' ? 'text-red-400' : 'text-emerald-400'}`}>
                        {rf.direction === 'INCREASE_RISK' ? '+' : '-'}{(rf.impactValue * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div
                        className={`h-full rounded-full ${rf.direction === 'INCREASE_RISK' ? 'bg-red-400' : 'bg-emerald-400'}`}
                        style={{ width: `${Math.min(100, rf.impactValue * 250)}%` }}
                      />
                    </div>
                    {rf.description && <p className="text-[10px] text-slate-500 mt-1">{rf.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
              <SectionHeader icon={Lightbulb} title="Suggested Actions" color="text-emerald-400" />
              <div className="space-y-3">
                {recommendations.map((r) => (
                  <div key={r.id} className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${r.priorityLevel === 'URGENT' ? 'bg-red-500/20 text-red-400' : r.priorityLevel === 'HIGH' ? 'bg-orange-500/20 text-orange-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {r.priorityLevel}
                      </span>
                      <span className="text-xs text-slate-400">{r.recommendationType}</span>
                    </div>
                    <p className="text-xs text-slate-300">{r.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
