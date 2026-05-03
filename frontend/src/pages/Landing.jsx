import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  MessageSquare, Calendar, Bell, Shield,
  Zap, BarChart, Check, ChevronRight,
  Menu, X, Moon, Sun
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

// Datos de los planes
const PLANS = [
  {
    name:     'Trial',
    price:    'Free',
    period:   '7 days',
    color:    'var(--text-3)',
    features: [
      '1 chatbot',
      'Appointment booking',
      'Email confirmations',
      'Basic calendar',
    ],
    cta:     'Start free trial',
    popular: false,
  },
  {
    name:     'Pro',
    price:    '$29',
    period:   'per month',
    color:    'var(--accent)',
    features: [
      '1 chatbot',
      'Everything in Trial',
      'Custom colors & branding',
      'WhatsApp reminders',
      'Priority support',
    ],
    cta:     'Get started',
    popular: true,
  },
  {
    name:     'Premium',
    price:    '$79',
    period:   'per month',
    color:    'var(--success)',
    features: [
      'Up to 3 chatbots',
      'Everything in Pro',
      'Advanced analytics',
      'CRM integration',
      'API access',
      'Dedicated support',
    ],
    cta:     'Get Premium',
    popular: false,
  },
]

// Características principales del producto
const FEATURES = [
  {
    icon:  MessageSquare,
    title: 'Smart chatbot builder',
    desc:  'Build your booking flow in minutes. No code required. Just set your questions, services and hours.',
  },
  {
    icon:  Calendar,
    title: 'Real-time availability',
    desc:  'Your clients only see available slots. No double bookings, no phone calls to reschedule.',
  },
  {
    icon:  Bell,
    title: 'Automatic reminders',
    desc:  'Email and WhatsApp reminders sent automatically 24h before every appointment.',
  },
  {
    icon:  BarChart,
    title: 'Business analytics',
    desc:  'Track bookings, peak hours, and client retention from your dashboard.',
  },
  {
    icon:  Shield,
    title: 'Secure and reliable',
    desc:  'JWT authentication, rate limiting and encrypted data keep your business safe.',
  },
  {
    icon:  Zap,
    title: 'Instant setup',
    desc:  'Share your chatbot link on Instagram, WhatsApp or your website. Start receiving bookings today.',
  },
]

// Testimonios de clientes
const TESTIMONIALS = [
  {
    name:   'Jesus B.',
    role:   'Barbershop owner',
    text:   'I used to spend 2 hours a day on the phone scheduling. Now my clients book themselves and I just show up.',
    avatar: 'P',
    color:  '#A0522D',
  },
  {
    name:   'Sofia R.',
    role:   'Nail salon owner',
    text:   'The WhatsApp reminders alone cut my no-shows by 60%. Worth every penny.',
    avatar: 'S',
    color:  '#ec4899',
  },
  {
    name:   'Carlos V.',
    role:   'Personal trainer',
    text:   'My clients love that they can book at 2am. I wake up with a full schedule.',
    avatar: 'C',
    color:  '#3b82f6',
  },
]

// Animación de entrada reutilizable para secciones
const fadeUp = {
  initial:     { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0  },
  viewport:    { once: true },
  transition:  { duration: 0.5 },
}

// Links de navegación
const NAV_LINKS = ['Features', 'Pricing', 'Testimonials']

