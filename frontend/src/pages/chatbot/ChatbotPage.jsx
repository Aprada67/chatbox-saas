import { useState, useEffect, useRef } from 'react'
import { useParams }    from 'react-router-dom'
import { useQuery }     from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, ChevronLeft } from 'lucide-react'
import { getPublicChatbotApi }   from '../../api/chatbot'
import { getAvailableSlotsApi, createAppointmentApi } from '../../api/appointments'

// Genera fechas disponibles para los próximos 14 días
const getNextDays = (count = 14) => {
  const days = []
  const today = new Date()
  for (let i = 1; i <= count; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    days.push(d)
  }
  return days
}

// Formatea una fecha para mostrar al usuario
const formatDate = (date) =>
  date.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  })

// Formatea fecha para enviar al backend
const toISODate = (date) => date.toISOString().split('T')[0]

const ChatbotPage = () => {
  const { slug }    = useParams()
  const bottomRef   = useRef(null)

  // Estado del flujo de conversación
  const [messages,  setMessages]  = useState([])
  const [step,      setStep]      = useState('welcome')
  const [inputVal,  setInputVal]  = useState('')
  const [isTyping,  setIsTyping]  = useState(false)
  const [booking,   setBooking]   = useState({
    name: '', email: '', phone: '',
    service: null, date: null, time: null,
  })
  const [availableSlots, setAvailableSlots] = useState([])
  const [loadingSlots,   setLoadingSlots]   = useState(false)
  const [confirmed,      setConfirmed]      = useState(false)
  const [error,          setError]          = useState(null)

  // Obtiene los datos públicos del chatbot por slug
  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-chatbot', slug],
    queryFn:  () => getPublicChatbotApi(slug).then(r => r.data),
  })

  const chatbot  = data?.chatbot
  const accent   = chatbot?.color || '#3b82f6'
  const services = chatbot?.services || []

  // Hace scroll al último mensaje automáticamente
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Inicia el flujo cuando carga el chatbot
  useEffect(() => {
    if (chatbot && messages.length === 0) {
      addBotMessage(chatbot.welcomeMessage, 500)
      setTimeout(() => askName(), 1400)
    }
  }, [chatbot])

  // Agrega un mensaje del bot con efecto de typing
  const addBotMessage = (text, delay = 0) => {
    setTimeout(() => {
      setIsTyping(true)
      setTimeout(() => {
        setIsTyping(false)
        setMessages(p => [...p, { from: 'bot', text, id: Date.now() }])
      }, 700)
    }, delay)
  }

  // Agrega un mensaje del usuario
  const addUserMessage = (text) => {
    setMessages(p => [...p, { from: 'user', text, id: Date.now() }])
  }

  // Paso 1 — pide el nombre
  const askName = () => {
    setStep('name')
    addBotMessage("What's your name?", 800)
  }

  // Paso 2 — pide el email
  const askEmail = (name) => {
    setStep('email')
    addBotMessage(`Nice to meet you, ${name.split(' ')[0]}! What's your email? (optional)`, 400)
  }

  // Paso 3 — pide el teléfono
  const askPhone = () => {
    setStep('phone')
    addBotMessage("And your phone number? (optional)", 400)
  }

  // Paso 4 — muestra los servicios
  const askService = () => {
    setStep('service')
    addBotMessage("What service would you like to book?", 400)
  }

  // Paso 5 — muestra los días disponibles
  const askDay = () => {
    setStep('day')
    addBotMessage("Which day works best for you?", 400)
  }

  // Paso 6 — carga y muestra los slots disponibles
  const askTime = async (date) => {
    setStep('time')
    setLoadingSlots(true)
    addBotMessage(`Let me check availability for ${formatDate(date)}...`, 400)
    try {
      const res = await getAvailableSlotsApi(
        chatbot.id,
        toISODate(date),
        booking.service?.durationMins || 30
      )
      const slots = res.data.available || []
      setAvailableSlots(slots)
      if (slots.length === 0) {
        setTimeout(() => {
          addBotMessage("No availability for that day. Please choose another day.")
          setStep('day')
        }, 800)
      } else {
        setTimeout(() => addBotMessage("Pick a time:"), 800)
      }
    } catch {
      addBotMessage("Something went wrong loading availability. Please try again.")
      setStep('day')
    } finally {
      setLoadingSlots(false)
    }
  }

  // Paso final — confirma la cita
  const confirmBooking = async (time) => {
    setStep('confirming')
    addBotMessage("Confirming your appointment...", 400)

    // Construye la fecha completa con la hora seleccionada
    const [h, m]  = time.split(':').map(Number)
    const dateObj = new Date(booking.date)
    dateObj.setHours(h, m, 0, 0)

    try {
      await createAppointmentApi({
        chatbotId:    chatbot.id,
        guestName:    booking.name,
        guestEmail:   booking.email || undefined,
        guestPhone:   booking.phone || undefined,
        service:      booking.service.name,
        price:        booking.service.price,
        durationMins: booking.service.durationMins,
        date:         dateObj.toISOString(),
      })
      setConfirmed(true)
    } catch (err) {
      setError(err.message || 'Failed to book appointment. Please try again.')
      setStep('time')
      addBotMessage("That time was just taken. Please choose another.")
    }
  }

  // Maneja el envío del input de texto
  const handleSend = () => {
    const val = inputVal.trim()
    if (!val) return
    setInputVal('')
    addUserMessage(val)

    if (step === 'name') {
      setBooking(p => ({ ...p, name: val }))
      askEmail(val)
    } else if (step === 'email') {
      setBooking(p => ({ ...p, email: val }))
      askPhone()
    } else if (step === 'phone') {
      setBooking(p => ({ ...p, phone: val }))
      askService()
    }
  }

  // Maneja omitir campos opcionales
  const handleSkip = () => {
    addUserMessage('Skip')
    if (step === 'email') {
      askPhone()
    } else if (step === 'phone') {
      askService()
    }
  }

  // Pantalla de carga
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center"
         style={{ background: '#0d1117' }}>
      <span className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: accent, borderTopColor: 'transparent' }} />
    </div>
  )

  // Chatbot no encontrado
  if (isError) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6"
         style={{ background: '#0d1117' }}>
      <p className="text-sm" style={{ color: '#94a3b8' }}>
        Chatbot not found or inactive.
      </p>
    </div>
  )

  // Pantalla de confirmación exitosa
  if (confirmed) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
         style={{ background: '#0d1117' }}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1,   opacity: 1 }}
        className="w-full max-w-sm rounded-3xl p-8 text-center border"
        style={{ background: '#161b27', borderColor: '#2a3147' }}
      >
        {/* Ícono de éxito animado */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: accent + '22', border: `2px solid ${accent}` }}
        >
          <span style={{ fontSize: '28px' }}>✓</span>
        </motion.div>

        <h2 className="text-lg font-semibold mb-2" style={{ color: '#e8edf5' }}>
          Appointment confirmed!
        </h2>
        <p className="text-sm mb-6" style={{ color: '#94a3b8' }}>
          We'll send you a reminder before your appointment.
        </p>

        {/* Resumen de la cita */}
        <div className="rounded-2xl p-4 text-left flex flex-col gap-2"
             style={{ background: '#1e2436', border: '0.5px solid #2a3147' }}>
          {[
            { label: 'Name',     value: booking.name },
            { label: 'Service',  value: booking.service?.name },
            { label: 'Price',    value: `$${booking.service?.price}` },
            { label: 'Duration', value: `${booking.service?.durationMins} min` },
            { label: 'Date',     value: formatDate(booking.date) },
            { label: 'Time',     value: booking.time },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between">
              <span className="text-xs" style={{ color: '#5a6a82' }}>{label}</span>
              <span className="text-xs font-medium" style={{ color: '#e8edf5' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Notificación de email */}
        {booking.email && (
          <p className="text-xs mt-4" style={{ color: '#5a6a82' }}>
            Confirmation sent to {booking.email}
          </p>
        )}
      </motion.div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto"
         style={{ background: '#0d1117' }}>

      {/* Header del chatbot */}
      <div className="flex items-center gap-3 px-4 py-4 border-b sticky top-0 z-10"
           style={{ background: '#0d1117', borderColor: '#2a3147' }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
             style={{ background: accent }}>
          <span className="text-white text-sm font-semibold">
            {chatbot.name.charAt(0)}
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#e8edf5' }}>
            {chatbot.name}
          </p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-xs" style={{ color: '#5a6a82' }}>Online</span>
          </div>
        </div>
      </div>

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3"
           style={{ paddingBottom: '100px' }}>

        {/* Mensajes */}
        <AnimatePresence>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1,  y: 0, scale: 1    }}
              className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                style={msg.from === 'bot'
                  ? { background: accent,    color: '#fff',
                      borderBottomLeftRadius: '4px' }
                  : { background: '#1e2436', color: '#e8edf5',
                      borderBottomRightRadius: '4px',
                      border: '0.5px solid #2a3147' }
                }
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Indicador de typing */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="px-4 py-3 rounded-2xl flex gap-1"
                 style={{ background: accent, borderBottomLeftRadius: '4px' }}>
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, delay: i * 0.15, duration: 0.6 }}
                  className="w-1.5 h-1.5 rounded-full bg-white"
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Opciones de servicios */}
        {step === 'service' && !isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1,  y: 0 }}
            className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
          >
            {services.map(svc => (
              <motion.button
                key={svc.id || svc.name}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setBooking(p => ({ ...p, service: svc }))
                  addUserMessage(`${svc.name} — $${svc.price}`)
                  askDay()
                }}
                className="flex-shrink-0 rounded-2xl p-4 text-left border transition-all"
                style={{
                  background:  '#161b27',
                  borderColor: '#2a3147',
                  minWidth:    '130px',
                }}
              >
                <p className="text-sm font-medium mb-1" style={{ color: '#e8edf5' }}>
                  {svc.name}
                </p>
                <p className="text-xs" style={{ color: '#5a6a82' }}>
                  ⏱ {svc.durationMins} min
                </p>
                <p className="text-sm font-semibold mt-1" style={{ color: accent }}>
                  ${svc.price}
                </p>
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Opciones de días */}
        {step === 'day' && !isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1,  y: 0 }}
            className="flex flex-col gap-2"
          >
            {getNextDays(14).map((date, i) => (
              <motion.button
                key={i}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setBooking(p => ({ ...p, date }))
                  addUserMessage(formatDate(date))
                  askTime(date)
                }}
                className="w-full text-left px-4 py-3 rounded-xl border transition-all text-sm"
                style={{
                  background:  '#161b27',
                  borderColor: '#2a3147',
                  color:       '#e8edf5',
                }}
              >
                {formatDate(date)}
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Opciones de horarios */}
        {step === 'time' && !isTyping && !loadingSlots && availableSlots.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1,  y: 0 }}
            className="grid grid-cols-3 gap-2"
          >
            {availableSlots.map(slot => (
              <motion.button
                key={slot}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setBooking(p => ({ ...p, time: slot }))
                  addUserMessage(slot)
                  confirmBooking(slot)
                }}
                className="py-2.5 rounded-xl text-sm font-medium border transition-all"
                style={{
                  background:  '#161b27',
                  borderColor: '#2a3147',
                  color:       '#e8edf5',
                }}
              >
                {slot}
              </motion.button>
            ))}
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input de texto — visible solo en pasos que requieren texto */}
      {['name', 'email', 'phone'].includes(step) && (
        <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-4 py-3 border-t"
             style={{ background: '#0d1117', borderColor: '#2a3147' }}>
          <div className="flex gap-2">
            {/* Input principal */}
            <input
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={
                step === 'name'  ? 'Your full name...'    :
                step === 'email' ? 'Your email...'        :
                                   'Your phone number...'
              }
              autoFocus
              className="flex-1 rounded-xl px-4 py-3 text-sm outline-none border"
              style={{
                background:  '#161b27',
                borderColor: '#2a3147',
                color:       '#e8edf5',
              }}
            />

            {/* Botón omitir — solo para campos opcionales */}
            {['email', 'phone'].includes(step) && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSkip}
                className="px-3 rounded-xl text-xs border"
                style={{
                  background:  '#161b27',
                  borderColor: '#2a3147',
                  color:       '#5a6a82',
                }}
              >
                Skip
              </motion.button>
            )}

            {/* Botón enviar */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!inputVal.trim()}
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: inputVal.trim() ? accent : '#1e2436',
                opacity:    inputVal.trim() ? 1 : 0.5,
              }}
            >
              <Send size={16} color="white" />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatbotPage