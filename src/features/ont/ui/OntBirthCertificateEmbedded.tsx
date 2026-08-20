import { useState } from 'react'
import clsx from 'clsx'
import { FiFileText } from 'react-icons/fi'
import { IoChevronDown } from 'react-icons/io5'

import type { OntBirthCertificateItem, OntBirthCertificateResult } from '@/features/ont/api/birth-certificate'
import { FtthDataIssueNotice } from '@/features/ftth/components/FtthDataIssueNotice'
import { hasAnyOntValue } from '@/features/ont/lib/missing-value'
import { OntCardEmptyBody } from '@/features/ont/ui/OntCardChrome'

interface Props {
  birthCertificate: OntBirthCertificateResult | null
  loading?: boolean
  layout?: 'default' | 'column'
}

export function OntBirthCertificateEmbedded({
  birthCertificate,
  loading = false,
  layout = 'default',
}: Props) {
  if (loading) return <BirthCertificateSkeleton layout={layout} />

  const certificates = birthCertificate?.certificates ?? []
  const issue = birthCertificate?.issue ?? 'no-data'
  const certificate = certificates[0] ?? null
  const shouldShowError = issue === 'error' || issue === 'unexpected'
  const hasCertificateData = Boolean(certificate) && certificateHasAnyValue(certificate)
  const shouldShowData = issue === 'none' && hasCertificateData

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-2" aria-label="Certificado de nacimiento">
      <h2 className="inline-flex items-center gap-1.5 text-[13px] font-semibold tracking-tight text-(--text-primary) md:text-[14px]">
        <FiFileText
          className={clsx(
            'shrink-0',
            layout === 'column'
              ? 'size-3.5 text-(--text-secondary) md:size-3'
              : 'size-3.5 text-(--text-secondary)',
          )}
          aria-hidden
        />
        Certificado de nacimiento
      </h2>

      {shouldShowError ? (
        <div className="flex min-h-0 flex-1 items-center justify-center px-2 py-6">
          <FtthDataIssueNotice
            presentation="inline"
            issue={issue === 'unexpected' ? 'unexpected' : 'error'}
            context="el certificado de nacimiento"
            className="text-left text-xs"
          />
        </div>
      ) : shouldShowData && certificate ? (
        <BirthCertificateContent certificate={certificate} layout={layout} />
      ) : (
        <OntCardEmptyBody className="py-6" />
      )}
    </section>
  )
}

