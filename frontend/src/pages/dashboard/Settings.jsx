import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { toast } from 'react-hot-toast';
import { Moon, Sun, Globe, Clock, Bell, Shield, LogOut } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../api/axios';

// Idiomas disponibles
const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'pt', label: 'Português' },
  { value: 'fr', label: 'Français' },
];

// Zonas horarias por offset UTC
const TIMEZONES = [
  { value: 'Etc/GMT+12', label: 'UTC−12:00' },
  { value: 'Etc/GMT+11', label: 'UTC−11:00' },
  { value: 'Etc/GMT+10', label: 'UTC−10:00' },
  { value: 'Etc/GMT+9', label: 'UTC−09:00' },
  { value: 'Etc/GMT+8', label: 'UTC−08:00' },
  { value: 'Etc/GMT+7', label: 'UTC−07:00' },
  { value: 'Etc/GMT+6', label: 'UTC−06:00' },
  { value: 'Etc/GMT+5', label: 'UTC−05:00' },
  { value: 'Etc/GMT+4', label: 'UTC−04:00' },
  { value: 'Etc/GMT+3', label: 'UTC−03:00' },
  { value: 'Etc/GMT+2', label: 'UTC−02:00' },
  { value: 'Etc/GMT+1', label: 'UTC−01:00' },
  { value: 'UTC', label: 'UTC±00:00' },
  { value: 'Etc/GMT-1', label: 'UTC+01:00' },
  { value: 'Etc/GMT-2', label: 'UTC+02:00' },
  { value: 'Etc/GMT-3', label: 'UTC+03:00' },
  { value: 'Etc/GMT-4', label: 'UTC+04:00' },
  { value: 'Etc/GMT-5', label: 'UTC+05:00' },
  { value: 'Etc/GMT-6', label: 'UTC+06:00' },
  { value: 'Etc/GMT-7', label: 'UTC+07:00' },
  { value: 'Etc/GMT-8', label: 'UTC+08:00' },
  { value: 'Etc/GMT-9', label: 'UTC+09:00' },
  { value: 'Etc/GMT-10', label: 'UTC+10:00' },
  { value: 'Etc/GMT-11', label: 'UTC+11:00' },
  { value: 'Etc/GMT-12', label: 'UTC+12:00' },
];

// Componente de fila de configuración reutilizable
const SettingRow = ({ icon: Icon, title, subtitle, children }) => (
  <div
    className="flex items-center justify-between py-4 border-b last:border-b-0"
    style={{ borderColor: 'var(--border)' }}
  >
    <div className="flex items-center gap-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: 'var(--bg-tertiary)' }}
      >
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
    <div className="shrink-0 ml-4">{children}</div>
  </div>
);

