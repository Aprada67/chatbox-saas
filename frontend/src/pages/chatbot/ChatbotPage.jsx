import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Send } from 'lucide-react'
import { getPublicChatbotApi } from '../../api/chatbot'
import {
  getAvailableSlotsApi,
  createAppointmentApi,
  getGuestAppointmentsApi,
  cancelGuestAppointmentApi,
} from '../../api/appointments'

// ── Translations ─────────────────────────────────────────────────────────────
const T = {
  en: {
    actionPrompt:       'What would you like to do?',
    schedule:           '📅 Book appointment',
    cancelAction:       '❌ Cancel appointment',
    askName:            "What's your name?",
    askEmail:           (name) => `Nice to meet you, ${name}! What's your email?`,
    askPhone:           'And your phone number? (optional)',
    askService:         'What service would you like to book?',
    askDay:             'Which day works best for you?',
    checkSlots:         (date) => `Let me check availability for ${date}...`,
    pickTime:           'Pick a time:',
    noSlots:            'No availability for that day. Please choose another.',
    confirming:         'Confirming your appointment...',
    farewell:           'Thank you! See you soon! 👋',
    anotherBooking:     'Book another appointment',
    exit:               'Exit',
    back:               '← Back',
    skip:               'Skip',
    invalidEmail:       'Please enter a valid email address.',
    slotTaken:          'That time was just taken. Please choose another.',
    error:              'Something went wrong. Please try again.',
    cancelAskEmail:     'Enter the email you used when booking:',
    cancelLooking:      'Looking up your appointments...',
    cancelNone:         'No upcoming appointments found for that email.',
    cancelConfirm:      (svc, date) => `Cancel "${svc}" on ${date}?`,
    cancelYes:          'Yes, cancel it',
    cancelNo:           'Keep it',
    cancelSuccess:      'Done! Your appointment has been cancelled. A confirmation email has been sent.',
    cancelError:        'Could not cancel. Please try again.',
    backToMenu:         '← Back to menu',
  },
  es: {
    actionPrompt:       '¿Qué deseas hacer?',
    schedule:           '📅 Agendar cita',
    cancelAction:       '❌ Cancelar cita',
    askName:            '¿Cuál es tu nombre?',
    askEmail:           (name) => `¡Mucho gusto, ${name}! ¿Cuál es tu email?`,
    askPhone:           '¿Y tu número de teléfono? (opcional)',
    askService:         '¿Qué servicio deseas reservar?',
    askDay:             '¿Qué día te conviene?',
    checkSlots:         (date) => `Déjame verificar disponibilidad para ${date}...`,
    pickTime:           'Elige un horario:',
    noSlots:            'Sin disponibilidad ese día. Por favor elige otro.',
    confirming:         'Confirmando tu cita...',
    farewell:           '¡Gracias! ¡Hasta pronto! 👋',
    anotherBooking:     'Agendar otra cita',
    exit:               'Salir',
    back:               '← Volver',
    skip:               'Omitir',
    invalidEmail:       'Por favor ingresa un email válido.',
    slotTaken:          'Ese horario ya fue tomado. Elige otro.',
    error:              'Algo salió mal. Intenta de nuevo.',
    cancelAskEmail:     'Ingresa el email que usaste al agendar:',
    cancelLooking:      'Buscando tus citas...',
    cancelNone:         'No se encontraron citas próximas para ese email.',
    cancelConfirm:      (svc, date) => `¿Cancelar "${svc}" el ${date}?`,
    cancelYes:          'Sí, cancelar',
    cancelNo:           'Mantenerla',
    cancelSuccess:      '¡Listo! Tu cita fue cancelada. Te enviamos un email de confirmación.',
    cancelError:        'No se pudo cancelar. Por favor intenta de nuevo.',
    backToMenu:         '← Volver al menú',
  },
  pt: {
    actionPrompt:       'O que você gostaria de fazer?',
    schedule:           '📅 Agendar consulta',
    cancelAction:       '❌ Cancelar consulta',
    askName:            'Qual é o seu nome?',
    askEmail:           (name) => `Prazer, ${name}! Qual é o seu email?`,
    askPhone:           'E seu número de telefone? (opcional)',
    askService:         'Qual serviço você gostaria de reservar?',
    askDay:             'Qual dia funciona melhor para você?',
    checkSlots:         (date) => `Deixa eu verificar disponibilidade para ${date}...`,
    pickTime:           'Escolha um horário:',
    noSlots:            'Sem disponibilidade nesse dia. Escolha outro.',
    confirming:         'Confirmando sua consulta...',
    farewell:           'Obrigado! Até logo! 👋',
    anotherBooking:     'Agendar outra consulta',
    exit:               'Sair',
    back:               '← Voltar',
    skip:               'Pular',
    invalidEmail:       'Por favor insira um email válido.',
    slotTaken:          'Esse horário acabou de ser ocupado. Escolha outro.',
    error:              'Algo deu errado. Tente novamente.',
    cancelAskEmail:     'Digite o email que você usou ao agendar:',
    cancelLooking:      'Buscando suas consultas...',
    cancelNone:         'Nenhuma consulta futura encontrada para esse email.',
    cancelConfirm:      (svc, date) => `Cancelar "${svc}" em ${date}?`,
    cancelYes:          'Sim, cancelar',
    cancelNo:           'Manter',
    cancelSuccess:      'Pronto! Sua consulta foi cancelada. Enviamos um email de confirmação.',
    cancelError:        'Não foi possível cancelar. Tente novamente.',
    backToMenu:         '← Voltar ao menu',
  },
  fr: {
    actionPrompt:       'Que souhaitez-vous faire ?',
    schedule:           '📅 Prendre rendez-vous',
    cancelAction:       '❌ Annuler rendez-vous',
    askName:            'Quel est votre nom ?',
    askEmail:           (name) => `Ravi de vous rencontrer, ${name} ! Votre email ?`,
    askPhone:           'Et votre numéro de téléphone ? (optionnel)',
    askService:         'Quel service souhaitez-vous réserver ?',
    askDay:             'Quel jour vous convient ?',
    checkSlots:         (date) => `Laissez-moi vérifier la disponibilité pour ${date}...`,
    pickTime:           'Choisissez un horaire :',
    noSlots:            'Pas de disponibilité ce jour. Veuillez en choisir un autre.',
    confirming:         'Confirmation de votre rendez-vous...',
    farewell:           'Merci ! À bientôt ! 👋',
    anotherBooking:     'Prendre un autre rendez-vous',
    exit:               'Quitter',
    back:               '← Retour',
    skip:               'Passer',
    invalidEmail:       'Veuillez entrer une adresse email valide.',
    slotTaken:          "Ce créneau vient d'être pris. Veuillez en choisir un autre.",
    error:              "Quelque chose s'est mal passé. Veuillez réessayer.",
    cancelAskEmail:     "Entrez l'email utilisé lors de votre réservation :",
    cancelLooking:      'Recherche de vos rendez-vous...',
    cancelNone:         'Aucun rendez-vous à venir trouvé pour cet email.',
    cancelConfirm:      (svc, date) => `Annuler "${svc}" le ${date} ?`,
    cancelYes:          'Oui, annuler',
    cancelNo:           'Conserver',
    cancelSuccess:      'Fait ! Votre rendez-vous a été annulé. Un email de confirmation a été envoyé.',
    cancelError:        "Impossible d'annuler. Veuillez réessayer.",
    backToMenu:         '← Retour au menu',
  },
}

