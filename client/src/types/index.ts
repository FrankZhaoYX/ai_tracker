export interface TrendPoint {
  hotScore: number
  recordedAt: string
}

export interface TopicSource {
  id: string
  name: string
  url: string
}

export interface Topic {
  id: string
  title: string
  summary: string
  url: string
  hotScore: number
  rawScore: number
  tags: string[]
  firstSeen: string
  updatedAt: string
  source: TopicSource
  trendData: TrendPoint[]
}

export interface Stats {
  totalTopics: number
  avgHotScore: number
  topicsBySource: Record<string, number>
  recentActivity: number
  topTopic: Topic | null
}

export interface Settings {
  id: string
  cronExpression: string
  alertThreshold: number
  emailEnabled: boolean
  notifyEmail: string
}

export type ScoreLevel = 'low' | 'medium' | 'high' | 'critical'

export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 80) return 'critical'
  if (score >= 60) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

export const SOURCE_LABELS: Record<string, string> = {
  hackernews: 'HN',
  reddit_ml: 'ML',
  reddit_ai: 'AI',
  twitter: 'X',
  producthunt: 'PH',
}

export const SOURCE_COLORS: Record<string, string> = {
  hackernews: '#ff6600',
  reddit_ml: '#ff4500',
  reddit_ai: '#ff4500',
  twitter: '#1da1f2',
  producthunt: '#da552f',
}
