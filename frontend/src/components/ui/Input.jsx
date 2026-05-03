const Input = ({ label, error, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-(--text-3) uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        className={`
          w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors
          bg-(--bg-tertiary) text-(--text-1) placeholder:text-(--text-3)
          focus:border-(--accent)
          ${error ? 'border-(--error)' : 'border-(--border)'}
          ${className}
        `}
        {...props}
      />
      {error && (
        <span className="text-xs text-(--error)">{error}</span>
      )}
    </div>
  )
}

export default Input