import { useEffect, useRef, useState } from 'react';
import { Moon, Sun, Bell, Calendar, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getNotificationsApi, markAsReadApi, markAllAsReadApi } from '../../api/notifications';

const TYPE_ICON = {
  new_appointment: <Calendar size={14} />,
  cancellation: <X size={14} />,
};

const TYPE_COLOR = {
  new_appointment: 'var(--success)',
  cancellation: 'var(--error)',
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
};

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotificationsApi().then((r) => r.data),
    refetchInterval: 30000,
    enabled: !!user,
  });

  const notifications = data?.notifications || [];
  const unread = data?.unreadCount || 0;

  const { mutate: readOne } = useMutation({
    mutationFn: markAsReadApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const { mutate: readAll } = useMutation({
    mutationFn: markAllAsReadApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen((p) => !p)}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer"
        style={{ color: 'var(--text-3)', background: 'var(--bg-tertiary)' }}
      >
        <Bell size={15} />
        {unread > 0 && (
          <span
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white"
            style={{ background: 'var(--error)', fontSize: '10px', fontWeight: 700 }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-10 w-80 rounded-2xl border shadow-xl z-50 overflow-hidden"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                Notificaciones
              </span>
              {unread > 0 && (
                <button
                  onClick={() => readAll()}
                  className="text-xs cursor-pointer"
                  style={{ color: 'var(--accent)' }}
                >
                  Marcar todo como leído
                </button>
              )}
            </div>

            {/* List */}
            <div className="overflow-y-auto" style={{ maxHeight: '360px' }}>
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell size={24} style={{ color: 'var(--text-3)', margin: '0 auto 8px' }} />
                  <p className="text-sm" style={{ color: 'var(--text-3)' }}>No hay notificaciones</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => { if (!n.isRead) readOne(n.id); }}
                    className="w-full text-left flex items-start gap-3 px-4 py-3 border-b cursor-pointer transition-colors"
                    style={{
                      borderColor: 'var(--border)',
                      background: n.isRead ? 'transparent' : 'var(--accent-bg)',
                    }}
                  >
                    {/* Icon */}
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        background: (TYPE_COLOR[n.type] || 'var(--accent)') + '22',
                        color: TYPE_COLOR[n.type] || 'var(--accent)',
                      }}
                    >
                      {TYPE_ICON[n.type] || <Bell size={14} />}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-semibold truncate"
                        style={{ color: 'var(--text-1)' }}
                      >
                        {n.title}
                      </p>
                      <p
                        className="text-xs mt-0.5 leading-relaxed"
                        style={{ color: 'var(--text-2)' }}
                      >
                        {n.message}
                      </p>
                      <p className="text-[10px] mt-1" style={{ color: 'var(--text-3)' }}>
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>

                    {/* Unread dot */}
                    {!n.isRead && (
                      <div
                        className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                        style={{ background: 'var(--accent)' }}
                      />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TopBar = ({ title }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className="h-14 flex items-center justify-between px-4 md:px-6 border-b shrink-0"
      style={{
        background: 'var(--bg-secondary)',
        borderColor: 'var(--border)',
      }}
    >
      <h1 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
        {title}
      </h1>

      <div className="flex items-center gap-2">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-all cursor-pointer"
          style={{ color: 'var(--text-3)', background: 'var(--bg-tertiary)' }}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </motion.button>

        <NotificationBell />
      </div>
    </header>
  );
};

export default TopBar;
