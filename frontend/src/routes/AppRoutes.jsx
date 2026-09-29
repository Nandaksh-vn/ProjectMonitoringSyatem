import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import PublicLayout from '../layouts/PublicLayout';
import DashboardLayout from '../layouts/DashboardLayout';

import HomePage from '../pages/public/HomePage';
import SectorDirectoryPage from '../pages/public/SectorDirectoryPage';
import PublicSectorDetailPage from '../pages/public/PublicSectorDetailPage';
import ProjectDirectoryPage from '../pages/public/ProjectDirectoryPage';
import PublicProjectOverviewPage from '../pages/public/PublicProjectOverviewPage';

import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import ProjectsPage from '../pages/ProjectsPage';
import ProjectDetailPage from '../pages/ProjectDetailPage';
import RiskAnalyticsPage from '../pages/RiskAnalyticsPage';
import AlertsPage from '../pages/AlertsPage';
import RecommendationsPage from '../pages/RecommendationsPage';
import ModelPerformancePage from '../pages/ModelPerformancePage';
import DataUploadPage from '../pages/DataUploadPage';
import AiAssistantPage from '../pages/AiAssistantPage';
import AddProjectPage from '../pages/AddProjectPage';
import { LoadingState } from '../components/ui/Shared';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><LoadingState message="Authenticating..." /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function ProjectsRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><LoadingState message="Loading..." /></div>;
  if (isAuthenticated) {
    return <DashboardLayout><ProjectsPage /></DashboardLayout>;
  }
  return <PublicLayout><ProjectDirectoryPage /></PublicLayout>;
}

function ProjectDetailRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><LoadingState message="Loading..." /></div>;
  if (isAuthenticated) {
    return <DashboardLayout><ProjectDetailPage /></DashboardLayout>;
  }
  return <PublicLayout><PublicProjectOverviewPage /></PublicLayout>;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages wrapped in PublicLayout */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="sectors" element={<SectorDirectoryPage />} />
        <Route path="sectors/:id" element={<PublicSectorDetailPage />} />
        <Route path="about" element={<div className="py-24 text-center">About Page Placeholder</div>} />
        <Route path="reports" element={<div className="py-24 text-center">Reports Placeholder</div>} />
      </Route>

      {/* Conditionally rendered based on role/auth */}
      <Route path="/projects" element={<ProjectsRoute />} />
      <Route path="/projects/:id" element={<ProjectDetailRoute />} />

      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />

      {/* Authenticated Dashboard */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/add-project" element={<AddProjectPage />} />
        <Route path="/risk-analytics" element={<RiskAnalyticsPage />} />
        <Route path="/early-warnings" element={<AlertsPage />} />
        <Route path="/recommendations" element={<RecommendationsPage />} />
        <Route path="/model-performance" element={<ModelPerformancePage />} />
        <Route path="/data-upload" element={<DataUploadPage />} />
        <Route path="/ai-assistant" element={<AiAssistantPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
