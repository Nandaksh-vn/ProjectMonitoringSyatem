import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Landmark, Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError('Username and password are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(form.username, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = (role) => {
    const creds = {
      admin: { username: 'admin', password: 'Admin@123' },
      monitor: { username: 'monitor_user', password: 'Admin@123' },
      analyst: { username: 'analyst_user', password: 'Admin@123' },
    };
    setForm(creds[role]);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-brand-600 px-8 py-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 rounded-full mb-3">
            <Landmark className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">InfraWatch AI</h1>
          <p className="text-brand-100 text-sm mt-1">Project Monitoring Intelligence System</p>
          <div className="inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 bg-white/10 rounded text-xs text-white">
            <ShieldCheck className="w-3.5 h-3.5" />
            Secure Government Portal
          </div>
        </div>

        {/* Form Body */}
        <div className="p-8">
          <h2 className="text-lg font-bold text-brand-900 mb-6 text-center">Sign in to your account</h2>

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Username <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="username"
                autoComplete="username"
                value={form.username}
                onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                placeholder="Enter username"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                <span className="text-sm text-slate-600">Remember me</span>
              </label>
              <a href="#" className="text-sm font-medium text-brand-600 hover:text-brand-700">Forgot Password?</a>
            </div>

            <button
              type="submit"
              id="login-btn"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white font-semibold py-2.5 rounded transition-colors text-sm shadow-sm"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? 'Authenticating...' : 'Login'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-500 text-center mb-3 uppercase tracking-wider">Quick Demo Access</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { role: 'admin', label: 'Admin' },
                { role: 'monitor', label: 'Monitor' },
                { role: 'analyst', label: 'Analyst' },
              ].map(({ role, label }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => demoLogin(role)}
                  className="px-2 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium rounded transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-slate-500 mt-6">
        © {new Date().getFullYear()} InfraWatch AI • Project Monitoring System • All rights reserved
      </p>
    </div>
  );
}