// ── Helpers ──────────────────────────────────────────────────────────────────
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

const formatDate = (date) =>
  date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

const toISODate = (date) => date.toISOString().split('T')[0]

const DAYS = getNextDays(14)

// ── Component ─────────────────────────────────────────────────────────────────
const ChatbotPage = () => {
  const { slug }      = useParams()
  const bottomRef     = useRef(null)
  const initialized   = useRef(false)
  const busyCount     = useRef(0)
  const dayFetchId    = useRef(0)

  const [messages,       setMessages]       = useState([])
  const [step,           setStep]           = useState('welcome')
  const [stepHistory,    setStepHistory]    = useState([])
  const [inputVal,       setInputVal]       = useState('')
  const [isTyping,       setIsTyping]       = useState(false)
  const [botBusy,        setBotBusy]        = useState(false)
  const [booking,        setBooking]        = useState({
    name: '', email: '', phone: '', service: null, date: null, time: null,
  })
  const [slots,          setSlots]          = useState([])
  const [loadingSlots,   setLoadingSlots]   = useState(false)
  // day availability: { 'YYYY-MM-DD': 'loading' | 'ok' | 'empty' }
  const [dayStatus,      setDayStatus]      = useState({})
  const [confirmed,      setConfirmed]      = useState(false)

  // Cancel flow state
  const [guestAppts,     setGuestAppts]     = useState([])
  const [loadingAppts,   setLoadingAppts]   = useState(false)
  const [cancellingId,   setCancellingId]   = useState(null)
  const [confirmingCancel, setConfirmingCancel] = useState(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-chatbot', slug],
    queryFn:  () => getPublicChatbotApi(slug).then(r => r.data),
  })

  const chatbot  = data?.chatbot
  const accent   = chatbot?.color || '#3b82f6'
  const services = chatbot?.services || []
  const t        = T[chatbot?.language] || T.en

  // ── Messaging helpers ────────────────────────────────────────────────────────

  const botMsg = (text, delay = 0) => {
    busyCount.current += 1
    setBotBusy(true)
    setTimeout(() => {
      setIsTyping(true)
      setTimeout(() => {
        setIsTyping(false)
        busyCount.current -= 1
        if (busyCount.current === 0) setBotBusy(false)
        setMessages(p => [...p, { from: 'bot', text, id: Date.now() + Math.random() }])
      }, 700)
    }, delay)
  }

  const userMsg = (text) =>
    setMessages(p => [...p, { from: 'user', text, id: Date.now() + Math.random() }])

  // ── Auto-scroll ──────────────────────────────────────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // ── Init (once chatbot loads) ────────────────────────────────────────────────

  useEffect(() => {
    if (!chatbot || initialized.current) return
    initialized.current = true
    const tr = T[chatbot.language] || T.en
    botMsg(chatbot.welcomeMessage, 500)
    setTimeout(() => {
      setStep('action')
      botMsg(tr.actionPrompt, 700)
    }, 1500)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatbot])

  // ── Navigation ───────────────────────────────────────────────────────────────

  const goTo = (s) => {
    setStepHistory(h => [...h, step])
    setStep(s)
  }

  const goBack = () => {
    setStepHistory(h => {
      const copy = [...h]
      const prev = copy.pop()
      if (prev) setStep(prev)
      return copy
    })
  }

  // ── Booking flow ─────────────────────────────────────────────────────────────

  const doName    = ()     => { goTo('name');    botMsg(t.askName, 400) }
  const doEmail   = (name) => { goTo('email');   botMsg(t.askEmail(name.split(' ')[0]), 400) }
  const doPhone   = ()     => { goTo('phone');   botMsg(t.askPhone, 400) }
  const doService = ()     => { goTo('service'); botMsg(t.askService, 400) }

  const doDay = async () => {
    goTo('day')
    botMsg(t.askDay, 400)

    // Pre-fetch availability for all 14 days in parallel
    const fetchId = ++dayFetchId.current
    const initial = {}
    DAYS.forEach(d => { initial[toISODate(d)] = 'loading' })
    setDayStatus(initial)

    const results = await Promise.allSettled(
      DAYS.map(d =>
        getAvailableSlotsApi(chatbot.id, toISODate(d), booking.service?.durationMins || 30)
      )
    )

    if (dayFetchId.current !== fetchId) return // stale fetch, ignore

    const updated = {}
    DAYS.forEach((d, i) => {
      const iso = toISODate(d)
      const ok  = results[i].status === 'fulfilled' &&
                  (results[i].value.data.available || []).length > 0
      updated[iso] = ok ? 'ok' : 'empty'
    })
    setDayStatus(updated)
  }

  const doTime = async (date) => {
    goTo('time')
    setLoadingSlots(true)
    botMsg(t.checkSlots(formatDate(date)), 400)
    try {
      const res      = await getAvailableSlotsApi(chatbot.id, toISODate(date), booking.service?.durationMins || 30)
      // Use full slots array with availability status if backend supports it,
      // otherwise fall back to converting available-only array
      const allSlots = res.data.slots ||
        (res.data.available || []).map(time => ({ time, available: true }))
      setSlots(allSlots)
      const hasAny = allSlots.length > 0
      if (!hasAny) {
        botMsg(t.noSlots, 800)
        setTimeout(() => setStep('day'), 1600)
      } else {
        botMsg(t.pickTime, 800)
      }
    } catch {
      botMsg(t.error)
      setTimeout(() => setStep('day'), 1200)
    } finally {
      setLoadingSlots(false)
    }
  }

  const doConfirm = async (time) => {
    goTo('confirming')
    botMsg(t.confirming, 400)
    const [h, m] = time.split(':').map(Number)
    const dt     = new Date(booking.date)
    dt.setHours(h, m, 0, 0)
    try {
      await createAppointmentApi({
        chatbotId:    chatbot.id,
        guestName:    booking.name,
        guestEmail:   booking.email,
        guestPhone:   booking.phone || undefined,
        service:      booking.service.name,
        price:        booking.service.price,
        durationMins: booking.service.durationMins,
        date:         dt.toISOString(),
      })
      setTimeout(() => {
        setStep('farewell')
        botMsg(t.farewell)
      }, 1200)
    } catch {
      botMsg(t.slotTaken)
      setStep('time')
    }
  }

  // ── Cancel flow ──────────────────────────────────────────────────────────────

  const doCancelEmail = () => {
    goTo('cancel_email')
    botMsg(t.cancelAskEmail, 400)
  }

  const lookupAppointments = async (email) => {
    goTo('cancel_list')
    setLoadingAppts(true)
    botMsg(t.cancelLooking, 400)
    try {
      const res   = await getGuestAppointmentsApi(chatbot.id, email)
      const appts = res.data.appointments || []
      setGuestAppts(appts)
      if (appts.length === 0) {
        botMsg(t.cancelNone, 800)
        setTimeout(() => setStep('cancel_email'), 1600)
      }
    } catch {
      botMsg(t.error)
      setTimeout(() => setStep('cancel_email'), 1200)
    } finally {
      setLoadingAppts(false)
    }
  }

  const executeCancel = async (apt) => {
    setCancellingId(apt.id)
    setConfirmingCancel(null)
    try {
      await cancelGuestAppointmentApi(apt.id, booking.email)
      setGuestAppts(p => p.filter(a => a.id !== apt.id))
      userMsg(`${t.cancelYes} — ${apt.service}`)
      botMsg(t.cancelSuccess, 400)
      setTimeout(() => setStep('cancel_done'), 1800)
    } catch {
      botMsg(t.cancelError)
    } finally {
      setCancellingId(null)
    }
  }

  // ── Input handlers ───────────────────────────────────────────────────────────

  const handleSend = () => {
    const val = inputVal.trim()
    if (!val) return
    setInputVal('')
    userMsg(val)
    const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

    if (step === 'name')  { setBooking(p => ({ ...p, name: val })); doEmail(val) }
    if (step === 'email') {
      if (!isValidEmail(val)) { botMsg(t.invalidEmail); return }
      setBooking(p => ({ ...p, email: val })); doPhone()
    }
    if (step === 'phone') { setBooking(p => ({ ...p, phone: val })); doService() }
    if (step === 'cancel_email') {
      if (!isValidEmail(val)) { botMsg(t.invalidEmail); return }
      setBooking(p => ({ ...p, email: val })); lookupAppointments(val)
    }
  }

  const handleSkip = () => {
    userMsg(t.skip)
    if (step === 'phone') { setBooking(p => ({ ...p, phone: '' })); doService() }
  }

  const restartBooking = () => {
    busyCount.current = 0
    setMessages([])
    setBooking({ name: '', email: '', phone: '', service: null, date: null, time: null })
    setSlots([])
    setDayStatus({})
    setGuestAppts([])
    setStepHistory([])
    setBotBusy(false)
    setIsTyping(false)
    setConfirmingCancel(null)
    setStep('action')
    setTimeout(() => botMsg(t.actionPrompt, 300), 50)
  }

  const canGoBack = stepHistory.length > 0 &&
    !['welcome', 'action', 'confirming', 'farewell', 'cancel_list', 'cancel_done'].includes(step) &&
    !botBusy

  // ── Screens ───────────────────────────────────────────────────────────────────

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d1117' }}>
      <span className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: accent, borderTopColor: 'transparent' }} />
    </div>
  )

  if (isError) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#0d1117' }}>
      <p className="text-sm" style={{ color: '#94a3b8' }}>Chatbot not found or inactive.</p>
    </div>
  )

  if (confirmed) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#0d1117' }}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1,   opacity: 1 }}
        className="w-full max-w-sm rounded-3xl p-8 text-center border"
        style={{ background: '#161b27', borderColor: '#2a3147' }}
      >
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
        <div className="rounded-2xl p-4 text-left flex flex-col gap-2"
             style={{ background: '#1e2436', border: '0.5px solid #2a3147' }}>
          {[
            { label: 'Name',     value: booking.name },
            { label: 'Service',  value: booking.service?.name },
            { label: 'Price',    value: `$${booking.service?.price}` },
            { label: 'Duration', value: `${booking.service?.durationMins} min` },
            { label: 'Date',     value: booking.date ? formatDate(booking.date) : '—' },
            { label: 'Time',     value: booking.time },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between">
              <span className="text-xs" style={{ color: '#5a6a82' }}>{label}</span>
              <span className="text-xs font-medium" style={{ color: '#e8edf5' }}>{value}</span>
            </div>
          ))}
        </div>
        <p className="text-xs mt-4" style={{ color: '#5a6a82' }}>
          Confirmation sent to {booking.email}
        </p>
      </motion.div>
    </div>
  )

  // ── Main chat UI ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto" style={{ background: '#0d1117' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b sticky top-0 z-10"
           style={{ background: '#0d1117', borderColor: '#2a3147' }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
             style={{ background: accent }}>
          <span className="text-white text-sm font-semibold">{chatbot.name.charAt(0)}</span>
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#e8edf5' }}>{chatbot.name}</p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-xs" style={{ color: '#5a6a82' }}>Online</span>
          </div>
        </div>
      </div>

      {/* Messages + interactive elements */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3"
           style={{ paddingBottom: '100px' }}>

        {/* Chat messages */}
        <AnimatePresence>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1,  y: 0, scale: 1   }}
              className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                style={msg.from === 'bot'
                  ? { background: accent,    color: '#fff',    borderBottomLeftRadius:  '4px' }
                  : { background: '#1e2436', color: '#e8edf5', borderBottomRightRadius: '4px',
                      border: '0.5px solid #2a3147' }
                }
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
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

        {/* ── Action: Schedule / Cancel ── */}
        {step === 'action' && !botBusy && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col gap-2">
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => { userMsg(t.schedule); doName() }}
              className="w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium"
              style={{ background: accent + '18', borderColor: accent + '66', color: accent }}
            >
              {t.schedule}
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => { userMsg(t.cancelAction); doCancelEmail() }}
              className="w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium"
              style={{ background: '#1e2436', borderColor: '#2a3147', color: '#94a3b8' }}
            >
              {t.cancelAction}
            </motion.button>
          </motion.div>
        )}

        {/* ── Service cards ── */}
        {step === 'service' && !botBusy && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {services.map(svc => (
              <motion.button key={svc.id || svc.name} whileTap={{ scale: 0.96 }}
                onClick={() => { setBooking(p => ({ ...p, service: svc })); userMsg(`${svc.name} — $${svc.price}`); doDay() }}
                className="shrink-0 rounded-2xl p-4 text-left border"
                style={{ background: '#161b27', borderColor: '#2a3147', minWidth: '130px' }}
              >
                <p className="text-sm font-medium mb-1" style={{ color: '#e8edf5' }}>{svc.name}</p>
                <p className="text-xs" style={{ color: '#5a6a82' }}>⏱ {svc.durationMins} min</p>
                <p className="text-sm font-semibold mt-1" style={{ color: accent }}>${svc.price}</p>
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* ── Day picker — horizontal scroll with availability status ── */}
        {step === 'day' && !botBusy && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {DAYS.map((date, i) => {
              const iso      = toISODate(date)
              const status   = dayStatus[iso] || 'loading'
              const loading  = status === 'loading'
              const unavail  = status === 'empty'
              return (
                <motion.button
                  key={i}
                  whileTap={unavail || loading ? {} : { scale: 0.95 }}
                  disabled={unavail || loading}
                  onClick={() => {
                    setBooking(p => ({ ...p, date }))
                    userMsg(formatDate(date))
                    doTime(date)
                  }}
                  className="shrink-0 flex flex-col items-center rounded-2xl border py-3 px-4 gap-0.5 transition-opacity"
                  style={{
                    minWidth:    '62px',
                    background:  unavail ? 'transparent' : '#161b27',
                    borderColor: unavail ? '#1e2436'     : '#2a3147',
                    opacity:     unavail ? 0.4           : 1,
                    cursor:      unavail || loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  <span style={{ color: '#5a6a82', fontSize: '11px' }}>
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  {loading ? (
                    <span className="w-4 h-4 border border-t-transparent rounded-full animate-spin my-1"
                          style={{ borderColor: '#5a6a82', borderTopColor: 'transparent' }} />
                  ) : (
                    <span style={{ color: unavail ? '#3a4255' : '#e8edf5', fontSize: '20px', fontWeight: '700', lineHeight: '1.2' }}>
                      {date.getDate()}
                    </span>
                  )}
                  <span style={{ color: '#5a6a82', fontSize: '11px' }}>
                    {date.toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                </motion.button>
              )
            })}
          </motion.div>
        )}

        {/* ── Time slots grid ── */}
        {step === 'time' && !botBusy && !loadingSlots && slots.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-3 gap-2">
            {slots.map(({ time, available: avail }) => (
              <motion.button
                key={time}
                whileTap={avail ? { scale: 0.95 } : {}}
                disabled={!avail}
                onClick={() => {
                  if (!avail) return
                  setBooking(p => ({ ...p, time }))
                  userMsg(time)
                  doConfirm(time)
                }}
                className="py-2.5 rounded-xl text-sm font-medium border relative"
                style={{
                  background:   avail ? '#161b27' : '#0d1117',
                  borderColor:  avail ? '#2a3147' : '#e24b4b33',
                  color:        avail ? '#e8edf5' : '#e24b4b66',
                  cursor:       avail ? 'pointer' : 'not-allowed',
                  opacity:      avail ? 1 : 0.6,
                  textDecoration: avail ? 'none' : 'line-through',
                }}
              >
                {time}
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* ── Farewell — Another booking / Exit ── */}
        {step === 'farewell' && !botBusy && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col gap-2">
            <motion.button whileTap={{ scale: 0.97 }} onClick={restartBooking}
              className="w-full px-4 py-3.5 rounded-xl border text-sm font-medium"
              style={{ background: accent + '18', borderColor: accent + '66', color: accent }}
            >
              {t.anotherBooking}
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setConfirmed(true)}
              className="w-full px-4 py-3.5 rounded-xl border text-sm font-medium"
              style={{ background: '#1e2436', borderColor: '#2a3147', color: '#94a3b8' }}
            >
              {t.exit}
            </motion.button>
          </motion.div>
        )}

        {/* ── Cancel list — upcoming appointments ── */}
        {step === 'cancel_list' && !botBusy && !loadingAppts && guestAppts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col gap-2">
            {guestAppts.map(apt => {
              const aptDate   = new Date(apt.date)
              const isConfirm = confirmingCancel === apt.id
              const isCancelling = cancellingId === apt.id
              return (
                <div key={apt.id} className="rounded-2xl border overflow-hidden"
                     style={{ background: '#161b27', borderColor: '#2a3147' }}>
                  {/* Appointment info */}
                  <div className="p-4">
                    <p className="text-sm font-medium" style={{ color: '#e8edf5' }}>{apt.service}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#5a6a82' }}>
                      {formatDate(aptDate)} · {aptDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {/* Cancel action */}
                  <div className="px-4 pb-4">
                    {isConfirm ? (
                      <div className="flex items-center gap-2">
                        <p className="text-xs flex-1" style={{ color: '#94a3b8' }}>
                          {t.cancelConfirm(apt.service, formatDate(aptDate))}
                        </p>
                        <motion.button whileTap={{ scale: 0.95 }}
                          disabled={isCancelling}
                          onClick={() => executeCancel(apt)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium shrink-0"
                          style={{ background: '#e24b4b22', color: '#e24b4b', border: '1px solid #e24b4b44' }}
                        >
                          {isCancelling ? '...' : t.cancelYes}
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.95 }}
                          onClick={() => setConfirmingCancel(null)}
                          className="px-3 py-1.5 rounded-lg text-xs"
                          style={{ background: '#1e2436', color: '#94a3b8', border: '1px solid #2a3147' }}
                        >
                          {t.cancelNo}
                        </motion.button>
                      </div>
                    ) : (
                      <motion.button whileTap={{ scale: 0.97 }}
                        onClick={() => setConfirmingCancel(apt.id)}
                        className="w-full py-2 rounded-xl text-xs font-medium border"
                        style={{ background: '#e24b4b18', borderColor: '#e24b4b44', color: '#e24b4b' }}
                      >
                        {t.cancelAction}
                      </motion.button>
                    )}
                  </div>
                </div>
              )
            })}
          </motion.div>
        )}

        {/* ── Cancel done — back to menu ── */}
        {step === 'cancel_done' && !botBusy && (
          <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.97 }} onClick={restartBooking}
            className="w-full px-4 py-3.5 rounded-xl border text-sm font-medium"
            style={{ background: accent + '18', borderColor: accent + '66', color: accent }}
          >
            {t.backToMenu}
          </motion.button>
        )}

        {/* ── Universal back button ── */}
        {canGoBack && (
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            whileTap={{ scale: 0.97 }} onClick={goBack}
            className="self-start px-3 py-1.5 rounded-lg text-xs border"
            style={{ background: 'transparent', borderColor: '#2a3147', color: '#5a6a82' }}
          >
            {t.back}
          </motion.button>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Text input bar */}
      {['name', 'email', 'phone', 'cancel_email'].includes(step) && (
        <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-4 py-3 border-t"
             style={{ background: '#0d1117', borderColor: '#2a3147' }}>
          <div className="flex gap-2">
            <input
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={
                step === 'name'         ? 'Your full name...'    :
                step === 'email'        ? 'Your email...'        :
                step === 'phone'        ? 'Your phone number...' :
                                          'Your email...'
              }
              autoFocus
              className="flex-1 rounded-xl px-4 py-3 text-sm outline-none border"
              style={{ background: '#161b27', borderColor: '#2a3147', color: '#e8edf5' }}
            />
            {step === 'phone' && (
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleSkip}
                className="px-3 rounded-xl text-xs border"
                style={{ background: '#161b27', borderColor: '#2a3147', color: '#5a6a82' }}
              >
                {t.skip}
              </motion.button>
            )}
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleSend}
              disabled={!inputVal.trim()}
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: inputVal.trim() ? accent : '#1e2436', opacity: inputVal.trim() ? 1 : 0.5 }}
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
