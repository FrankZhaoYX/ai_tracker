import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  isConnected: boolean
  isScraping: boolean
  lastUpdated: string | null
}

export function LiveIndicator({ isConnected, isScraping, lastUpdated }: Props) {
  const color  = isScraping ? '#8b5cf6' : isConnected ? '#00f5d4' : '#4b5563'
  const label  = isScraping ? 'SCANNING' : isConnected ? 'LIVE' : 'OFFLINE'

  return (
    <div className="flex items-center gap-2.5">
      {/* Pulse ring + dot */}
      <div className="relative w-4 h-4 flex items-center justify-center">
        <AnimatePresence>
          {isConnected && (
            <motion.span
              key="ring"
              className="absolute inline-flex rounded-full"
              style={{ background: color, opacity: 0.25, width: 16, height: 16 }}
              animate={{ scale: [1, 1.9, 1], opacity: [0.25, 0, 0.25] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </AnimatePresence>
        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      </div>

      <span
        className="font-mono text-[11px] font-bold tracking-[0.2em]"
        style={{ color }}
      >
        {label}
      </span>

      {lastUpdated && (
        <span className="hidden sm:block text-white/20 text-[10px] font-mono border-l border-white/10 pl-2.5">
          {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      )}
    </div>
  )
}
