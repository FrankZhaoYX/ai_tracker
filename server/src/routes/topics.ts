import { Router } from 'express'
import { prisma } from '../db/prisma.js'
import type { TopicWithSource } from '../types/index.js'

export const topicsRouter = Router()

export function parseTopic(t: {
  id: string
  title: string
  summary: string
  url: string
  hotScore: number
  rawScore: number
  tags: string
  firstSeen: Date
  updatedAt: Date
  source: { id: string; name: string; url: string }
  trendData: { hotScore: number; recordedAt: Date }[]
}): TopicWithSource {
  return { ...t, tags: JSON.parse(t.tags || '[]') }
}

topicsRouter.get('/', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
  const offset = parseInt(req.query.offset as string) || 0
  const source = req.query.source as string | undefined
  const minScore = parseInt(req.query.minScore as string) || 0

  const where = {
    ...(source ? { source: { name: source } } : {}),
    hotScore: { gte: minScore },
  }

  const [topics, total] = await Promise.all([
    prisma.topic.findMany({
      where,
      include: {
        source: true,
        trendData: { orderBy: { recordedAt: 'asc' }, take: 20 },
      },
      orderBy: { hotScore: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.topic.count({ where }),
  ])

  res.json({ topics: topics.map(parseTopic), total, limit, offset })
})

topicsRouter.get('/:id', async (req, res) => {
  const topic = await prisma.topic.findUnique({
    where: { id: req.params.id },
    include: {
      source: true,
      trendData: { orderBy: { recordedAt: 'asc' } },
      alerts: { orderBy: { sentAt: 'desc' }, take: 5 },
    },
  })
  if (!topic) {
    res.status(404).json({ error: 'Topic not found' })
    return
  }
  res.json(parseTopic(topic))
})
