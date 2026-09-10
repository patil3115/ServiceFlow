import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TicketListPage from './pages/TicketListPage';
import TicketCreatePage from './pages/TicketCreatePage';
import TicketDetailPage from './pages/TicketDetailPage';
import SlaReportPage from './pages/SlaReportPage';
import AuditLogsPage from './pages/AuditLogsPage';
import UsersPage from './pages/UsersPage';
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Application Workspace */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tickets" element={<TicketListPage />} />
              <Route path="/tickets/new" element={<TicketCreatePage />} />
              <Route path="/tickets/:id" element={<TicketDetailPage />} />

              {/* Agent & Admin Restricted Routes */}
              <Route element={<ProtectedRoute allowedRoles={['SUPPORT_AGENT', 'ADMIN']} />}>
                <Route path="/sla" element={<SlaReportPage />} />
              </Route>

              {/* Admin Only Restricted Routes */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/audit-logs" element={<AuditLogsPage />} />
                <Route path="/users" element={<UsersPage />} />
              </Route>

              {/* 404 Inside Layout */}
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
