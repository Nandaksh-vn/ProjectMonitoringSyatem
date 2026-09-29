import React, { useEffect, useState } from 'react';
import { mlService } from '../services/api';
import { LoadingState } from '../components/ui/Shared';
import { Cpu, AlertTriangle, BookOpen, BarChart2, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ModelPerformancePage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mlService.getModelPerformance()
      .then(res => setMetrics(res.data))
      .catch(() => setMetrics(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading model metrics..." />;

  const PredictionSection = ({ title, columns, data }) => (
    <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
        <BarChart2 className="w-5 h-5 text-brand-600" />
        <h3 className="text-base font-bold text-slate-800">{title}</h3>
      </div>
      <div className="p-5 flex-1">
        {data ? (
          <div className="text-slate-700 italic">Metrics loaded.</div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {columns.map(c => <th key={c} className="px-4 py-3 font-bold text-slate-600 uppercase text-xs tracking-wide">{c}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center bg-slate-50/50">
                    <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2"/>
                    <span className="text-slate-600 font-semibold">Model evaluation metrics are currently unavailable.</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold text-slate-500 mb-1 tracking-wide uppercase">
          <Link to="/dashboard" className="hover:text-brand-600">Home</Link> / ML / Model Performance
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-900 flex items-center gap-2">
              <Cpu className="w-6 h-6 text-brand-600" /> Model Performance
            </h1>
            <p className="text-slate-600 text-sm mt-1">Evaluation metrics, feature importance, and methodology for the deployed risk prediction models.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Sections 1 & 2 */}
        <PredictionSection 
          title="1. Cost Overrun Prediction" 
          columns={['Model', 'Accuracy', 'Precision', 'Recall', 'F1 Score', 'ROC-AUC']} 
          data={metrics?.costOverrun} 
        />
        <PredictionSection 
          title="2. Schedule/Time Overrun Prediction" 
          columns={['Model', 'Accuracy', 'Precision', 'Recall', 'F1 Score', 'ROC-AUC']} 
          data={metrics?.timeOverrun} 
        />
        
        {/* Section 3 */}
        <PredictionSection 
          title="3. Overall Risk Prediction" 
          columns={['Model', 'MAE', 'RMSE', 'R²']} 
          data={metrics?.overallRisk} 
        />

        {/* Section 4: Feature Importance */}
        <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-600" />
            <h3 className="text-base font-bold text-slate-800">4. Feature Importance</h3>
          </div>
          <div className="p-5 flex-1 flex flex-col">
            <div className="text-sm text-slate-600 mb-4 bg-blue-50 border border-blue-100 p-4 rounded flex-1">
              <p className="font-bold text-blue-900 mb-2">SHAP Value Implementation</p>
              <p className="mb-2">
                Global feature importance aggregation is currently unavailable via the `/model-performance` API.
              </p>
              <p>
                However, the ML backend dynamically computes local feature importance for individual projects during inference using <code className="bg-white px-1 py-0.5 rounded text-blue-800 text-xs">shap.TreeExplainer</code> and <code className="bg-white px-1 py-0.5 rounded text-blue-800 text-xs">shap.LinearExplainer</code>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Methodology Section */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
           <BookOpen className="w-5 h-5 text-brand-600" />
           <h3 className="text-base font-bold text-slate-800">5. Methodology</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-8 text-sm">
           <div>
             <h4 className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1">Dataset</h4>
             <p className="text-slate-600">Historical infrastructure project dataset (<code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-slate-800 border border-slate-200">v2_dataset</code>).</p>
           </div>
           <div>
             <h4 className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1">Model Type</h4>
             <p className="text-slate-600">Ensemble / Tree-based classification classifiers.</p>
           </div>
           <div>
             <h4 className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1">Validation Approach</h4>
             <p className="text-slate-600">Standard train-test split with cross-validation for hyperparameter tuning.</p>
           </div>
           <div className="md:col-span-2 lg:col-span-3">
             <h4 className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1">Training Features</h4>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <span className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded text-xs font-semibold text-slate-700">Budget</span>
                <span className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded text-xs font-semibold text-slate-700">Material Cost</span>
                <span className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded text-xs font-semibold text-slate-700">Labor Cost</span>
                <span className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded text-xs font-semibold text-slate-700">Equipment Cost</span>
                <span className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded text-xs font-semibold text-slate-700">Total Expenditure</span>
                <span className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded text-xs font-semibold text-slate-700">Expenditure Ratio</span>
                <span className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded text-xs font-semibold text-slate-700">Progress %</span>
             </div>
           </div>
        </div>
      </div>

    </div>
  );
}
