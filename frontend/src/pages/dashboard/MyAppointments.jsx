import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Calendar, Clock, X, ChevronDown } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/ui/Button';
import { getMyChatbotsApi } from '../../api/chatbot';
import { useSettings } from '../../context/SettingsContext';
import {
  getChatbotAppointmentsApi,
  cancelAppointmentApi,
} from '../../api/appointments';

// Colores por estado de cita
const STATUS_COLORS = {
  confirmed: { color: 'var(--accent)', bg: 'var(--accent-bg)' },
  pending: { color: 'var(--text-3)', bg: 'var(--bg-tertiary)' },
  cancelled: { color: 'var(--error)', bg: 'var(--error-bg)' },
  completed: { color: 'var(--success)', bg: 'var(--success-bg)' },
};

const TAB_IDS = ['all', 'confirmed', 'completed', 'cancelled'];

const MyAppointments = () => {
  const queryClient = useQueryClient();
  const { formatDate, formatTime, t } = useSettings();
  const [activeTab, setActiveTab] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);

  const { data: chatbotsData } = useQuery({
    queryKey: ['chatbots'],
    queryFn: () => getMyChatbotsApi().then((r) => r.data),
  });

  const chatbotId = chatbotsData?.chatbots?.[0]?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', chatbotId],
    queryFn: () => getChatbotAppointmentsApi(chatbotId).then((r) => r.data),
    enabled: !!chatbotId,
  });

  const appointments = data?.appointments || [];

  // Filtra las citas según el tab activo
  const filtered = appointments.filter((a) =>
    activeTab === 'all' ? true : a.status === activeTab,
  );

  // Ordena las citas — las más recientes primero
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );

  // Mutación para cancelar una cita
  const cancelMutation = useMutation({
    mutationFn: cancelAppointmentApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments', chatbotId]);
      toast.success(t('apptCancelled'));
      setConfirmingId(null);
      setExpandedId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading)
    return (
      <DashboardLayout title={t('appointments')}>
        <div className="flex items-center justify-center h-48">
          <span
            className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
            style={{
              borderColor: 'var(--accent)',
              borderTopColor: 'transparent',
            }}
          />
        </div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout title={t('appointments')}>
      {/* Encabezado */}
      <div className="mb-5">
        <h2
          className="text-base md:text-lg font-semibold"
          style={{ color: 'var(--text-1)' }}
        >
          {t('yourAppts')}
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
          {appointments.length} total
        </p>
      </div>

      {/* Tabs de filtro */}
      <div
        className="flex gap-1 mb-5 p-1 rounded-xl overflow-x-auto"
        style={{
          background: 'var(--bg-secondary)',
          border: '0.5px solid var(--border)',
        }}
      >
        {TAB_IDS.map((id) => {
          const label = id === 'all' ? t('allTab') : t(id);
          const count =
            id === 'all'
              ? appointments.length
              : appointments.filter((a) => a.status === id).length;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex-1 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center justify-center gap-1.5"
              style={{
                background: activeTab === id ? 'var(--accent)' : 'transparent',
                color: activeTab === id ? '#fff' : 'var(--text-3)',
              }}
            >
              {label}
              {count > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-[10px]"
                  style={{
                    background:
                      activeTab === id
                        ? 'rgba(255,255,255,0.25)'
                        : 'var(--bg-tertiary)',
                    color: activeTab === id ? '#fff' : 'var(--text-3)',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Estado vacío */}
      {sorted.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 rounded-2xl border"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--bg-secondary)',
          }}
        >
          <Calendar
            size={32}
            className="mb-3"
            style={{ color: 'var(--text-3)' }}
          />
          <p
            className="text-sm font-medium mb-1"
            style={{ color: 'var(--text-1)' }}
          >
            {t('noAppts')}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>
            {activeTab === 'all'
              ? t('noApptsFull')
              : t('noApptsFiltered', activeTab)}
          </p>
        </motion.div>
      ) : (
        // Lista de citas
        <div className="flex flex-col gap-3">
          <AnimatePresence>
            {sorted.map((apt, i) => {
              const date = new Date(apt.date);
              const statusStyle =
                STATUS_COLORS[apt.status] || STATUS_COLORS.pending;
              const isPast = date < new Date();
              const isExpanded = expandedId === apt.id;

              return (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-2xl border overflow-hidden"
                  style={{
                    background: 'var(--bg-secondary)',
                    borderColor: 'var(--border)',
                  }}
                >
                  {/* Fila principal de la cita */}
                  <div
                    className="p-4 flex items-center justify-between gap-3 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : apt.id)}
                  >
                    {/* Fecha compacta */}
                    <div
                      className="w-12 flex flex-col items-center shrink-0 rounded-xl py-2"
                      style={{ background: 'var(--bg-tertiary)' }}
                    >
                      <span
                        className="text-xs font-medium"
                        style={{ color: 'var(--text-3)' }}
                      >
                        {formatDate(date, { month: 'short' })}
                      </span>
                      <span
                        className="text-lg font-bold leading-tight"
                        style={{ color: 'var(--text-1)' }}
                      >
                        {formatDate(date, { day: 'numeric' })}
                      </span>
                    </div>

                    {/* Info del servicio */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: 'var(--text-1)' }}
                      >
                        {apt.service}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock size={11} style={{ color: 'var(--text-3)' }} />
                        <span
                          className="text-xs"
                          style={{ color: 'var(--text-3)' }}
                        >
                          {formatTime(date, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {' · '}
                          {apt.durationMins} min
                        </span>
                      </div>
                    </div>

                    {/* Badge de estado y chevron */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{
                          background: statusStyle.bg,
                          color: statusStyle.color,
                        }}
                      >
                        {t(apt.status)}
                      </span>
                      <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                        <ChevronDown
                          size={14}
                          style={{ color: 'var(--text-3)' }}
                        />
                      </motion.div>
                    </div>
                  </div>

                  {/* Panel expandible con detalles */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div
                          className="px-4 pb-4 border-t"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          {/* Detalles de la cita */}
                          <div className="pt-3 flex flex-col gap-2 mb-4">
                            {[
                              { label: t('service'), value: apt.service },
                              { label: t('price'), value: '€' + apt.price },
                              {
                                label: t('duration'),
                                value: apt.durationMins + ' min',
                              },
                              {
                                label: t('date'),
                                value: formatDate(date, {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                }),
                              },
                              {
                                label: t('time'),
                                value: formatTime(date, {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }),
                              },
                            ].map(({ label, value }) => (
                              <div
                                key={label}
                                className="flex justify-between items-center"
                              >
                                <span
                                  className="text-xs"
                                  style={{ color: 'var(--text-3)' }}
                                >
                                  {label}
                                </span>
                                <span
                                  className="text-xs font-medium"
                                  style={{ color: 'var(--text-1)' }}
                                >
                                  {value}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Botón cancelar — solo para citas confirmadas y futuras */}
                          {apt.status === 'confirmed' && !isPast && (
                            <div>
                              {confirmingId === apt.id ? (
                                <div className="flex items-center gap-2">
                                  <p
                                    className="text-xs flex-1"
                                    style={{ color: 'var(--text-3)' }}
                                  >
                                    {t('cancelThisAppt')}
                                  </p>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    loading={cancelMutation.isPending}
                                    onClick={() =>
                                      cancelMutation.mutate(apt.id)
                                    }
                                  >
                                    {t('yesCancel')}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setConfirmingId(null)}
                                  >
                                    <X size={13} />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="danger"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => setConfirmingId(apt.id)}
                                >
                                  {t('cancelAppt')}
                                </Button>
                              )}
                            </div>
                          )}

                          {/* Mensaje para citas pasadas */}
                          {apt.status === 'confirmed' && isPast && (
                            <p
                              className="text-xs text-center"
                              style={{ color: 'var(--text-3)' }}
                            >
                              {t('pastAppt')}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MyAppointments;
