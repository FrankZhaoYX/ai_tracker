import { motion } from 'framer-motion'
import type { ScoreLevel } from '../types/index'
import { getScoreLevel } from '../types/index'

const COLORS: Record<ScoreLevel, string> = {
  low: '#6b7280',
  medium: '#00f5d4',
  high: '#8b5cf6',
  critical: '#ef4444',
}

const GLOWS: Record<ScoreLevel, string> = {
  low: 'none',
  medium: '0 0 12px #00f5d4aa',
  high: '0 0 12px #8b5cf6aa',
  critical: '0 0 16px #ef4444cc',
}

interface Props {
  score: number
  size?: number
}

export function ScoreGauge({ score, size = 56 }: Props) {
  const level = getScoreLevel(score)
  const color = COLORS[level]
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const dashoffset = circumference * (1 - score / 100)

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#ffffff10"
          strokeWidth={4}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ filter: GLOWS[level] }}
        />
      </svg>
      <motion.span
        className="absolute font-mono text-xs font-bold"
        style={{ color }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {score}
      </motion.span>
    </div>
  )
}
