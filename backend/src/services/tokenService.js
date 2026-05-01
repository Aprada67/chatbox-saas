import jwt from 'jsonwebtoken'

export const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

export const generateTrialEndDate = () => {
  const date = new Date()
  // Agrega 7 días a la fecha actual
  date.setDate(date.getDate() + 7)
  return date
}