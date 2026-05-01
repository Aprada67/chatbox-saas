import { db } from '../config/db.js'
import { chatbots } from '../models/schema.js'
import { eq } from 'drizzle-orm'

export const generateSlug = (name) => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100)
}

export const generateUniqueSlug = async (name) => {
  let slug = generateSlug(name)
  let exists = true
  let counter = 0

  while (exists) {
    const candidate = counter === 0 ? slug : `${slug}-${counter}`
    const [found] = await db
      .select({ id: chatbots.id })
      .from(chatbots)
      .where(eq(chatbots.slug, candidate))

    if (!found) {
      slug = candidate
      exists = false
    } else {
      counter++
    }
  }

  return slug
}