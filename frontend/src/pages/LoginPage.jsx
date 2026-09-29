import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HardHat, Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';

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
      admin: { username: 'admin', password: 'admin123' },
      monitor: { username: 'monitor_user', password: 'admin123' },
      analyst: { username: 'analyst_user', password: 'admin123' },
    };
    setForm(creds[role]);
  };

  return (
    <div className="min-h-screen bg-[#060b18] flex items-center justify-center px-4">
      {/* Background grid effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-slide-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl mb-4">
            <HardHat className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">InfraWatch AI</h1>
          <p className="text-slate-400 text-sm mt-1">Project Monitoring Intelligence System</p>
          <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-400">
            <ShieldCheck className="w-3 h-3" />
            Secure Government Portal
          </div>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-slate-100 mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Username</label>
              <input
                type="text"
                id="username"
                autoComplete="username"
                value={form.username}
                onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-colors"
                placeholder="Enter username"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-2.5 pr-10 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-colors"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="login-btn"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-500/50 text-slate-950 font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-xs text-slate-500 text-center mb-3">Quick Demo Access</p>
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
                  className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          © 2026 InfraWatch AI • MoSPI IPMD • All rights reserved
        </p>
      </div>
    </div>
  );
}
