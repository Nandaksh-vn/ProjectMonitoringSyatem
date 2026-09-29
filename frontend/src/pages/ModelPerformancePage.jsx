import React, { useCallback, useEffect, useState } from 'react';
import { predictionService } from '../services/api';
import { LoadingState, ErrorState } from '../components/ui/Shared';
import { Cpu, AlertTriangle, BookOpen, BarChart2, Activity, Database, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const TARGET_TITLES = {
  cost_overrun_risk: {
    title: '1. Cost Overrun Prediction',
    task: 'Binary classification',
    dataset: 'Kaggle (real)',
  },
  time_overrun_risk: {
    title: '2. Schedule / Time Overrun Prediction',
    task: 'Binary classification',
    dataset: 'Synthetic (seeded)',
  },
  overall_risk_score: {
    title: '3. Overall Risk Score',
    task: 'Regression',
    dataset: 'Synthetic (seeded)',
  },
};

const METRIC_ORDER = ['ROC-AUC', 'Accuracy', 'Precision', 'Recall', 'F1', 'RMSE', 'MAE', 'R2'];

/** Metrics arrive from the ML service as a dict with title-cased keys. */
function metricEntries(metrics = {}) {
  return Object.entries(metrics).sort(
    (a, b) => {
      const ai = METRIC_ORDER.indexOf(a[0]);
      const bi = METRIC_ORDER.indexOf(b[0]);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    }
  );
}

function formatMetric(key, value) {
  if (typeof value !== 'number') return String(value ?? '—');
  // Error metrics in rupees-crore; scores and probabilities in 0..1.
  if (['MAE', 'RMSE'].includes(key)) return value.toFixed(3);
  return value.toFixed(4);
}

function MetricsTable({ title, subtitle, experiments, selected, selectedModel }) {
  const columns = useMemoColumns(experiments, selected);
  const best = bestByMetric(experiments);

  return (
    <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-brand-600" /> {title}
          </h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {selectedModel && (
          <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            Deployed: {selectedModel}
          </span>
        )}
      </div>

      <div className="p-5 flex-1">
        {experiments.length === 0 ? (
          <div className="flex items-start gap-2 text-sm text-slate-600 bg-amber-50 border border-amber-200 rounded p-4">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <span>No experiment results were reported for this target.</span>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {columns.map((c) => (
                    <th
                      key={c}
                      className="px-4 py-3 font-bold text-slate-600 uppercase text-xs tracking-wide whitespace-nowrap"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {experiments.map((row, idx) => {
                  const isSelected = selected && row.model === selectedModel;
                  return (
                    <tr
                      key={`${row.experiment}-${row.model}-${idx}`}
                      className={`border-b border-slate-100 last:border-0 ${
                        isSelected ? 'bg-emerald-50/60' : ''
                      }`}
                    >
                      <td className="px-4 py-2.5 font-semibold text-slate-700 whitespace-nowrap">
                        {row.model}
                        {isSelected && <span className="ml-2 text-[10px] font-bold text-emerald-700">SELECTED</span>}
                      </td>
                      {columns.slice(1).map((col) => {
                        const isMetric = col !== 'Experiment' && col !== 'Dataset';
                        const isBest = isMetric && best[col] === row.metrics[col];
                        return (
                          <td
                            key={col}
                            className={`px-4 py-2.5 tabular-nums whitespace-nowrap ${
                              isBest ? 'font-bold text-emerald-700' : 'text-slate-600'
                            }`}
                          >
                            {isMetric
                              ? formatMetric(col, row.metrics[col])
                              : row[col === 'Experiment' ? 'experiment' : 'dataset']}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function useMemoColumns(experiments, selected) {
  if (!experiments || experiments.length === 0) return ['Model'];
  const keys = new Set();
  experiments.forEach((e) => Object.keys(e.metrics || {}).forEach((k) => keys.add(k)));
  return ['Model', 'Experiment', 'Dataset', ...metricEntries(Object.fromEntries([...keys].map((k) => [k, 0]))).map(([k]) => k)];
}

/** The best value per metric; "best" is max for ROC-AUC/Accuracy/R2, min for errors. */
function bestByMetric(experiments) {
  const best = {};
  if (!experiments?.length) return best;
  metricEntries(experiments[0].metrics).forEach(([key]) => {
    const lowerIsBetter = ['MAE', 'RMSE'].includes(key);
    const values = experiments
      .map((e) => e.metrics?.[key])
      .filter((v) => typeof v === 'number');
    if (!values.length) return;
    best[key] = lowerIsBetter ? Math.min(...values) : Math.max(...values);
  });
  return best;
}

function FeatureImportance({ targets }) {
  const blocks = Object.entries(targets || {}).filter(([, meta]) => meta.global_feature_importance?.length);
  const [active, setActive] = useState(blocks[0]?.[0] ?? null);

  useEffect(() => {
    if (!blocks.some(([key]) => key === active)) setActive(blocks[0]?.[0] ?? null);
  }, [blocks, active]);

  if (!blocks.length) {
    return (
      <div className="bg-white rounded border border-slate-200 shadow-sm">
        <SectionHeader icon={Activity} title="4. Feature Importance" />
        <div className="p-5">
          <p className="text-sm text-slate-600 bg-blue-50 border border-blue-100 p-4 rounded">
            Global feature importance was not returned by the model registry.
          </p>
        </div>
      </div>
    );
  }

  const importance = targets[active].global_feature_importance;
  const max = Math.max(...importance.map((f) => Math.abs(f.mean_abs_shap ?? 0)), 1e-9);

  return (
    <div className="bg-white rounded border border-slate-200 shadow-sm">
      <SectionHeader icon={Activity} title="4. Feature Importance (mean |SHAP|)" />
      <div className="p-5">
        <div className="flex flex-wrap gap-2 mb-4">
          {blocks.map(([key]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActive(key)}
              className={`text-xs font-semibold px-3 py-1.5 rounded border transition ${
                key === active
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {TARGET_TITLES[key]?.title.replace(/^\d+\.\s*/, '') ?? key}
            </button>
          ))}
        </div>

        <ul className="space-y-3">
          {importance.map((f) => (
            <li key={f.feature}>
              <div className="flex justify-between items-baseline gap-3 mb-1">
                <span className="font-mono text-xs text-slate-700 truncate" title={f.description}>
                  {f.feature}
                </span>
                <span className="tabular-nums text-xs text-slate-500 shrink-0">
                  {(f.mean_abs_shap ?? 0).toFixed(3)}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded"
                  style={{ width: `${Math.max((Math.abs(f.mean_abs_shap ?? 0) / max) * 100, 1)}%` }}
                />
              </div>
              {f.description && <p className="text-[11px] text-slate-500 mt-1">{f.description}</p>}
            </li>
          ))}
        </ul>
        <p className="text-xs text-slate-500 mt-4">
          Averaged absolute SHAP contributions over the evaluation set. A longer bar means that feature moves the
          model's output further, on average.
        </p>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
      <Icon className="w-5 h-5 text-brand-600" />
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
    </div>
  );
}

export default function ModelPerformancePage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    predictionService
      .getModelPerformance()
      .then((res) => setMetrics(res.data))
      .catch(() => setError('Model performance is unavailable because the ML service did not respond.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  if (loading) return <LoadingState message="Loading model metrics..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const targets = metrics?.targets ?? {};
  const experiments = metrics?.experiments ?? {};
  const syntheticTargets = Object.entries(targets).filter(
    ([, meta]) => String(meta.dataset ?? '').toLowerCase().includes('synthetic')
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold text-slate-500 mb-1 tracking-wide uppercase">
          <Link to="/dashboard" className="hover:text-brand-600">Home</Link> / ML / Model Performance
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-900 flex items-center gap-2">
              <Cpu className="w-6 h-6 text-brand-600" /> Model Performance
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Experiment comparison, held-out metrics and global feature importance for the deployed models.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 self-start"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
          Model set: {metrics?.model_set ?? 'v3_full'}
        </span>
        <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
          Version: {metrics?.model_version ?? '—'}
        </span>
        {metrics?.trained_at && (
          <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
            Trained: {new Date(metrics.trained_at).toISOString().slice(0, 10)}
          </span>
        )}
      </div>

      {syntheticTargets.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded p-4 flex items-start gap-3">
          <Database className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900">
            <p className="font-bold mb-1">Read these scores with care</p>
            <p>
              {syntheticTargets.map(([key]) => TARGET_TITLES[key]?.title ?? key).join(' and ')}{' '}
              {syntheticTargets.length === 1 ? 'is' : 'are'} trained against <strong>seeded synthetic labels</strong>,
              because the source cost dataset has no schedule or milestone dates to learn from. The reported
              metrics describe how well the model fits that generated data — they are <strong>not</strong>{' '}
              evidence of real-world accuracy, and only the cost model is trained on real observations.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {Object.entries(TARGET_TITLES).map(([key, meta]) => (
          <MetricsTable
            key={key}
            title={meta.title}
            subtitle={`${meta.task} · ${targets[key]?.dataset ?? meta.dataset} · n_train ${
              targets[key]?.n_train ?? '—'
            } / n_test ${targets[key]?.n_test ?? '—'}`}
            experiments={experiments[key] ?? []}
            selected={Boolean(targets[key])}
            selectedModel={targets[key]?.model}
          />
        ))}

        <FeatureImportance targets={targets} />
      </div>

      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <SectionHeader icon={BookOpen} title="5. Methodology" />
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-8 text-sm">
          <div>
            <h4 className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1">Datasets</h4>
            <p className="text-slate-600">
              Cost overrun: the public Kaggle <em>Project Overrun Prediction</em> dataset (real). Schedule and overall
              risk: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">data/raw/schedule_prediction.csv</code>,
              generated by a seeded script so the pipeline is reproducible.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1">Model selection</h4>
            <p className="text-slate-600">
              Logistic regression, decision tree, random forest, gradient boosting and XGBoost are each trained per
              target. The deployed model is the best on the primary metric for that task.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1">Validation</h4>
            <p className="text-slate-600">
              Stratified train/test split with cross-validation for hyperparameter search. Reported metrics are
              computed on the held-out test split only.
            </p>
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <h4 className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1">Features</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                'Cost escalation ratio',
                'Expenditure to budget ratio',
                'Physical progress gap',
                'Time elapsed ratio',
                'Milestone delay ratio',
                'Land acquisition flag',
                'Environmental clearance',
                'Tender status',
                'Project age',
                'Sector & state',
                'Revised cost ratio',
                'Financial progress',
              ].map((f) => (
                <span
                  key={f}
                  className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded text-xs font-semibold text-slate-700"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
