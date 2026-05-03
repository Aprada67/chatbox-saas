import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import ChatbotsPage from './pages/dashboard/ChatbotsPage';
import CalendarPage from './pages/dashboard/Calendar';
import Settings from './pages/dashboard/Settings';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminChatbots from './pages/admin/AdminChatbots';
import ChatbotPage from './pages/chatbot/ChatbotPage';
import MyAppointments from './pages/dashboard/MyAppointments';
import Landing from './pages/Landing'

// Spinner de carga global
const Spinner = () => (
  <div
    className="min-h-screen flex items-center justify-center"
    style={{ background: 'var(--bg-primary)' }}
  >
    <span
      className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
      style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
    />
  </div>
);

// Ruta protegida — redirige al login si no hay sesión activa
const PrivateRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRouter = () => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/register"
          element={!user ? <Register /> : <Navigate to="/dashboard" />}
        />
        <Route path="/chat/:slug" element={<ChatbotPage />} />

        {/* Rutas del cliente */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/chatbots"
          element={
            <PrivateRoute>
              <ChatbotsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/calendar"
          element={
            <PrivateRoute>
              <CalendarPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/appointments"
          element={
            <PrivateRoute>
              <MyAppointments />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />

        {/* Rutas del admin */}
        <Route
          path="/admin"
          element={
            <PrivateRoute role="admin">
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <PrivateRoute role="admin">
              <AdminUsers />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/chatbots"
          element={
            <PrivateRoute role="admin">
              <AdminChatbots />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <PrivateRoute role="admin">
              <Settings />
            </PrivateRoute>
          }
        />

        {/* Redirecciones */}
        <Route path="/" element={<Landing />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
