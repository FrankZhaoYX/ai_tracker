import { motion } from 'framer-motion'

export function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-[120px]"
        style={{ background: 'radial-gradient(circle, #00f5d4, transparent)', top: '-10%', left: '-10%' }}
        animate={{ x: [0, 60, -30, 0], y: [0, -40, 60, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-15 blur-[100px]"
        style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)', top: '40%', right: '-5%' }}
        animate={{ x: [0, -80, 40, 0], y: [0, 60, -30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full opacity-10 blur-[80px]"
        style={{ background: 'radial-gradient(circle, #ef4444, transparent)', bottom: '-5%', left: '35%' }}
        animate={{ x: [0, 50, -60, 0], y: [0, -50, 20, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut', delay: 7 }}
      />
    </div>
  )
}
