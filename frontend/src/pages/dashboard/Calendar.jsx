import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Clock, X, Save } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { SkeletonStat } from '../../components/ui/Skeleton';
import { getMyChatbotsApi } from '../../api/chatbot';
import {
  getChatbotAppointmentsApi,
  cancelAppointmentApi,
} from '../../api/appointments';
import { useSettings } from '../../context/SettingsContext';
import api from '../../api/axios';

const LOCALE_MAP = { en: 'en-US', es: 'es-ES', pt: 'pt-BR', fr: 'fr-FR' };

// Colors by appointment status
const STATUS_COLORS = {
  confirmed: '#3b82f6',
  pending: '#94a3b8',
  cancelled: '#e24b4b',
  completed: '#1D9E75',
};

const CalendarPage = () => {
  const queryClient = useQueryClient();
  const { formatDateTime, t, language } = useSettings();

  const locale = LOCALE_MAP[language] || 'en-US';

  // Day names derived from locale — Jan 1 2017 was a Sunday (index 0)
  const DAYS = [0, 1, 2, 3, 4, 5, 6].map((v) => ({
    value: v,
    label: new Date(2017, 0, 1 + v).toLocaleDateString(locale, {
      weekday: 'long',
    }),
  }));

  // Appointment detail modal state
  const [selectedApt, setSelectedApt] = useState(null);

  // Availability panel state
  // localSlots = null means "use server data"; set when user edits
  const [localSlots, setLocalSlots] = useState(null);
  const [showAvail, setShowAvail] = useState(false);

  // Fetches the client's chatbots
  const { data: chatbotsData, isLoading: chatbotsLoading } = useQuery({
    queryKey: ['chatbots'],
    queryFn: () => getMyChatbotsApi().then((r) => r.data),
  });

  const chatbots = chatbotsData?.chatbots || [];
  const chatbotId = chatbots[0]?.id;

  // Fetches appointments for the active chatbot
  const { data: appointmentsData, isLoading: apptLoading } = useQuery({
    queryKey: ['appointments', chatbotId],
    queryFn: () => getChatbotAppointmentsApi(chatbotId).then((r) => r.data),
    enabled: !!chatbotId,
  });

  // Fetches the chatbot's configured availability
  const { data: availabilityData } = useQuery({
    queryKey: ['availability', chatbotId],
    queryFn: () => api.get(`/availability/${chatbotId}`).then((r) => r.data),
    enabled: !!chatbotId,
  });

  const isLoading = chatbotsLoading || (!!chatbotId && apptLoading);

  // Derived state: localSlots overrides server data while the user edits
  const availability = localSlots ?? availabilityData?.slots ?? [];
  const setAvailability = setLocalSlots;

  const appointments = appointmentsData?.appointments || [];

  // Converts appointments to the format FullCalendar understands
  const events = appointments
    .filter((apt) => apt.status !== 'cancelled')
    .map((apt) => ({
      id: apt.id,
      title: `${apt.guestName} — ${apt.service}`,
      start: apt.date,
      end: new Date(
        new Date(apt.date).getTime() + apt.durationMins * 60000,
      ).toISOString(),
      backgroundColor: STATUS_COLORS[apt.status] || STATUS_COLORS.pending,
      borderColor: STATUS_COLORS[apt.status] || STATUS_COLORS.pending,
      extendedProps: apt,
    }));

  // Cancels an appointment and refreshes the list
  const cancelMutation = useMutation({
    mutationFn: cancelAppointmentApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments', chatbotId]);
      toast.success(t('apptCancelled'));
      setSelectedApt(null);
    },
    onError: (err) => toast.error(err.message),
  });

  // Saves availability schedules
  const availMutation = useMutation({
    mutationFn: (slots) => api.post(`/availability/${chatbotId}`, { slots }),
    onSuccess: () => {
      queryClient.invalidateQueries(['availability', chatbotId]);
      toast.success(t('availabilitySaved'));
      setLocalSlots(null); // reset so it reads from the server again
      setShowAvail(false);
    },
    onError: (err) => toast.error(err.message),
  });

  // Toggles a day of the week on or off
  const toggleDay = (day) => {
    const current = localSlots ?? availabilityData?.slots ?? [];
    const exists = current.find((s) => s.dayOfWeek === day);
    if (exists) {
      setLocalSlots(current.filter((s) => s.dayOfWeek !== day));
    } else {
      setLocalSlots([
        ...current,
        { dayOfWeek: day, startTime: '09:00', endTime: '18:00' },
      ]);
    }
  };

  // Updates the start or end time of a day
  const updateSlot = (day, field, value) => {
    const current = localSlots ?? availabilityData?.slots ?? [];
    setLocalSlots(current.map((s) => (s.dayOfWeek === day ? { ...s, [field]: value } : s)));
  };

  // Show skeleton while chatbot / appointment data is loading
  if (isLoading)
    return (
      <DashboardLayout title={t('calendar')}>
        {/* Header row skeleton */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex flex-col gap-2">
            <div className="w-32 h-4 animate-pulse rounded-lg" style={{ background: 'var(--bg-tertiary)' }} />
            <div className="w-20 h-3 animate-pulse rounded-lg" style={{ background: 'var(--bg-tertiary)' }} />
          </div>
          <div className="w-28 h-9 animate-pulse rounded-xl" style={{ background: 'var(--bg-tertiary)' }} />
        </div>

        {/* Status legend skeleton */}
        <div className="flex items-center gap-3 mb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: 'var(--bg-tertiary)' }} />
              <div className="w-14 h-3 animate-pulse rounded-lg" style={{ background: 'var(--bg-tertiary)' }} />
            </div>
          ))}
        </div>

        {/* Calendar area skeleton */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
        >
          {/* Toolbar row */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex gap-2">
              <div className="w-8 h-7 animate-pulse rounded-lg" style={{ background: 'var(--bg-tertiary)' }} />
              <div className="w-8 h-7 animate-pulse rounded-lg" style={{ background: 'var(--bg-tertiary)' }} />
            </div>
            <div className="w-28 h-4 animate-pulse rounded-lg" style={{ background: 'var(--bg-tertiary)' }} />
            <div className="flex gap-2">
              <div className="w-16 h-7 animate-pulse rounded-lg" style={{ background: 'var(--bg-tertiary)' }} />
              <div className="w-16 h-7 animate-pulse rounded-lg" style={{ background: 'var(--bg-tertiary)' }} />
            </div>
          </div>
          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--border)' }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="py-3 flex justify-center"
                style={{ background: 'var(--bg-tertiary)' }}
              >
                <div className="w-8 h-3 animate-pulse rounded" style={{ background: 'var(--border)' }} />
              </div>
            ))}
          </div>
          {/* Calendar grid rows — 5 weeks */}
          {Array.from({ length: 5 }).map((_, row) => (
            <div
              key={row}
              className="grid grid-cols-7 border-b last:border-b-0"
              style={{ borderColor: 'var(--border)' }}
            >
              {Array.from({ length: 7 }).map((_, col) => (
                <div
                  key={col}
                  className="h-20 border-r last:border-r-0 p-1.5"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'var(--bg-secondary)',
                  }}
                >
                  <div
                    className="w-6 h-4 animate-pulse rounded"
                    style={{ background: 'var(--bg-tertiary)' }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </DashboardLayout>
    );

  // If no chatbot exists, show a guide message
  if (!chatbotId)
    return (
      <DashboardLayout title={t('calendar')}>
        <div className="flex flex-col items-center justify-center py-20">
          <Clock
            size={36}
            className="mb-4"
            style={{ color: 'var(--text-3)' }}
          />
          <p
            className="text-sm text-center px-4"
            style={{ color: 'var(--text-3)' }}
          >
            {t('noChatbotCalendar')}
          </p>
        </div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout title={t('calendar')}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2
            className="text-base md:text-lg font-semibold"
            style={{ color: 'var(--text-1)' }}
          >
            {t('appointments')}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
            {appointments.filter((a) => a.status === 'confirmed').length}{' '}
            {t('confirmed').toLowerCase()}
          </p>
        </div>
        <Button
          variant="secondary"
          size="md"
          onClick={() => setShowAvail(true)}
        >
          <Clock size={14} />
          <span className="hidden sm:inline">{t('setAvailability')}</span>
          <span className="sm:hidden">{t('time')}</span>
        </Button>
      </div>

      {/* Status legend */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: color }}
            />
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>
              {t(status)}
            </span>
          </div>
        ))}
      </div>

      {/* Calendar — month view on mobile, week on desktop */}
      <Card className="overflow-hidden p-0">
        <style>{`
          .fc { font-family: inherit; }
          .fc-theme-standard td, .fc-theme-standard th,
          .fc-theme-standard .fc-scrollgrid { border-color: var(--border) !important; }
          .fc-col-header-cell { background: var(--bg-tertiary) !important; }
          .fc-col-header-cell-cushion, .fc-daygrid-day-number,
          .fc-timegrid-slot-label {
            color: var(--text-3) !important;
            text-decoration: none !important;
            font-size: 12px !important;
          }
          .fc-daygrid-day, .fc-timegrid-col { background: var(--bg-secondary) !important; }
          .fc-button-primary {
            background: var(--bg-tertiary) !important;
            border-color: var(--border) !important;
            color: var(--text-2) !important;
            font-size: 12px !important;
            border-radius: 8px !important;
            padding: 4px 10px !important;
          }
          .fc-button-primary:hover { background: var(--border) !important; }
          .fc-button-active {
            background: var(--accent-bg) !important;
            color: var(--accent) !important;
          }
          .fc-toolbar-title {
            color: var(--text-1) !important;
            font-size: 14px !important;
            font-weight: 600 !important;
          }
          .fc-event {
            border-radius: 6px !important;
            font-size: 11px !important;
            cursor: pointer;
          }
          .fc-daygrid-day.fc-day-today,
          .fc-timegrid-col.fc-day-today { background: var(--accent-bg) !important; }
          .fc-toolbar {
            padding: 12px 16px !important;
            flex-wrap: wrap;
            gap: 8px;
          }
          .fc-toolbar-chunk { display: flex; gap: 6px; }
          .fc-button-group { display: flex; gap: 6px; }
        `}</style>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek',
          }}
          events={events}
          eventClick={(info) => setSelectedApt(info.event.extendedProps)}
          height="auto"
          aspectRatio={1.5}
          slotMinTime="07:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
        />
      </Card>

      {/* ── APPOINTMENT DETAIL MODAL ── */}
      <AnimatePresence>
        {selectedApt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ background: '#00000066' }}
            onClick={() => setSelectedApt(null)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6 border"
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border)',
              }}
            >
              {/* Handle visible on mobile only */}
              <div className="flex justify-center mb-4 sm:hidden">
                <div
                  className="w-10 h-1 rounded-full"
                  style={{ background: 'var(--border-2)' }}
                />
              </div>

              {/* Modal header */}
              <div className="flex items-center justify-between mb-5">
                <h3
                  className="text-sm font-semibold"
                  style={{ color: 'var(--text-1)' }}
                >
                  {t('apptDetails')}
                </h3>
                <button
                  onClick={() => setSelectedApt(null)}
                  className="cursor-pointer"
                  style={{ color: 'var(--text-3)' }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Appointment detail rows */}
              <div className="flex flex-col gap-3">
                {[
                  { label: t('client'), value: selectedApt.guestName },
                  { label: t('email'), value: selectedApt.guestEmail || '—' },
                  { label: t('phone'), value: selectedApt.guestPhone || '—' },
                  { label: t('service'), value: selectedApt.service },
                  { label: t('price'), value: `€${selectedApt.price}` },
                  {
                    label: t('duration'),
                    value: `${selectedApt.durationMins} min`,
                  },
                  {
                    label: t('date'),
                    value: formatDateTime(selectedApt.date, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
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

                {/* Status badge with dynamic color */}
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                    {t('status')}
                  </span>
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{
                      background: STATUS_COLORS[selectedApt.status] + '22',
                      color: STATUS_COLORS[selectedApt.status],
                    }}
                  >
                    {t(selectedApt.status)}
                  </span>
                </div>
              </div>

              {/* Cancel button — only visible if the appointment is confirmed */}
              {selectedApt.status === 'confirmed' && (
                <Button
                  variant="danger"
                  size="md"
                  className="w-full mt-5"
                  loading={cancelMutation.isPending}
                  onClick={() => cancelMutation.mutate(selectedApt.id)}
                >
                  {t('cancelAppt')}
                </Button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── AVAILABILITY PANEL ── */}
      <AnimatePresence>
        {showAvail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end"
            style={{ background: '#00000066' }}
            onClick={() => setShowAvail(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:w-80 max-h-[85vh] sm:max-h-full rounded-t-3xl sm:rounded-none border-t sm:border-l overflow-y-auto flex flex-col"
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border)',
              }}
            >
              {/* Handle visible on mobile only */}
              <div className="flex justify-center pt-3 pb-2 sm:hidden">
                <div
                  className="w-10 h-1 rounded-full"
                  style={{ background: 'var(--border-2)' }}
                />
              </div>

              {/* Panel header */}
              <div
                className="flex items-center justify-between px-5 py-4 border-b"
                style={{ borderColor: 'var(--border)' }}
              >
                <h3
                  className="text-sm font-semibold"
                  style={{ color: 'var(--text-1)' }}
                >
                  {t('setAvailability')}
                </h3>
                <button
                  onClick={() => setShowAvail(false)}
                  className="cursor-pointer"
                  style={{ color: 'var(--text-3)' }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* List of configurable days */}
              <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto">
                {DAYS.map((day) => {
                  const slot = availability.find(
                    (s) => s.dayOfWeek === day.value,
                  );
                  const active = !!slot;
                  return (
                    <div
                      key={day.value}
                      className="rounded-xl border p-3 transition-all"
                      style={{
                        borderColor: active ? 'var(--accent)' : 'var(--border)',
                        background: active
                          ? 'var(--accent-bg)'
                          : 'var(--bg-tertiary)',
                      }}
                    >
                      {/* Row with day name and toggle */}
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="text-sm font-medium"
                          style={{
                            color: active ? 'var(--accent)' : 'var(--text-2)',
                          }}
                        >
                          {day.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          className="w-10 h-6 rounded-full transition-all relative flex-shrink-0 cursor-pointer"
                          style={{
                            background: active
                              ? 'var(--accent)'
                              : 'var(--border)',
                          }}
                        >
                          <motion.div
                            animate={{ x: active ? 18 : 2 }}
                            className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                          />
                        </button>
                      </div>

                      {/* Time selectors — visible only when the day is active */}
                      {active && (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) =>
                              updateSlot(day.value, 'startTime', e.target.value)
                            }
                            style={{ fontSize: '13px', padding: '5px 8px' }}
                          />
                          <span
                            className="text-xs flex-shrink-0"
                            style={{ color: 'var(--text-3)' }}
                          >
                            {t('to')}
                          </span>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) =>
                              updateSlot(day.value, 'endTime', e.target.value)
                            }
                            style={{ fontSize: '13px', padding: '5px 8px' }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Save availability button */}
              <div
                className="p-4 border-t"
                style={{ borderColor: 'var(--border)' }}
              >
                <Button
                  className="w-full"
                  loading={availMutation.isPending}
                  onClick={() => availMutation.mutate(availability)}
                >
                  <Save size={14} />
                  {t('saveAvailability')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default CalendarPage;
