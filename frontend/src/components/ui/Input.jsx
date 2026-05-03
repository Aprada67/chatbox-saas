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
          ${error ? 'border-(--error)' : ''}
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