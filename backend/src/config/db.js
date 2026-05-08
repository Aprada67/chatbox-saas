import { neon, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL no está definida en .env')
}

// Retry fetch: Neon free tier pauses after inactivity; the first request after
// sleep can get a ConnectTimeout. We retry up to 3 times with exponential backoff.
const retryFetch = async (url, options, attempt = 1) => {
  try {
    return await fetch(url, options)
  } catch (err) {
    const isTimeout =
      err?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
      err?.message?.includes('fetch failed')
    if (isTimeout && attempt < 3) {
      await new Promise(resolve => setTimeout(resolve, 500 * attempt))
      return retryFetch(url, options, attempt + 1)
    }
    throw err
  }
}

neonConfig.fetchFunction = retryFetch

const sql = neon(process.env.DATABASE_URL)
export const db = drizzle(sql)
