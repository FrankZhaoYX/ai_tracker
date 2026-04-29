import type { Server } from 'socket.io'
import { prisma } from '../db/prisma.js'
import { parseTopic } from '../routes/topics.js'

export function registerSocketHandlers(io: Server): void {
  io.on('connection', (socket) => {
    console.log(`[socket] connected: ${socket.id}`)

    socket.on('request:initial', async () => {
      try {
        const topics = await prisma.topic.findMany({
          include: {
            source: true,
            trendData: { orderBy: { recordedAt: 'asc' }, take: 20 },
          },
          orderBy: { hotScore: 'desc' },
          take: 20,
        })
        socket.emit('initial:data', topics.map(parseTopic))
      } catch (err) {
        console.error('[socket] initial data error:', err)
      }
    })

    socket.on('disconnect', () => {
      console.log(`[socket] disconnected: ${socket.id}`)
    })
  })
}