function BirthCertificateContent({
  certificate,
  layout,
}: {
  certificate: {
    fechaHora: string
    date: string
    rx: string
    tx: string
    cdo: string
    puertoInstalado: string
    workOrder: string
    caseNumber: string
  }
  layout: 'default' | 'column'
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const displayDate = certificate.fechaHora || certificate.date || 'Sin Datos'
  const isColumn = layout === 'column'

  return (
    <div className="flex flex-col gap-2">
      {isColumn ? (
        <div className="flex flex-col gap-2 text-sm md:text-[12px]">
          <DetailRow label="Fecha" value={displayDate} muted />
          <DetailRow label="RX" value={formatWithUnit(certificate.rx, 'dBm')} emphasize />
          <DetailRow label="TX" value={formatWithUnit(certificate.tx, 'dBm')} emphasize />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          <MetricCell label="Fecha" value={displayDate} />
          <MetricCell label="RX" value={formatWithUnit(certificate.rx, 'dBm')} emphasize />
          <MetricCell label="TX" value={formatWithUnit(certificate.tx, 'dBm')} emphasize />
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        aria-expanded={isExpanded}
        className="inline-flex w-fit items-center gap-1 rounded-md px-0.5 py-0.5 text-[11px] font-semibold text-(--primary) transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-(--primary)/35 dark:text-(--secondary) dark:hover:bg-white/8"
      >
        {isExpanded ? 'Ver menos información' : 'Ver más información'}
        <IoChevronDown
          className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {isExpanded ? (
        <div className="grid gap-2 text-sm md:text-[12px]">
          <DetailRow label="CDO" value={certificate.cdo} />
          <DetailRow label="Puerto instalado" value={certificate.puertoInstalado} />
          <DetailRow label="Work order" value={certificate.workOrder} />
          <DetailRow label="Caso" value={certificate.caseNumber} />
        </div>
      ) : null}
    </div>
  )
}

function MetricCell({
  label,
  value,
  emphasize = false,
}: {
  label: string
  value: string
  emphasize?: boolean
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 rounded-lg border border-[#e8edf3] bg-[#f5f7fa] px-2 py-2 dark:border-white/10 dark:bg-white/[0.04]">
      <span className="text-[10px] font-medium tracking-wide text-(--text-secondary)/80 uppercase">
        {label}
      </span>
      <span
        className={clsx(
          'truncate font-semibold tabular-nums text-(--text-primary)',
          emphasize ? 'text-[13px]' : 'text-[12px]',
        )}
        title={value}
      >
        {value}
      </span>
    </div>
  )
}

function DetailRow({
  label,
  value,
  emphasize = false,
  muted = false,
}: {
  label: string
  value: string
  emphasize?: boolean
  muted?: boolean
}) {
  const display = displayValue(value)
  return (
    <div className="flex min-w-0 items-start justify-between gap-3">
      <span className="shrink-0 text-(--text-secondary)">{label}</span>
      <span
        className={clsx(
          'truncate text-right tabular-nums',
          emphasize ? 'text-[13px] font-semibold text-(--text-primary) md:text-[12px]' : null,
          muted ? 'font-medium text-(--text-secondary)' : null,
          !emphasize && !muted ? 'font-semibold' : null,
        )}
        title={display}
      >
        {display}
      </span>
    </div>
  )
}

function BirthCertificateSkeleton({ layout }: { layout: 'default' | 'column' }) {
  if (layout === 'column') {
    return (
      <section className="flex flex-col gap-2" aria-busy="true" aria-live="polite">
        <div className="h-3 w-28 animate-pulse rounded bg-(--text-secondary)/15" />
        <div className="h-3.5 w-full animate-pulse rounded bg-(--text-secondary)/10" />
        <div className="h-3.5 w-4/5 animate-pulse rounded bg-(--text-secondary)/10" />
        <div className="h-3.5 w-3/5 animate-pulse rounded bg-(--text-secondary)/10" />
        <span className="sr-only">Cargando certificado de nacimiento</span>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-2.5" aria-busy="true" aria-live="polite">
      <div className="h-3.5 w-40 animate-pulse rounded bg-(--text-secondary)/15" />
      <div className="grid grid-cols-3 gap-1.5">
        <div className="h-[52px] animate-pulse rounded-lg bg-(--text-secondary)/10" />
        <div className="h-[52px] animate-pulse rounded-lg bg-(--text-secondary)/10" />
        <div className="h-[52px] animate-pulse rounded-lg bg-(--text-secondary)/10" />
      </div>
      <span className="sr-only">Cargando certificado de nacimiento</span>
    </section>
  )
}

function certificateHasAnyValue(
  certificate: Pick<
    OntBirthCertificateItem,
    'fechaHora' | 'date' | 'rx' | 'tx' | 'cdo' | 'puertoInstalado' | 'workOrder' | 'caseNumber'
  > | null,
): boolean {
  if (!certificate) return false
  return hasAnyOntValue([
    certificate.fechaHora,
    certificate.date,
    certificate.rx,
    certificate.tx,
    certificate.cdo,
    certificate.puertoInstalado,
    certificate.workOrder,
    certificate.caseNumber,
  ])
}

function displayValue(value: string): string {
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : 'Sin Datos'
}

function formatWithUnit(value: string, unit: string): string {
  const normalized = value.trim()
  if (!normalized) return 'Sin Datos'
  return `${normalized} ${unit}`
}
