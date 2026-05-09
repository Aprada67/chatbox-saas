/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';
import { getT } from '../i18n';

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const { user } = useAuth();

  // manualTimezone almacena el valor elegido por el usuario en Settings.
  // Se deriva: si hay override manual se usa ese, si no el del servidor, si no localStorage.
  const [manualTimezone, setTimezone] = useState(null);
  const timezone =
    manualTimezone ??
    user?.timezone ??
    localStorage.getItem('timezone') ??
    'UTC';

  const [language, setLanguage] = useState(() => {
    if (localStorage.getItem('language')) return localStorage.getItem('language');
    const browser = navigator.language?.slice(0, 2).toLowerCase();
    return ['es', 'pt', 'fr'].includes(browser) ? browser : 'en';
  });

  const t = getT(language);

  const LOCALE_MAP = { en: 'en-US', es: 'es-ES', pt: 'pt-BR', fr: 'fr-FR' };
  const locale = LOCALE_MAP[language] || 'en-US';

  const formatDate = (date, options = {}) =>
    new Date(date).toLocaleDateString(locale, {
      timeZone: timezone,
      ...options,
    });

  const formatTime = (date, options = {}) =>
    new Date(date).toLocaleTimeString(locale, {
      timeZone: timezone,
      ...options,
    });

  const formatDateTime = (date, options = {}) =>
    new Date(date).toLocaleString(locale, { timeZone: timezone, ...options });

  const saveLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  return (
    <SettingsContext.Provider
      value={{
        timezone,
        setTimezone,
        language,
        saveLanguage,
        t,
        formatDate,
        formatTime,
        formatDateTime,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
