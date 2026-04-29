import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { fetchTopic } from '../lib/api'
import { ScoreGauge } from '../components/ScoreGauge'
import { TrendSparkline } from '../components/TrendSparkline'
import { SOURCE_LABELS, SOURCE_COLORS } from '../types/index'
import type { Topic } from '../types/index'

export function TopicDetail() {
  const { id } = useParams<{ id: string }>()
  const [topic, setTopic] = useState<Topic | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetchTopic(id)
      .then(setTopic)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          className="w-8 h-8 rounded-full border-2 border-cyan-400/30 border-t-cyan-400"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
        />
      </div>
    )
  }

  if (!topic) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-white/40 font-mono">Topic not found</p>
        <Link to="/" className="text-cyan-400 hover:underline text-sm">← Back</Link>
      </div>
    )
  }

  const srcColor = SOURCE_COLORS[topic.source.name] ?? '#888'

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6 max-w-3xl mx-auto text-white">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors text-sm mb-6">
          <ArrowLeft size={14} /> Back
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-6 space-y-6">
          <div className="flex items-start gap-4">
            <ScoreGauge score={topic.hotScore} size={72} />
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold leading-snug text-white">{topic.title}</h1>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className="px-2 py-0.5 rounded text-xs font-mono font-bold"
                  style={{ background: `${srcColor}22`, color: srcColor }}
                >
                  {SOURCE_LABELS[topic.source.name] ?? topic.source.name}
                </span>
                <span className="text-white/30 text-xs font-mono">
                  {new Date(topic.firstSeen).toLocaleDateString()}
                </span>
                <a
                  href={topic.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-white/30 hover:text-white/70 transition-colors"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>

          {topic.summary && (
            <div>
              <h2 className="text-xs font-mono text-white/30 uppercase tracking-wider mb-2">AI Summary</h2>
              <p className="text-white/70 leading-relaxed">{topic.summary}</p>
            </div>
          )}

          {topic.tags.length > 0 && (
            <div>
              <h2 className="text-xs font-mono text-white/30 uppercase tracking-wider mb-2">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {topic.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded bg-white/5 text-white/60 text-xs font-mono">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {topic.trendData.length > 1 && (
            <div>
              <h2 className="text-xs font-mono text-white/30 uppercase tracking-wider mb-3">Score Trend</h2>
              <div className="bg-white/5 rounded-xl p-4">
                <TrendSparkline data={topic.trendData} width={500} height={80} />
                <div className="flex justify-between mt-2 text-white/30 text-xs font-mono">
                  <span>{new Date(topic.trendData[0].recordedAt).toLocaleDateString()}</span>
                  <span>{new Date(topic.trendData[topic.trendData.length - 1].recordedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
