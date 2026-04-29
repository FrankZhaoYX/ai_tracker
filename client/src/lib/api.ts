import axios from 'axios'
import type { Topic, Stats, Settings } from '../types/index'

const api = axios.create({ baseURL: '/api' })

export async function fetchTopics(params?: {
  limit?: number
  offset?: number
  source?: string
  minScore?: number
}): Promise<{ topics: Topic[]; total: number }> {
  const { data } = await api.get('/topics', { params })
  return data
}

export async function fetchTopic(id: string): Promise<Topic> {
  const { data } = await api.get(`/topics/${id}`)
  return data
}

export async function fetchStats(): Promise<Stats> {
  const { data } = await api.get('/stats')
  return data
}

export async function fetchSettings(): Promise<Settings> {
  const { data } = await api.get('/settings')
  return data
}

export async function updateSettings(settings: Partial<Settings>): Promise<Settings> {
  const { data } = await api.post('/settings', settings)
  return data
}
