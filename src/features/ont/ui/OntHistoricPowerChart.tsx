import { useMemo } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import clsx from 'clsx'

import {
  extendThresholdSegmentsToDomain,
  getOntMetricThresholdConfig,
  ontMetricThresholdBandFill,
  ontMetricThresholdSwatchClass,
  resolveOntMetricThresholdSegment,
  type OntMetricThresholdSegment,
  type OntMetricThresholdTone,
} from '@/features/ont/lib/ont-metric-thresholds'

const SERIES_COLOR = 'var(--primary)'

export interface HistoricPowerChartRow {
  x: string
  label: string
  value: number | null
}

export function resolveHistoricPowerLatest(
  rows: HistoricPowerChartRow[],
  metricTitle: string,
  unit: string,
): { formatted: string; statusLabel: string | null; statusTone: OntMetricThresholdTone | null } | null {
  let lastValue: number | null = null
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const value = rows[index]?.value
    if (typeof value === 'number' && Number.isFinite(value)) {
      lastValue = value
      break
    }
  }
  if (lastValue === null) return null

  const thresholds = getOntMetricThresholdConfig(metricTitle)
  const segment =
    thresholds ? resolveOntMetricThresholdSegment(lastValue, thresholds) : null
  const displayUnit = unit.trim()

  return {
    formatted: displayUnit ? `${lastValue.toFixed(1)} ${displayUnit}` : lastValue.toFixed(1),
    statusLabel: segment ? chartStatusLabel(segment) : null,
    statusTone: segment?.tone ?? null,
  }
}

interface Props {
  title: string
  metricTitle: string
  unit: string
  rows: HistoricPowerChartRow[]
}

export function OntHistoricPowerChart({ title, metricTitle, unit, rows }: Props) {
  const thresholds = getOntMetricThresholdConfig(metricTitle)
  const yDomain = useMemo(() => {
    const values = rows
      .map((row) => row.value)
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
    if (thresholds) {
      const dataMin = values.length > 0 ? Math.min(...values) : thresholds.min
      const dataMax = values.length > 0 ? Math.max(...values) : thresholds.max
      return [
        Math.min(thresholds.min, dataMin),
        Math.max(thresholds.max, dataMax),
      ] as [number, number]
    }
    return null
  }, [rows, thresholds])

  const bandSegments = useMemo(() => {
    if (!thresholds || !yDomain) return []
    return extendThresholdSegmentsToDomain(thresholds, yDomain[0], yDomain[1])
  }, [thresholds, yDomain])

  const displayUnit = unit.trim()

  return (
    <div className="flex flex-col gap-3">
      <div className="historic-line-chart h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
            {bandSegments.map((segment) => (
              <ReferenceArea
                key={`${segment.label}-${segment.start}`}
                y1={segment.start}
                y2={segment.end}
                fill={ontMetricThresholdBandFill(segment.tone)}
                fillOpacity={1}
                ifOverflow="extendDomain"
                strokeOpacity={0}
              />
            ))}
            <CartesianGrid stroke="var(--table-stroke)" strokeDasharray="3 3" opacity={0.7} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
              minTickGap={28}
              tickMargin={6}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
              width={46}
              domain={yDomain ?? ['auto', 'auto']}
              tickFormatter={(value) => String(value)}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--card)',
                border: '1px solid var(--table-stroke)',
                borderRadius: 8,
                fontSize: 11,
              }}
              formatter={(value) => {
                if (typeof value !== 'number') return ['—', title]
                return [displayUnit ? `${value.toFixed(2)} ${displayUnit}` : value.toFixed(2), title]
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              name={title}
              stroke={SERIES_COLOR}
              strokeWidth={2}
              dot={{ r: 3.5, fill: SERIES_COLOR, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <ul className="m-0 flex list-none flex-wrap items-center gap-x-5 gap-y-2 p-0 text-xs text-(--text-primary)">
        <li className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[2px] bg-(--primary)" aria-hidden />
          {displayUnit === 'dBm'
            ? `Potencia (${displayUnit})`
            : displayUnit
              ? `${title} (${displayUnit})`
              : title}
        </li>
        {legendItems(thresholds?.segments ?? []).map((item) => (
          <li key={item.label} className="inline-flex items-center gap-1.5">
            <span
              className={clsx('h-2.5 w-2.5 rounded-[2px]', ontMetricThresholdSwatchClass(item.tone))}
              aria-hidden
            />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

function chartStatusLabel(segment: OntMetricThresholdSegment): string {
  return segment.label
}

export function statusTextClass(tone: OntMetricThresholdTone): string {
  switch (tone) {
    case 'green':
      return 'text-(--state-01)'
    case 'orange':
    case 'yellow':
      return 'text-(--state-02)'
    case 'red':
      return 'text-(--state-03)'
    case 'blue':
      return 'text-(--primary-2)'
    default:
      return 'text-(--text-secondary)'
  }
}

function legendItems(segments: OntMetricThresholdSegment[]): OntMetricThresholdSegment[] {
  const seen = new Set<string>()
  const items: OntMetricThresholdSegment[] = []
  for (const segment of segments) {
    if (seen.has(segment.label)) continue
    seen.add(segment.label)
    items.push(segment)
  }
  return items
}
