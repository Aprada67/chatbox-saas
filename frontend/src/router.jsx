import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth as useClerkAuth, SignIn, RedirectToSignIn } from '@clerk/clerk-react';
import { useAuth } from './context/AuthContext';
import Dashboard from './pages/dashboard/Dashboard';
import ChatbotsPage from './pages/dashboard/ChatbotsPage';
import CalendarPage from './pages/dashboard/Calendar';
import Settings from './pages/dashboard/Settings';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminChatbots from './pages/admin/AdminChatbots';
import ChatbotPage from './pages/chatbot/ChatbotPage';
import MyAppointments from './pages/dashboard/MyAppointments';
import Billing from './pages/dashboard/Billing';
import Analytics from './pages/dashboard/Analytics';
import Landing from './pages/Landing';
import Register from './pages/auth/Register';

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
    <span className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
  </div>
);

const PrivateRoute = ({ children, role }) => {
  const { isSignedIn, isLoaded } = useClerkAuth();
  const { user, loading } = useAuth();
  if (!isLoaded || loading) return <Spinner />;
  if (!isSignedIn) return <RedirectToSignIn />;
  if (role && user?.role !== role) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRouter = () => {
  const { isSignedIn, isLoaded } = useClerkAuth();
  if (!isLoaded) return <Spinner />;

  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth routes */}
        <Route path="/login" element={isSignedIn ? <Navigate to="/dashboard" /> : <div className="min-h-screen flex items-center justify-center" style={{background:'var(--bg-primary)'}}><SignIn routing="hash" afterSignInUrl="/dashboard" /></div>} />
        <Route path="/register" element={isSignedIn ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/chat/:slug" element={<ChatbotPage />} />

        {/* Client routes */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/dashboard/chatbots" element={<PrivateRoute><ChatbotsPage /></PrivateRoute>} />
        <Route path="/dashboard/calendar" element={<PrivateRoute><CalendarPage /></PrivateRoute>} />
        <Route path="/dashboard/appointments" element={<PrivateRoute><MyAppointments /></PrivateRoute>} />
        <Route path="/dashboard/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
        <Route path="/dashboard/billing" element={<PrivateRoute><Billing /></PrivateRoute>} />
        <Route path="/dashboard/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />

        {/* Admin routes */}
        <Route path="/admin" element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/users" element={<PrivateRoute role="admin"><AdminUsers /></PrivateRoute>} />
        <Route path="/admin/chatbots" element={<PrivateRoute role="admin"><AdminChatbots /></PrivateRoute>} />
        <Route path="/admin/settings" element={<PrivateRoute role="admin"><Settings /></PrivateRoute>} />

        {/* Redirects */}
        <Route path="/" element={<Landing />} />
        <Route path="*" element={<Navigate to={isSignedIn ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
