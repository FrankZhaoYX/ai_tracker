export interface ScrapedItem {
  title: string
  url: string
  text?: string
  rawScore: number
  sourceName: string
}

export interface AnalysisResult {
  summary: string
  tags: string[]
  hotScore: number
}

export interface TrendPoint {
  hotScore: number
  recordedAt: Date
}

export interface TopicWithSource {
  id: string
  title: string
  summary: string
  url: string
  hotScore: number
  rawScore: number
  tags: string[]
  firstSeen: Date
  updatedAt: Date
  source: { id: string; name: string; url: string }
  trendData: TrendPoint[]
}

export interface StatsPayload {
  totalTopics: number
  avgHotScore: number
  topicsBySource: Record<string, number>
  recentActivity: number
  topTopic: TopicWithSource | null
}
