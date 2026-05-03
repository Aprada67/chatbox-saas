import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { Clock, X, Save } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Button          from '../../components/ui/Button'
import Card            from '../../components/ui/Card'
import { getMyChatbotsApi }            from '../../api/chatbot'
import { getChatbotAppointmentsApi, cancelAppointmentApi } from '../../api/appointments'
import api             from '../../api/axios'

// Días de la semana para el panel de disponibilidad
const DAYS = [
  { label: 'Sunday',    value: 0 },
  { label: 'Monday',    value: 1 },
  { label: 'Tuesday',   value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday',  value: 4 },
  { label: 'Friday',    value: 5 },
  { label: 'Saturday',  value: 6 },
]

// Colores por estado de cita
const STATUS_COLORS = {
  confirmed: '#3b82f6',
  pending:   '#94a3b8',
  cancelled: '#e24b4b',
  completed: '#1D9E75',
}

const CalendarPage = () => {
  const queryClient = useQueryClient()

  // Estado del modal de detalle de cita
  const [selectedApt, setSelectedApt] = useState(null)

  // Estado del panel de disponibilidad
  const [availability, setAvailability] = useState([])
  const [showAvail,    setShowAvail]    = useState(false)

  // Obtiene los chatbots del cliente
  const { data: chatbotsData } = useQuery({
    queryKey: ['chatbots'],
    queryFn:  () => getMyChatbotsApi().then(r => r.data),
  })

  const chatbots  = chatbotsData?.chatbots || []
  const chatbotId = chatbots[0]?.id

  // Obtiene las citas del chatbot activo
  const { data: appointmentsData } = useQuery({
    queryKey: ['appointments', chatbotId],
    queryFn:  () => getChatbotAppointmentsApi(chatbotId).then(r => r.data),
    enabled:  !!chatbotId,
  })

  // Obtiene la disponibilidad configurada del chatbot
  useQuery({
    queryKey: ['availability', chatbotId],
    queryFn:  () => api.get(`/availability/${chatbotId}`).then(r => r.data),
    enabled:  !!chatbotId,
    onSuccess: (data) => setAvailability(data.slots || []),
  })

  const appointments = appointmentsData?.appointments || []

  // Convierte las citas al formato que FullCalendar entiende
  const events = appointments.map(apt => ({
    id:              apt.id,
    title:           `${apt.guestName} — ${apt.service}`,
    start:           apt.date,
    end:             new Date(new Date(apt.date).getTime() + apt.durationMins * 60000).toISOString(),
    backgroundColor: STATUS_COLORS[apt.status] || STATUS_COLORS.pending,
    borderColor:     STATUS_COLORS[apt.status] || STATUS_COLORS.pending,
    extendedProps:   apt,
  }))

  // Cancela una cita y refresca la lista
  const cancelMutation = useMutation({
    mutationFn: cancelAppointmentApi,
    onSuccess:  () => {
      queryClient.invalidateQueries(['appointments', chatbotId])
      toast.success('Appointment cancelled')
      setSelectedApt(null)
    },
    onError: (err) => toast.error(err.message),
  })

  // Guarda los horarios de disponibilidad
  const availMutation = useMutation({
    mutationFn: (slots) => api.post(`/availability/${chatbotId}`, { slots }),
    onSuccess:  () => {
      queryClient.invalidateQueries(['availability', chatbotId])
      toast.success('Availability saved')
      setShowAvail(false)
    },
    onError: (err) => toast.error(err.message),
  })

  // Activa o desactiva un día de la semana
  const toggleDay = (day) => {
    const exists = availability.find(s => s.dayOfWeek === day)
    if (exists) {
      setAvailability(p => p.filter(s => s.dayOfWeek !== day))
    } else {
      setAvailability(p => [...p, { dayOfWeek: day, startTime: '09:00', endTime: '18:00' }])
    }
  }

  // Actualiza el horario de inicio o fin de un día
  const updateSlot = (day, field, value) =>
    setAvailability(p =>
      p.map(s => s.dayOfWeek === day ? { ...s, [field]: value } : s)
    )

  // Si no hay chatbot creado muestra mensaje guía
  if (!chatbotId) return (
    <DashboardLayout title="Calendar">
      <div className="flex flex-col items-center justify-center py-20">
        <Clock size={36} className="mb-4" style={{ color: 'var(--text-3)' }} />
        <p className="text-sm text-center px-4" style={{ color: 'var(--text-3)' }}>
          Create a chatbot first to manage your calendar
        </p>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout title="Calendar">

      {/* Encabezado con contador y botón de disponibilidad */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base md:text-lg font-semibold"
              style={{ color: 'var(--text-1)' }}>
            Appointments
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
            {appointments.filter(a => a.status === 'confirmed').length} confirmed
          </p>
        </div>
        <Button variant="secondary" size="md" onClick={() => setShowAvail(true)}>
          <Clock size={14} />
          {/* Texto corto en móvil, completo en desktop */}
          <span className="hidden sm:inline">Set availability</span>
          <span className="sm:hidden">Hours</span>
        </Button>
      </div>

      {/* Leyenda de estados */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <span className="text-xs capitalize" style={{ color: 'var(--text-3)' }}>
              {status}
            </span>
          </div>
        ))}
      </div>

      {/* Calendario — mes en móvil, semana en desktop */}
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
          .fc-toolbar-chunk { display: flex; gap: 4px; }
        `}</style>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left:   'prev,next',
            center: 'title',
            right:  'dayGridMonth,timeGridWeek',
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

      {/* ── MODAL DE DETALLE DE CITA ── */}
      <AnimatePresence>
        {selectedApt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{    opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ background: '#00000066' }}
            onClick={() => setSelectedApt(null)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0,      opacity: 1 }}
              exit={{    y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6 border"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
            >
              {/* Handle visible solo en móvil */}
              <div className="flex justify-center mb-4 sm:hidden">
                <div className="w-10 h-1 rounded-full"
                     style={{ background: 'var(--border-2)' }} />
              </div>

              {/* Encabezado del modal */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                  Appointment details
                </h3>
                <button onClick={() => setSelectedApt(null)}
                        style={{ color: 'var(--text-3)' }}>
                  <X size={16} />
                </button>
              </div>

              {/* Filas de detalles de la cita */}
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Client',   value: selectedApt.guestName },
                  { label: 'Email',    value: selectedApt.guestEmail || '—' },
                  { label: 'Phone',    value: selectedApt.guestPhone || '—' },
                  { label: 'Service',  value: selectedApt.service },
                  { label: 'Price',    value: `$${selectedApt.price}` },
                  { label: 'Duration', value: `${selectedApt.durationMins} min` },
                  { label: 'Date',     value: new Date(selectedApt.date).toLocaleString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                      {label}
                    </span>
                    <span className="text-xs font-medium" style={{ color: 'var(--text-1)' }}>
                      {value}
                    </span>
                  </div>
                ))}

                {/* Badge de estado con color dinámico */}
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: 'var(--text-3)' }}>Status</span>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full capitalize"
                        style={{
                          background: STATUS_COLORS[selectedApt.status] + '22',
                          color:      STATUS_COLORS[selectedApt.status],
                        }}>
                    {selectedApt.status}
                  </span>
                </div>
              </div>

              {/* Botón cancelar — solo visible si la cita está confirmada */}
              {selectedApt.status === 'confirmed' && (
                <Button
                  variant="danger" size="md"
                  className="w-full mt-5"
                  loading={cancelMutation.isPending}
                  onClick={() => cancelMutation.mutate(selectedApt.id)}
                >
                  Cancel appointment
                </Button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PANEL DE DISPONIBILIDAD ── */}
      {/* Drawer desde abajo en móvil, desde la derecha en desktop */}
      <AnimatePresence>
        {showAvail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{    opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end"
            style={{ background: '#00000066' }}
            onClick={() => setShowAvail(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{    y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full sm:w-80 max-h-[85vh] sm:max-h-full rounded-t-3xl sm:rounded-none border-t sm:border-l overflow-y-auto flex flex-col"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
            >
              {/* Handle visible solo en móvil */}
              <div className="flex justify-center pt-3 pb-2 sm:hidden">
                <div className="w-10 h-1 rounded-full"
                     style={{ background: 'var(--border-2)' }} />
              </div>

              {/* Encabezado del panel */}
              <div className="flex items-center justify-between px-5 py-4 border-b"
                   style={{ borderColor: 'var(--border)' }}>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                  Set availability
                </h3>
                <button onClick={() => setShowAvail(false)}
                        style={{ color: 'var(--text-3)' }}>
                  <X size={16} />
                </button>
              </div>

              {/* Lista de días configurables */}
              <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto">
                {DAYS.map(day => {
                  const slot   = availability.find(s => s.dayOfWeek === day.value)
                  const active = !!slot
                  return (
                    <div
                      key={day.value}
                      className="rounded-xl border p-3 transition-all"
                      style={{
                        borderColor: active ? 'var(--accent)' : 'var(--border)',
                        background:  active ? 'var(--accent-bg)' : 'var(--bg-tertiary)',
                      }}
                    >
                      {/* Fila con nombre del día y toggle */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium"
                              style={{ color: active ? 'var(--accent)' : 'var(--text-2)' }}>
                          {day.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          className="w-10 h-6 rounded-full transition-all relative flex-shrink-0"
                          style={{ background: active ? 'var(--accent)' : 'var(--border)' }}
                        >
                          <motion.div
                            animate={{ x: active ? 18 : 2 }}
                            className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                          />
                        </button>
                      </div>

                      {/* Selectores de horario — visibles solo si el día está activo */}
                      {active && (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={e => updateSlot(day.value, 'startTime', e.target.value)}
                            style={{ fontSize: '13px', padding: '5px 8px' }}
                          />
                          <span className="text-xs flex-shrink-0"
                                style={{ color: 'var(--text-3)' }}>
                            to
                          </span>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={e => updateSlot(day.value, 'endTime', e.target.value)}
                            style={{ fontSize: '13px', padding: '5px 8px' }}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Botón guardar disponibilidad */}
              <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <Button
                  className="w-full"
                  loading={availMutation.isPending}
                  onClick={() => availMutation.mutate(availability)}
                >
                  <Save size={14} />
                  Save availability
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}

export default CalendarPage