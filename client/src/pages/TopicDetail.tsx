import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ExternalLink, Tag, Clock } from 'lucide-react'
import { fetchTopic } from '../lib/api'
import { ScoreGauge } from '../components/ScoreGauge'
import { TrendSparkline } from '../components/TrendSparkline'
import { CardSpotlight } from '../components/aceternity/CardSpotlight'
import { Spotlight } from '../components/aceternity/Spotlight'
import { SOURCE_LABELS, SOURCE_COLORS, getScoreLevel } from '../types/index'
import type { Topic } from '../types/index'

const LEVEL_LABELS = { low: 'MINOR', medium: 'NOTEWORTHY', high: 'SIGNIFICANT', critical: 'CRITICAL' }
const LEVEL_COLORS = { low: '#6b7280', medium: '#00f5d4', high: '#8b5cf6', critical: '#ef4444' }

export function TopicDetail() {
  const { id } = useParams<{ id: string }>()
  const [topic, setTopic] = useState<Topic | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetchTopic(id).then(setTopic).catch(console.error).finally(() => setIsLoading(false))
  }, [id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          className="w-10 h-10 rounded-full border-t border-cyan-400"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
        />
      </div>
    )
  }

  if (!topic) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-white/30 font-mono text-sm tracking-widest">SIGNAL NOT FOUND</p>
        <Link to="/" className="text-cyan-400 text-xs font-mono hover:underline">← RETURN TO FEED</Link>
      </div>
    )
  }

  const level = getScoreLevel(topic.hotScore)
  const srcColor = SOURCE_COLORS[topic.source.name] ?? '#888'

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6 max-w-3xl mx-auto">
      <div className="relative">
        <Spotlight className="-top-20 left-0" fill="rgba(139,92,246,0.1)" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {/* Back */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-white/30 hover:text-white/60 transition-colors text-xs font-mono tracking-widest mb-6 group"
        >
          <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
          RETURN TO FEED
        </Link>

        <CardSpotlight
          radius={400}
          color={LEVEL_COLORS[level] + '10'}
          className={`border border-white/8 bg-white/[0.03] p-6 space-y-6`}
        >
          {/* Header section */}
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center gap-1.5">
              <ScoreGauge score={topic.hotScore} size={72} />
              <span
                className="text-[9px] font-mono font-bold tracking-widest"
                style={{ color: LEVEL_COLORS[level] }}
              >
                {LEVEL_LABELS[level]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold leading-snug text-white mb-3">{topic.title}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                  style={{ background: `${srcColor}15`, color: srcColor, border: `1px solid ${srcColor}25` }}
                >
                  {SOURCE_LABELS[topic.source.name] ?? topic.source.name}
                </span>
                <span className="flex items-center gap-1 text-white/25 text-[10px] font-mono">
                  <Clock size={9} />
                  {new Date(topic.firstSeen).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="text-white/20 text-[10px] font-mono">RAW: {topic.rawScore}</span>
                <a
                  href={topic.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto flex items-center gap-1 text-white/25 hover:text-cyan-400 transition-colors text-[10px] font-mono"
                >
                  OPEN SOURCE <ExternalLink size={10} />
                </a>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-white/5 via-white/10 to-transparent" />

          {/* AI Summary */}
          {topic.summary && topic.summary !== topic.title && (
            <div>
              <p className="text-[10px] font-mono text-white/25 uppercase tracking-[0.2em] mb-2">
                AI Analysis
              </p>
              <p className="text-white/65 leading-relaxed text-sm">{topic.summary}</p>
            </div>
          )}

          {/* Tags */}
          {topic.tags.length > 0 && (
            <div>
              <p className="text-[10px] font-mono text-white/25 uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                <Tag size={9} /> Signal Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {topic.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/8 text-white/50 text-xs font-mono"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Trend chart */}
          {topic.trendData.length > 1 && (
            <div>
              <p className="text-[10px] font-mono text-white/25 uppercase tracking-[0.2em] mb-3">
                Score Trajectory
              </p>
              <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                <TrendSparkline data={topic.trendData} width={500} height={80} />
                <div className="flex justify-between mt-3 text-white/20 text-[10px] font-mono">
                  <span>{new Date(topic.trendData[0].recordedAt).toLocaleString()}</span>
                  <span>{new Date(topic.trendData[topic.trendData.length - 1].recordedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </CardSpotlight>
      </motion.div>
    </div>
  )
}
