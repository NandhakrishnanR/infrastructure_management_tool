import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { MainLayout } from '../layouts/MainLayout.js';
import { AuthLayout } from '../layouts/AuthLayout.js';

// Pages
import { LoginPage } from '../pages/LoginPage.js';
import { DashboardPage } from '../pages/DashboardPage.js';
import { RequestsPage } from '../pages/RequestsPage.js';
import { CreateRequestPage } from '../pages/CreateRequestPage.js';
import { RequestDetailPage } from '../pages/RequestDetailPage.js';
import { ApprovalsPage } from '../pages/ApprovalsPage.js';
import { InventoryPage } from '../pages/InventoryPage.js';
import { JobsPage } from '../pages/JobsPage.js';
import { AuditLogsPage } from '../pages/AuditLogsPage.js';
import { QuotasPage } from '../pages/QuotasPage.js';

const ProtectedRoute: React.FC<{ children: React.ReactNode; requireAdmin?: boolean }> = ({
  children,
  requireAdmin = false,
}) => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner message="Verifying session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Main app protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/requests" element={<RequestsPage />} />
        <Route path="/requests/new" element={<CreateRequestPage />} />
        <Route path="/requests/:id" element={<RequestDetailPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/inventory/:id" element={<InventoryPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/jobs/:id" element={<JobsPage />} />

        {/* Admin only routes */}
        <Route
          path="/approvals"
          element={
            <ProtectedRoute requireAdmin>
              <ApprovalsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute requireAdmin>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quotas"
          element={
            <ProtectedRoute requireAdmin>
              <QuotasPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
