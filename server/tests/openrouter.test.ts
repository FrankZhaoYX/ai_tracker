import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

vi.mock('axios')
vi.mock('../src/config/env.js', () => ({
  env: {
    PORT: 3001,
    CLIENT_URL: 'http://localhost:5173',
    DATABASE_URL: 'file:./test.db',
    OPENROUTER_API_KEY: 'test-key',
    TWITTER_API_KEY: '',
    SMTP_HOST: '', SMTP_PORT: 465, SMTP_SECURE: false,
    SMTP_USER: '', SMTP_PASS: '', NOTIFY_EMAIL: '',
  },
}))

const mockedAxios = vi.mocked(axios)

describe('analyzeContent', () => {
  beforeEach(() => vi.clearAllMocks())

  it('parses valid JSON response', async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({
      data: {
        choices: [{
          message: {
            content: JSON.stringify({ summary: 'Test summary', tags: ['llm', 'ai'], hotScore: 85 }),
          },
        }],
      },
    })

    const { analyzeContent } = await import('../src/services/openrouter.js')
    const result = await analyzeContent({
      title: 'GPT-5 released',
      url: 'https://example.com',
      rawScore: 1000,
      sourceName: 'hackernews',
    })

    expect(result.summary).toBe('Test summary')
    expect(result.tags).toEqual(['llm', 'ai'])
    expect(result.hotScore).toBe(85)
  })

  it('handles markdown-wrapped JSON', async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({
      data: {
        choices: [{
          message: {
            content: '```json\n{"summary":"wrapped","tags":["test"],"hotScore":60}\n```',
          },
        }],
      },
    })

    const { analyzeContent } = await import('../src/services/openrouter.js')
    const result = await analyzeContent({
      title: 'Test',
      url: 'https://example.com',
      rawScore: 100,
      sourceName: 'hackernews',
    })

    expect(result.summary).toBe('wrapped')
    expect(result.hotScore).toBe(60)
  })

  it('falls back gracefully on malformed response', async () => {
    mockedAxios.post = vi.fn().mockRejectedValue(new Error('Network error'))

    const { analyzeContent } = await import('../src/services/openrouter.js')
    const result = await analyzeContent({
      title: 'Fallback test',
      url: 'https://example.com',
      rawScore: 500,
      sourceName: 'hackernews',
    })

    expect(result.hotScore).toBeGreaterThan(0)
    expect(result.hotScore).toBeLessThanOrEqual(100)
    expect(result.summary).toBe('Fallback test')
  })

  it('clamps hotScore to 1-100', async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({
      data: {
        choices: [{ message: { content: JSON.stringify({ summary: 'x', tags: [], hotScore: 150 }) } }],
      },
    })

    const { analyzeContent } = await import('../src/services/openrouter.js')
    const result = await analyzeContent({
      title: 'Test',
      url: 'https://example.com',
      rawScore: 100,
      sourceName: 'hackernews',
    })

    expect(result.hotScore).toBeLessThanOrEqual(100)
    expect(result.hotScore).toBeGreaterThanOrEqual(1)
  })
})
