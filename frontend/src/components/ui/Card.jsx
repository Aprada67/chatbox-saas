const Card = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`
        bg-(--bg-secondary) border border-(--border)
        rounded p-6 ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card