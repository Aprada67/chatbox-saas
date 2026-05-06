// WhatsApp reminders via Twilio (sandbox / production)
// NOTE: requires `npm install twilio` — package is not yet installed.
// Until installed, this module exports a no-op so the rest of the app keeps working.

let twilioClient = null

try {
  // Lazy import — fails silently if `twilio` is not installed
  const { default: twilio } = await import('twilio')
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  }
} catch {
  // `twilio` package not installed — keep client null and treat sends as no-ops
  twilioClient = null
}

// Envia un recordatorio por WhatsApp 24h antes de la cita
export const sendWhatsAppReminder = async (appointment) => {
  // Guard: sin credenciales o sin teléfono — no hacemos nada
  if (!process.env.TWILIO_ACCOUNT_SID || !appointment?.guestPhone) return
  if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) return

  try {
    const date = new Date(appointment.date)
    const time = date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    })

    const body = `Hola ${appointment.guestName}, te recordamos tu cita de ${appointment.service} mañana a las ${time}. ¡Te esperamos!`

    await twilioClient.messages.create({
      from: 'whatsapp:' + process.env.TWILIO_PHONE_NUMBER,
      to:   'whatsapp:' + appointment.guestPhone,
      body,
    })

    console.log(`WhatsApp reminder sent to ${appointment.guestPhone}`)
  } catch (err) {
    // Nunca lanzamos — el cron debe seguir procesando el resto de citas
    console.error('WhatsApp reminder error:', err?.message || err)
  }
}

export default { sendWhatsAppReminder }
