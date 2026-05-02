import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Settings as SettingsIcon, RefreshCw, Cpu } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Spotlight } from '../components/aceternity/Spotlight'
import { HotTopicCard } from '../components/HotTopicCard'
import { StatsBar } from '../components/StatsBar'
import { LiveIndicator } from '../components/LiveIndicator'
import { SourceFilter } from '../components/SourceFilter'
import { useTopics } from '../hooks/useTopics'

export function Dashboard() {
  const { topics, stats, isLoading, isConnected, isScraping, lastUpdated, filter, setFilter } = useTopics()
  const [minScore, setMinScore] = useState(0)
  const navigate = useNavigate()

  const filtered = minScore > 0 ? topics.filter((t) => t.hotScore >= minScore) : topics

  const sourceCounts = topics.reduce<Record<string, number>>((acc, t) => {
    acc[t.source.name] = (acc[t.source.name] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto">
      {/* Spotlight effect at top */}
      <div className="relative">
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="rgba(0,245,212,0.15)" />
      </div>

      {/* ── Header ── */}
      <motion.header
        className="flex items-center justify-between mb-8"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-400/10 border border-cyan-400/20">
              <Cpu size={16} className="text-cyan-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-none">
                AI{' '}
                <span className="text-transparent bg-clip-text" style={{
                  backgroundImage: 'linear-gradient(90deg, #00f5d4, #8b5cf6)',
                }}>
                  PULSE
                </span>
              </h1>
              <p className="text-white/25 text-[10px] font-mono tracking-widest">SIGNAL MONITOR</p>
            </div>
          </div>

          <div className="h-6 w-px bg-white/10" />
          <LiveIndicator isConnected={isConnected} isScraping={isScraping} lastUpdated={lastUpdated} />
        </div>

        <div className="flex items-center gap-2">
          <AnimatePresence>
            {isScraping && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20"
              >
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}>
                  <RefreshCw size={11} className="text-violet-400" />
                </motion.div>
                <span className="text-violet-400 text-[10px] font-mono tracking-widest">FETCHING</span>
              </motion.div>
            )}
          </AnimatePresence>
          <Link to="/settings">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-xl border border-white/8 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/15 transition-all"
            >
              <SettingsIcon size={15} className="text-white/50" />
            </motion.button>
          </Link>
        </div>
      </motion.header>

      {/* ── Stats ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="mb-6"
      >
        <StatsBar stats={stats} />
      </motion.div>

      {/* ── Filters ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.4 }}
        className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-5"
      >
        <SourceFilter active={filter} onChange={setFilter} counts={sourceCounts} />

        <div className="flex items-center gap-3">
          <span className="text-white/20 text-[10px] font-mono tracking-widest">THRESHOLD</span>
          <input
            type="range"
            min={0}
            max={90}
            step={10}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-24 accent-violet-500 cursor-pointer"
          />
          <span className="text-white/50 text-xs font-mono w-5 text-right">{minScore || '—'}</span>
        </div>
      </motion.div>

      {/* ── Section label ── */}
      <motion.div
        className="flex items-center gap-3 mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.22 }}
      >
        <span className="text-white/20 text-[10px] font-mono tracking-[0.3em] uppercase">
          {filtered.length} Signal{filtered.length !== 1 ? 's' : ''} Detected
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-white/5 to-transparent" />
      </motion.div>

      {/* ── Topic Grid ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-5">
          <div className="relative w-12 h-12">
            <motion.div
              className="absolute inset-0 rounded-full border border-cyan-400/20"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-1 rounded-full border-t border-cyan-400"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
          </div>
          <div className="text-center">
            <p className="text-white/40 text-xs font-mono tracking-widest">INITIALIZING NEURAL FEED</p>
            <p className="text-white/15 text-[10px] font-mono mt-1">Connecting to signal sources...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 gap-3"
        >
          <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center">
            <Cpu size={20} className="text-white/10" />
          </div>
          <p className="text-white/25 text-xs font-mono tracking-widest">
            {isScraping ? 'SCANNING SOURCES...' : 'NO SIGNALS MATCH CURRENT FILTERS'}
          </p>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((topic, i) => (
              <HotTopicCard
                key={topic.id}
                topic={topic}
                index={i}
                onClick={() => navigate(`/topic/${topic.id}`)}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Footer */}
      <motion.div
        className="mt-10 pt-4 border-t border-white/5 flex items-center justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <span className="text-white/15 text-[10px] font-mono">AI PULSE v1.0 — NEURAL SIGNAL MONITOR</span>
        <span className="text-white/10 text-[10px] font-mono">
          {stats?.totalTopics ?? 0} TOTAL SIGNALS
        </span>
      </motion.div>
    </div>
  )
}
