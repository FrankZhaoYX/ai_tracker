import { useState, useCallback, useEffect } from 'react'
import { fetchTopics, fetchStats } from '../lib/api'
import { useSocket } from './useSocket'
import type { Topic, Stats } from '../types/index'

export function useTopics() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [isScraping, setIsScraping] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [filter, setFilter] = useState<string | null>(null)

  const mergeTopic = useCallback((newTopic: Topic) => {
    setTopics((prev) => {
      const idx = prev.findIndex((t) => t.id === newTopic.id)
      if (idx === -1) {
        return [newTopic, ...prev].sort((a, b) => b.hotScore - a.hotScore)
      }
      const next = [...prev]
      next[idx] = newTopic
      return next.sort((a, b) => b.hotScore - a.hotScore)
    })
  }, [])

  useSocket({
    onConnect: () => setIsConnected(true),
    onDisconnect: () => setIsConnected(false),
    onInitialData: (data) => {
      setTopics(data)
      setIsLoading(false)
    },
    onTopicNew: mergeTopic,
    onTopicUpdated: mergeTopic,
    onStatsUpdate: (partial) => setStats((prev) => prev ? { ...prev, ...partial } : null),
    onScrapeStarted: () => setIsScraping(true),
    onScrapeCompleted: ({ timestamp }) => {
      setIsScraping(false)
      setLastUpdated(timestamp)
    },
    onScrapeError: () => setIsScraping(false),
  })

  useEffect(() => {
    Promise.all([fetchTopics({ limit: 50 }), fetchStats()])
      .then(([topicsData, statsData]) => {
        setTopics(topicsData.topics)
        setStats(statsData)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const filteredTopics = filter ? topics.filter((t) => t.source.name === filter) : topics

  return {
    topics: filteredTopics,
    allTopics: topics,
    stats,
    isLoading,
    isConnected,
    isScraping,
    lastUpdated,
    filter,
    setFilter,
  }
}
