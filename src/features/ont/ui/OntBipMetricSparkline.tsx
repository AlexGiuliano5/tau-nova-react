import { useEffect, useMemo, useRef, useState } from 'react'

import {
  fetchOntBipSparklinePoints,
  type OntBipHistoricMetric,
  type OntBipSparklinePoint,
} from '@/features/ont/api/bip-sparkline'

type BipGraphId = 'ont-bip-us' | 'ont-bip-ds'

interface Props {
  ont: string
  oltId: string
  graphId: BipGraphId
}

function BipSparklineChart({ rows }: { rows: OntBipSparklinePoint[] }) {
  const path = useMemo(() => buildSparklinePath(rows, 56, 56, 8), [rows])
  return (
    <div
      className="size-14 min-h-14 min-w-14 shrink-0 overflow-hidden rounded-md border border-black/10 bg-white/55 dark:border-white/12 dark:bg-white/5"
      role="img"
      aria-label="Histórico BIP últimos 3 días"
    >
      <svg viewBox="0 0 56 56" className="size-full" aria-hidden>
        <path
          d={path}
          fill="none"
          stroke="var(--primary-2)"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

export function OntBipMetricSparkline({ ont, oltId, graphId }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [rows, setRows] = useState<OntBipSparklinePoint[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const element = rootRef.current
    if (!element) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '120px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible || !oltId.trim()) return
    const controller = new AbortController()
    setLoading(true)
    const metric: OntBipHistoricMetric =
      graphId === 'ont-bip-us' ? 'Ont Bip US' : 'Ont Bip DS'

    void fetchOntBipSparklinePoints(ont, oltId, metric, controller.signal)
      .then((points) => {
        if (!controller.signal.aborted) setRows(points)
      })
      .catch(() => {
        if (!controller.signal.aborted) setRows([])
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [graphId, isVisible, oltId, ont])

  const hasPeaks = rows.some((row) => row.value !== 0)
  const showChart = isVisible && !loading && rows.length >= 2 && hasPeaks

  return (
    <div ref={rootRef} className={showChart ? undefined : 'h-px w-full'}>
      {showChart ? <BipSparklineChart rows={rows} /> : null}
    </div>
  )
}

function buildSparklinePath(
  rows: OntBipSparklinePoint[],
  width: number,
  height: number,
  padding: number,
): string {
  const values = rows.map((row) => row.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const innerW = width - padding * 2
  const innerH = height - padding * 2

  return rows
    .map((row, index) => {
      const x = padding + (index / Math.max(rows.length - 1, 1)) * innerW
      const y = padding + innerH - ((row.value - min) / range) * innerH
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')
}
