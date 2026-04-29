import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Settings as SettingsIcon, Zap, RefreshCw } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
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
    <div className="min-h-screen text-white px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Zap className="text-cyan-400" size={22} />
            <h1 className="text-xl font-bold tracking-tight">
              AI <span className="text-cyan-400">Pulse</span>
            </h1>
          </motion.div>
          <LiveIndicator isConnected={isConnected} isScraping={isScraping} lastUpdated={lastUpdated} />
        </div>
        <div className="flex items-center gap-3">
          {isScraping && (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
              <RefreshCw size={14} className="text-violet-400" />
            </motion.div>
          )}
          <Link to="/settings">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
            >
              <SettingsIcon size={16} className="text-white/60" />
            </motion.button>
          </Link>
        </div>
      </header>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-5"
      >
        <StatsBar stats={stats} />
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-5"
      >
        <SourceFilter active={filter} onChange={setFilter} counts={sourceCounts} />
        <div className="flex items-center gap-2">
          <span className="text-white/30 text-xs font-mono">MIN SCORE</span>
          <input
            type="range"
            min={0}
            max={90}
            step={10}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-24 accent-violet-500"
          />
          <span className="text-white/60 text-xs font-mono w-6">{minScore || '—'}</span>
        </div>
      </motion.div>

      {/* Topic Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <motion.div
            className="w-8 h-8 rounded-full border-2 border-cyan-400/30 border-t-cyan-400"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
          />
          <p className="text-white/30 text-sm font-mono">Connecting to neural feed...</p>
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 gap-3"
        >
          <Zap className="text-white/10" size={40} />
          <p className="text-white/30 text-sm font-mono">
            {isScraping ? 'Scraping sources...' : 'No topics yet — first scrape in progress'}
          </p>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.05 } } }}
          >
            {filtered.map((topic, i) => (
              <HotTopicCard key={topic.id} topic={topic} index={i} onClick={() => navigate(`/topic/${topic.id}`)} />
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
