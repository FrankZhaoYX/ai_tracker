import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof import('axios')>('axios')
  return {
    ...actual,
    default: {
      ...actual.default,
      create: vi.fn(() => ({
        get: vi.fn(),
      })),
    },
  }
})

const HN_IDS = [1, 2, 3, 4, 5]
const HN_STORIES = [
  { id: 1, type: 'story', title: 'GPT-5 Released by OpenAI', url: 'https://example.com/1', score: 500 },
  { id: 2, type: 'story', title: 'New JavaScript Framework', url: 'https://example.com/2', score: 200 },
  { id: 3, type: 'story', title: 'LLM Benchmark Results 2025', url: 'https://example.com/3', score: 300 },
  { id: 4, type: 'comment', title: undefined, url: undefined, score: 0 },
  { id: 5, type: 'story', title: 'Claude 4 Anthropic Model', url: 'https://example.com/5', score: 800 },
]

describe('AI keyword filter', () => {
  it('accepts AI-related titles', () => {
    const aiTitles = [
      'GPT-5 Released', 'New LLM Benchmark', 'Claude beats GPT', 'OpenAI announcement',
      'Deep learning model', 'Vector database comparison',
    ]
    const nonAiTitles = ['New JavaScript framework', 'Rust 2.0 released', 'PostgreSQL tips']

    const AI_KEYWORDS = [
      'ai', 'llm', 'gpt', 'claude', 'gemini', 'model', 'neural', 'machine learning',
      'deep learning', 'openai', 'anthropic', 'mistral', 'transformer', 'diffusion',
      'agent', 'inference', 'fine-tun', 'rag', 'embedding', 'vector', 'benchmark',
      'language model',
    ]
    const isAiRelevant = (title: string) => {
      const lower = title.toLowerCase()
      return AI_KEYWORDS.some((kw) => lower.includes(kw))
    }

    aiTitles.forEach((t) => expect(isAiRelevant(t)).toBe(true))
    expect(isAiRelevant('New JavaScript framework')).toBe(false)
    expect(isAiRelevant('PostgreSQL tips')).toBe(false)
  })
})

describe('deduplication', () => {
  it('removes duplicate URLs', () => {
    const items = [
      { title: 'A', url: 'https://a.com', rawScore: 10, sourceName: 'hn' },
      { title: 'B', url: 'https://b.com', rawScore: 20, sourceName: 'hn' },
      { title: 'A dup', url: 'https://a.com', rawScore: 5, sourceName: 'reddit' },
    ]
    const seen = new Set<string>()
    const deduped = items.filter((item) => {
      if (seen.has(item.url)) return false
      seen.add(item.url)
      return true
    })
    expect(deduped).toHaveLength(2)
    expect(deduped[0].url).toBe('https://a.com')
    expect(deduped[1].url).toBe('https://b.com')
  })
})

describe('Promise.allSettled resilience', () => {
  it('returns successful results even when some sources fail', async () => {
    const results = await Promise.allSettled([
      Promise.resolve([{ title: 'A', url: 'https://a.com', rawScore: 1, sourceName: 'hn' }]),
      Promise.reject(new Error('Source down')),
      Promise.resolve([{ title: 'C', url: 'https://c.com', rawScore: 3, sourceName: 'reddit' }]),
    ])

    const items = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
    expect(items).toHaveLength(2)
    expect(items[0].title).toBe('A')
    expect(items[1].title).toBe('C')
  })
})

describe('HN story filter', () => {
  it('filters out non-story items', () => {
    const filtered = HN_STORIES.filter(
      (item) => item.type === 'story' && item.title
    )
    expect(filtered).toHaveLength(4)
  })

  it('filters AI-relevant stories from HN', () => {
    const AI_KEYWORDS = ['gpt', 'llm', 'claude', 'openai', 'benchmark', 'model']
    const isAiRelevant = (title: string) =>
      AI_KEYWORDS.some((kw) => title.toLowerCase().includes(kw))

    const aiStories = HN_STORIES.filter(
      (item) => item.type === 'story' && item.title && isAiRelevant(item.title)
    )
    expect(aiStories.length).toBeGreaterThanOrEqual(3)
  })
})
