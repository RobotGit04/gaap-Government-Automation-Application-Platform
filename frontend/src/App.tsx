import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/auth.store';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { NewApplicationPage } from './pages/NewApplicationPage';
import { ApplicationDetailPage } from './pages/ApplicationDetailPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { Layout } from './components/layout/Layout';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' },
          }}
        />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout><DashboardPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/applications/new"
            element={
              <ProtectedRoute>
                <Layout><NewApplicationPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/applications/:id"
            element={
              <ProtectedRoute>
                <Layout><ApplicationDetailPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <Layout><AdminDashboardPage /></Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
