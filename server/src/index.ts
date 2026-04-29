import './config/env.js'
import { createServer } from 'http'
import express from 'express'
import cors from 'cors'
import { Server as SocketIOServer } from 'socket.io'
import { env } from './config/env.js'
import { prisma } from './db/prisma.js'
import { topicsRouter } from './routes/topics.js'
import { statsRouter } from './routes/stats.js'
import { settingsRouter } from './routes/settings.js'
import { registerSocketHandlers } from './socket/handlers.js'
import { startScheduler } from './services/scheduler.js'

const app = express()
const httpServer = createServer(app)

export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: [env.CLIENT_URL, 'http://localhost:5173'],
    methods: ['GET', 'POST'],
  },
})

app.use(cors({ origin: [env.CLIENT_URL, 'http://localhost:5173'] }))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/topics', topicsRouter)
app.use('/api/stats', statsRouter)
app.use('/api/settings', settingsRouter)

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: err.message })
})

async function seed() {
  await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      cronExpression: '*/30 * * * *',
      alertThreshold: 80,
      emailEnabled: false,
      notifyEmail: env.NOTIFY_EMAIL,
    },
  })

  const sources = [
    { name: 'hackernews', url: 'https://news.ycombinator.com' },
    { name: 'reddit_ml', url: 'https://www.reddit.com/r/MachineLearning' },
    { name: 'reddit_ai', url: 'https://www.reddit.com/r/artificial' },
    { name: 'twitter', url: 'https://twitter.com' },
    { name: 'producthunt', url: 'https://www.producthunt.com' },
  ]

  for (const s of sources) {
    await prisma.source.upsert({
      where: { name: s.name },
      update: {},
      create: s,
    })
  }
}

registerSocketHandlers(io)

httpServer.listen(env.PORT, async () => {
  await seed()
  startScheduler(io)
  console.log(`[server] running at http://localhost:${env.PORT}`)
})
