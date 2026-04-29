import type { TrendPoint } from '../types/index'

interface Props {
  data: TrendPoint[]
  width?: number
  height?: number
}

export function TrendSparkline({ data, width = 80, height = 28 }: Props) {
  if (data.length < 2) {
    return <div style={{ width, height }} className="opacity-30 border-b border-white/20" />
  }

  const scores = data.map((d) => d.hotScore)
  const min = Math.min(...scores)
  const max = Math.max(...scores)
  const range = max - min || 1

  const points = scores.map((s, i) => {
    const x = (i / (scores.length - 1)) * width
    const y = height - ((s - min) / range) * (height - 4) - 2
    return `${x},${y}`
  })

  const last = scores[scores.length - 1]
  const trend = last > scores[0] ? '#00f5d4' : last < scores[0] ? '#ef4444' : '#6b7280'

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={trend}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.7}
      />
      <circle
        cx={parseFloat(points[points.length - 1].split(',')[0])}
        cy={parseFloat(points[points.length - 1].split(',')[1])}
        r={2.5}
        fill={trend}
      />
    </svg>
  )
}
