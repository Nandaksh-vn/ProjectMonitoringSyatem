import React, { useState, useCallback } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { Upload, FileText, CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';
import api from '../services/api';

const ACCEPTED_TYPES = ['text/csv', 'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

const UPLOAD_TYPES = [
  { id: 'monthly-data', label: 'Monthly Progress Data', endpoint: '/data/upload/monthly-data', description: 'CSV with monthly physical/financial progress, expenditure, milestones' },
  { id: 'project-data', label: 'Project Master Data', endpoint: '/data/upload/projects', description: 'CSV with project details, costs, dates, status' },
  { id: 'prediction-data', label: 'ML Predictions', endpoint: '/data/upload/predictions', description: 'CSV with ML model prediction outputs' },
];

function DropZone({ onFiles, disabled }) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    onFiles(Array.from(e.dataTransfer.files));
  }, [onFiles]);

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-10 cursor-pointer transition-all ${
        disabled ? 'opacity-40 cursor-not-allowed' : ''
      } ${dragging ? 'border-cyan-400 bg-cyan-500/5' : 'border-slate-700 hover:border-slate-600 bg-slate-800/30 hover:bg-slate-800/50'}`}
    >
      <Upload className={`w-10 h-10 ${dragging ? 'text-cyan-400' : 'text-slate-500'}`} />
      <div className="text-center">
        <p className="text-sm font-medium text-slate-300">Drop CSV/Excel file here or <span className="text-cyan-400">browse</span></p>
        <p className="text-xs text-slate-500 mt-1">Supports .csv, .xlsx, .xls — Max 10 MB</p>
      </div>
      <input
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        disabled={disabled}
        onChange={(e) => onFiles(Array.from(e.target.files))}
      />
    </label>
  );
}

export default function DataUploadPage() {
  const [uploadType, setUploadType] = useState(UPLOAD_TYPES[0]);
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState(null); // null | 'uploading' | 'success' | 'error'
  const [result, setResult] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);

  const handleFiles = (newFiles) => {
    const valid = newFiles.filter(f => ACCEPTED_TYPES.includes(f.type) || f.name.endsWith('.csv') || f.name.endsWith('.xlsx'));
    const invalid = newFiles.filter(f => !valid.includes(f));
    setFiles(valid);
    setValidationErrors(invalid.map(f => `${f.name}: Unsupported file type. Only CSV/Excel accepted.`));
    setStatus(null);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!files.length) return;
    setStatus('uploading');
    setResult(null);
    setValidationErrors([]);

    const formData = new FormData();
    files.forEach(f => formData.append('file', f));

    try {
      const res = await api.post(uploadType.endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStatus('success');
      setResult(res.data);
    } catch (err) {
      setStatus('error');
      const errData = err.response?.data;
      if (errData?.validationErrors) {
        setValidationErrors(errData.validationErrors);
      }
      setResult({ message: errData?.message || err.message || 'Upload failed' });
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <Upload className="w-6 h-6 text-blue-400" />
          Data Upload
        </h1>
        <p className="text-slate-400 text-sm mt-1">Upload monitoring data CSV/Excel files for processing and validation</p>
      </div>

      {/* Authorization notice */}
      <div className="flex items-start gap-3 px-4 py-3 bg-blue-500/5 border border-blue-500/20 rounded-xl mb-6 text-sm text-blue-300">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <strong>Authorization Required:</strong> Only authorized users (Admin/Monitor role) can upload data.
          Uploaded files undergo server-side validation before database insertion.
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Upload type selector */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Select Data Type</h2>
          {UPLOAD_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => { setUploadType(t); setFiles([]); setStatus(null); setResult(null); }}
              className={`w-full text-left p-4 rounded-xl border transition-all ${uploadType.id === t.id
                ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'}`}
            >
              <p className="font-medium text-sm">{t.label}</p>
              <p className="text-xs mt-1 opacity-70">{t.description}</p>
            </button>
          ))}
        </div>

        {/* Upload area */}
        <div className="xl:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300">Upload: {uploadType.label}</h2>

          <DropZone onFiles={handleFiles} disabled={status === 'uploading'} />

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-lg">
                  <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{f.name}</p>
                    <p className="text-xs text-slate-500">{(f.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-slate-500 hover:text-red-400 transition-colors">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Validation errors */}
          {validationErrors.length > 0 && (
            <div className="space-y-1">
              {validationErrors.map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-red-400 px-3 py-2 bg-red-500/10 rounded-lg border border-red-500/20">
                  <XCircle className="w-3.5 h-3.5 shrink-0" /> {e}
                </div>
              ))}
            </div>
          )}

          {/* Upload button */}
          <button
            id="upload-btn"
            onClick={handleUpload}
            disabled={!files.length || status === 'uploading'}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/40 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          >
            {status === 'uploading'
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading & Validating...</>
              : <><Upload className="w-4 h-4" /> Upload & Validate</>}
          </button>

          {/* Result */}
          {status === 'success' && (
            <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Upload Successful</p>
                <p className="text-xs mt-1 opacity-80">{result?.message || 'Data validated and imported successfully.'}</p>
                {result?.rowsImported && <p className="text-xs mt-1">Rows imported: {result.rowsImported}</p>}
              </div>
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Upload Failed</p>
                <p className="text-xs mt-1 opacity-80">{result?.message}</p>
              </div>
            </div>
          )}

          {/* Format guide */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">Expected Format</h3>
            <p className="text-xs text-slate-500">
              {uploadType.id === 'monthly-data' &&
                'Required columns: project_id, reporting_month, planned_physical_progress, actual_physical_progress, planned_financial_progress, actual_financial_progress, monthly_expenditure, cumulative_expenditure, milestones_planned, milestones_completed, milestones_delayed, revised_cost, revised_completion_date'}
              {uploadType.id === 'project-data' &&
                'Required columns: project_code, project_name, ministry_id, sector_id, agency_id, state, district, approved_cost, revised_cost, approval_date, original_start_date, original_completion_date, status'}
              {uploadType.id === 'prediction-data' &&
                'Required columns: project_id, model_version_id, cost_overrun_probability, predicted_cost_overrun_pct, time_overrun_probability, predicted_delay_months, overall_risk_score, risk_level'}
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
