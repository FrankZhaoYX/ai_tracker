import { motion } from 'framer-motion'
import { clsx } from 'clsx'

interface Props {
  isConnected: boolean
  isScraping: boolean
  lastUpdated: string | null
}

export function LiveIndicator({ isConnected, isScraping, lastUpdated }: Props) {
  const label = isScraping ? 'SCANNING' : isConnected ? 'LIVE' : 'OFFLINE'
  const color = isScraping ? '#8b5cf6' : isConnected ? '#00f5d4' : '#6b7280'

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center w-4 h-4">
        {isConnected && (
          <motion.div
            className="absolute w-4 h-4 rounded-full"
            style={{ background: color, opacity: 0.3 }}
            animate={{ scale: [1, 1.8, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: color }}
        />
      </div>
      <span
        className={clsx('font-mono text-xs font-semibold tracking-widest')}
        style={{ color }}
      >
        {label}
      </span>
      {lastUpdated && (
        <span className="text-white/30 text-xs font-mono hidden sm:block">
          {new Date(lastUpdated).toLocaleTimeString()}
        </span>
      )}
    </div>
  )
}
