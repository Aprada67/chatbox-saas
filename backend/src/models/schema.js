import { pgTable, uuid, varchar, text, boolean, timestamp, pgEnum, integer, jsonb } from 'drizzle-orm/pg-core'

export const roleEnum = pgEnum('role', ['admin', 'client', 'user'])
export const planEnum = pgEnum('plan', ['trial', 'pro', 'premium'])
export const appointmentStatusEnum = pgEnum('appointment_status', ['pending', 'confirmed', 'cancelled', 'completed'])

//Define la tabla de usuarios
export const users = pgTable('users', {
  id:          uuid('id').primaryKey().defaultRandom(),
  name:        varchar('name', { length: 100 }).notNull(),
  email:       varchar('email', { length: 255 }).notNull().unique(),
  password:    text('password').notNull(),
  role:        roleEnum('role').default('user').notNull(),
  plan:        planEnum('plan').default('trial'),
  isActive:    boolean('is_active').default(true).notNull(),
  trialEndsAt: timestamp('trial_ends_at'),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  updatedAt:   timestamp('updated_at').defaultNow().notNull(),
})

// Define la tabla de chatbots
export const chatbots = pgTable('chatbots', {
  id:             uuid('id').primaryKey().defaultRandom(),
  ownerId:        uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name:           varchar('name', { length: 100 }).notNull(),
  welcomeMessage: text('welcome_message').notNull(),
  color:          varchar('color', { length: 7 }).default('#3b82f6').notNull(),
  bgImage:        text('bg_image'),
  isActive:       boolean('is_active').default(true).notNull(),
  slug:           varchar('slug', { length: 150 }).notNull().unique(),
  steps:          jsonb('steps').default([]).notNull(),
  services:       jsonb('services').default([]).notNull(),
  createdAt:      timestamp('created_at').defaultNow().notNull(),
  updatedAt:      timestamp('updated_at').defaultNow().notNull(),
})

// Define la tabla de citas
export const appointments = pgTable('appointments', {
  id:           uuid('id').primaryKey().defaultRandom(),
  chatbotId:    uuid('chatbot_id').notNull().references(() => chatbots.id, { onDelete: 'cascade' }),
  clientId:     uuid('client_id').references(() => users.id, { onDelete: 'set null' }),
  guestName:    varchar('guest_name', { length: 100 }).notNull(),
  guestEmail:   varchar('guest_email', { length: 255 }),
  guestPhone:   varchar('guest_phone', { length: 30 }),
  service:      varchar('service', { length: 100 }).notNull(),
  price:        integer('price').notNull(),
  durationMins: integer('duration_mins').notNull(),
  date:         timestamp('date').notNull(),
  status:       appointmentStatusEnum('status').default('pending').notNull(),
  notes:        text('notes'),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
  updatedAt:    timestamp('updated_at').defaultNow().notNull(),
})

// Define la tabla de horarios disponibles
export const availabilitySlots = pgTable('availability_slots', {
  id:         uuid('id').primaryKey().defaultRandom(),
  chatbotId:  uuid('chatbot_id').notNull().references(() => chatbots.id, { onDelete: 'cascade' }),
  dayOfWeek:  integer('day_of_week').notNull(),
  startTime:  varchar('start_time', { length: 5 }).notNull(),
  endTime:    varchar('end_time', { length: 5 }).notNull(),
  isActive:   boolean('is_active').default(true).notNull(),
})