import { pgTable, uuid, varchar, text, boolean, timestamp, pgEnum, integer, jsonb } from 'drizzle-orm/pg-core'

export const roleEnum = pgEnum('role', ['admin', 'client', 'user'])
export const planEnum = pgEnum('plan', ['trial', 'pro', 'premium'])
export const appointmentStatusEnum = pgEnum('appointment_status', ['pending', 'confirmed', 'cancelled', 'completed'])

//Define la tabla de usuarios
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: varchar('clerk_id', { length: 100 }).unique(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password'),
  role: roleEnum('role').default('user').notNull(),
  plan: planEnum('plan').default('trial'),
  isActive: boolean('is_active').default(true).notNull(),
  trialEndsAt: timestamp('trial_ends_at'),
  emailNotifs: boolean('email_notifs').default(true).notNull(),
  reminderNotifs: boolean('reminder_notifs').default(true).notNull(),
  timezone: varchar('timezone', { length: 100 }).default('UTC').notNull(),
  stripeCustomerId: varchar('stripe_customer_id', { length: 100 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Define la tabla de chatbots
export const chatbots = pgTable('chatbots', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  welcomeMessage: text('welcome_message').notNull(),
  color: varchar('color', { length: 7 }).default('#3b82f6').notNull(),
  bgImage: text('bg_image'),
  language: varchar('language', { length: 5 }).default('en').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  slug: varchar('slug', { length: 150 }).notNull().unique(),
  steps: jsonb('steps').default([]).notNull(),
  services: jsonb('services').default([]).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Define la tabla de citas
export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatbotId: uuid('chatbot_id').notNull().references(() => chatbots.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id').references(() => users.id, { onDelete: 'set null' }),
  guestName: varchar('guest_name', { length: 100 }).notNull(),
  guestEmail: varchar('guest_email', { length: 255 }),
  guestPhone: varchar('guest_phone', { length: 30 }),
  service: varchar('service', { length: 100 }).notNull(),
  price: integer('price').notNull(),
  durationMins: integer('duration_mins').notNull(),
  date: timestamp('date').notNull(),
  status: appointmentStatusEnum('status').default('pending').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Define la tabla de notificaciones
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(), // 'new_appointment' | 'cancellation'
  title: varchar('title', { length: 150 }).notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  data: jsonb('data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Define la tabla de horarios disponibles
export const availabilitySlots = pgTable('availability_slots', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatbotId: uuid('chatbot_id').notNull().references(() => chatbots.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(),
  startTime: varchar('start_time', { length: 5 }).notNull(),
  endTime: varchar('end_time', { length: 5 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
})