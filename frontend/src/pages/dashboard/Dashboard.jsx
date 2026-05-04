import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, MessageSquare, Clock, CheckCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import KpiCard from '../../components/ui/KpiCard';
import { getMyChatbotsApi } from '../../api/chatbot';
import { getChatbotAppointmentsApi } from '../../api/appointments';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

// Badge de estado para cada cita
const StatusBadge = ({ status, t }) => {
  const styles = {
    confirmed: { bg: 'var(--accent-bg)', color: 'var(--accent)' },
    pending: { bg: 'var(--bg-tertiary)', color: 'var(--text-2)' },
    cancelled: { bg: 'var(--error-bg)', color: 'var(--error)' },
    completed: { bg: 'var(--success-bg)', color: 'var(--success)' },
  };
  const s = styles[status] || styles.pending;
  return (
    <span
      className="text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ background: s.bg, color: s.color }}
    >
      {t(status)}
    </span>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const { t, formatDate, formatTime } = useSettings();

  // Obtiene los chatbots del cliente autenticado
  const { data: chatbotsData } = useQuery({
    queryKey: ['chatbots'],
    queryFn: () => getMyChatbotsApi().then((r) => r.data),
  });

  const chatbots = chatbotsData?.chatbots || [];
  const chatbotId = chatbots[0]?.id;

  // Obtiene las citas del primer chatbot encontrado
  const { data: appointmentsData } = useQuery({
    queryKey: ['appointments', chatbotId],
    queryFn: () => getChatbotAppointmentsApi(chatbotId).then((r) => r.data),
    enabled: !!chatbotId,
  });

  const appointments = appointmentsData?.appointments || [];

  // Filtra solo las citas confirmadas
  const confirmed = appointments.filter((a) => a.status === 'confirmed');

  // Ordena y limita las próximas citas
  const upcoming = confirmed
    .filter((a) => new Date(a.date) > new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  // Calcula los días restantes del trial
  const trialDaysLeft = user?.trialEndsAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(user.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24),
        ),
      )
    : null;

  return (
    <DashboardLayout title="Dashboard">
      {/* Banner de trial */}
      {user?.plan === 'trial' && trialDaysLeft !== null && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
          style={{
            background: 'var(--accent-bg)',
            color: 'var(--accent)',
            border: '0.5px solid var(--accent)',
          }}
        >
          <Clock size={14} className="shrink-0" />
          <span>
            {trialDaysLeft > 0
              ? `${trialDaysLeft} day(s) left in your free trial`
              : 'Your free trial has expired — upgrade to continue'}
          </span>
        </motion.div>
      )}

      {/* Grid de KPIs — 2 columnas en móvil, 4 en desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <KpiCard
          title={t('chatbots')}
          value={chatbots.length}
          subtitle={t('active')}
          icon={MessageSquare}
        />
        <KpiCard
          title={t('total')}
          value={appointments.length}
          subtitle={t('appointments')}
          icon={Calendar}
        />
        <KpiCard
          title={t('confirmed')}
          value={confirmed.length}
          subtitle={t('pending')}
          icon={CheckCircle}
          color="var(--success)"
        />
        <KpiCard
          title={t('today')}
          value={
            upcoming.filter((a) => {
              const d = new Date(a.date);
              const now = new Date();
              return d.toDateString() === now.toDateString();
            }).length
          }
          subtitle={t('appointments')}
          icon={Clock}
        />
      </div>

      {/* Tabla de próximas citas */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Encabezado */}
        <div
          className="px-4 md:px-5 py-4 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--border)' }}
        >
          <h2
            className="text-sm font-semibold"
            style={{ color: 'var(--text-1)' }}
          >
            {t('upcomingAppts')}
          </h2>
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>
            {upcoming.length} {t('pending')}
          </span>
        </div>

        {/* Estado vacío */}
        {upcoming.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Calendar
              size={28}
              className="mx-auto mb-3"
              style={{ color: 'var(--text-3)' }}
            />
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>
              {t('noUpcoming')}
            </p>
          </div>
        ) : (
          // Lista de citas con animación escalonada
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {upcoming.map((apt, i) => {
              const date = new Date(apt.date);
              return (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="px-4 md:px-5 py-3.5 flex items-center justify-between gap-3"
                >
                  {/* Nombre y servicio */}
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span
                      className="text-sm font-medium truncate"
                      style={{ color: 'var(--text-1)' }}
                    >
                      {apt.guestName}
                    </span>
                    <span
                      className="text-xs truncate"
                      style={{ color: 'var(--text-3)' }}
                    >
                      {apt.service} · {apt.durationMins} min
                    </span>
                  </div>

                  {/* Fecha y badge */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p
                        className="text-xs font-medium"
                        style={{ color: 'var(--text-1)' }}
                      >
                        {formatDate(date, {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                        {formatTime(date, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <p
                      className="text-xs font-medium sm:hidden"
                      style={{ color: 'var(--text-3)' }}
                    >
                      {formatTime(date, { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <StatusBadge status={apt.status} t={t} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