// Toggle switch reutilizable
const Toggle = ({ value, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!value)}
    className="w-11 h-6 rounded-full transition-all relative shrink-0"
    style={{ background: value ? 'var(--accent)' : 'var(--border)' }}
  >
    <motion.div
      animate={{ x: value ? 26 : 2 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
    />
  </button>
);

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const {
    timezone: ctxTz,
    setTimezone: setCtxTz,
    language: ctxLang,
    saveLanguage,
    t,
  } = useSettings();

  const [timezone, setTimezone] = useState(
    () => user?.timezone || ctxTz || 'UTC',
  );
  const [language, setLanguage] = useState(() => ctxLang || 'en');
  const [emailNotifs, setEmailNotifs] = useState(
    () => user?.emailNotifs ?? true,
  );
  const [reminderNotifs, setReminderNotifs] = useState(
    () => user?.reminderNotifs ?? true,
  );
  const [savingPrefs, setSavingPrefs] = useState(false);

  const savePreferences = async () => {
    try {
      setSavingPrefs(true);
      await api.patch('/auth/preferences', {
        emailNotifs,
        reminderNotifs,
        timezone,
      });
      setCtxTz(timezone);
      localStorage.setItem('timezone', timezone);
      saveLanguage(language);
      toast.success(t('prefsSaved'));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingPrefs(false);
    }
  };

  // Cambia contraseña — llamada al backend
  const [passwords, setPasswords] = useState({
    current: '',
    newPass: '',
    confirm: '',
  });
  const [changingPass, setChangingPass] = useState(false);

  const handleChangePassword = async () => {
    if (passwords.newPass.length < 8) {
      toast.error(t('passMin8'));
      return;
    }
    if (passwords.newPass !== passwords.confirm) {
      toast.error(t('passMismatch'));
      return;
    }
    try {
      setChangingPass(true);
      await api.post('/auth/change-password', {
        currentPassword: passwords.current,
        newPassword: passwords.newPass,
      });
      toast.success(t('passUpdated'));
      setPasswords({ current: '', newPass: '', confirm: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <DashboardLayout title={t('settings')}>
      <div className="max-w-2xl mx-auto flex flex-col gap-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <p
            className="text-xs font-medium uppercase tracking-wide mb-3"
            style={{ color: 'var(--text-3)' }}
          >
            {t('appearance')}
          </p>
          <Card className="p-0 px-4">
            <SettingRow
              icon={theme === 'dark' ? Moon : Sun}
              title={t('theme')}
              subtitle={theme === 'dark' ? t('darkModeOn') : t('lightModeOn')}
            >
              <Toggle value={theme === 'dark'} onChange={toggleTheme} />
            </SettingRow>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p
            className="text-xs font-medium uppercase tracking-wide mb-3"
            style={{ color: 'var(--text-3)' }}
          >
            {t('regional')}
          </p>
          <Card className="p-0 px-4">
            <SettingRow
              icon={Globe}
              title={t('language')}
              subtitle={t('selectLanguage')}
            >
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{
                  fontSize: '13px',
                  padding: '6px 10px',
                  width: 'auto',
                  minWidth: '130px',
                }}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </SettingRow>
            <SettingRow
              icon={Clock}
              title={t('timezone')}
              subtitle={t('timezoneHint')}
            >
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                style={{
                  fontSize: '13px',
                  padding: '6px 10px',
                  width: 'auto',
                  minWidth: '140px',
                }}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </SettingRow>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <p
            className="text-xs font-medium uppercase tracking-wide mb-3"
            style={{ color: 'var(--text-3)' }}
          >
            {t('notifications')}
          </p>
          <Card className="p-0 px-4">
            <SettingRow
              icon={Bell}
              title={t('emailNotifs')}
              subtitle={t('emailNotifsHint')}
            >
              <Toggle value={emailNotifs} onChange={setEmailNotifs} />
            </SettingRow>
            <SettingRow
              icon={Bell}
              title={t('reminderNotifs')}
              subtitle={t('reminderNotifsHint')}
            >
              <Toggle value={reminderNotifs} onChange={setReminderNotifs} />
            </SettingRow>
          </Card>
        </motion.div>

        <Button
          onClick={savePreferences}
          loading={savingPrefs}
          className="w-full"
        >
          {t('savePrefs')}
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p
            className="text-xs font-medium uppercase tracking-wide mb-3"
            style={{ color: 'var(--text-3)' }}
          >
            {t('security')}
          </p>
          <Card className="flex flex-col gap-4">
            <p
              className="text-sm font-medium"
              style={{ color: 'var(--text-1)' }}
            >
              {t('changePassword')}
            </p>
            <div className="flex flex-col gap-3">
              <input
                type="password"
                placeholder={t('currentPassword')}
                value={passwords.current}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, current: e.target.value }))
                }
                style={{ fontSize: '13px', padding: '9px 12px' }}
              />
              <input
                type="password"
                placeholder={t('newPassword')}
                value={passwords.newPass}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, newPass: e.target.value }))
                }
                style={{ fontSize: '13px', padding: '9px 12px' }}
              />
              <input
                type="password"
                placeholder={t('confirmPassword')}
                value={passwords.confirm}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, confirm: e.target.value }))
                }
                style={{ fontSize: '13px', padding: '9px 12px' }}
              />
            </div>
            <Button
              variant="secondary"
              loading={changingPass}
              onClick={handleChangePassword}
            >
              <Shield size={14} />
              {t('updatePassword')}
            </Button>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <p
            className="text-xs font-medium uppercase tracking-wide mb-3"
            style={{ color: 'var(--text-3)' }}
          >
            {t('account')}
          </p>
          <Card className="p-0 px-4">
            <SettingRow
              icon={Shield}
              title={user?.name}
              subtitle={`${user?.email} · ${user?.plan} plan`}
            >
              <span
                className="text-xs px-2.5 py-1 rounded-full capitalize"
                style={{
                  background: 'var(--accent-bg)',
                  color: 'var(--accent)',
                }}
              >
                {user?.role}
              </span>
            </SettingRow>
            <SettingRow
              icon={LogOut}
              title={t('signOut')}
              subtitle={t('signOutAccount')}
            >
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  logout();
                  window.location.href = '/login';
                }}
              >
                {t('signOut')}
              </Button>
            </SettingRow>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
