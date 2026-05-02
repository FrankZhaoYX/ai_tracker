import cron from 'node-cron'
import type { Server } from 'socket.io'
import { prisma } from '../db/prisma.js'
import { scrapeAll } from './scraper.js'
import { scrapeTwitter } from './twitter.js'
import { analyzeContent } from './openrouter.js'
import { sendAlert } from './email.js'
import { parseTopic } from '../routes/topics.js'

let currentTask: cron.ScheduledTask | null = null

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function runScrapeAndAnalyze(io: Server): Promise<void> {
  const timestamp = new Date().toISOString()
  io.emit('scrape:started', { timestamp })
  console.log('[scheduler] scrape started', timestamp)

  try {
    const settings = await prisma.settings.findUnique({ where: { id: 'singleton' } })
    const threshold = settings?.alertThreshold ?? 80
    const emailEnabled = settings?.emailEnabled ?? false

    // ── Phase 1: Scrape all sources ──────────────────────────────────────────
    const [webItems, twitterItems] = await Promise.all([scrapeAll(), scrapeTwitter(8)])
    const allItems = [...webItems, ...twitterItems]

    const sources = await prisma.source.findMany()
    const sourceMap = Object.fromEntries(sources.map((s) => [s.name, s.id]))

    // ── Phase 2: Upsert all items immediately with fallback scores ───────────
    // This ensures the feed is always populated, even without AI analysis.
    const newTopicIds: string[] = []

    for (const item of allItems) {
      const sourceId = sourceMap[item.sourceName]
      if (!sourceId) continue

      const fallbackScore = Math.min(85, Math.max(10, Math.round(Math.log10(item.rawScore + 2) * 28)))

      const existing = await prisma.topic.findUnique({ where: { url: item.url } })

      const topic = await prisma.topic.upsert({
        where: { url: item.url },
        create: {
          title: item.title,
          summary: '',         // empty = not yet AI-analyzed
          url: item.url,
          sourceId,
          hotScore: fallbackScore,
          rawScore: item.rawScore,
          tags: '[]',
        },
        update: {
          rawScore: item.rawScore,
          // Only update score if not yet AI-analyzed (summary is empty)
          ...(existing?.summary === '' || !existing ? { hotScore: fallbackScore } : {}),
        },
        include: {
          source: true,
          trendData: { orderBy: { recordedAt: 'asc' }, take: 20 },
        },
      })

      await prisma.trendData.create({
        data: { topicId: topic.id, hotScore: topic.hotScore },
      })

      const parsed = parseTopic(topic)
      io.emit(existing ? 'topic:updated' : 'topic:new', parsed)

      // Track new topics that need AI analysis (no summary yet)
      if (!existing || existing.summary === '') {
        newTopicIds.push(topic.id)
      }
    }

    io.emit('scrape:completed', { count: allItems.length, timestamp: new Date().toISOString() })
    console.log(`[scheduler] phase 1 done — ${allItems.length} topics upserted, ${newTopicIds.length} queued for AI`)

    // ── Phase 3: AI analysis — sequential, max 8, 7s apart ──────────────────
    // 7s between calls ≈ 8 req/min, safely under OpenRouter free tier (~10/min)
    const toAnalyze = newTopicIds.slice(0, 8)
    let analyzed = 0

    for (const topicId of toAnalyze) {
      const topic = await prisma.topic.findUnique({
        where: { id: topicId },
        include: { source: true },
      })
      if (!topic) continue

      try {
        const analysis = await analyzeContent({
          title: topic.title,
          url: topic.url,
          rawScore: topic.rawScore,
          sourceName: topic.source.name,
        })

        const updated = await prisma.topic.update({
          where: { id: topicId },
          data: {
            summary: analysis.summary,
            hotScore: analysis.hotScore,
            tags: JSON.stringify(analysis.tags),
          },
          include: {
            source: true,
            trendData: { orderBy: { recordedAt: 'asc' }, take: 20 },
          },
        })

        // Update trend with AI-calibrated score
        await prisma.trendData.create({
          data: { topicId, hotScore: analysis.hotScore },
        })

        const parsed = parseTopic(updated)
        io.emit('topic:updated', parsed)

        // Email alert for high-score new topics
        if (analysis.hotScore >= threshold && emailEnabled) {
          const sent = await sendAlert(parsed, threshold)
          if (sent) {
            await prisma.alert.create({ data: { topicId, type: 'email', threshold } })
          }
        }

        analyzed++
        console.log(`[openrouter] analyzed "${topic.title.slice(0, 50)}" → score ${analysis.hotScore}`)
      } catch (err) {
        console.error('[scheduler] AI analysis error:', (err as Error).message)
      }

      // Wait 7 seconds before the next OpenRouter call
      if (analyzed < toAnalyze.length) {
        await delay(7000)
      }
    }

    if (analyzed > 0) {
      const [total, avg] = await Promise.all([
        prisma.topic.count(),
        prisma.topic.aggregate({ _avg: { hotScore: true } }),
      ])
      io.emit('stats:update', { totalTopics: total, avgHotScore: Math.round(avg._avg.hotScore ?? 0) })
      console.log(`[scheduler] AI analysis done — ${analyzed}/${toAnalyze.length} topics enriched`)
    }
  } catch (err) {
    console.error('[scheduler] error:', err)
    io.emit('scrape:error', { message: (err as Error).message })
  }
}

export function startScheduler(io: Server): void {
  const task = cron.schedule('*/30 * * * *', () => runScrapeAndAnalyze(io))
  currentTask = task
  console.log('[scheduler] started — running every 30 minutes')
  setTimeout(() => runScrapeAndAnalyze(io), 3000)
}

export function restartScheduler(io: Server, expression: string): void {
  currentTask?.stop()
  currentTask = cron.schedule(expression, () => runScrapeAndAnalyze(io))
  console.log(`[scheduler] restarted with expression: ${expression}`)
}

export async function triggerManualScrape(io: Server): Promise<void> {
  await runScrapeAndAnalyze(io)
}
