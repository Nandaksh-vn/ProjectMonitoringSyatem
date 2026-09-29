import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { projectService, referenceService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AddProjectPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_PROJECT_MANAGER';

  const [formData, setFormData] = useState({
    projectCode: '',
    projectName: '',
    ministryId: '',
    sectorId: '',
    agencyId: '',
    state: '',
    district: '',
    approvedCost: '',
    revisedCost: '',
    approvalDate: '',
    originalStartDate: '',
    originalCompletionDate: '',
    status: 'ONGOING'
  });

  const [ministries, setMinistries] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [referenceLoading, setReferenceLoading] = useState(true);
  const [referenceError, setReferenceError] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Reference lists come from the database so agency renames and additions are
  // reflected without a frontend release.
  useEffect(() => {
    if (!canManage) return;
    let cancelled = false;
    referenceService
      .getAll()
      .then(r => {
        if (cancelled) return;
        setMinistries(r.data?.ministries || []);
        setSectors(r.data?.sectors || []);
        setAgencies(r.data?.agencies || []);
        setReferenceError('');
      })
      .catch(e => {
        if (cancelled) return;
        setReferenceError(
          e.response?.data?.message || 'Could not load ministries, sectors and agencies from the server.'
        );
      })
      .finally(() => {
        if (!cancelled) setReferenceLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [canManage]);

  // An agency belongs to exactly one ministry, so keep the two dropdowns consistent.
  const handleMinistryChange = (e) => {
    const ministryId = e.target.value;
    setFormData(prev => ({ ...prev, ministryId, agencyId: '' }));
  };

  const visibleAgencies = formData.ministryId
    ? agencies.filter(a => String(a.ministryId) === String(formData.ministryId))
    : agencies;

  // Prevent non-admins from loading the form.
  // Must stay after all hook calls to preserve React's hook ordering.
  if (!canManage) {
    return (
      <div className="bg-white p-8 rounded border border-slate-200 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h2>
        <p className="text-slate-600 mb-6">You do not have permission to create new projects.</p>
        <button onClick={() => navigate('/projects')} className="bg-brand-600 text-white px-4 py-2 rounded font-medium hover:bg-brand-700">Back to Projects</button>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!formData.projectCode.trim()) return "Project Code is required.";
    if (!formData.projectName.trim()) return "Project Name is required.";
    if (!formData.ministryId) return "Ministry is required.";
    if (!formData.sectorId) return "Sector is required.";
    if (!formData.agencyId) return "Implementing Agency is required.";
    if (!formData.state.trim()) return "State is required.";
    if (!formData.district.trim()) return "District is required.";
    if (!formData.approvedCost || parseFloat(formData.approvedCost) < 0) return "Valid Approved Cost is required.";
    if (!formData.revisedCost || parseFloat(formData.revisedCost) < 0) return "Valid Revised Cost is required.";
    if (!formData.approvalDate) return "Approval Date is required.";
    if (!formData.originalStartDate) return "Original Start Date is required.";
    if (!formData.originalCompletionDate) return "Original Completion Date is required.";
    if (new Date(formData.originalStartDate) > new Date(formData.originalCompletionDate)) return "Start date cannot be after completion date.";
    return null;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    const payload = {
      ...formData,
      ministryId: parseInt(formData.ministryId, 10),
      sectorId: parseInt(formData.sectorId, 10),
      agencyId: parseInt(formData.agencyId, 10),
      approvedCost: parseFloat(formData.approvedCost),
      revisedCost: parseFloat(formData.revisedCost),
      currentExpenditure: 0,
      physicalProgress: 0,
      financialProgress: 0,
      revisedCompletionDate: formData.originalCompletionDate
    };

    try {
      await projectService.create(payload);
      setSuccess('Project created successfully!');
      setTimeout(() => navigate('/projects'), 1500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create project. Please ensure project code is unique and try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <Link to="/projects" className="text-brand-600 hover:underline text-sm font-semibold flex items-center gap-1 w-fit">
          &larr; Back to Projects
        </Link>
      </div>

      <div className="bg-white p-6 lg:p-8 rounded border border-slate-200 shadow-sm max-w-4xl mx-auto">
        <div className="mb-8 border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-bold text-brand-900">Add New Project</h1>
          <p className="text-slate-600 mt-1 text-sm">Register a new infrastructure project into the monitoring system.</p>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 text-sm font-medium rounded-r">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 p-4 text-sm font-medium rounded-r">
            {success}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Basic Details */}
          <div className="bg-slate-50 p-4 rounded border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Project Code *</label>
                <input name="projectCode" type="text" value={formData.projectCode} onChange={handleChange} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="e.g. PRJ-2026-001" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Project Name *</label>
                <input name="projectName" type="text" value={formData.projectName} onChange={handleChange} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Full project name" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Ministry *</label>
                <select name="ministryId" value={formData.ministryId} onChange={handleMinistryChange} disabled={referenceLoading} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-slate-100">
                  <option value="">{referenceLoading ? 'Loading ministries…' : '-- Select Ministry --'}</option>
                  {ministries.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Sector *</label>
                <select name="sectorId" value={formData.sectorId} onChange={handleChange} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
                  <option value="">-- Select Sector --</option>
                  {sectors.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Implementing Agency *</label>
                <select
                  name="agencyId"
                  value={formData.agencyId}
                  onChange={handleChange}
                  disabled={referenceLoading}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-slate-100"
                >
                  <option value="">
                    {referenceLoading ? 'Loading agencies…' : formData.ministryId ? '-- Select Agency --' : '-- Select a ministry first --'}
                  </option>
                  {visibleAgencies.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.code})</option>
                  ))}
                </select>
                {referenceError && (
                  <p className="text-xs text-red-600 mt-1">{referenceError}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Location */}
          <div className="bg-slate-50 p-4 rounded border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">State / UT *</label>
                <select name="state" value={formData.state} onChange={handleChange} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-white">
                  <option value="">-- Select State/UT --</option>
                  <optgroup label="States">
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                    <option value="Assam">Assam</option>
                    <option value="Bihar">Bihar</option>
                    <option value="Chhattisgarh">Chhattisgarh</option>
                    <option value="Goa">Goa</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Haryana">Haryana</option>
                    <option value="Himachal Pradesh">Himachal Pradesh</option>
                    <option value="Jharkhand">Jharkhand</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Kerala">Kerala</option>
                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Manipur">Manipur</option>
                    <option value="Meghalaya">Meghalaya</option>
                    <option value="Mizoram">Mizoram</option>
                    <option value="Nagaland">Nagaland</option>
                    <option value="Odisha">Odisha</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Sikkim">Sikkim</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Tripura">Tripura</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Uttarakhand">Uttarakhand</option>
                    <option value="West Bengal">West Bengal</option>
                  </optgroup>
                  <optgroup label="Union Territories">
                    <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                    <option value="Chandigarh">Chandigarh</option>
                    <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                    <option value="Ladakh">Ladakh</option>
                    <option value="Lakshadweep">Lakshadweep</option>
                    <option value="Puducherry">Puducherry</option>
                  </optgroup>
                  <option value="Multi-State">Multi-State / National</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">District *</label>
                <input name="district" type="text" value={formData.district} onChange={handleChange} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="District" />
              </div>
            </div>
          </div>

          {/* Section 3: Financials */}
          <div className="bg-slate-50 p-4 rounded border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Financials (INR Crores)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Approved Cost *</label>
                <input name="approvedCost" type="number" step="0.01" min="0" value={formData.approvedCost} onChange={handleChange} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Revised Cost *</label>
                <input name="revisedCost" type="number" step="0.01" min="0" value={formData.revisedCost} onChange={handleChange} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="0.00" />
              </div>
            </div>
          </div>

          {/* Section 4: Schedule */}
          <div className="bg-slate-50 p-4 rounded border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Schedule & Timelines</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Approval Date *</label>
                <input name="approvalDate" type="date" value={formData.approvalDate} onChange={handleChange} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Original Start Date *</label>
                <input name="originalStartDate" type="date" value={formData.originalStartDate} onChange={handleChange} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Original Completion Date *</label>
                <input name="originalCompletionDate" type="date" value={formData.originalCompletionDate} onChange={handleChange} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded border border-slate-200">
             <div className="w-1/3">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Initial Status *</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
                  <option value="ONGOING">ONGOING</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="DELAYED">DELAYED</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 mt-6">
            <button type="button" onClick={() => navigate('/projects')} className="px-5 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 font-semibold text-sm transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-5 py-2 bg-brand-600 text-white rounded hover:bg-brand-700 font-semibold text-sm shadow-sm transition-colors disabled:bg-brand-400">
              {loading ? 'Saving...' : 'Save Project'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
