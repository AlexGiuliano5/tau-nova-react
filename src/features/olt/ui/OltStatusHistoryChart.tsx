import { useEffect, useRef, useState } from 'react'
import {
  Brush,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { formatOntAggregateMetricLabel } from '@/features/ont/lib/ont-status-labels'
import type { OltStatusChartRow } from '@/features/olt/types/status-chart'
import { useMdUp } from '@/shared/hooks/use-md-up'

const OLT_STATUS_SERIES = [
  { dataKey: 'total' as const, name: formatOntAggregateMetricLabel('Total'), stroke: 'var(--primary)' },
  { dataKey: 'good' as const, name: formatOntAggregateMetricLabel('Good'), stroke: 'var(--card-green)' },
  {
    dataKey: 'degraded' as const,
    name: formatOntAggregateMetricLabel('Degraded'),
    stroke: 'var(--card-orange)',
  },
  {
    dataKey: 'switchedOff' as const,
    name: formatOntAggregateMetricLabel('Switched Off'),
    stroke: 'var(--text-primary)',
  },
  {
    dataKey: 'interrupted' as const,
    name: formatOntAggregateMetricLabel('Interrupted'),
    stroke: 'var(--state-03)',
  },
]

const FILL_MIN_HEIGHT_PX = 220

interface Props {
  data: OltStatusChartRow[]
  expanded?: boolean
}

function StatusBrushTraveller(props: {
  x: number
  y: number
  width: number
  height: number
}) {
  const { x, y, width, height } = props
  const w = Math.max(width, 8)
  const padY = 2
  const capH = Math.max(height - padY * 2, 10)
  const capY = y + (height - capH) / 2
  const rx = Math.min(w / 2, capH / 2, 6)

  return (
    <rect
      x={x}
      y={capY}
      width={w}
      height={capH}
      rx={rx}
      ry={rx}
      fill="var(--chart-brush-handle-fill)"
      stroke="var(--chart-brush-handle-stroke)"
      strokeWidth={1}
    />
  )
}

/**
 * Gráfico de histórico de estados.
 * Ocupa el 100% del alto del contenedor (ResizeObserver, cadena flex `flex-1 min-h-0`).
 */
export function OltStatusHistoryChart({ data, expanded = false }: Props) {
  const isDesktop = useMdUp()
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const showBrush = data.length > 2
  const axisTickFontSize = isDesktop ? 10 : 11

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const updateSize = () => {
      setSize({
        width: Math.max(0, Math.floor(element.clientWidth)),
        height: Math.max(0, Math.floor(element.clientHeight)),
      })
    }

    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const chartHeight = Math.max(size.height, FILL_MIN_HEIGHT_PX)

  return (
    <div
      ref={containerRef}
      className="historic-line-chart h-full min-h-[220px] w-full min-w-0 flex-1 self-stretch"
    >
      {size.width > 0 && chartHeight > 0 ? (
        <LineChart
          width={size.width}
          height={chartHeight}
          data={data}
          margin={{ top: 6, right: 12, left: 4, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--table-stroke)" opacity={0.6} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: axisTickFontSize, fill: 'var(--text-secondary)' }}
            minTickGap={expanded ? 20 : 36}
            interval="preserveStartEnd"
            tickMargin={6}
            height={28}
          />
          <YAxis
            tick={{ fontSize: axisTickFontSize, fill: 'var(--text-secondary)' }}
            width={36}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--card)',
              border: '1px solid var(--table-stroke)',
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend
            verticalAlign="top"
            align="left"
            wrapperStyle={{
              fontSize: isDesktop ? 11 : 12,
              paddingBottom: expanded ? 14 : 10,
            }}
          />
          {OLT_STATUS_SERIES.map((series) => (
            <Line
              key={series.dataKey}
              type="monotone"
              dataKey={series.dataKey}
              name={series.name}
              stroke={series.stroke}
              strokeWidth={2}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          ))}
          {showBrush ? (
            <Brush
              dataKey="x"
              height={28}
              gap={1}
              fill="var(--chart-brush-track)"
              stroke="var(--chart-brush-rim)"
              travellerWidth={10}
              traveller={StatusBrushTraveller}
              tickFormatter={() => ''}
            />
          ) : null}
        </LineChart>
      ) : null}
    </div>
  )
}
