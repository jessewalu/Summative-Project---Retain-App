// A hand-rolled SVG donut, no charting library needed. Each slice is a circle whose
// stroke is cut into a dash, which keeps the maths simple and the bundle small.
import { Box, Typography } from '@mui/material'

export interface DonutSlice {
  name: string
  value: number
  color: string
}

interface DonutChartProps {
  slices: DonutSlice[]
  centerLabel: string
  centerValue: string
  size?: number
}

export function DonutChart({ slices, centerLabel, centerValue, size = 200 }: DonutChartProps) {
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)

  // Each slice starts where the previous one ended, so offsets are a running total of the lengths.
  const lengths = slices.map((slice) => (total > 0 ? (slice.value / total) * circumference : 0))
  const arcs = slices.map((slice, index) => ({
    ...slice,
    length: lengths[index],
    offset: lengths.slice(0, index).reduce((sum, length) => sum + length, 0),
  }))

  return (
    <Box
      role="img"
      aria-label={`Spending breakdown: ${slices.map((s) => `${s.name} ${s.value}`).join(', ')}`}
      sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}
    >
      <svg viewBox="0 0 100 100" width={size} height={size}>
        {/* Track behind the slices, also what an empty chart looks like. */}
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#e7e5e4" strokeWidth="13" />
        <g transform="rotate(-90 50 50)">
          {arcs.map((arc) => (
            <circle
              key={arc.name}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth="13"
              strokeDasharray={`${Math.max(arc.length - 0.8, 0)} ${circumference}`}
              strokeDashoffset={-arc.offset}
            >
              <title>{`${arc.name}: ${arc.value}`}</title>
            </circle>
          ))}
        </g>
      </svg>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
          px: 4,
        }}
      >
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            {centerLabel}
          </Typography>
          <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
            {centerValue}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
