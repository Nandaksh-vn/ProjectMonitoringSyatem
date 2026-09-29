import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { projectService } from "../services/api";
import api from "../services/api";
import {
  Save, ArrowLeft, AlertCircle, CheckCircle2, RefreshCw,
  TrendingUp, Calendar, DollarSign, ClipboardList, Info,
} from "lucide-react";
import { LoadingState } from "../components/ui/Shared";

function Field({ label, helper, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">{label}</label>
      {helper && <p className="text-xs text-slate-500 mb-1.5">{helper}</p>}
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, colorCls }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${colorCls} mb-4`}>
      <Icon className="w-5 h-5 shrink-0" />
      <div>
        <p className="font-bold text-sm">{title}</p>
        {subtitle && <p className="text-xs opacity-80">{subtitle}</p>}
      </div>
    </div>
  );
}

const inp = "w-full border border-slate-300 bg-slate-50 rounded px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors placeholder-slate-400";
const sel = "w-full border border-slate-300 bg-slate-50 rounded px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors";

export default function EditProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    physicalProgress: "",
    financialProgress: "",
    currentExpenditure: "",
    revisedCost: "",
    revisedCompletionDate: "",
    status: "",
  });

  useEffect(() => {
    setLoading(true);
    projectService.getById(id)
      .then(r => {
        const p = r.data;
        setProject(p);
        setForm({
          physicalProgress: p.physicalProgress ?? "",
          financialProgress: p.financialProgress ?? "",
          currentExpenditure: p.currentExpenditure ?? "",
          revisedCost: p.revisedCost ?? "",
          revisedCompletionDate: p.revisedCompletionDate ? p.revisedCompletionDate.slice(0, 10) : "",
          status: p.status ?? "",
        });
      })
      .catch(e => setError(e.response?.data?.message || e.message || "Failed to load project."))
      .finally(() => setLoading(false));
  }, [id]);

  const set = field => e => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSave = async e => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);
    const payload = {
      ...project,
      physicalProgress: parseFloat(form.physicalProgress) || 0,
      financialProgress: parseFloat(form.financialProgress) || 0,
      currentExpenditure: parseFloat(form.currentExpenditure) || 0,
      revisedCost: parseFloat(form.revisedCost) || project.revisedCost,
      revisedCompletionDate: form.revisedCompletionDate || project.revisedCompletionDate,
      status: form.status || project.status,
    };
    try {
      await api.put("/projects/" + id, payload);
      setSuccess(true);
      setTimeout(() => navigate("/projects"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to save project.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading project data..." />;

  return (
    <form onSubmit={handleSave} className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-1 tracking-wide uppercase">Home / Projects / Edit</div>
          <h1 className="text-2xl font-bold text-brand-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-brand-600" /> Update Project Progress
          </h1>
          {project && (
            <p className="text-slate-600 text-sm mt-1">
              <span className="font-mono font-bold text-slate-700">{project.projectCode}</span> — {project.projectName}
            </p>
          )}
        </div>
        <button type="button" onClick={() => navigate("/projects")}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded hover:bg-slate-50 transition-colors shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </button>
      </div>

      {project && (
        <div className="flex items-start gap-3 px-4 py-3 bg-slate-100 border border-slate-200 rounded text-sm text-slate-700 shadow-sm">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-slate-500" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 text-xs">
            <div><span className="font-bold text-slate-500 uppercase">State:</span> {project.state}</div>
            <div><span className="font-bold text-slate-500 uppercase">Sector:</span> {project.sectorCode || project.sectorId}</div>
            <div><span className="font-bold text-slate-500 uppercase">Ministry:</span> {project.ministryCode || project.ministryId}</div>
            <div><span className="font-bold text-slate-500 uppercase">Approved Cost:</span> Rs.{Number(project.approvedCost).toLocaleString("en-IN")} Cr</div>
            <div><span className="font-bold text-slate-500 uppercase">Original Start:</span> {project.originalStartDate}</div>
            <div><span className="font-bold text-slate-500 uppercase">Original End:</span> {project.originalCompletionDate}</div>
          </div>
        </div>
      )}

      {/* Physical & Financial */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-5">
        <SectionHeader icon={TrendingUp} title="Physical & Financial Progress"
          subtitle="Enter the current completion percentages"
          colorCls="bg-emerald-50 border-emerald-200 text-emerald-700" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Physical Progress (%)" helper="Overall physical work completed (0-100)">
            <div className="relative">
              <input type="number" min="0" max="100" step="0.1" value={form.physicalProgress}
                onChange={set("physicalProgress")} className={inp + " pr-8"} placeholder="e.g. 72.5" required />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">%</span>
            </div>
            {form.physicalProgress !== "" && (
              <div className="mt-2 w-full bg-slate-100 rounded h-2 overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: Math.min(100, parseFloat(form.physicalProgress) || 0) + "%" }} />
              </div>
            )}
          </Field>
          <Field label="Financial Progress (%)" helper="Percentage of budget utilised (0-100)">
            <div className="relative">
              <input type="number" min="0" max="100" step="0.1" value={form.financialProgress}
                onChange={set("financialProgress")} className={inp + " pr-8"} placeholder="e.g. 68.0" required />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">%</span>
            </div>
            {form.financialProgress !== "" && (
              <div className="mt-2 w-full bg-slate-100 rounded h-2 overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: Math.min(100, parseFloat(form.financialProgress) || 0) + "%" }} />
              </div>
            )}
          </Field>
        </div>
      </div>

      {/* Cost */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-5">
        <SectionHeader icon={DollarSign} title="Expenditure & Revised Cost"
          subtitle="Update current spending and any cost revision"
          colorCls="bg-amber-50 border-amber-200 text-amber-700" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Current Expenditure (Rs. Crore)" helper="Total amount spent to date">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">Rs.</span>
              <input type="number" min="0" step="0.01" value={form.currentExpenditure}
                onChange={set("currentExpenditure")} className={inp + " pl-8"} placeholder="e.g. 3250.00" required />
            </div>
          </Field>
          <Field label="Revised Project Cost (Rs. Crore)" helper="Leave unchanged if no cost revision">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">Rs.</span>
              <input type="number" min="0" step="0.01" value={form.revisedCost}
                onChange={set("revisedCost")} className={inp + " pl-8"} placeholder="e.g. 4750.00" required />
            </div>
          </Field>
        </div>
      </div>

      {/* Schedule & Status */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-5">
        <SectionHeader icon={Calendar} title="Schedule & Status"
          subtitle="Update the revised completion date and current project status"
          colorCls="bg-blue-50 border-blue-200 text-blue-700" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Revised Completion Date" helper="Updated expected completion date">
            <input type="date" value={form.revisedCompletionDate}
              onChange={set("revisedCompletionDate")} className={inp} required />
          </Field>
          <Field label="Project Status" helper="Current overall status of the project">
            <select value={form.status} onChange={set("status")} className={sel} required>
              <option value="">-- Select Status --</option>
              <option value="ONGOING">Ongoing</option>
              <option value="DELAYED">Delayed</option>
              <option value="CRITICAL">Critical</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </Field>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <span className="font-medium">{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-sm shadow-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span className="font-bold">Project updated successfully! Redirecting to Projects...</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pb-8">
        <button type="submit" disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold py-3 rounded-lg transition-colors text-sm shadow-sm">
          {saving
            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving Changes...</>
            : <><Save className="w-4 h-4" /> Save Progress Update</>}
        </button>
        <button type="button" onClick={() => navigate("/projects")}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}
