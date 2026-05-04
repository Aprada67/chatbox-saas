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
import { useAuth }     from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { toast }       from 'react-hot-toast';

// Keys de traducción por item de navegación
const navItems = [
  { key: 'dashboard',    icon: LayoutDashboard, path: '/dashboard',              roles: ['client', 'admin'] },
  { key: 'chatbots',     icon: MessageSquare,   path: '/dashboard/chatbots',     roles: ['client'] },
  { key: 'calendar',     icon: Calendar,        path: '/dashboard/calendar',     roles: ['client'] },
  { key: 'appointments', icon: Calendar,        path: '/dashboard/appointments', roles: ['client'] },
  { key: 'settings',     icon: Settings,        path: '/dashboard/settings',     roles: ['client', 'admin'] },
  { key: 'clients',      icon: Users,           path: '/admin/users',            roles: ['admin'] },
  { key: 'chatbots',     icon: MessageSquare,   path: '/admin/chatbots',         roles: ['admin'] },
];

const Sidebar = () => {
  const { user, logout }   = useAuth();
  const { t }              = useSettings();
  const location           = useLocation();
  const navigate           = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success(t('loggedOut'));
    navigate('/login');
  };

  const filtered = navItems.filter((i) => i.roles.includes(user?.role));

  return (
    <>
      {/* ── BOTTOM NAV — móvil ── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-2 border-t"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
      >
        {filtered.slice(0, 4).map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className="flex flex-col items-center gap-0.5 px-3 py-1">
              <motion.div whileTap={{ scale: 0.85 }}>
                <item.icon size={22} style={{ color: active ? 'var(--accent)' : 'var(--text-3)' }} />
              </motion.div>
              <span className="text-[10px] font-medium"
                    style={{ color: active ? 'var(--accent)' : 'var(--text-3)' }}>
                {t(item.key)}
              </span>
            </Link>
          );
        })}
        <button onClick={() => setDrawerOpen(true)} className="flex flex-col items-center gap-0.5 px-3 py-1">
          <Menu size={22} style={{ color: 'var(--text-3)' }} />
          <span className="text-[10px] font-medium" style={{ color: 'var(--text-3)' }}>
            More
          </span>
        </button>
      </nav>

      {/* ── DRAWER MÓVIL ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-50"
              style={{ background: '#00000077' }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t pb-8"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
            >
              <div className="flex justify-center pt-3 pb-4">
                <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border-2)' }} />
              </div>
              <div className="px-5 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{user?.name}</p>
                <p className="text-xs capitalize mt-0.5" style={{ color: 'var(--text-3)' }}>{user?.plan} plan</p>
              </div>
              <div className="px-4 pt-3 flex flex-col gap-1">
                {filtered.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setDrawerOpen(false)}>
                      <motion.div
                        whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
                        style={{
                          background: active ? 'var(--accent-bg)' : 'transparent',
                          color:      active ? 'var(--accent)'    : 'var(--text-2)',
                        }}
                      >
                        <item.icon size={18} />
                        {t(item.key)}
                      </motion.div>
                    </Link>
                  );
                })}
                <motion.button
                  whileTap={{ scale: 0.97 }} onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm mt-2"
                  style={{ color: 'var(--error)' }}
                >
                  <LogOut size={18} />
                  {t('signOut')}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── SIDEBAR DESKTOP ── */}
      <aside
        className="hidden lg:flex w-56 h-screen flex-col border-r shrink-0"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
      >
        <div className="px-5 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                 style={{ background: 'var(--accent)' }}>
              <MessageSquare size={14} color="white" />
            </div>
            <span className="font-semibold text-sm tracking-tight" style={{ color: 'var(--text-1)' }}>
              Chatbox
            </span>
          </div>
        </div>

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
                    color:      active ? 'var(--accent)'    : 'var(--text-3)',
                  }}
                >
                  <item.icon size={16} />
                  {t(item.key)}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-medium truncate" style={{ color: 'var(--text-1)' }}>{user?.name}</p>
            <p className="text-xs truncate capitalize mt-0.5" style={{ color: 'var(--text-3)' }}>{user?.plan} plan</p>
          </div>
          <motion.button
            whileHover={{ x: 2 }} onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
            style={{ color: 'var(--text-3)' }}
          >
            <LogOut size={16} />
            {t('signOut')}
          </motion.button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
