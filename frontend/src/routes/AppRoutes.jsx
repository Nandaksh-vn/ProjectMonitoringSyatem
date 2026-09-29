import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
import { LoadingState } from '../components/ui/Shared';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#060b18] flex items-center justify-center"><LoadingState message="Authenticating..." /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
      <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
      <Route path="/risk-analytics" element={<ProtectedRoute><RiskAnalyticsPage /></ProtectedRoute>} />
      <Route path="/alerts" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
      <Route path="/recommendations" element={<ProtectedRoute><RecommendationsPage /></ProtectedRoute>} />
      <Route path="/model-performance" element={<ProtectedRoute><ModelPerformancePage /></ProtectedRoute>} />
      <Route path="/data-upload" element={<ProtectedRoute><DataUploadPage /></ProtectedRoute>} />
      <Route path="/ai-assistant" element={<ProtectedRoute><AiAssistantPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
