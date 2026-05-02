import { useMemo } from 'react'
import { clsx } from 'clsx'

interface Props {
  number?: number
  className?: string
}

export function Meteors({ number = 20, className }: Props) {
  const meteors = useMemo(() =>
    Array.from({ length: number }, (_, i) => ({
      id: i,
      left: `${Math.floor(Math.random() * (400 - -400) + -400)}px`,
      delay: `${(Math.random() * 0.6).toFixed(2)}s`,
      duration: `${Math.floor(Math.random() * (10 - 2) + 2)}s`,
      size: `${Math.floor(Math.random() * (80 - 40) + 40)}px`,
    })), [number])

  return (
    <div className={clsx('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {meteors.map((m) => (
        <span
          key={m.id}
          className="meteor absolute top-1/4 h-px bg-gradient-to-r from-cyan-400 via-violet-400 to-transparent rounded-full rotate-[215deg]"
          style={{
            left: m.left,
            width: m.size,
            animationDelay: m.delay,
            animationDuration: m.duration,
            opacity: 0,
          }}
        />
      ))}
    </div>
  )
}
