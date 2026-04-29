import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { SOURCE_LABELS, SOURCE_COLORS } from '../types/index'

const SOURCES = ['hackernews', 'reddit_ml', 'reddit_ai', 'twitter', 'producthunt']

interface Props {
  active: string | null
  onChange: (source: string | null) => void
  counts: Record<string, number>
}

export function SourceFilter({ active, onChange, counts }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange(null)}
        className={clsx(
          'px-3 py-1 rounded-full text-xs font-mono font-semibold border transition-all',
          active === null
            ? 'bg-white/15 border-white/40 text-white'
            : 'bg-transparent border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
        )}
      >
        ALL
      </button>
      {SOURCES.map((src) => {
        const color = SOURCE_COLORS[src] ?? '#888'
        const isActive = active === src
        return (
          <motion.button
            key={src}
            onClick={() => onChange(isActive ? null : src)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={clsx(
              'px-3 py-1 rounded-full text-xs font-mono font-semibold border transition-all',
              isActive ? 'text-black' : 'bg-transparent text-white/40 hover:text-white/70'
            )}
            style={{
              borderColor: isActive ? color : `${color}40`,
              background: isActive ? color : 'transparent',
            }}
          >
            {SOURCE_LABELS[src] ?? src} {counts[src] ? `(${counts[src]})` : ''}
          </motion.button>
        )
      })}
    </div>
  )
}
