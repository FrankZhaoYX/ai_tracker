import { motion } from 'framer-motion'
import { Activity, BarChart3, Flame, Zap } from 'lucide-react'
import type { Stats } from '../types/index'

interface StatProps {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
  delay?: number
}

function StatItem({ icon, label, value, color, delay = 0 }: StatProps) {
  return (
    <motion.div
      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.05] transition-colors"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className="p-1.5 rounded-lg" style={{ background: `${color}15` }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <div>
        <p className="text-white/30 text-[10px] font-mono uppercase tracking-widest">{label}</p>
        <p className="font-mono font-bold text-base leading-tight" style={{ color }}>
          {value}
        </p>
      </div>
    </motion.div>
  )
}

export function StatsBar({ stats }: { stats: Stats | null }) {
  if (!stats) return null

  return (
    <div className="flex flex-wrap gap-2">
      <StatItem icon={<Zap size={14} />}      label="Topics"     value={stats.totalTopics}          color="#00f5d4" delay={0.1} />
      <StatItem icon={<BarChart3 size={14} />} label="Avg Score"  value={`${stats.avgHotScore}/100`} color="#8b5cf6" delay={0.15} />
      <StatItem icon={<Activity size={14} />}  label="Active 1h"  value={stats.recentActivity}       color="#f59e0b" delay={0.2} />
      {stats.topTopic && (
        <motion.div
          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/15 bg-red-500/[0.04] hover:bg-red-500/[0.07] transition-colors flex-1 min-w-0"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="p-1.5 rounded-lg bg-red-500/15">
            <Flame size={14} className="text-red-400" />
          </div>
          <div className="min-w-0">
            <p className="text-white/30 text-[10px] font-mono uppercase tracking-widest">Top Signal</p>
            <p className="text-white/80 font-semibold text-sm truncate">{stats.topTopic.title}</p>
          </div>
        </motion.div>
      )}
    </div>
  )
}
