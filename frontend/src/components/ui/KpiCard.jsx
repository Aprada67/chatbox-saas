import { motion } from 'framer-motion'

// Tarjeta de métrica reutilizable para el dashboard
const KpiCard = ({ title, value, subtitle, icon: Icon, color = 'var(--accent)' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1,  y: 0 }}
      className="rounded-2xl p-4 md:p-5 border flex flex-col gap-3"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between">
        {/* Título de la métrica */}
        <span className="text-xs font-medium uppercase tracking-wide"
              style={{ color: 'var(--text-3)' }}>
          {title}
        </span>
        {/* Ícono representativo */}
        {Icon && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{ background: 'var(--bg-tertiary)' }}>
            <Icon size={15} style={{ color }} />
          </div>
        )}
      </div>
      <div>
        {/* Valor principal */}
        <p className="text-2xl font-semibold tracking-tight"
           style={{ color: 'var(--text-1)' }}>
          {value ?? '—'}
        </p>
        {/* Subtítulo descriptivo */}
        {subtitle && (
          <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  )
}

export default KpiCard