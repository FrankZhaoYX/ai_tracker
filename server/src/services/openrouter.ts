import axios from 'axios'
import { env } from '../config/env.js'
import type { AnalysisResult, ScrapedItem } from '../types/index.js'

const SYSTEM_PROMPT = `You are an AI trend analyst. Analyze the given tech article/post and return a JSON object with exactly these fields:
- summary: string (2-3 sentences explaining why this matters for AI/tech practitioners)
- tags: string[] (3-5 lowercase topic tags, e.g. ["llm", "open-source", "benchmark"])
- hotScore: number (integer 1-100: 90+=historic, 80-89=major breakthrough, 60-79=significant, 40-59=noteworthy, below 40=minor)

Consider novelty, community engagement, and relevance to AI/ML. Return ONLY valid JSON, no markdown fences.`

async function callOpenRouter(userContent: string, retries = 2): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'meta-llama/llama-3.3-70b-instruct:free',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userContent },
          ],
          temperature: 0.3,
          max_tokens: 350,
        },
        {
          headers: {
            Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3001',
            'X-Title': 'AI Hot Topic Tracker',
          },
          timeout: 20000,
        }
      )
      return response.data?.choices?.[0]?.message?.content ?? '{}'
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status
      if (status === 429 && attempt < retries) {
        const wait = (attempt + 1) * 12000  // 12s, 24s
        console.warn(`[openrouter] 429 rate limit — retrying in ${wait / 1000}s`)
        await new Promise((r) => setTimeout(r, wait))
        continue
      }
      throw err
    }
  }
  throw new Error('Max retries exceeded')
}

export async function analyzeContent(item: ScrapedItem): Promise<AnalysisResult> {
  const userContent = `Title: ${item.title}
URL: ${item.url}
Source: ${item.sourceName}
Community score: ${item.rawScore}
${item.text ? `Content: ${item.text.slice(0, 600)}` : ''}`

  try {
    const raw = await callOpenRouter(userContent)
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(cleaned) as Partial<AnalysisResult>

    return {
      summary: parsed.summary ?? item.title,
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
      hotScore: Math.min(100, Math.max(1, Math.round(Number(parsed.hotScore) || 50))),
    }
  } catch (err) {
    console.error('[openrouter] analysis failed:', (err as Error).message)
    const fallback = Math.min(85, Math.round(Math.log10(item.rawScore + 2) * 28))
    return {
      summary: '',
      tags: [],
      hotScore: Math.max(10, fallback),
    }
  }
}
