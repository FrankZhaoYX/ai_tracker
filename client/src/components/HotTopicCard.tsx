import { ExternalLink, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { CardSpotlight } from './aceternity/CardSpotlight'
import { ScoreGauge } from './ScoreGauge'
import { TrendSparkline } from './TrendSparkline'
import { SOURCE_LABELS, SOURCE_COLORS, getScoreLevel } from '../types/index'
import type { Topic } from '../types/index'

const SCORE_BORDER: Record<string, string> = {
  low:      'border-white/5',
  medium:   'border-cyan-400/20',
  high:     'border-violet-500/30',
  critical: 'border-red-500/40',
}

const SCORE_BG: Record<string, string> = {
  low:      'bg-white/[0.03]',
  medium:   'bg-cyan-400/[0.04]',
  high:     'bg-violet-500/[0.05]',
  critical: 'bg-red-500/[0.06]',
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
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
    >
      <CardSpotlight
        onClick={onClick}
        radius={280}
        color={
          level === 'critical' ? '#ef444412' :
          level === 'high'     ? '#8b5cf612' :
          level === 'medium'   ? '#00f5d410' : '#ffffff06'
        }
        className={`border ${SCORE_BORDER[level]} ${SCORE_BG[level]} p-4 group`}
      >
        {/* Critical badge */}
        {level === 'critical' && (
          <div className="absolute top-3 right-10 flex items-center gap-1">
            <TrendingUp size={10} className="text-red-400" />
            <span className="text-[10px] font-mono text-red-400 tracking-widest">HOT</span>
          </div>
        )}

        <div className="flex items-start gap-3">
          <ScoreGauge score={topic.hotScore} size={52} />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 pr-1">
              <h3 className="text-white/90 font-semibold text-sm leading-snug line-clamp-2 group-hover:text-cyan-300 transition-colors duration-200">
                {topic.title}
              </h3>
              <a
                href={topic.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 text-white/15 hover:text-cyan-400 transition-colors mt-0.5"
              >
                <ExternalLink size={13} />
              </a>
            </div>

            {topic.summary && topic.summary !== topic.title && (
              <p className="text-white/35 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                {topic.summary}
              </p>
            )}

            <div className="flex items-center justify-between mt-2.5 gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wide"
                  style={{ background: `${srcColor}18`, color: srcColor, border: `1px solid ${srcColor}30` }}
                >
                  {SOURCE_LABELS[topic.source.name] ?? topic.source.name}
                </span>
                {topic.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-white/35 text-[10px] font-mono"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <TrendSparkline data={topic.trendData} />
            </div>
          </div>
        </div>
      </CardSpotlight>
    </motion.div>
  )
}
