import { Router } from 'express'
import { prisma } from '../db/prisma.js'
import { parseTopic } from './topics.js'

export const statsRouter = Router()

statsRouter.get('/', async (_req, res) => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

  const [totalTopics, avgResult, sourceGroups, recentCount, topTopic] = await Promise.all([
    prisma.topic.count(),
    prisma.topic.aggregate({ _avg: { hotScore: true } }),
    prisma.topic.groupBy({ by: ['sourceId'], _count: { _all: true } }),
    prisma.topic.count({ where: { updatedAt: { gte: oneHourAgo } } }),
    prisma.topic.findFirst({
      orderBy: { hotScore: 'desc' },
      include: {
        source: true,
        trendData: { orderBy: { recordedAt: 'asc' }, take: 20 },
      },
    }),
  ])

  const sourceIds = sourceGroups.map((g) => g.sourceId)
  const sources = await prisma.source.findMany({ where: { id: { in: sourceIds } } })
  const sourceMap = Object.fromEntries(sources.map((s) => [s.id, s.name]))

  const topicsBySource = Object.fromEntries(
    sourceGroups.map((g) => [sourceMap[g.sourceId] ?? g.sourceId, g._count._all])
  )

  res.json({
    totalTopics,
    avgHotScore: Math.round(avgResult._avg.hotScore ?? 0),
    topicsBySource,
    recentActivity: recentCount,
    topTopic: topTopic ? parseTopic(topTopic) : null,
  })
})
