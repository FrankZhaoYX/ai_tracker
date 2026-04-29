import nodemailer from 'nodemailer'
import { env } from '../config/env.js'
import type { TopicWithSource } from '../types/index.js'

function createTransport() {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) return null
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  })
}

export async function sendAlert(topic: TopicWithSource, threshold: number): Promise<boolean> {
  const transport = createTransport()
  if (!transport || !env.NOTIFY_EMAIL) return false

  try {
    await transport.sendMail({
      from: env.SMTP_USER,
      to: env.NOTIFY_EMAIL,
      subject: `🔥 Hot Topic Alert [${topic.hotScore}/100]: ${topic.title.slice(0, 60)}`,
      html: `
        <h2>Hot Topic Alert (Score: ${topic.hotScore}/${threshold} threshold)</h2>
        <h3>${topic.title}</h3>
        <p>${topic.summary}</p>
        <p><strong>Source:</strong> ${topic.source.name}</p>
        <p><strong>Tags:</strong> ${topic.tags.join(', ')}</p>
        <p><a href="${topic.url}">Read more →</a></p>
      `,
    })
    return true
  } catch (err) {
    console.error('[email] send failed:', (err as Error).message)
    return false
  }
}
