import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import type { Topic, Stats } from '../types/index'

export interface SocketCallbacks {
  onTopicNew?: (topic: Topic) => void
  onTopicUpdated?: (topic: Topic) => void
  onStatsUpdate?: (stats: Partial<Stats>) => void
  onInitialData?: (topics: Topic[]) => void
  onScrapeStarted?: (data: { timestamp: string }) => void
  onScrapeCompleted?: (data: { count: number; timestamp: string }) => void
  onScrapeError?: (data: { message: string }) => void
  onConnect?: () => void
  onDisconnect?: () => void
}

export function useSocket(callbacks: SocketCallbacks) {
  const socketRef = useRef<Socket | null>(null)
  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks

  useEffect(() => {
    const socket = io('http://localhost:3001', { transports: ['websocket', 'polling'] })
    socketRef.current = socket

    socket.on('connect', () => {
      callbacksRef.current.onConnect?.()
      socket.emit('request:initial')
    })
    socket.on('disconnect', () => callbacksRef.current.onDisconnect?.())
    socket.on('initial:data', (data: Topic[]) => callbacksRef.current.onInitialData?.(data))
    socket.on('topic:new', (data: Topic) => callbacksRef.current.onTopicNew?.(data))
    socket.on('topic:updated', (data: Topic) => callbacksRef.current.onTopicUpdated?.(data))
    socket.on('stats:update', (data: Partial<Stats>) => callbacksRef.current.onStatsUpdate?.(data))
    socket.on('scrape:started', (data: { timestamp: string }) => callbacksRef.current.onScrapeStarted?.(data))
    socket.on('scrape:completed', (data: { count: number; timestamp: string }) => callbacksRef.current.onScrapeCompleted?.(data))
    socket.on('scrape:error', (data: { message: string }) => callbacksRef.current.onScrapeError?.(data))

    return () => { socket.disconnect() }
  }, [])

  return socketRef
}
