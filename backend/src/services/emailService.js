import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST,
  port:   parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from:    process.env.EMAIL_FROM,
      to,
      subject,
      html,
    })
    console.log(`Email enviado a ${to}`)
  } catch (error) {
    console.error('Error enviando email:', error.message)
    // No lanzamos el error — si el email falla, la cita igual se crea
  }
}

// Recordatorio de cita para el cliente (se envía 24 horas antes)
export const sendAppointmentConfirmation = async (appointment) => {
  if (!appointment.guestEmail) return

  const date = new Date(appointment.date)
  const formattedDate = date.toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric',
    month: 'long',   day: 'numeric'
  })
  const formattedTime = date.toLocaleTimeString('es-ES', {
    hour: '2-digit', minute: '2-digit'
  })

  await sendEmail({
    to:      appointment.guestEmail,
    subject: 'Appointment Confirmation',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1e293b">Appointment Confirmation</h2>
        <p>Hello <strong>${appointment.guestName}</strong>, your appointment has been confirmed.</p>
        <div style="background:#f8fafc;border-radius:12px;padding:16px;margin:16px 0">
          <p style="margin:6px 0"><strong>Service:</strong> ${appointment.service}</p>
          <p style="margin:6px 0"><strong>Date:</strong> ${formattedDate}</p>
          <p style="margin:6px 0"><strong>Time:</strong> ${formattedTime}</p>
          <p style="margin:6px 0"><strong>Duration:</strong> ${appointment.durationMins} minutes</p>
          <p style="margin:6px 0"><strong>Price:</strong> $${appointment.price}</p>
        </div>
        <p style="color:#64748b;font-size:13px">If you need to cancel your appointment, you can do so at any time.</p>
      </div>
    `
  })
}

// Recordatorio 1 día antes de la cita
export const sendAppointmentReminder = async (appointment) => {
  if (!appointment.guestEmail) return

  const date = new Date(appointment.date)
  const formattedDate = date.toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric',
    month: 'long',   day: 'numeric'
  })
  const formattedTime = date.toLocaleTimeString('es-ES', {
    hour: '2-digit', minute: '2-digit'
  })

  await sendEmail({
    to:      appointment.guestEmail,
    subject: 'Appointment Reminder — Tomorrow',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1e293b">Appointment Reminder</h2>
        <p>Hello <strong>${appointment.guestName}</strong>, we remind you that you have an appointment tomorrow.</p>
        <div style="background:#f8fafc;border-radius:12px;padding:16px;margin:16px 0">
          <p style="margin:6px 0"><strong>Servicio:</strong> ${appointment.service}</p>
          <p style="margin:6px 0"><strong>Fecha:</strong> ${formattedDate}</p>
          <p style="margin:6px 0"><strong>Hora:</strong> ${formattedTime}</p>
          <p style="margin:6px 0"><strong>Duración:</strong> ${appointment.durationMins} minutos</p>
        </div>
        <p style="color:#64748b;font-size:13px">¡We look forward to seeing you!</p>
      </div>
    `
  })
}

// Notificación al dueño del negocio cuando se agenda una nueva cita
export const sendOwnerNotification = async (appointment, ownerEmail) => {
  if (!ownerEmail) return

  const date = new Date(appointment.date)
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  })

  await sendEmail({
    to:      ownerEmail,
    subject: `New appointment — ${appointment.service}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1e293b">New Appointment Booked</h2>
        <p>A new appointment has been scheduled.</p>
        <div style="background:#f8fafc;border-radius:12px;padding:16px;margin:16px 0">
          <p style="margin:6px 0"><strong>Client:</strong> ${appointment.guestName}</p>
          ${appointment.guestEmail ? `<p style="margin:6px 0"><strong>Email:</strong> ${appointment.guestEmail}</p>` : ''}
          ${appointment.guestPhone ? `<p style="margin:6px 0"><strong>Phone:</strong> ${appointment.guestPhone}</p>` : ''}
          <p style="margin:6px 0"><strong>Service:</strong> ${appointment.service}</p>
          <p style="margin:6px 0"><strong>Date:</strong> ${formattedDate}</p>
          <p style="margin:6px 0"><strong>Time:</strong> ${formattedTime}</p>
          <p style="margin:6px 0"><strong>Duration:</strong> ${appointment.durationMins} min</p>
          <p style="margin:6px 0"><strong>Price:</strong> $${appointment.price}</p>
        </div>
      </div>
    `
  })
}

// En caso de cancelación por parte del cliente o del negocio
export const sendCancellationEmail = async (appointment) => {
  if (!appointment.guestEmail) return

  await sendEmail({
    to:      appointment.guestEmail,
    subject: 'Appointment Cancellation',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1e293b">Appointment Cancellation</h2>
        <p>Hello <strong>${appointment.guestName}</strong>, your appointment for <strong>${appointment.service}</strong> has been cancelled.</p>
        <p style="color:#64748b;font-size:13px">If you wish to reschedule, you can do so at any time.</p>
      </div>
    `
  })
}