const Landing = () => {
  const { theme, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div style={{ background: 'var(--bg-primary)', color: 'var(--text-1)' }}>

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 border-b backdrop-blur-sm"
           style={{ background: 'var(--bg-primary)99', borderColor: 'var(--border)' }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                 style={{ background: 'var(--accent)' }}>
              <MessageSquare size={14} color="white" />
            </div>
            <span className="font-semibold text-sm tracking-tight"
                  style={{ color: 'var(--text-1)' }}>
              Chatbox
            </span>
          </div>

          {/* Links desktop */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(item => (
              <a
                key={item}
                href={'#' + item.toLowerCase()}
                className="text-sm transition-all"
                style={{ color: 'var(--text-3)' }}
              >
                {item}
              </a>
            ))}
          </div>

          {/* Acciones navbar */}
          <div className="flex items-center gap-2">

            {/* Toggle de tema */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-lg"
              style={{ color: 'var(--text-3)', background: 'var(--bg-tertiary)' }}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </motion.button>

            {/* Botones auth desktop */}
            <Link to="/login"
                  className="hidden md:block text-sm px-4 py-2 rounded-xl transition-all"
                  style={{ color: 'var(--text-2)' }}>
              Sign in
            </Link>
            <Link to="/register"
                  className="hidden md:block text-sm px-4 py-2 rounded-xl font-medium"
                  style={{ background: 'var(--accent)', color: '#fff' }}>
              Get started
            </Link>

            {/* Botón hamburguesa móvil */}
            <button
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg"
              style={{ color: 'var(--text-3)', background: 'var(--bg-tertiary)' }}
              onClick={() => setMenuOpen(p => !p)}
            >
              {menuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {/* Menú móvil desplegable */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{    height: 0,      opacity: 0 }}
              className="md:hidden border-t overflow-hidden"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
            >
              <div className="px-4 py-4 flex flex-col gap-3">
                {NAV_LINKS.map(item => (
                  <a
                    key={item}
                    href={'#' + item.toLowerCase()}
                    onClick={() => setMenuOpen(false)}
                    className="text-sm py-2"
                    style={{ color: 'var(--text-2)' }}
                  >
                    {item}
                  </a>
                ))}
                <div className="flex flex-col gap-2 pt-2 border-t"
                     style={{ borderColor: 'var(--border)' }}>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="text-sm py-2.5 px-4 rounded-xl text-center border"
                    style={{ color: 'var(--text-2)', borderColor: 'var(--border)' }}
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className="text-sm py-2.5 px-4 rounded-xl text-center font-medium"
                    style={{ background: 'var(--accent)', color: '#fff' }}
                  >
                    Get started free
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── HERO ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pt-20 pb-24 text-center">
        <motion.div {...fadeUp}>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6 border"
               style={{
                 background:  'var(--accent-bg)',
                 color:       'var(--accent)',
                 borderColor: 'var(--accent)',
               }}>
            <Zap size={11} />
            No more phone bookings
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight mb-5 leading-tight">
            Your business deserves<br />
            <span style={{ color: 'var(--accent)' }}>a smarter booking system</span>
          </h1>

          <p className="text-base md:text-lg max-w-xl mx-auto mb-8"
             style={{ color: 'var(--text-3)' }}>
            Build a chatbot that handles bookings 24/7. Share one link.
            Watch your schedule fill up automatically.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{  scale: 0.98 }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                Start free — 7 days
                <ChevronRight size={15} />
              </motion.div>
            </Link>
            <a href="#features">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{  scale: 0.98 }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium border"
                style={{ color: 'var(--text-2)', borderColor: 'var(--border)' }}
              >
                See how it works
              </motion.div>
            </a>
          </div>

          {/* Social proof */}
          <p className="text-xs mt-6" style={{ color: 'var(--text-3)' }}>
            No credit card required · Cancel anytime
          </p>
        </motion.div>

        {/* Preview del chatbot */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-16 max-w-sm mx-auto rounded-3xl border overflow-hidden shadow-2xl"
          style={{ background: '#111827', borderColor: '#2a3147' }}
        >
          {/* Header del preview */}
          <div className="flex items-center gap-3 px-4 py-4 border-b"
               style={{ borderColor: '#2a3147' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                 style={{ background: '#3b82f6' }}>
              P
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                My Assistant
              </p>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-xs" style={{ color: '#5a6a82' }}>Online</span>
              </div>
            </div>
          </div>

          {/* Mensajes del preview */}
          <div className="p-4 flex flex-col gap-3">
            {[
              { from: 'bot',  text: "Hi! I'm your assistant. What service would you like?" },
              { from: 'user', text: 'Haircut + beard' },
              { from: 'bot',  text: 'Great choice! Which day works best for you?' },
            ].map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: msg.from === 'bot' ? -10 : 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className={'flex ' + (msg.from === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className="max-w-xs px-3 py-2 rounded-2xl text-xs"
                  style={msg.from === 'bot'
                    ? { background: '#3b82f6', color: '#fff',
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

            {/* Opciones del preview */}
            <div className="flex gap-2 flex-wrap mt-1">
              {['Mon May 5', 'Tue May 6', 'Wed May 7'].map(day => (
                <div
                  key={day}
                  className="px-3 py-1.5 rounded-xl text-xs border"
                  style={{ background: '#1e2436', borderColor: '#2a3147', color: '#94a3b8' }}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="max-w-6xl mx-auto px-4 md:px-6 py-20">
        <motion.div {...fadeUp} className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
            Everything your business needs
          </h2>
          <p className="text-sm md:text-base" style={{ color: 'var(--text-3)' }}>
            Built for service businesses that want to work smarter, not harder.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="rounded-2xl border p-5 flex flex-col gap-3"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                   style={{ background: 'var(--accent-bg)' }}>
                <f.icon size={17} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-1)' }}>
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

      {/* ── PRICING ── */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 md:px-6 py-20">
        <motion.div {...fadeUp} className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
            Simple, honest pricing
          </h2>
          <p className="text-sm md:text-base" style={{ color: 'var(--text-3)' }}>
            Start free. Upgrade when you're ready.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border p-6 flex flex-col relative"
              style={{
                background:  plan.popular ? 'var(--accent-bg)' : 'var(--bg-secondary)',
                borderColor: plan.popular ? 'var(--accent)'    : 'var(--border)',
              }}
            >
              {/* Badge popular */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium text-white"
                     style={{ background: 'var(--accent)' }}>
                  Most popular
                </div>
              )}

              <div className="mb-5">
                <p className="text-sm font-semibold mb-2" style={{ color: plan.color }}>
                  {plan.name}
                </p>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-bold" style={{ color: 'var(--text-1)' }}>
                    {plan.price}
                  </span>
                  <span className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>
                    {plan.period}
                  </span>
                </div>
              </div>

              {/* Features del plan */}
              <div className="flex flex-col gap-2.5 flex-1 mb-6">
                {plan.features.map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <Check size={13} style={{ color: plan.color, flexShrink: 0 }} />
                    <span className="text-xs" style={{ color: 'var(--text-2)' }}>{f}</span>
                  </div>
                ))}
              </div>

              {/* CTA del plan */}
              <Link to="/register">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{  scale: 0.98 }}
                  className="w-full py-2.5 rounded-xl text-sm font-medium text-center border transition-all"
                  style={{
                    background:  plan.popular ? 'var(--accent)'    : 'transparent',
                    color:       plan.popular ? '#fff'              : 'var(--text-2)',
                    borderColor: plan.popular ? 'var(--accent)'    : 'var(--border)',
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
      <section id="testimonials" className="max-w-6xl mx-auto px-4 md:px-6 py-20">
        <motion.div {...fadeUp} className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
            Businesses love Chatbox
          </h2>
          <p className="text-sm md:text-base" style={{ color: 'var(--text-3)' }}>
            Real results from real business owners.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border p-5 flex flex-col gap-4"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
            >
              <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--text-2)' }}>
                "{t.text}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                     style={{ background: t.color }}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-1)' }}>
                    {t.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                    {t.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-20">
        <motion.div
          {...fadeUp}
          className="rounded-3xl p-8 md:p-12 text-center border"
          style={{ background: 'var(--accent-bg)', borderColor: 'var(--accent)' }}
        >
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3"
              style={{ color: 'var(--text-1)' }}>
            Ready to automate your bookings?
          </h2>
          <p className="text-sm md:text-base mb-7" style={{ color: 'var(--text-3)' }}>
            Join hundreds of businesses saving hours every week.
          </p>
          <Link to="/register">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{  scale: 0.98 }}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-medium"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              Start free today
              <ChevronRight size={15} />
            </motion.div>
          </Link>
          <p className="text-xs mt-4" style={{ color: 'var(--text-3)' }}>
            7-day free trial · No credit card required
          </p>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                 style={{ background: 'var(--accent)' }}>
              <MessageSquare size={12} color="white" />
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
              Chatbox
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>
            2026 Chatbox. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {['Privacy', 'Terms', 'Contact'].map(item => (
              <a key={item} href="#"
                 className="text-xs transition-all"
                 style={{ color: 'var(--text-3)' }}>
                {item}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing