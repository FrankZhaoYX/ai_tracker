import cron from 'node-cron'
import type { Server } from 'socket.io'
import { prisma } from '../db/prisma.js'
import { scrapeAll } from './scraper.js'
import { scrapeTwitter } from './twitter.js'
import { analyzeContent } from './openrouter.js'
import { sendAlert } from './email.js'
import { parseTopic } from '../routes/topics.js'

let currentTask: cron.ScheduledTask | null = null

async function runScrapeAndAnalyze(io: Server): Promise<void> {
  const timestamp = new Date().toISOString()
  io.emit('scrape:started', { timestamp })
  console.log('[scheduler] scrape started', timestamp)

  try {
    const settings = await prisma.settings.findUnique({ where: { id: 'singleton' } })
    const threshold = settings?.alertThreshold ?? 80
    const emailEnabled = settings?.emailEnabled ?? false

    const [webItems, twitterItems] = await Promise.all([scrapeAll(), scrapeTwitter(8)])
    const allItems = [...webItems, ...twitterItems]

    // fetch sources map
    const sources = await prisma.source.findMany()
    const sourceMap = Object.fromEntries(sources.map((s) => [s.name, s.id]))

    let count = 0

    // Process in batches of 5 to respect rate limits
    for (let i = 0; i < allItems.length; i += 5) {
      const batch = allItems.slice(i, i + 5)

      await Promise.all(
        batch.map(async (item) => {
          const sourceId = sourceMap[item.sourceName]
          if (!sourceId) return

          try {
            const analysis = await analyzeContent(item)

            const existing = await prisma.topic.findUnique({ where: { url: item.url } })

            const topic = await prisma.topic.upsert({
              where: { url: item.url },
              create: {
                title: item.title,
                summary: analysis.summary,
                url: item.url,
                sourceId,
                hotScore: analysis.hotScore,
                rawScore: item.rawScore,
                tags: JSON.stringify(analysis.tags),
              },
              update: {
                hotScore: analysis.hotScore,
                rawScore: item.rawScore,
                summary: analysis.summary,
                tags: JSON.stringify(analysis.tags),
              },
              include: {
                source: true,
                trendData: { orderBy: { recordedAt: 'asc' }, take: 20 },
              },
            })

            // Append trend snapshot
            await prisma.trendData.create({
              data: { topicId: topic.id, hotScore: analysis.hotScore },
            })

            const parsed = parseTopic(topic)
            if (!existing) {
              io.emit('topic:new', parsed)
            } else {
              io.emit('topic:updated', parsed)
            }

            // Alert if above threshold
            if (analysis.hotScore >= threshold && !existing) {
              if (emailEnabled) {
                const sent = await sendAlert(parsed, threshold)
                if (sent) {
                  await prisma.alert.create({
                    data: { topicId: topic.id, type: 'email', threshold },
                  })
                }
              }
            }

            count++
          } catch (err) {
            console.error('[scheduler] item processing error:', (err as Error).message)
          }
        })
      )

      // Small delay between batches
      if (i + 5 < allItems.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    // Emit updated stats
    const [total, avg] = await Promise.all([
      prisma.topic.count(),
      prisma.topic.aggregate({ _avg: { hotScore: true } }),
    ])
    io.emit('stats:update', { totalTopics: total, avgHotScore: Math.round(avg._avg.hotScore ?? 0) })
    io.emit('scrape:completed', { count, timestamp: new Date().toISOString() })

    console.log(`[scheduler] scrape done — ${count} topics processed`)
  } catch (err) {
    console.error('[scheduler] scrape error:', err)
    io.emit('scrape:error', { message: (err as Error).message })
  }
}

export function startScheduler(io: Server): void {
  const task = cron.schedule('*/30 * * * *', () => runScrapeAndAnalyze(io))
  currentTask = task
  console.log('[scheduler] started — running every 30 minutes')

  // Run immediately on start
  setTimeout(() => runScrapeAndAnalyze(io), 3000)
}

export function restartScheduler(io: Server, expression: string): void {
  currentTask?.stop()
  const task = cron.schedule(expression, () => runScrapeAndAnalyze(io))
  currentTask = task
  console.log(`[scheduler] restarted with expression: ${expression}`)
}

export async function triggerManualScrape(io: Server): Promise<void> {
  await runScrapeAndAnalyze(io)
}
