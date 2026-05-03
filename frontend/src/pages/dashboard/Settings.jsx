import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import { useAuth }  from '../../context/AuthContext'
import { toast }    from 'react-hot-toast'
import { Moon, Sun, Globe, Clock, Bell, Shield, LogOut } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card            from '../../components/ui/Card'
import Button          from '../../components/ui/Button'
import api             from '../../api/axios'

// Idiomas disponibles
const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'pt', label: 'Português' },
  { value: 'fr', label: 'Français' },
]

// Zonas horarias comunes
const TIMEZONES = [
  { value: 'America/New_York',    label: 'Eastern Time (ET)' },
  { value: 'America/Chicago',     label: 'Central Time (CT)' },
  { value: 'America/Denver',      label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Caracas',     label: 'Venezuela (VET)' },
  { value: 'America/Bogota',      label: 'Colombia (COT)' },
  { value: 'America/Lima',        label: 'Peru (PET)' },
  { value: 'America/Sao_Paulo',   label: 'Brazil (BRT)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Argentina (ART)' },
  { value: 'Europe/Madrid',       label: 'Spain (CET)' },
  { value: 'Europe/London',       label: 'UK (GMT)' },
  { value: 'UTC',                 label: 'UTC' },
]

// Componente de fila de configuración reutilizable
const SettingRow = ({ icon: Icon, title, subtitle, children }) => (
  <div className="flex items-center justify-between py-4 border-b last:border-b-0"
       style={{ borderColor: 'var(--border)' }}>
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
           style={{ background: 'var(--bg-tertiary)' }}>
        <Icon size={15} style={{ color: 'var(--text-3)' }} />
      </div>
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>
          {title}
        </p>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
    <div className="flex-shrink-0 ml-4">
      {children}
    </div>
  </div>
)

// Toggle switch reutilizable
const Toggle = ({ value, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!value)}
    className="w-11 h-6 rounded-full transition-all relative flex-shrink-0"
    style={{ background: value ? 'var(--accent)' : 'var(--border)' }}
  >
    <motion.div
      animate={{ x: value ? 19 : 2 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
    />
  </button>
)

const Settings = () => {
  const { theme, toggleTheme } = useTheme()
  const { user, logout }       = useAuth()

  // Carga preferencias guardadas o usa valores por defecto
  const [language,       setLanguage]       = useState(
    () => localStorage.getItem('language') || 'en'
  )
  const [timezone,       setTimezone]       = useState(
    () => localStorage.getItem('timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone
  )
  const [emailNotifs,    setEmailNotifs]    = useState(
    () => localStorage.getItem('emailNotifs') !== 'false'
  )
  const [reminderNotifs, setReminderNotifs] = useState(
    () => localStorage.getItem('reminderNotifs') !== 'false'
  )

  // Guarda todas las preferencias en localStorage
  const savePreferences = () => {
    localStorage.setItem('language',       language)
    localStorage.setItem('timezone',       timezone)
    localStorage.setItem('emailNotifs',    emailNotifs)
    localStorage.setItem('reminderNotifs', reminderNotifs)
    toast.success('Preferences saved')
  }

  // Cambia contraseña — llamada al backend
  const [passwords, setPasswords] = useState({
    current: '', newPass: '', confirm: ''
  })
  const [changingPass, setChangingPass] = useState(false)

  const handleChangePassword = async () => {
    if (passwords.newPass.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (passwords.newPass !== passwords.confirm) {
      toast.error('Passwords do not match')
      return
    }
    try {
      setChangingPass(true)
      await api.patch('/auth/password', {
        currentPassword: passwords.current,
        newPassword:     passwords.newPass,
      })
      toast.success('Password updated')
      setPasswords({ current: '', newPass: '', confirm: '' })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setChangingPass(false)
    }
  }

  return (
    <DashboardLayout title="Settings">

      <div className="max-w-2xl mx-auto flex flex-col gap-5">

        {/* Sección de apariencia */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1,  y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <p className="text-xs font-medium uppercase tracking-wide mb-3"
             style={{ color: 'var(--text-3)' }}>
            Appearance
          </p>
          <Card className="p-0 px-4">
            <SettingRow
              icon={theme === 'dark' ? Moon : Sun}
              title="Theme"
              subtitle={theme === 'dark' ? 'Dark mode is on' : 'Light mode is on'}
            >
              <Toggle value={theme === 'dark'} onChange={toggleTheme} />
            </SettingRow>
          </Card>
        </motion.div>

        {/* Sección de preferencias regionales */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1,  y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-xs font-medium uppercase tracking-wide mb-3"
             style={{ color: 'var(--text-3)' }}>
            Regional
          </p>
          <Card className="p-0 px-4">
            <SettingRow
              icon={Globe}
              title="Language"
              subtitle="Select your preferred language"
            >
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                style={{
                  fontSize: '13px', padding: '6px 10px',
                  width: 'auto', minWidth: '120px'
                }}
              >
                {LANGUAGES.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </SettingRow>
            <SettingRow
              icon={Clock}
              title="Timezone"
              subtitle="Used for appointment scheduling"
            >
              <select
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                style={{
                  fontSize: '13px', padding: '6px 10px',
                  width: 'auto', minWidth: '160px'
                }}
              >
                {TIMEZONES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </SettingRow>
          </Card>
        </motion.div>

        {/* Sección de notificaciones */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1,  y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <p className="text-xs font-medium uppercase tracking-wide mb-3"
             style={{ color: 'var(--text-3)' }}>
            Notifications
          </p>
          <Card className="p-0 px-4">
            <SettingRow
              icon={Bell}
              title="Email notifications"
              subtitle="Receive emails when a new appointment is booked"
            >
              <Toggle value={emailNotifs} onChange={setEmailNotifs} />
            </SettingRow>
            <SettingRow
              icon={Bell}
              title="Appointment reminders"
              subtitle="Send reminders to clients 24h before their appointment"
            >
              <Toggle value={reminderNotifs} onChange={setReminderNotifs} />
            </SettingRow>
          </Card>
        </motion.div>

        {/* Botón de guardar preferencias */}
        <Button onClick={savePreferences} className="w-full">
          Save preferences
        </Button>

        {/* Sección de seguridad */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1,  y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-xs font-medium uppercase tracking-wide mb-3"
             style={{ color: 'var(--text-3)' }}>
            Security
          </p>
          <Card className="flex flex-col gap-4">
            <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>
              Change password
            </p>

            {/* Campos de cambio de contraseña */}
            <div className="flex flex-col gap-3">
              <input
                type="password"
                placeholder="Current password"
                value={passwords.current}
                onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))}
                style={{ fontSize: '13px', padding: '9px 12px' }}
              />
              <input
                type="password"
                placeholder="New password"
                value={passwords.newPass}
                onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))}
                style={{ fontSize: '13px', padding: '9px 12px' }}
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={passwords.confirm}
                onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                style={{ fontSize: '13px', padding: '9px 12px' }}
              />
            </div>

            <Button
              variant="secondary"
              loading={changingPass}
              onClick={handleChangePassword}
            >
              <Shield size={14} />
              Update password
            </Button>
          </Card>
        </motion.div>

        {/* Sección de cuenta */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1,  y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <p className="text-xs font-medium uppercase tracking-wide mb-3"
             style={{ color: 'var(--text-3)' }}>
            Account
          </p>
          <Card className="p-0 px-4">
            {/* Info del usuario */}
            <SettingRow
              icon={Shield}
              title={user?.name}
              subtitle={`${user?.email} · ${user?.plan} plan`}
            >
              <span className="text-xs px-2.5 py-1 rounded-full capitalize"
                    style={{
                      background: 'var(--accent-bg)',
                      color:      'var(--accent)'
                    }}>
                {user?.role}
              </span>
            </SettingRow>

            {/* Botón de cerrar sesión */}
            <SettingRow
              icon={LogOut}
              title="Sign out"
              subtitle="Sign out of your account"
            >
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  logout()
                  window.location.href = '/login'
                }}
              >
                Sign out
              </Button>
            </SettingRow>
          </Card>
        </motion.div>

      </div>
    </DashboardLayout>
  )
}

export default Settings