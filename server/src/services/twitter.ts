import axios from 'axios'
import { env } from '../config/env.js'
import type { ScrapedItem } from '../types/index.js'

export async function scrapeTwitter(limit = 10): Promise<ScrapedItem[]> {
  if (!env.TWITTER_API_KEY) return []

  try {
    const { data } = await axios.get('https://api.twitterapi.io/twitter/tweet/advanced_search', {
      headers: { 'X-API-Key': env.TWITTER_API_KEY },
      params: {
        query: '(AI OR LLM OR GPT OR Claude OR Gemini) lang:en -is:retweet min_faves:100',
        queryType: 'Latest',
        count: limit * 2,
      },
      timeout: 10000,
    })

    const tweets = (data?.tweets ?? []) as {
      text?: string; url?: string; likeCount?: number; retweetCount?: number
    }[]

    return tweets
      .filter((t) => t.text && t.url)
      .slice(0, limit)
      .map((t) => ({
        title: t.text!.slice(0, 200),
        url: t.url!,
        rawScore: (t.likeCount ?? 0) + (t.retweetCount ?? 0) * 3,
        sourceName: 'twitter',
      }))
  } catch (err) {
    console.warn('[twitter] scrape failed (non-critical):', (err as Error).message)
    return []
  }
}
