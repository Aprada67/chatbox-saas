import { motion } from 'framer-motion'

const variants = {
  primary:  'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white',
  secondary:'bg-[var(--bg-tertiary)] hover:bg-[var(--border)] text-[var(--text-2)]',
  danger:   'bg-[var(--error-bg)] hover:bg-[var(--error)] text-[var(--error)] hover:text-white',
  ghost:    'bg-transparent hover:bg-[var(--bg-tertiary)] text-[var(--text-2)]',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}

const Button = ({
  children, variant = 'primary', size = 'md',
  loading = false, className = '', ...props
}) => {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={`
        ${variants[variant]} ${sizes[size]}
        rounded-xl font-medium border border-(--border)
        transition-all duration-150 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
        ${className}
      `}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading
        ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        : children
      }
    </motion.button>
  )
}

export default Button