import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle2, XCircle, AlertTriangle, Info, Download } from 'lucide-react';
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
      className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded bg-slate-50 p-12 cursor-pointer transition-all ${
        disabled ? 'opacity-40 cursor-not-allowed' : ''
      } ${dragging ? 'border-brand-500 bg-brand-50' : 'border-slate-300 hover:border-brand-400 hover:bg-brand-50/50'}`}
    >
      <div className={`p-4 rounded-full mb-2 ${dragging ? 'bg-brand-100' : 'bg-slate-200'}`}>
        <Upload className={`w-8 h-8 ${dragging ? 'text-brand-600' : 'text-slate-500'}`} />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-slate-700">Drop CSV/Excel file here or <span className="text-brand-600 underline">browse</span></p>
        <p className="text-xs font-medium text-slate-500 mt-2">Supports .csv, .xlsx, .xls — Max 10 MB per file</p>
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

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  // Fetch projects on load
  React.useEffect(() => {
    api.get('/projects?size=200')
      .then(r => setProjects(r.data?.content || r.data || []))
      .catch(e => console.error('Failed to load projects', e));
  }, []);

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
    if (uploadType.id !== 'project-data' && !selectedProjectId) {
      setValidationErrors(['Please select a project before uploading this data type.']);
      return;
    }
    
    setStatus('uploading');
    setResult(null);
    setValidationErrors([]);

    const formData = new FormData();
    files.forEach(f => formData.append('file', f));
    if (selectedProjectId && uploadType.id !== 'project-data') {
      formData.append('projectId', selectedProjectId);
    }

    try {
      const res = await api.post(uploadType.endpoint, formData); // Removed explicit Content-Type to preserve boundary
      setStatus('success');
      setResult(res.data);
    } catch (err) {
      setStatus('error');
      const errData = err.response?.data;
      if (errData?.validationErrors) {
        setValidationErrors(errData.validationErrors);
      }
      setResult({ message: errData?.message || err.message || 'Upload failed due to server error.' });
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-1 tracking-wide uppercase">Admin / Data</div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Upload className="w-6 h-6 text-brand-600" />
            Bulk Data Upload
          </h1>
          <p className="text-slate-600 text-sm mt-1">Upload project monitoring data CSV/Excel files for batch processing</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded hover:bg-slate-50 transition-colors shadow-sm">
          <Download className="w-4 h-4" /> Download Template
        </button>
      </div>

      {/* Authorization notice */}
      <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded mb-6 text-sm text-blue-900 shadow-sm">
        <Info className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
        <div>
          <strong className="block mb-0.5 font-bold">Authorization Required:</strong> Only authorized users (Admin/Monitor roles) can upload bulk data. 
          All uploaded files undergo strict server-side validation against database schemas before insertion.
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Upload type selector */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-2">Select Import Category</h2>
          <div className="space-y-2">
            {UPLOAD_TYPES.map(t => (
              <button
                key={t.id}
                onClick={() => { setUploadType(t); setFiles([]); setStatus(null); setResult(null); }}
                className={`w-full text-left p-4 rounded border transition-all ${uploadType.id === t.id
                  ? 'bg-brand-50 border-brand-500 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm'}`}
              >
                <p className={`font-bold text-sm ${uploadType.id === t.id ? 'text-brand-800' : 'text-slate-800'}`}>{t.label}</p>
                <p className={`text-xs mt-1 font-medium ${uploadType.id === t.id ? 'text-brand-600' : 'text-slate-500'}`}>{t.description}</p>
              </button>
            ))}
          </div>
          
          {/* Project Selection */}
          {uploadType.id !== 'project-data' && (
            <div className="bg-white border border-slate-200 rounded p-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-2">Select Project *</h3>
              <p className="text-xs text-slate-500 mb-3">You must select a project to attach this data to.</p>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-slate-50"
              >
                <option value="">-- Search / Select Project --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.projectCode} - {p.projectName}</option>
                ))}
              </select>
            </div>
          )}

          {/* Format guide */}
          <div className="bg-slate-50 border border-slate-200 rounded p-4 mt-6">
            <h3 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide flex items-center gap-1.5"><FileText className="w-4 h-4" /> Expected Format</h3>
            <p className="text-xs text-slate-600 font-mono leading-relaxed">
              {uploadType.id === 'monthly-data' &&
                'project_id, reporting_month, planned_physical_progress, actual_physical_progress, planned_financial_progress, actual_financial_progress, monthly_expenditure, cumulative_expenditure, milestones_planned, milestones_completed, milestones_delayed, revised_cost, revised_completion_date'}
              {uploadType.id === 'project-data' &&
                'project_code, project_name, ministry_id, sector_id, agency_id, state, district, approved_cost, revised_cost, approval_date, original_start_date, original_completion_date, status'}
              {uploadType.id === 'prediction-data' &&
                'project_id, model_version_id, cost_overrun_probability, predicted_cost_overrun_pct, time_overrun_probability, predicted_delay_months, overall_risk_score, risk_level'}
            </p>
          </div>
        </div>

        {/* Upload area */}
        <div className="xl:col-span-2 space-y-5">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-2">Upload: {uploadType.label}</h2>

          <div className="gov-card p-6">
            <DropZone onFiles={handleFiles} disabled={status === 'uploading'} />

            {/* File list */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded shadow-sm">
                    <FileText className="w-5 h-5 text-brand-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{f.name}</p>
                      <p className="text-xs font-semibold text-slate-500">{(f.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-600 transition-colors bg-slate-50 hover:bg-red-50 p-1.5 rounded">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Validation errors */}
            {validationErrors.length > 0 && (
              <div className="mt-4 space-y-2">
                {validationErrors.map((e, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm font-medium text-red-700 px-4 py-3 bg-red-50 rounded border border-red-200">
                    <XCircle className="w-4 h-4 shrink-0 text-red-500" /> {e}
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
            <div className="mt-6">
              <button
                id="upload-btn"
                onClick={handleUpload}
                disabled={!files.length || status === 'uploading'}
                className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold py-3 rounded transition-colors text-sm shadow-sm"
              >
                {status === 'uploading'
                  ? <><div className="w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin" /> Processing & Validating Upload...</>
                  : <><Upload className="w-4 h-4" /> Secure Upload & Validate</>}
              </button>
            </div>
            
            {/* Result */}
            {status === 'success' && (
              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 shadow-sm">
                <div className="flex items-start gap-3 mb-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
                  <div>
                    <p className="font-bold text-sm text-emerald-800">Upload Successful</p>
                    <p className="text-sm mt-1 font-medium">{result?.message || 'Data validated and imported successfully.'}</p>
                    {uploadType.id !== 'project-data' && (
                      <p className="text-sm font-bold mt-1 text-emerald-700">Project: {projects.find(p => p.id.toString() === selectedProjectId.toString())?.projectName || selectedProjectId}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 pt-4 border-t border-emerald-100">
                  <div className="bg-white p-2 rounded border border-emerald-100 text-center">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Records Processed</div>
                    <div className="text-lg font-bold text-slate-800">{result?.recordsProcessed || 0}</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-emerald-100 text-center">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Records Inserted</div>
                    <div className="text-lg font-bold text-emerald-600">{result?.recordsInserted || 0}</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-emerald-100 text-center">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Records Updated</div>
                    <div className="text-lg font-bold text-blue-600">{result?.recordsUpdated || 0}</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-emerald-100 text-center">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Records Rejected</div>
                    <div className="text-lg font-bold text-red-600">{result?.recordsRejected || 0}</div>
                  </div>
                </div>
              </div>
            )}
            {status === 'error' && (
              <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded text-red-900 shadow-sm">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
                <div>
                  <p className="font-bold text-sm text-red-800">Upload Failed</p>
                  <p className="text-sm mt-1 font-medium break-words">Reason: {result?.message}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
