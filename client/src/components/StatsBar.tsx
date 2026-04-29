import { motion } from 'framer-motion'
import type { Stats } from '../types/index'

interface Props {
  stats: Stats | null
}

function StatItem({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <motion.div
      className="flex flex-col gap-0.5"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <span className="text-white/40 text-xs font-mono uppercase tracking-wider">{label}</span>
      <span className="font-mono text-lg font-bold" style={{ color: accent ?? '#fff' }}>
        {value}
      </span>
    </motion.div>
  )
}

export function StatsBar({ stats }: Props) {
  if (!stats) return null

  return (
    <div className="flex flex-wrap gap-6 px-4 py-3 rounded-xl border border-white/5 bg-white/[0.03]">
      <StatItem label="Topics" value={stats.totalTopics} accent="#00f5d4" />
      <StatItem label="Avg Score" value={`${stats.avgHotScore}/100`} accent="#8b5cf6" />
      <StatItem label="Active (1h)" value={stats.recentActivity} accent="#f59e0b" />
      {stats.topTopic && (
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-white/40 text-xs font-mono uppercase tracking-wider">Top Topic</span>
          <span className="text-white font-semibold text-sm truncate max-w-[200px]">
            {stats.topTopic.title}
          </span>
        </div>
      )}
    </div>
  )
}
