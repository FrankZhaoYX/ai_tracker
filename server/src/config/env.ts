import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

function requireEnv(name: string): string {
  const val = process.env[name]
  if (!val) throw new Error(`Missing required env var: ${name}`)
  return val
}

export const env = {
  PORT: parseInt(process.env.PORT ?? '3001', 10),
  CLIENT_URL: process.env.CLIENT_URL ?? 'http://localhost:5173',
  DATABASE_URL: requireEnv('DATABASE_URL'),
  OPENROUTER_API_KEY: requireEnv('OPENROUTER_API_KEY'),
  TWITTER_API_KEY: process.env.TWITTER_API_KEY ?? '',
  SMTP_HOST: process.env.SMTP_HOST ?? '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT ?? '465', 10),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER ?? '',
  SMTP_PASS: process.env.SMTP_PASS ?? '',
  NOTIFY_EMAIL: process.env.NOTIFY_EMAIL ?? '',
} as const
