import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import { clsx } from 'clsx'
import { ScoreGauge } from './ScoreGauge'
import { TrendSparkline } from './TrendSparkline'
import { SOURCE_LABELS, SOURCE_COLORS, getScoreLevel } from '../types/index'
import type { Topic } from '../types/index'

const BORDER_GLOW: Record<string, string> = {
  low: 'border-white/5',
  medium: 'border-cyan-400/20',
  high: 'border-violet-500/30',
  critical: 'border-red-500/40',
}

interface Props {
  topic: Topic
  onClick?: () => void
  index?: number
}

export function HotTopicCard({ topic, onClick, index = 0 }: Props) {
  const level = getScoreLevel(topic.hotScore)
  const srcColor = SOURCE_COLORS[topic.source.name] ?? '#888'

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      whileHover={{ y: -4, transition: { duration: 0.15 } }}
      onClick={onClick}
      className={clsx(
        'relative rounded-2xl border bg-white/[0.04] backdrop-blur-sm p-4 cursor-pointer',
        'hover:bg-white/[0.07] transition-colors group',
        BORDER_GLOW[level]
      )}
    >
      {/* Score glow accent top-right */}
      {level === 'critical' && (
        <div className="absolute top-0 right-0 w-20 h-20 rounded-tr-2xl rounded-bl-full opacity-10"
          style={{ background: 'radial-gradient(circle at top right, #ef4444, transparent)' }}
        />
      )}

      <div className="flex items-start gap-3">
        <ScoreGauge score={topic.hotScore} size={52} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 group-hover:text-cyan-300 transition-colors">
              {topic.title}
            </h3>
            <a
              href={topic.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 text-white/20 hover:text-white/70 transition-colors mt-0.5"
            >
              <ExternalLink size={14} />
            </a>
          </div>

          {topic.summary && topic.summary !== topic.title && (
            <p className="text-white/40 text-xs mt-1 line-clamp-2 leading-relaxed">
              {topic.summary}
            </p>
          )}

          <div className="flex items-center justify-between mt-2 gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Source badge */}
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
                style={{ background: `${srcColor}22`, color: srcColor }}
              >
                {SOURCE_LABELS[topic.source.name] ?? topic.source.name}
              </span>
              {/* Tags */}
              {topic.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="px-1.5 py-0.5 rounded bg-white/5 text-white/40 text-[10px] font-mono">
                  #{tag}
                </span>
              ))}
            </div>

            <TrendSparkline data={topic.trendData} />
          </div>
        </div>
      </div>
    </motion.article>
  )
}
