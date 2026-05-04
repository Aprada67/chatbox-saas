import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  MessageSquare, Calendar, Bell, Shield, Zap, BarChart,
  Check, ChevronRight, Menu, X, Moon, Sun, Star, ArrowRight,
  Clock, Users, TrendingUp,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const PLANS = [
  {
    name: 'Trial',
    price: 'Gratis',
    oldPrice: null,
    period: '7 días',
    color: 'var(--text-3)',
    features: [
      '1 chatbot',
      'Reservas online 24/7',
      'Confirmaciones por email',
      'Calendario básico',
    ],
    cta: 'Empezar gratis',
    popular: false,
    savings: null,
  },
  {
    name: 'Pro',
    price: '34,99 €',
    oldPrice: '39,99 €',
    period: '/mes',
    color: 'var(--accent)',
    features: [
      '1 chatbot',
      'Todo lo del Trial',
      'Colores y marca propia',
      'Recordatorios WhatsApp',
      'Soporte prioritario',
    ],
    cta: 'Empezar con Pro',
    popular: true,
    savings: 'Ahorra 5 €/mes',
  },
  {
    name: 'Premium',
    price: '79,99 €',
    oldPrice: '110 €',
    period: '/mes',
    color: 'var(--success)',
    features: [
      'Hasta 3 chatbots',
      'Todo lo del Pro',
      'Analíticas avanzadas',
      'Integración CRM',
      'Acceso a la API',
      'Soporte dedicado',
    ],
    cta: 'Empezar con Premium',
    popular: false,
    savings: 'Ahorra 30 €/mes',
  },
];

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'Constructor de chatbot',
    desc: 'Crea tu flujo de reservas en minutos. Sin código. Solo configura tus preguntas, servicios y horarios.',
  },
  {
    icon: Calendar,
    title: 'Disponibilidad en tiempo real',
    desc: 'Tus clientes solo ven los horarios disponibles. Sin dobles reservas, sin llamadas para reagendar.',
  },
  {
    icon: Bell,
    title: 'Recordatorios automáticos',
    desc: 'Recordatorios por email y WhatsApp enviados automáticamente 24h antes de cada cita.',
  },
  {
    icon: BarChart,
    title: 'Analíticas de negocio',
    desc: 'Controla reservas, horas pico y retención de clientes desde tu panel de control.',
  },
  {
    icon: Shield,
    title: 'Seguro y fiable',
    desc: 'Autenticación JWT, límite de intentos y datos cifrados mantienen tu negocio protegido.',
  },
  {
    icon: Zap,
    title: 'Configuración instantánea',
    desc: 'Comparte tu enlace en Instagram, WhatsApp o tu web. Empieza a recibir reservas hoy mismo.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Jesús B.',
    role: 'Dueño de barbería',
    text: 'Antes perdía 2 horas al día al teléfono. Ahora mis clientes se reservan solos y yo solo tengo que aparecer.',
    avatar: 'J',
    color: '#A0522D',
    stars: 5,
  },
  {
    name: 'Sofía R.',
    role: 'Dueña de nail salon',
    text: 'Los recordatorios de WhatsApp redujeron mis no-shows un 60%. Vale cada céntimo.',
    avatar: 'S',
    color: '#ec4899',
    stars: 5,
  },
  {
    name: 'Carlos V.',
    role: 'Entrenador personal',
    text: 'Mis clientes adoran reservar a las 2 de la mañana. Me despierto con la agenda llena.',
    avatar: 'C',
    color: '#7c3aed',
    stars: 5,
  },
];

const STATS = [
  { icon: Users,      value: '2.400+', label: 'negocios activos' },
  { icon: Calendar,   value: '180k+',  label: 'reservas gestionadas' },
  { icon: TrendingUp, value: '60%',    label: 'menos no-shows' },
  { icon: Clock,      value: '3h',     label: 'ahorradas por semana' },
];

const NAV_LINKS = [
  { label: 'Funciones',    href: '#features'      },
  { label: 'Precios',      href: '#pricing'        },
  { label: 'Testimonios',  href: '#testimonials'   },
];

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55 },
};

