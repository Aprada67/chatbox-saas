import { Moon, Sun, Bell } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'

const TopBar = ({ title }) => {
  // Obtiene el tema actual y la función para cambiarlo
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b flex-shrink-0"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>

      {/* Título de la página actual */}
      <h1 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
        {title}
      </h1>

      {/* Controles de la barra superior */}
      <div className="flex items-center gap-2">

        {/* Toggle de tema oscuro/claro */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
          style={{ color: 'var(--text-3)', background: 'var(--bg-tertiary)' }}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </motion.button>

        {/* Botón de notificaciones */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="w-8 h-8 flex items-center justify-center rounded-lg"
          style={{ color: 'var(--text-3)', background: 'var(--bg-tertiary)' }}
        >
          <Bell size={15} />
        </motion.button>
      </div>
    </header>
  )
}

export default TopBar