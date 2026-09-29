import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { projectService, predictionService, alertService, recommendationService } from '../services/api';
import { LoadingState, ErrorState, RiskBadge, StatusBadge, ProgressBar, Card } from '../components/ui/Shared';
import {
  ArrowLeft, CalendarDays, IndianRupee, Activity, MapPin,
  CheckCircle2, Clock, AlertTriangle, Lightbulb, TrendingUp,
  Building2, ChevronRight, Download
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, Legend, BarChart, Bar,
} from 'recharts';

const TOOLTIP_STYLE = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 4,
  color: '#0f172a',
  fontSize: 12,
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
};

function SectionHeader({ icon: Icon, title, color = 'text-brand-700' }) {
  return (
    <div className={`flex items-center gap-2 mb-4 border-b border-slate-100 pb-2 ${color}`}>
      <Icon className="w-4 h-4" />
      <h2 className="text-sm font-bold text-slate-800">{title}</h2>
    </div>
  );
}

function InfoRow({ label, value, mono = false }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
      <span className={`text-sm font-medium text-slate-800 ${mono ? 'font-mono font-bold' : ''}`}>{value ?? '—'}</span>
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

  if (loading) return <AppLayout><LoadingState message="Loading project profile..." /></AppLayout>;
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
          className="flex items-center gap-1.5 text-brand-600 hover:text-brand-800 font-semibold text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Project Directory
        </button>
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 bg-white border border-slate-200 rounded p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">{project.projectCode}</span>
              <StatusBadge status={project.status} />
              <RiskBadge level={riskLevel} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">{project.projectName}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm font-medium text-slate-600">
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" />{project.district}, {project.state}</span>
              <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-slate-400" />{project.ministryCode || project.ministry?.code}</span>
              <span className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-slate-400" />{project.sectorCode || project.sector?.code}</span>
            </div>
          </div>
          {/* Risk Score */}
          {pred && (
            <div className={`gov-card border-l-4 ${riskBorderMap[riskLevel]} p-5 min-w-[200px] text-center shrink-0`}>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Overall Risk Score</p>
              <p className="text-4xl font-bold text-slate-900 mb-2">{pred.overallRiskScore?.toFixed(1)}</p>
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
              { label: 'Physical Progress', value: project.physicalProgress, color: 'blue' },
              { label: 'Financial Progress', value: project.financialProgress, color: 'cyan' },
              { label: 'Cost Overrun Risk', value: pred ? `${(pred.costOverrunProbability * 100).toFixed(0)}%` : '—', color: 'orange', raw: true },
              { label: 'Delay Risk', value: pred ? `${(pred.timeOverrunProbability * 100).toFixed(0)}%` : '—', color: 'red', raw: true },
            ].map(({ label, value, color, raw }) => (
              <div key={label} className="gov-card p-4 text-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{label}</p>
                <p className="text-2xl font-bold text-slate-900 mb-2">{raw ? value : `${value?.toFixed(1) || 0}%`}</p>
                {!raw && <ProgressBar value={value || 0} color={color} />}
              </div>
            ))}
          </div>

          {/* Monthly Progress Chart */}
          {monthlyData.length > 0 && (
            <div className="gov-card p-6">
              <SectionHeader icon={Activity} title="Monthly Progress — Planned vs Actual" color="text-brand-600" />
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="reportingMonth" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} domain={[0, 100]} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, n) => [`${v?.toFixed(1)}%`, n]} />
                  <Legend formatter={(v) => <span className="text-xs font-semibold text-slate-700">{v}</span>} verticalAlign="top" height={36} />
                  <Line type="monotone" dataKey="plannedPhysicalProgress" name="Planned %" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} dot={{ r: 3, fill: '#94a3b8' }} />
                  <Line type="monotone" dataKey="actualPhysicalProgress" name="Actual %" stroke="#2563eb" strokeWidth={2} dot={{ r: 4, fill: '#2563eb' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Expenditure Chart */}
          {monthlyData.length > 0 && (
            <div className="gov-card p-6">
              <SectionHeader icon={IndianRupee} title="Monthly Expenditure Trend" color="text-brand-600" />
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="reportingMonth" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { month: 'short' })} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="monthlyExpenditure" name="Expenditure (Cr)" stroke="#0ea5e9" fill="url(#expGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Milestones */}
          {milestones.length > 0 && (
            <div className="gov-card p-6">
              <SectionHeader icon={CheckCircle2} title="Milestone Status" color="text-brand-600" />
              <div className="space-y-1">
                {milestones.map((m) => {
                  const statusColor = m.status === 'COMPLETED' ? 'text-emerald-600 bg-emerald-50' :
                    m.status === 'DELAYED' ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50';
                  const dotColor = m.status === 'COMPLETED' ? 'bg-emerald-500' :
                    m.status === 'DELAYED' ? 'bg-red-500' : 'bg-amber-500';
                  return (
                    <div key={m.id} className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{m.milestoneName}</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Planned: {m.plannedDate} {m.delayDays > 0 && <span className="text-red-600">· Delay: {m.delayDays}d</span>}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${statusColor}`}>{m.status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Alerts */}
          {projAlerts.length > 0 && (
            <div className="gov-card p-6">
              <SectionHeader icon={AlertTriangle} title="Active Early Warnings" color="text-red-600" />
              <div className="space-y-3">
                {projAlerts.map((a) => (
                  <div key={a.id} className="flex gap-3 p-4 rounded bg-red-50 border border-red-200">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-red-800">{a.title}</p>
                      <p className="text-xs font-medium text-red-600 mt-1">{a.description}</p>
                      {a.suggestedAction && (
                        <div className="mt-2 pt-2 border-t border-red-200/60">
                          <p className="text-xs font-bold text-red-700 flex items-center gap-1">
                            <ChevronRight className="w-3.5 h-3.5" /> Suggested Action: <span className="font-medium">{a.suggestedAction}</span>
                          </p>
                        </div>
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
          <div className="gov-card p-6 bg-slate-50/50">
            <SectionHeader icon={Building2} title="Project Profile" />
            <InfoRow label="Executing Agency" value={project.agencyCode || project.agency?.code} />
            <InfoRow label="Approval Date" value={project.approvalDate} />
            <InfoRow label="Original Start" value={project.originalStartDate} />
            <InfoRow label="Original Target" value={project.originalCompletionDate} />
            <InfoRow label="Revised Target" value={project.revisedCompletionDate} />
          </div>

          {/* Cost Summary */}
          <div className="gov-card p-6">
            <SectionHeader icon={IndianRupee} title="Financial Overview" />
            <InfoRow label="Approved Cost" value={`₹${project.approvedCost?.toLocaleString('en-IN')} Cr`} mono />
            <InfoRow label="Revised Cost" value={`₹${project.revisedCost?.toLocaleString('en-IN')} Cr`} mono />
            <InfoRow label="Cumulative Expenditure" value={`₹${project.currentExpenditure?.toLocaleString('en-IN')} Cr`} mono />
            {project.approvedCost > 0 && (
              <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded text-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Cost Escalation</p>
                <p className={`text-xl font-bold ${((project.revisedCost - project.approvedCost) / project.approvedCost * 100) > 10 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {(((project.revisedCost - project.approvedCost) / project.approvedCost) * 100).toFixed(1)}%
                </p>
              </div>
            )}
          </div>

          {/* AI Predictions */}
          {pred && (
            <div className="gov-card p-6">
              <SectionHeader icon={TrendingUp} title="AI Risk Prediction" color="text-brand-600" />
              <InfoRow label="Cost Escalation Prob." value={`${(pred.costOverrunProbability * 100).toFixed(1)}%`} mono />
              <InfoRow label="Predicted Escalation" value={`${pred.predictedCostOverrunPct?.toFixed(1)}%`} mono />
              <InfoRow label="Schedule Delay Prob." value={`${(pred.timeOverrunProbability * 100).toFixed(1)}%`} mono />
              <InfoRow label="Predicted Delay" value={`${pred.predictedDelayMonths?.toFixed(0)} months`} mono />
              <InfoRow label="AI Model Version" value={pred.modelVersion?.version || 'v2.0.0'} />
            </div>
          )}

          {/* SHAP Risk Factors */}
          {riskFactors.length > 0 && (
            <div className="gov-card p-6">
              <SectionHeader icon={Activity} title="Key Risk Indicators" color="text-orange-600" />
              <div className="space-y-4">
                {riskFactors.map((rf) => (
                  <div key={rf.id}>
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="text-xs font-bold text-slate-700 truncate pr-2">{rf.factorName}</span>
                      <span className={`text-xs font-bold font-mono shrink-0 ${rf.direction === 'INCREASE_RISK' ? 'text-red-600' : 'text-emerald-600'}`}>
                        {rf.direction === 'INCREASE_RISK' ? '+' : '-'}{(rf.impactValue * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-sm h-2">
                      <div
                        className={`h-full rounded-sm ${rf.direction === 'INCREASE_RISK' ? 'bg-red-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(100, rf.impactValue * 250)}%` }}
                      />
                    </div>
                    {rf.description && <p className="text-[10px] font-medium text-slate-500 mt-1">{rf.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="gov-card p-6">
              <SectionHeader icon={Lightbulb} title="Suggested Interventions" color="text-emerald-600" />
              <div className="space-y-3">
                {recommendations.map((r) => (
                  <div key={r.id} className="p-3 bg-white border border-slate-200 rounded shadow-sm">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${r.priorityLevel === 'URGENT' ? 'bg-red-100 text-red-700' : r.priorityLevel === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'}`}>
                        {r.priorityLevel}
                      </span>
                      <span className="text-xs font-bold text-slate-600">{r.recommendationType}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-700 leading-relaxed">{r.description}</p>
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
