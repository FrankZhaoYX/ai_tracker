import axios from 'axios'
import * as cheerio from 'cheerio'
import type { ScrapedItem } from '../types/index.js'

const http = axios.create({
  timeout: 12000,
  headers: { 'User-Agent': 'ai-tracker/1.0 (research tool; contact: admin@localhost)' },
})

// ─── Quality gates ────────────────────────────────────────────────────────────

const MIN_SCORE: Record<string, number> = {
  hackernews:     50,
  reddit_ml:      10,
  reddit_localllama: 5,
  arxiv:          0,
  huggingface:    0,
}

function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw)
    // Strip tracking params
    ;['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref'].forEach(
      (p) => u.searchParams.delete(p)
    )
    // Remove trailing slash
    return u.href.replace(/\/$/, '')
  } catch {
    return raw
  }
}

function isValidItem(item: ScrapedItem): boolean {
  const min = MIN_SCORE[item.sourceName] ?? 0
  return (
    item.title.length >= 15 &&
    item.url.startsWith('http') &&
    item.rawScore >= min
  )
}

// ─── Hacker News ──────────────────────────────────────────────────────────────

const AI_KEYWORDS = [
  'ai', 'llm', 'gpt', 'claude', 'gemini', 'openai', 'anthropic', 'mistral',
  'machine learning', 'deep learning', 'neural', 'transformer', 'diffusion',
  'agent', 'inference', 'fine-tun', 'rag', 'embedding', 'benchmark',
  'language model', 'generative', 'chatgpt', 'llama', 'multimodal', 'copilot',
  'stable diffusion', 'hugging face', 'huggingface', 'reinforcement', 'nlp',
  'computer vision', 'image generation', 'text-to',
]

function isAiRelevant(title: string): boolean {
  const lower = title.toLowerCase()
  return AI_KEYWORDS.some((kw) => lower.includes(kw))
}

interface HNItem {
  id: number; type: string; title?: string; url?: string; score?: number; text?: string
}

async function scrapeHackerNews(limit = 15): Promise<ScrapedItem[]> {
  const { data: ids } = await http.get<number[]>(
    'https://hacker-news.firebaseio.com/v0/topstories.json'
  )

  const items = await Promise.allSettled(
    ids.slice(0, 80).map((id) =>
      http.get<HNItem>(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then((r) => r.data)
    )
  )

  return items
    .filter(
      (r): r is PromiseFulfilledResult<HNItem> =>
        r.status === 'fulfilled' &&
        r.value?.type === 'story' &&
        (r.value?.score ?? 0) >= MIN_SCORE.hackernews &&
        isAiRelevant(r.value?.title ?? '')
    )
    .slice(0, limit)
    .map((r) => ({
      title: r.value.title ?? '',
      url: normalizeUrl(r.value.url ?? `https://news.ycombinator.com/item?id=${r.value.id}`),
      rawScore: r.value.score ?? 0,
      sourceName: 'hackernews',
      text: r.value.text,
    }))
}

// ─── Reddit ───────────────────────────────────────────────────────────────────

interface RedditPost {
  data: { stickied: boolean; title: string; url: string; selftext?: string; score: number }
}

async function scrapeReddit(
  subreddit: string,
  sourceName: string,
  limit = 12,
  minScore = 10
): Promise<ScrapedItem[]> {
  const { data } = await http.get(`https://www.reddit.com/r/${subreddit}/hot.json?limit=30`)
  const posts = (data?.data?.children ?? []) as RedditPost[]

  return posts
    .filter((p) => !p.data.stickied && p.data.score >= minScore && p.data.title.length >= 15)
    .slice(0, limit)
    .map((p) => ({
      title: p.data.title,
      url: normalizeUrl(
        p.data.url.startsWith('/r/') ? `https://reddit.com${p.data.url}` : p.data.url
      ),
      text: p.data.selftext?.slice(0, 800),
      rawScore: p.data.score,
      sourceName,
    }))
}

// ─── arXiv ────────────────────────────────────────────────────────────────────

async function scrapeArxiv(limit = 12): Promise<ScrapedItem[]> {
  const categories = 'cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CL+OR+cat:cs.CV'
  const { data: xml } = await http.get(
    `https://export.arxiv.org/api/query?search_query=${categories}&sortBy=submittedDate&sortOrder=descending&max_results=${limit * 2}`,
    { headers: { Accept: 'application/xml' }, timeout: 15000 }
  )

  const $ = cheerio.load(xml as string, { xmlMode: true })
  const items: ScrapedItem[] = []

  $('entry').each((_i, el) => {
    if (items.length >= limit) return false

    const title = $(el).find('title').first().text().replace(/\s+/g, ' ').trim()
    const id    = $(el).find('id').first().text().trim()
    const url   = id.replace('http://', 'https://')
    const summary = $(el).find('summary').first().text().replace(/\s+/g, ' ').trim().slice(0, 600)
    const categories = $(el).find('category').map((_, c) => $(c).attr('term')).get().join(', ')

    if (!title || !url || title.length < 15) return

    items.push({
      title,
      url,
      text: `${summary} [categories: ${categories}]`,
      rawScore: 0,  // arXiv has no community score — AI will judge quality
      sourceName: 'arxiv',
    })
  })

  return items
}

// ─── HuggingFace Daily Papers ─────────────────────────────────────────────────

interface HFPaper {
  paper?: { title?: string; id?: string; summary?: string }
  upvotes?: number
  numComments?: number
}

async function scrapeHuggingFace(limit = 10): Promise<ScrapedItem[]> {
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await http.get(`https://huggingface.co/api/daily_papers?date=${today}`, {
    timeout: 10000,
  })

  const papers = (Array.isArray(data) ? data : []) as HFPaper[]

  return papers
    .filter((p) => p.paper?.title && p.paper?.id)
    .sort((a, b) => (b.upvotes ?? 0) - (a.upvotes ?? 0))
    .slice(0, limit)
    .map((p) => ({
      title: p.paper!.title!,
      url: `https://huggingface.co/papers/${p.paper!.id}`,
      text: p.paper!.summary?.slice(0, 600),
      rawScore: (p.upvotes ?? 0) * 10 + (p.numComments ?? 0) * 2,
      sourceName: 'huggingface',
    }))
}

// ─── scrapeAll ────────────────────────────────────────────────────────────────

export async function scrapeAll(): Promise<ScrapedItem[]> {
  const results = await Promise.allSettled([
    scrapeHackerNews(15),
    scrapeReddit('MachineLearning',  'reddit_ml',         12, MIN_SCORE.reddit_ml),
    scrapeReddit('LocalLLaMA',       'reddit_localllama', 12, MIN_SCORE.reddit_localllama),
    scrapeArxiv(12),
    scrapeHuggingFace(10),
  ])

  // Log per-source success/failure
  const names = ['hackernews', 'reddit_ml', 'reddit_localllama', 'arxiv', 'huggingface']
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.warn(`[scraper] ${names[i]} failed:`, (r.reason as Error).message)
    } else {
      console.log(`[scraper] ${names[i]}: ${r.value.length} items`)
    }
  })

  const raw = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))

  // Apply quality gates + deduplicate by normalized URL
  const seen = new Set<string>()
  return raw.filter((item) => {
    const url = normalizeUrl(item.url)
    if (seen.has(url) || !isValidItem(item)) return false
    seen.add(url)
    item.url = url  // store normalized URL
    return true
  })
}
