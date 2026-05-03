import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  MessageSquare,
  Calendar,
  Settings,
  LogOut,
  Users,
  Menu,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

// Elementos de navegación filtrados por rol
const navItems = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    roles: ['client', 'admin'],
  },
  {
    label: 'Chatbots',
    icon: MessageSquare,
    path: '/dashboard/chatbots',
    roles: ['client'],
  },
  {
    label: 'Calendar',
    icon: Calendar,
    path: '/dashboard/calendar',
    roles: ['client'],
  },
  { label: 'Clients', icon: Users, path: '/admin/users', roles: ['admin'] },
  {
    label: 'Chatbots',
    icon: MessageSquare,
    path: '/admin/chatbots',
    roles: ['admin'],
  },
  {
    label: 'Settings',
    icon: Settings,
    path: '/dashboard/settings',
    roles: ['client', 'admin'],
  },
  {
    label: 'Appointments',
    icon: Calendar,
    path: '/dashboard/appointments',
    roles: ['client'],
  },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  // Controla si el drawer móvil está abierto
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Cierra sesión y redirige al login
  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  // Filtra los items según el rol del usuario
  const filtered = navItems.filter((i) => i.roles.includes(user?.role));

  return (
    <>
      {/* ── BOTTOM NAV — visible solo en móvil ── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-2 border-t"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border)',
        }}
      >
        {filtered.slice(0, 4).map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center gap-0.5 px-3 py-1"
            >
              <motion.div whileTap={{ scale: 0.85 }}>
                <item.icon
                  size={22}
                  style={{ color: active ? 'var(--accent)' : 'var(--text-3)' }}
                />
              </motion.div>
              <span
                className="text-[10px] font-medium"
                style={{ color: active ? 'var(--accent)' : 'var(--text-3)' }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
        {/* Botón de menú para ver más opciones */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex flex-col items-center gap-0.5 px-3 py-1"
        >
          <Menu size={22} style={{ color: 'var(--text-3)' }} />
          <span
            className="text-[10px] font-medium"
            style={{ color: 'var(--text-3)' }}
          >
            More
          </span>
        </button>
      </nav>

      {/* ── DRAWER MÓVIL — se abre desde el botón More ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Overlay oscuro */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-50"
              style={{ background: '#00000077' }}
              onClick={() => setDrawerOpen(false)}
            />
            {/* Drawer deslizable desde abajo */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t pb-8"
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border)',
              }}
            >
              {/* Handle del drawer */}
              <div className="flex justify-center pt-3 pb-4">
                <div
                  className="w-10 h-1 rounded-full"
                  style={{ background: 'var(--border-2)' }}
                />
              </div>

              {/* Info del usuario */}
              <div
                className="px-5 pb-4 border-b"
                style={{ borderColor: 'var(--border)' }}
              >
                <p
                  className="text-sm font-semibold"
                  style={{ color: 'var(--text-1)' }}
                >
                  {user?.name}
                </p>
                <p
                  className="text-xs capitalize mt-0.5"
                  style={{ color: 'var(--text-3)' }}
                >
                  {user?.plan} plan
                </p>
              </div>

              {/* Todos los items de navegación */}
              <div className="px-4 pt-3 flex flex-col gap-1">
                {filtered.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setDrawerOpen(false)}
                    >
                      <motion.div
                        whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
                        style={{
                          background: active
                            ? 'var(--accent-bg)'
                            : 'transparent',
                          color: active ? 'var(--accent)' : 'var(--text-2)',
                        }}
                      >
                        <item.icon size={18} />
                        {item.label}
                      </motion.div>
                    </Link>
                  );
                })}

                {/* Botón de logout */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm mt-2"
                  style={{ color: 'var(--error)' }}
                >
                  <LogOut size={18} />
                  Sign out
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── SIDEBAR — visible solo en desktop ── */}
      <aside
        className="hidden lg:flex w-56 h-screen flex-col border-r flex-shrink-0"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Logo */}
        <div
          className="px-5 py-5 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--accent)' }}
            >
              <MessageSquare size={14} color="white" />
            </div>
            <span
              className="font-semibold text-sm tracking-tight"
              style={{ color: 'var(--text-1)' }}
            >
              Chatbox
            </span>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {filtered.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ x: 2 }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: active ? 'var(--accent-bg)' : 'transparent',
                    color: active ? 'var(--accent)' : 'var(--text-3)',
                  }}
                >
                  <item.icon size={16} />
                  {item.label}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Info usuario y logout */}
        <div
          className="px-3 py-4 border-t"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="px-3 py-2 mb-1">
            <p
              className="text-xs font-medium truncate"
              style={{ color: 'var(--text-1)' }}
            >
              {user?.name}
            </p>
            <p
              className="text-xs truncate capitalize mt-0.5"
              style={{ color: 'var(--text-3)' }}
            >
              {user?.plan} plan
            </p>
          </div>
          <motion.button
            whileHover={{ x: 2 }}
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
            style={{ color: 'var(--text-3)' }}
          >
            <LogOut size={16} />
            Sign out
          </motion.button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