const Landing = () => {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ background: 'var(--bg-primary)', color: 'var(--text-1)' }}>

      {/* ── NAVBAR ── */}
      <nav
        className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{ background: 'var(--bg-primary)dd', borderColor: 'var(--border)' }}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
                 style={{ background: 'var(--accent)' }}>
              <MessageSquare size={15} color="white" />
            </div>
            <span className="font-bold text-base tracking-tight" style={{ color: 'var(--text-1)' }}>
              Chatbox
            </span>
          </div>

          {/* Links desktop */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm px-3 py-2 rounded-lg transition-all cursor-pointer"
                style={{ color: 'var(--text-3)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-1)'; e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'transparent'; }}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Acciones navbar */}
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer transition-all"
              style={{ color: 'var(--text-3)', background: 'var(--bg-tertiary)' }}
              whileHover={{ background: 'var(--border)' }}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </motion.button>

            <Link
              to="/login"
              className="hidden md:block text-sm px-4 py-2 rounded-xl transition-all cursor-pointer font-medium"
              style={{ color: 'var(--text-2)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              Iniciar sesión
            </Link>
            <Link to="/register">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="hidden md:flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-medium cursor-pointer shadow-sm"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                Empezar gratis <ChevronRight size={13} />
              </motion.div>
            </Link>

            <button
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer"
              style={{ color: 'var(--text-3)', background: 'var(--bg-tertiary)' }}
              onClick={() => setMenuOpen((p) => !p)}
            >
              {menuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {/* Menú móvil */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t overflow-hidden"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
            >
              <div className="px-4 py-4 flex flex-col gap-2">
                {NAV_LINKS.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="text-sm py-2.5 px-3 rounded-xl cursor-pointer"
                    style={{ color: 'var(--text-2)' }}
                  >
                    {item.label}
                  </a>
                ))}
                <div className="flex flex-col gap-2 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                  <Link to="/login" onClick={() => setMenuOpen(false)}
                    className="text-sm py-2.5 px-4 rounded-xl text-center border cursor-pointer"
                    style={{ color: 'var(--text-2)', borderColor: 'var(--border)' }}>
                    Iniciar sesión
                  </Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)}
                    className="text-sm py-2.5 px-4 rounded-xl text-center font-medium cursor-pointer"
                    style={{ background: 'var(--accent)', color: '#fff' }}>
                    Empezar gratis
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── HERO ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 pt-24 pb-20">
        <div className="text-center">
          <motion.div {...fadeUp}>
            {/* Badge */}
            <motion.div
              whileHover={{ scale: 1.04 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-8 border cursor-default"
              style={{ background: 'var(--accent-bg)', color: 'var(--accent)', borderColor: 'var(--accent)' }}
            >
              <Zap size={11} fill="currentColor" />
              La forma más rápida de gestionar reservas
            </motion.div>

            {/* Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              Tu negocio merece
              <br />
              <span
                className="relative"
                style={{ color: 'var(--accent)' }}
              >
                un sistema más inteligente
              </span>
            </h1>

            <p className="text-base md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
               style={{ color: 'var(--text-3)' }}>
              Crea un chatbot que gestiona reservas 24/7. Comparte un enlace.
              Observa cómo tu agenda se llena sola.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <Link to="/register">
                <motion.div
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-semibold cursor-pointer shadow-lg"
                  style={{ background: 'var(--accent)', color: '#fff',
                    boxShadow: '0 8px 24px color-mix(in srgb, var(--accent) 35%, transparent)' }}
                >
                  Empezar gratis — 7 días
                  <ArrowRight size={15} />
                </motion.div>
              </Link>
              <a href="#features">
                <motion.div
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-semibold border cursor-pointer"
                  style={{ color: 'var(--text-2)', borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
                >
                  Ver cómo funciona
                </motion.div>
              </a>
            </div>

            <p className="text-xs" style={{ color: 'var(--text-3)' }}>
              Sin tarjeta de crédito · Cancela cuando quieras
            </p>
          </motion.div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.55 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.06 }}
              whileHover={{ y: -2 }}
              className="rounded-2xl border p-4 flex flex-col items-center gap-1.5 cursor-default"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
            >
              <s.icon size={16} style={{ color: 'var(--accent)' }} />
              <span className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>{s.value}</span>
              <span className="text-xs text-center" style={{ color: 'var(--text-3)' }}>{s.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Chatbot mockup */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.65 }}
          animate={{ y: [0, -6, 0] }}
          // @ts-ignore
          {...{ transition: { y: { duration: 4, repeat: Infinity, ease: 'easeInOut' } } }}
          className="mt-16 max-w-sm mx-auto rounded-3xl border overflow-hidden"
          style={{
            background: '#111827',
            borderColor: '#2a3147',
            boxShadow: '0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px #2a314788',
          }}
        >
          {/* Notificación flotante */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7 }}
            className="absolute -right-2 top-8 flex items-center gap-2 px-3 py-2 rounded-xl text-xs shadow-xl"
            style={{ background: '#1D9E75', color: '#fff', zIndex: 10 }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
            ¡Nueva reserva recibida!
          </motion.div>

          {/* Header del preview */}
          <div className="flex items-center gap-3 px-4 py-4 border-b" style={{ borderColor: '#2a3147' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                 style={{ background: 'var(--accent)' }}>
              C
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Mi Asistente</p>
              <div className="flex items-center gap-1">
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-green-400"
                />
                <span className="text-xs" style={{ color: '#5a6a82' }}>En línea</span>
              </div>
            </div>
          </div>

          {/* Mensajes del preview */}
          <div className="p-4 flex flex-col gap-3">
            {[
              { from: 'bot',  text: '¡Hola! Soy tu asistente. ¿Qué servicio te interesa?' },
              { from: 'user', text: 'Corte + barba' },
              { from: 'bot',  text: '¡Perfecto! ¿Qué día te viene mejor?' },
            ].map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: msg.from === 'bot' ? -12 : 12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + i * 0.18 }}
                className={'flex ' + (msg.from === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className="max-w-xs px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed"
                  style={
                    msg.from === 'bot'
                      ? { background: 'var(--accent)', color: '#fff', borderBottomLeftRadius: '4px' }
                      : { background: '#1e2436', color: '#e8edf5', borderBottomRightRadius: '4px', border: '0.5px solid #2a3147' }
                  }
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}

            {/* Opciones del preview */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1.1 }}
              className="flex gap-2 flex-wrap mt-1"
            >
              {['Lun 5 mayo', 'Mar 6 mayo', 'Mié 7 mayo'].map((day) => (
                <motion.div
                  key={day}
                  whileHover={{ scale: 1.05, borderColor: 'var(--accent)' }}
                  className="px-3 py-1.5 rounded-xl text-xs border cursor-pointer transition-all"
                  style={{ background: '#1e2436', borderColor: '#2a3147', color: '#94a3b8' }}
                >
                  {day}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="max-w-6xl mx-auto px-4 md:px-8 py-24">
        <motion.div {...fadeUp} className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--accent)' }}>
            Funcionalidades
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Todo lo que necesita tu negocio
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: 'var(--text-3)' }}>
            Diseñado para negocios de servicios que quieren trabajar de forma más inteligente.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ y: -4, borderColor: 'var(--accent)' }}
              className="rounded-2xl border p-6 flex flex-col gap-4 cursor-default transition-colors"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
            >
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                   style={{ background: 'var(--accent-bg)' }}>
                <f.icon size={20} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-1)' }}>
                  {f.title}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>
                  {f.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24" style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <motion.div {...fadeUp} className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--accent)' }}>
              Cómo funciona
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              En marcha en 3 pasos
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: 'var(--text-3)' }}>
              Sin técnicos, sin configuraciones complicadas.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Crea tu chatbot', desc: 'Define tus servicios, precios y horarios de disponibilidad en minutos.' },
              { step: '02', title: 'Comparte el enlace', desc: 'Comparte tu link en Instagram, WhatsApp o tu web. Sin apps, sin descargas.' },
              { step: '03', title: 'Recibe reservas', desc: 'Tus clientes reservan solos. Tú recibes el aviso y apareces a la cita.' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                whileHover={{ y: -3 }}
                className="rounded-2xl border p-6 flex flex-col gap-4 cursor-default"
                style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)' }}
              >
                <span className="text-4xl font-black" style={{ color: 'var(--accent)', opacity: 0.25 }}>
                  {item.step}
                </span>
                <div>
                  <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-1)' }}>{item.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 md:px-8 py-24">
        <motion.div {...fadeUp} className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--accent)' }}>
            Precios
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Precios simples y honestos
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: 'var(--text-3)' }}>
            Empieza gratis. Actualiza cuando estés listo.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: plan.popular ? -4 : -3 }}
              className="rounded-2xl border p-7 flex flex-col relative cursor-default"
              style={{
                background: plan.popular ? 'var(--accent-bg)' : 'var(--bg-secondary)',
                borderColor: plan.popular ? 'var(--accent)' : 'var(--border)',
                boxShadow: plan.popular ? '0 0 0 1px var(--accent), 0 16px 40px color-mix(in srgb, var(--accent) 12%, transparent)' : 'none',
              }}
            >
              {/* Badge popular */}
              {plan.popular && (
                <div
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold text-white shadow"
                  style={{ background: 'var(--accent)' }}
                >
                  Más popular
                </div>
              )}

              {/* Savings badge */}
              {plan.savings && (
                <div
                  className="absolute top-5 right-5 px-2.5 py-1 rounded-lg text-[10px] font-semibold"
                  style={{ background: 'var(--success-bg)', color: 'var(--success)' }}
                >
                  {plan.savings}
                </div>
              )}

              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: plan.color }}>
                  {plan.name}
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-black" style={{ color: 'var(--text-1)' }}>
                    {plan.price}
                  </span>
                  <div className="mb-1.5 flex flex-col">
                    {plan.oldPrice && (
                      <span className="text-xs line-through" style={{ color: 'var(--text-3)' }}>
                        {plan.oldPrice}
                      </span>
                    )}
                    <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                      {plan.period}
                    </span>
                  </div>
                </div>
              </div>

              {/* Features del plan */}
              <div className="flex flex-col gap-3 flex-1 mb-7">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                         style={{ background: plan.popular ? 'var(--accent)' : 'var(--bg-tertiary)' }}>
                      <Check size={10} style={{ color: plan.popular ? '#fff' : plan.color }} />
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text-2)' }}>{f}</span>
                  </div>
                ))}
              </div>

              {/* CTA del plan */}
              <Link to="/register">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-center cursor-pointer transition-all"
                  style={{
                    background: plan.popular ? 'var(--accent)' : 'transparent',
                    color: plan.popular ? '#fff' : 'var(--text-2)',
                    border: plan.popular ? 'none' : '1.5px solid var(--border)',
                  }}
                >
                  {plan.cta}
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-24" style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <motion.div {...fadeUp} className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--accent)' }}>
              Testimonios
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Los negocios adoran Chatbox
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: 'var(--text-3)' }}>
              Resultados reales de dueños de negocios reales.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="rounded-2xl border p-6 flex flex-col gap-5 cursor-default"
                style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)' }}
              >
                {/* Estrellas */}
                <div className="flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, si) => (
                    <Star key={si} size={13} fill="currentColor" style={{ color: '#f59e0b' }} />
                  ))}
                </div>

                <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--text-2)' }}>
                  "{t.text}"
                </p>

                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ background: t.color }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-1)' }}>{t.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-24">
        <motion.div
          {...fadeUp}
          whileHover={{ scale: 1.005 }}
          className="relative rounded-3xl p-10 md:p-16 text-center border overflow-hidden cursor-default"
          style={{ background: 'var(--accent-bg)', borderColor: 'var(--accent)' }}
        >
          {/* Glow de fondo */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, color-mix(in srgb, var(--accent) 8%, transparent) 0%, transparent 70%)',
            }}
          />

          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--accent)' }}>
            Empieza hoy
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 relative"
              style={{ color: 'var(--text-1)' }}>
            ¿Listo para automatizar tus reservas?
          </h2>
          <p className="text-base mb-10 max-w-lg mx-auto relative" style={{ color: 'var(--text-3)' }}>
            Únete a cientos de negocios que ahorran horas cada semana con Chatbox.
          </p>
          <Link to="/register">
            <motion.div
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2.5 px-9 py-4 rounded-2xl text-sm font-bold cursor-pointer shadow-xl relative"
              style={{
                background: 'var(--accent)',
                color: '#fff',
                boxShadow: '0 12px 32px color-mix(in srgb, var(--accent) 40%, transparent)',
              }}
            >
              Empezar gratis ahora
              <ArrowRight size={16} />
            </motion.div>
          </Link>
          <p className="text-xs mt-5 relative" style={{ color: 'var(--text-3)' }}>
            7 días de prueba gratuita · Sin tarjeta de crédito
          </p>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                 style={{ background: 'var(--accent)' }}>
              <MessageSquare size={13} color="white" />
            </div>
            <span className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>Chatbox</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>
            © 2026 Chatbox. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-5">
            {['Privacidad', 'Términos', 'Contacto'].map((item) => (
              <a
                key={item}
                href="#"
                className="text-xs transition-all cursor-pointer"
                style={{ color: 'var(--text-3)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
