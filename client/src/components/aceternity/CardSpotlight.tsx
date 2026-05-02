import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

interface Props {
  children: React.ReactNode
  className?: string
  radius?: number
  color?: string
  onClick?: () => void
}

export function CardSpotlight({
  children,
  className,
  radius = 350,
  color = '#00f5d410',
  onClick,
}: Props) {
  const divRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(0)

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!divRef.current) return
    const rect = divRef.current.getBoundingClientRect()
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  function handleMouseEnter() {
    setIsFocused(true)
    setOpacity(1)
  }

  function handleMouseLeave() {
    setIsFocused(false)
    setOpacity(0)
  }

  return (
    <div
      ref={divRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={clsx('relative rounded-2xl overflow-hidden cursor-pointer', className)}
    >
      {/* Spotlight radial gradient */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 rounded-2xl"
        style={{
          opacity,
          background: `radial-gradient(${radius}px circle at ${position.x}px ${position.y}px, ${color}, transparent 80%)`,
        }}
      />
      {/* Border glow on hover */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        animate={{ opacity: isFocused ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        style={{
          background: 'transparent',
          boxShadow: 'inset 0 0 0 1px rgba(0, 245, 212, 0.15)',
        }}
      />
      {children}
    </div>
  )
}
