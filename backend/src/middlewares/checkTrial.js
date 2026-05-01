import { AppError } from './errorHandler.js'

export const checkTrial = (req, res, next) => {
  const user = req.user

  if (!user) return next()

  if (user.plan === 'trial' && user.trialEndsAt) {
    const now = new Date()
    const trialEnd = new Date(user.trialEndsAt)

    if (now > trialEnd) {
      throw new AppError(
        'Your trial period has ended. Please upgrade to a paid plan to continue using the service.',
        403
      )
    }
  }

  next()
}