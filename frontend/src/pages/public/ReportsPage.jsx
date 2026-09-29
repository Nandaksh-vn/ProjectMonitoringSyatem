import React, { useEffect, useState } from 'react';
import { publicService } from '../../services/api';
import { LoadingState, ErrorState, RiskBadge } from '../../components/ui/Shared';
import { FileText, ShieldAlert, Building2, IndianRupee, TrendingUp, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const RISK_COLOURS = {
  CRITICAL: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-amber-400',
  LOW: 'bg-emerald-500',
};

function rupees(value) {
  const n = Number(value ?? 0);
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr`;
}

function pct(value) {
  return `${Number(value ?? 0).toFixed(2)}%`;
}

export default function ReportsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    publicService
      .getReport()
      .then((res) => setReport(res.data))
      .catch(() => setError('The monitoring report could not be generated.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <LoadingState message="Generating report..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const financials = report.financials ?? {};
  const distribution = report.riskDistribution ?? {};
  const totalScored = Object.values(distribution).reduce((a, b) => a + Number(b ?? 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <header>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold text-brand-600 uppercase tracking-widest">Reports</p>
            <h1 className="text-3xl font-bold text-slate-900 mt-2">Monitoring Summary</h1>
            <p className="text-slate-600 mt-2 text-sm">
              Aggregated from {report.totalProjects} projects, of which {report.scoredProjects} carry a model
              prediction. Generated{' '}
              {report.generatedAt ? new Date(report.generatedAt).toLocaleString('en-IN') : '—'}.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded border border-slate-300 text-slate-700 hover:bg-white"
          >
            <FileText className="w-4 h-4" /> Regenerate
          </button>
        </div>
      </header>

      {report.disclaimer && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900 leading-relaxed">{report.disclaimer}</p>
        </div>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Projects monitored" value={report.totalProjects} />
        <StatCard icon={ShieldAlert} label="Projects scored" value={report.scoredProjects} />
        <StatCard icon={IndianRupee} label="Total sanctioned cost" value={rupees(financials.totalApprovedCost)} />
        <StatCard
          icon={TrendingUp}
          label="Cost escalation to date"
          value={pct(financials.costEscalationPercent)}
          tone={(financials.costEscalationPercent ?? 0) > 10 ? 'warn' : 'default'}
        />
      </section>

      <section>
        <h2 className="text-lg font-bold text-slate-900 mb-3">Latest risk distribution</h2>
        {totalScored === 0 ? (
          <p className="text-sm text-slate-600 bg-white border border-slate-200 rounded-lg p-4">
            No predictions have been generated yet. An analyst or monitor can run a prediction sync from the
            dashboard.
          </p>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="flex h-8 rounded overflow-hidden">
              {Object.entries(distribution).map(([level, count]) =>
                Number(count) > 0 ? (
                  <div
                    key={level}
                    className={RISK_COLOURS[level] ?? 'bg-slate-400'}
                    style={{ width: `${(Number(count) / totalScored) * 100}%` }}
                    title={`${level}: ${count}`}
                  />
                ) : null
              )}
            </div>
            <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(distribution).map(([level, count]) => (
                <div key={level} className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded ${RISK_COLOURS[level] ?? 'bg-slate-400'}`} />
                  <dt className="text-sm text-slate-600">{level}</dt>
                  <dd className="text-sm font-bold text-slate-800 ml-auto tabular-nums">{count}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold text-slate-900 mb-3">Sector breakdown</h2>
        <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <Th>Sector</Th>
                <Th className="text-right">Projects</Th>
                <Th className="text-right">Sanctioned</Th>
                <Th className="text-right">Revised</Th>
                <Th className="text-right">Escalation</Th>
                <Th className="text-right">Fund used</Th>
                <Th className="text-right">Avg physical</Th>
                <Th className="text-right">Avg risk</Th>
              </tr>
            </thead>
            <tbody>
              {(report.sectors ?? []).map((s) => (
                <tr key={s.name} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-semibold text-slate-800">{s.name}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{s.projectCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{rupees(s.approvedCost)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{rupees(s.revisedCost)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{pct(s.costEscalationPercent)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{pct(s.fundUtilisationPercent)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{pct(s.averagePhysicalProgress)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-800">
                    {s.scoredCount ? Number(s.averageRiskScore).toFixed(2) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-slate-900 mb-3">Highest-risk projects</h2>
        {(report.topAtRiskProjects ?? []).length === 0 ? (
          <p className="text-sm text-slate-600 bg-white border border-slate-200 rounded-lg p-4">
            No project has been scored yet.
          </p>
        ) : (
          <div className="space-y-2">
            {report.topAtRiskProjects.map((p) => (
              <Link
                key={p.projectId}
                to={`/projects/${p.projectId}`}
                className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 rounded-lg px-4 py-3 hover:border-brand-300 hover:bg-brand-50/30 transition-colors"
              >
                <span className="font-mono text-xs text-slate-500 shrink-0">{p.projectCode}</span>
                <span className="font-semibold text-slate-800 flex-1 min-w-[200px]">{p.projectName}</span>
                <span className="text-xs text-slate-500">{p.sector}</span>
                <span className="text-sm tabular-nums text-slate-700 w-24 text-right">
                  risk {Number(p.overallRiskScore).toFixed(1)}
                </span>
                <RiskBadge level={p.riskLevel} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone = 'default' }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <div className="flex items-center gap-2 text-slate-500 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p
        className={`text-xl font-bold tabular-nums ${
          tone === 'warn' ? 'text-amber-600' : 'text-slate-900'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Th({ children, className = '' }) {
  return (
    <th className={`px-4 py-3 font-bold text-slate-600 uppercase text-xs tracking-wide whitespace-nowrap ${className}`}>
      {children}
    </th>
  );
}
