import axios from 'axios'
import { env } from '../config/env.js'
import type { ScrapedItem } from '../types/index.js'

interface TweetAuthor {
  userName?: string
  followers?: number
  isBlueVerified?: boolean
  isVerified?: boolean
}

interface Tweet {
  text?: string
  url?: string
  likeCount?: number
  retweetCount?: number
  quoteCount?: number
  viewCount?: number
  author?: TweetAuthor
}

// Quality gate: verified account with real following
function isQualityAccount(author?: TweetAuthor): boolean {
  if (!author) return false
  const followers = author.followers ?? 0
  const verified = author.isBlueVerified === true || author.isVerified === true
  return followers > 10000 && verified
}

export async function scrapeTwitter(limit = 10): Promise<ScrapedItem[]> {
  if (!env.TWITTER_API_KEY) return []

  try {
    const { data } = await axios.get('https://api.twitterapi.io/twitter/tweet/advanced_search', {
      headers: { 'X-API-Key': env.TWITTER_API_KEY },
      params: {
        query: [
          '(AI OR LLM OR "language model" OR "machine learning" OR OpenAI OR Anthropic',
          'OR "deep learning" OR "neural network" OR GPT OR Claude OR Gemini OR Mistral)',
          'lang:en -is:retweet min_faves:1000 min_retweets:500',
        ].join(' '),
        queryType: 'Latest',
        count: limit * 5,  // fetch more to survive quality filtering
      },
      timeout: 12000,
    })

    const tweets = (data?.tweets ?? []) as Tweet[]

    return tweets
      .filter((t) =>
        t.text &&
        t.url &&
        t.text.length >= 30 &&
        (t.likeCount ?? 0) > 1000 &&
        (t.retweetCount ?? 0) > 500 &&
        (t.viewCount ?? 0) > 5000 &&
        isQualityAccount(t.author)
      )
      .slice(0, limit)
      .map((t) => ({
        title: t.text!.replace(/https?:\/\/\S+/g, '').trim().slice(0, 220),
        url: t.url!,
        rawScore: (t.likeCount ?? 0) + (t.retweetCount ?? 0) * 3 + (t.quoteCount ?? 0) * 2,
        sourceName: 'twitter',
        text: `@${t.author?.userName ?? 'unknown'} (${(t.author?.followers ?? 0).toLocaleString()} followers)`,
      }))
  } catch (err) {
    console.warn('[twitter] scrape failed (non-critical):', (err as Error).message)
    return []
  }
}
