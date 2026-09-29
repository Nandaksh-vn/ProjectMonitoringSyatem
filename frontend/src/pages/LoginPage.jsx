import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/api";
import {
  Landmark, Eye, EyeOff, LogIn, ShieldCheck,
  UserPlus, KeyRound, ArrowLeft, CheckCircle2, AlertCircle,
} from "lucide-react";

const inputCls =
  "w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-900 placeholder-slate-400 " +
  "focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors";

function Header({ mode }) {
  const titles = {
    login: "Sign in to your account",
    register: "Create your account",
    forgot: "Reset your password",
  };
  const subtitles = {
    login: "Access the InfraWatch Project Monitoring Portal",
    register: "Register to monitor infrastructure projects",
    forgot: "We will send a temporary password to your email",
  };
  return (
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
  );
}

/* ─── LOGIN MODE ─────────────────────────────────────────────── */
function LoginForm({ onSwitch }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) { setError("Username and password are required."); return; }
    setLoading(true); setError("");
    try {
      await login(form.username, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally { setLoading(false); }
  };

  const demoLogin = (role) => {
    const creds = {
      admin: { username: "admin", password: "Admin@123" },
      monitor: { username: "monitor_user", password: "Admin@123" },
      analyst: { username: "analyst_user", password: "Admin@123" },
    };
    setForm(creds[role]);
  };

  return (
    <div className="p-8">
      <h2 className="text-lg font-bold text-brand-900 mb-6 text-center">Sign in to your account</h2>

      {error && (
        <div className="mb-5 flex items-center gap-2 px-4 py-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Username <span className="text-red-500">*</span></label>
          <input type="text" id="username" autoComplete="username" value={form.username}
            onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))}
            className={inputCls} placeholder="Enter username" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Password <span className="text-red-500">*</span></label>
          <div className="relative">
            <input type={showPw ? "text" : "password"} id="password" autoComplete="current-password"
              value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
              className={inputCls + " pr-10"} placeholder="Enter password" />
            <button type="button" onClick={() => setShowPw(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
            <span className="text-sm text-slate-600">Remember me</span>
          </label>
          <button type="button" onClick={() => onSwitch("forgot")}
            className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
            Forgot Password?
          </button>
        </div>
        <button type="submit" id="login-btn" disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white font-semibold py-2.5 rounded transition-colors text-sm shadow-sm">
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <LogIn className="w-4 h-4" />}
          {loading ? "Authenticating..." : "Login"}
        </button>
      </form>

      <div className="mt-5 text-center">
        <span className="text-sm text-slate-500">Do not have an account? </span>
        <button type="button" onClick={() => onSwitch("register")}
          className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors">
          Register
        </button>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-200">
        <p className="text-xs font-semibold text-slate-500 text-center mb-3 uppercase tracking-wider">Quick Demo Access</p>
        <div className="grid grid-cols-3 gap-2">
          {[{ role: "admin", label: "Admin" }, { role: "monitor", label: "Monitor" }, { role: "analyst", label: "Analyst" }].map(({ role, label }) => (
            <button key={role} type="button" onClick={() => demoLogin(role)}
              className="px-2 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium rounded transition-colors">
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── REGISTER MODE ──────────────────────────────────────────── */
function RegisterForm({ onSwitch }) {
  const [form, setForm] = useState({
    fullName: "", username: "", email: "", password: "", confirmPassword: "",
    department: "", role: "ROLE_VIEWER",
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (f) => (e) => setForm(prev => ({ ...prev, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      await authService.register({
        fullName: form.fullName,
        username: form.username,
        email: form.email,
        password: form.password,
        department: form.department,
        role: form.role,
      });
      setSuccess("Account created successfully! You can now log in.");
      setTimeout(() => onSwitch("login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-2 mb-6">
        <button type="button" onClick={() => onSwitch("login")}
          className="text-slate-400 hover:text-slate-600 transition-colors"><ArrowLeft className="w-4 h-4" /></button>
        <h2 className="text-lg font-bold text-brand-900">Create your account</h2>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name <span className="text-red-500">*</span></label>
            <input type="text" value={form.fullName} onChange={set("fullName")} required
              className={inputCls} placeholder="Your full name" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Username <span className="text-red-500">*</span></label>
            <input type="text" value={form.username} onChange={set("username")} required
              className={inputCls} placeholder="Choose username" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address <span className="text-red-500">*</span></label>
          <input type="email" value={form.email} onChange={set("email")} required
            className={inputCls} placeholder="your@email.com" />
          <p className="text-xs text-slate-400 mt-1">Password reset emails will be sent here</p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
          <input type="text" value={form.department} onChange={set("department")}
            className={inputCls} placeholder="e.g. Ministry of Road Transport" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
          <select value={form.role} onChange={set("role")} className={inputCls}>
            <option value="ROLE_VIEWER">Viewer (Read Only)</option>
            <option value="ROLE_ANALYST">Analyst</option>
            <option value="ROLE_MONITOR">Monitor</option>
          </select>
          <p className="text-xs text-slate-400 mt-1">Admin &amp; Project Manager roles are assigned by system admin</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={form.password} onChange={set("password")} required
                className={inputCls + " pr-10"} placeholder="Min 6 characters" />
              <button type="button" onClick={() => setShowPw(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password <span className="text-red-500">*</span></label>
            <input type={showPw ? "text" : "password"} value={form.confirmPassword} onChange={set("confirmPassword")} required
              className={inputCls} placeholder="Repeat password" />
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white font-semibold py-2.5 rounded transition-colors text-sm shadow-sm mt-2">
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UserPlus className="w-4 h-4" />}
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      <div className="mt-5 text-center">
        <span className="text-sm text-slate-500">Already have an account? </span>
        <button type="button" onClick={() => onSwitch("login")}
          className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors">
          Sign In
        </button>
      </div>
    </div>
  );
}

/* ─── FORGOT PASSWORD MODE ───────────────────────────────────── */
function ForgotPasswordForm({ onSwitch }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError("Please enter your email address."); return; }
    setError(""); setSuccess(""); setLoading(true);
    try {
      const res = await authService.forgotPassword(email);
      setSuccess(res.data?.message || "If this email is registered, a temporary password will be sent.");
    } catch (err) {
      setError(err.response?.data?.message || "Request failed. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-2 mb-6">
        <button type="button" onClick={() => onSwitch("login")}
          className="text-slate-400 hover:text-slate-600 transition-colors"><ArrowLeft className="w-4 h-4" /></button>
        <h2 className="text-lg font-bold text-brand-900">Reset your password</h2>
      </div>

      <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
        <p className="font-semibold mb-1">How it works:</p>
        <p>Enter the email you used during registration. We will send a temporary password to that email. Use it to log in, then change your password.</p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
        </div>
      )}

      {!success && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Registered Email <span className="text-red-500">*</span></label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className={inputCls} placeholder="your@email.com" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white font-semibold py-2.5 rounded transition-colors text-sm shadow-sm">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <KeyRound className="w-4 h-4" />}
            {loading ? "Sending..." : "Send Temporary Password"}
          </button>
        </form>
      )}

      {success && (
        <button type="button" onClick={() => onSwitch("login")}
          className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded transition-colors text-sm shadow-sm">
          <LogIn className="w-4 h-4" /> Back to Login
        </button>
      )}

      {!success && (
        <div className="mt-5 text-center">
          <button type="button" onClick={() => onSwitch("login")}
            className="text-sm text-brand-600 hover:text-brand-700 font-semibold transition-colors">
            Back to Login
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── ROOT ───────────────────────────────────────────────────── */
export default function LoginPage() {
  const [mode, setMode] = useState("login"); // "login" | "register" | "forgot"

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        <Header mode={mode} />
        {mode === "login"    && <LoginForm onSwitch={setMode} />}
        {mode === "register" && <RegisterForm onSwitch={setMode} />}
        {mode === "forgot"   && <ForgotPasswordForm onSwitch={setMode} />}
      </div>
      <p className="text-center text-xs text-slate-500 mt-6">
        {new Date().getFullYear()} InfraWatch AI - Project Monitoring System - All rights reserved
      </p>
    </div>
  );
}
