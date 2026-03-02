import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout.tsx';
import AuthPage from './pages/AuthPage.tsx';
import DashboardPage from './pages/DashboardPage.tsx';
import LandingPage from './pages/LandingPage.tsx';
import ProfilePage from './pages/ProfilePage.tsx';
import EmailClientSetupPage from './pages/EmailClientSetupPage.tsx';
import VerifyForwardingPage from './pages/VerifyForwardingPage.tsx';
import VerifyPage from './pages/VerifyPage.tsx';
import PlanSelectionPage from './pages/PlanSelectionPage.tsx';
import RequireSubscription from './components/RequireSubscription.tsx';
import { AuthProvider } from './hooks/AuthProvider.tsx';
import { useAuth } from './hooks/useAuth.ts';

function AppShell() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth/login" replace />;

  return (
    <Routes>
      {/* Setup Routes (Standalone, No Sidebar Layout) */}
      <Route path="/setup/email-client" element={<EmailClientSetupPage />} />
      <Route path="/setup/verify-forwarding" element={<VerifyForwardingPage />} />

      {/* Main Application Routes inside styling layout */}
      <Route element={<RequireSubscription><AppLayout /></RequireSubscription>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<Navigate to="/auth/login" replace />} />
          <Route path="/auth/login" element={<AuthPage />} />
          <Route path="/auth/register" element={<AuthPage />} />
          <Route path="/verify/:token" element={<VerifyPage />} />
          <Route path="/plan-selection" element={<PlanSelectionPage />} />

          {/* Protected Routes */}
          <Route path="/*" element={<AppShell />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
