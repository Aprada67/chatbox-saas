import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { getT }    from '../i18n'

const SettingsContext = createContext(null)

export const SettingsProvider = ({ children }) => {
  const { user } = useAuth()

  const [timezone, setTimezone] = useState(
    () => localStorage.getItem('timezone') || 'UTC'
  )
  const [language, setLanguage] = useState(
    () => localStorage.getItem('language') || 'en'
  )

  useEffect(() => {
    if (user?.timezone) {
      setTimezone(user.timezone)
      localStorage.setItem('timezone', user.timezone)
    }
  }, [user?.timezone])

  const t = getT(language)

  const LOCALE_MAP = { en: 'en-US', es: 'es-ES', pt: 'pt-BR', fr: 'fr-FR' }
  const locale = LOCALE_MAP[language] || 'en-US'

  const formatDate = (date, options = {}) =>
    new Date(date).toLocaleDateString(locale, { timeZone: timezone, ...options })

  const formatTime = (date, options = {}) =>
    new Date(date).toLocaleTimeString(locale, { timeZone: timezone, ...options })

  const formatDateTime = (date, options = {}) =>
    new Date(date).toLocaleString(locale, { timeZone: timezone, ...options })

  const saveLanguage = (lang) => {
    setLanguage(lang)
    localStorage.setItem('language', lang)
  }

  return (
    <SettingsContext.Provider value={{
      timezone, setTimezone,
      language, saveLanguage,
      t,
      formatDate, formatTime, formatDateTime,
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)
