import axios from 'axios'
import * as cheerio from 'cheerio'
import type { ScrapedItem } from '../types/index.js'

const http = axios.create({
  timeout: 12000,
  headers: { 'User-Agent': 'ai-tracker/1.0 (research tool; contact: admin@localhost)' },
})

const AI_KEYWORDS = [
  'ai', 'llm', 'gpt', 'claude', 'gemini', 'model', 'neural', 'machine learning',
  'deep learning', 'openai', 'anthropic', 'mistral', 'transformer', 'diffusion',
  'agent', 'inference', 'fine-tun', 'rag', 'embedding', 'vector', 'benchmark',
  'language model', 'generative', 'chatgpt', 'llama', 'multimodal', 'copilot',
]

function isAiRelevant(title: string): boolean {
  const lower = title.toLowerCase()
  return AI_KEYWORDS.some((kw) => lower.includes(kw))
}

interface HNItem {
  id: number
  type: string
  title?: string
  url?: string
  score?: number
  text?: string
}

async function scrapeHackerNews(limit = 20): Promise<ScrapedItem[]> {
  const { data: ids } = await http.get<number[]>(
    'https://hacker-news.firebaseio.com/v0/topstories.json'
  )
  const topIds = ids.slice(0, 60)

  const items = await Promise.allSettled(
    topIds.map((id) =>
      http
        .get<HNItem>(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
        .then((r) => r.data)
    )
  )

  return items
    .filter(
      (r): r is PromiseFulfilledResult<HNItem> =>
        r.status === 'fulfilled' &&
        r.value?.type === 'story' &&
        isAiRelevant(r.value?.title ?? '')
    )
    .slice(0, limit)
    .map((r) => ({
      title: r.value.title ?? '',
      url: r.value.url ?? `https://news.ycombinator.com/item?id=${r.value.id}`,
      rawScore: r.value.score ?? 0,
      sourceName: 'hackernews',
      text: r.value.text,
    }))
}

async function scrapeReddit(subreddit: string, sourceName: string, limit = 15): Promise<ScrapedItem[]> {
  const { data } = await http.get(
    `https://www.reddit.com/r/${subreddit}/hot.json?limit=30`
  )
  const posts = (data?.data?.children ?? []) as { data: {
    stickied: boolean; title: string; url: string; selftext?: string; score: number
  } }[]

  return posts
    .filter((p) => !p.data.stickied)
    .slice(0, limit)
    .map((p) => ({
      title: p.data.title,
      url: p.data.url.startsWith('/r/')
        ? `https://reddit.com${p.data.url}`
        : p.data.url,
      text: p.data.selftext?.slice(0, 800),
      rawScore: p.data.score,
      sourceName,
    }))
}

async function scrapeProductHunt(limit = 10): Promise<ScrapedItem[]> {
  const { data: html } = await http.get('https://www.producthunt.com/topics/artificial-intelligence')
  const $ = cheerio.load(html as string)
  const items: ScrapedItem[] = []

  $('a[href*="/posts/"]').each((_i, el) => {
    if (items.length >= limit) return false
    const title = $(el).text().trim()
    const href = $(el).attr('href') ?? ''
    if (!title || title.length < 5) return
    items.push({
      title,
      url: href.startsWith('http') ? href : `https://www.producthunt.com${href}`,
      rawScore: 100,
      sourceName: 'producthunt',
    })
  })

  return items
}

export async function scrapeAll(): Promise<ScrapedItem[]> {
  const results = await Promise.allSettled([
    scrapeHackerNews(15),
    scrapeReddit('MachineLearning', 'reddit_ml', 10),
    scrapeReddit('artificial', 'reddit_ai', 10),
    scrapeProductHunt(8),
  ])

  const items = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.url)) return false
    seen.add(item.url)
    return true
  })
}
