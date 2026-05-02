import { clsx } from 'clsx'

interface Props {
  className?: string
  size?: number
  opacity?: number
}

export function GridPattern({ className, size = 40, opacity = 0.03 }: Props) {
  return (
    <div
      className={clsx('absolute inset-0 pointer-events-none', className)}
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(255,255,255,${opacity}) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,255,255,${opacity}) 1px, transparent 1px)
        `,
        backgroundSize: `${size}px ${size}px`,
      }}
    />
  )
}
