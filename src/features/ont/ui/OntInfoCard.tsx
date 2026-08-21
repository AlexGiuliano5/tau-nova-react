import { FiAlertTriangle, FiCheck, FiCpu, FiMinus } from 'react-icons/fi'
import { IoOpenOutline } from 'react-icons/io5'
import { Link } from 'react-router-dom'

import type { OntBirthCertificateResult } from '@/features/ont/api/birth-certificate'
import { hasAnyOntValue } from '@/features/ont/lib/missing-value'
import { formatOntSerial } from '@/features/ont/lib/ont-serial'
import { formatOntStatusLabel, normalizeOntStatusKey } from '@/features/ont/lib/ont-status-labels'
import { OntBirthCertificateEmbedded } from '@/features/ont/ui/OntBirthCertificateEmbedded'
import { OntCardEmptyBody, OntCardTitle } from '@/features/ont/ui/OntCardChrome'
import { OntHistoricStatusBarChart } from '@/features/ont/ui/OntHistoricStatusBarChart'
import { infoCardClassName } from '@/features/ont/ui/OntInfoCardLoadings'
import type { HistoricStatusBarModel } from '@/features/ont/lib/historic-status-bar'

export interface OntInfoDetails {
  ponId: string
  serial: string
  vendor: string
  olt: string
  placa: string
  puerto: string
  estado: string
  distancia: string
  ultimaVezActiva: string
  ultimaVezInactiva: string
  causaUltimaInactividad: string
}

interface Props {
  ontInfo: OntInfoDetails | null
  statusLoading?: boolean
  birthCertificate?: OntBirthCertificateResult | null
  birthCertificateLoading?: boolean
  showBirthCertificate?: boolean
  statusHistory?: HistoricStatusBarModel | null
  statusHistoryLoading?: boolean
}

const fieldRowClassName = 'flex items-start justify-between gap-3'
const fieldLabelClassName = 'shrink-0 text-(--text-secondary)'
const fieldValueClassName = 'text-right font-semibold'
const columnClassName = 'flex min-w-0 flex-col gap-2 text-sm md:text-[12px]'
const columnDividerClassName =
  'mt-3 border-t border-(--outline) pt-3 md:mt-0 md:border-t-0 md:border-l md:border-(--outline) md:pl-3 md:pt-0'

export function OntInfoCard({
  ontInfo,
  statusLoading = false,
  birthCertificate = null,
  birthCertificateLoading = false,
  showBirthCertificate = true,
  statusHistory = null,
  statusHistoryLoading = false,
}: Props) {
  const data = ontInfo ?? {
    ponId: 'Sin Datos',
    serial: 'Sin Datos',
    vendor: 'Sin Datos',
    olt: 'Sin Datos',
    placa: 'Sin Datos',
    puerto: 'Sin Datos',
    estado: 'Sin Datos',
    distancia: 'Sin Datos',
    ultimaVezActiva: 'Sin Datos',
    ultimaVezInactiva: 'Sin Datos',
    causaUltimaInactividad: 'Sin Datos',
  }

  const statusTone = getStatusTone(data.estado)
  const statusKey = normalizeOntStatusKey(data.estado)
  const StatusIcon = resolveStatusIcon(statusKey)
  const statusLabel = statusLoading ? 'Cargando' : formatOntStatusLabel(data.estado)

  const hasInfoData = hasAnyOntValue([
    data.ponId,
    data.serial,
    data.vendor,
    data.olt,
    data.placa,
    data.puerto,
    data.distancia,
    data.ultimaVezActiva,
    data.ultimaVezInactiva,
    data.causaUltimaInactividad,
  ])

  const oltHref =
    data.olt && data.olt !== 'Sin Datos'
      ? `/ftth/olt/${encodeURIComponent(data.olt)}`
      : undefined
  const portHref =
    oltHref && data.placa !== 'Sin Datos' && data.puerto !== 'Sin Datos'
      ? `${oltHref}/placa/${encodeURIComponent(data.placa)}/puerto/${encodeURIComponent(data.puerto)}`
      : undefined

  const oltLinkClassName =
    'font-semibold text-(--primary) underline underline-offset-2 decoration-(--primary)/40 hover:decoration-(--primary) dark:text-(--secondary) dark:decoration-(--secondary)/40'
  const portButtonClassName =
    'inline-flex h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-(--outline) bg-transparent px-2 text-xs font-semibold text-(--primary) transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-(--primary)/35 dark:border-white/12 dark:bg-white/5 dark:text-(--secondary) dark:hover:border-(--secondary)/35 dark:hover:bg-(--secondary)/15'

  return (
    <div className={infoCardClassName}>
      <header className="flex min-w-0 items-start justify-between gap-3">
        <OntCardTitle icon={FiCpu} className="min-w-0">
          Información de ONT
        </OntCardTitle>
        <div className="flex min-w-0 max-w-[min(100%,18rem)] flex-col items-end gap-1.5">
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[14px] font-semibold dark:text-white ${statusTone}`}
          >
            {statusLoading ? (
              <>
                <span className="inline-flex h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Estado: Cargando
              </>
            ) : (
              <>
                <StatusIcon className="size-3.5 shrink-0" aria-hidden />
                Estado: {statusLabel}
              </>
            )}
          </span>
          {statusHistory ? (
            <div className="w-full min-w-0">
              <OntHistoricStatusBarChart model={statusHistory} variant="compact" periodLabel="72hs" />
            </div>
          ) : statusHistoryLoading ? (
            <div className="flex w-full min-w-0 items-center gap-1.5" aria-busy="true">
              <span className="h-3.5 flex-1 animate-pulse rounded-full bg-(--table-stroke)" />
              <span className="shrink-0 text-[11px] font-semibold text-(--text-secondary)">72hs</span>
            </div>
          ) : null}
        </div>
      </header>

      <div
        className={
          showBirthCertificate
            ? 'grid min-h-0 flex-1 grid-cols-1 gap-0 md:grid-cols-3 md:gap-3'
            : 'grid min-h-0 flex-1 grid-cols-1 gap-0 md:grid-cols-2 md:gap-3'
        }
      >
        {hasInfoData ? (
          <>
            <section className={columnClassName} aria-label="Identificación">
          <div className={fieldRowClassName}>
            <span className={fieldLabelClassName}>PON ID</span>
            <span className={fieldValueClassName}>{data.ponId}</span>
          </div>
          <div className={fieldRowClassName}>
            <span className={fieldLabelClassName}>Serial</span>
            <span className={fieldValueClassName}>{formatOntSerial(data.serial)}</span>
          </div>
          <div className={fieldRowClassName}>
            <span className={fieldLabelClassName}>Vendor</span>
            <span className={fieldValueClassName}>{formatVendor(data.vendor)}</span>
          </div>
          <div className={fieldRowClassName}>
            <span className={fieldLabelClassName}>OLT</span>
            {oltHref ? (
              <Link to={oltHref} className={`${oltLinkClassName} text-right`}>
                {data.olt}
              </Link>
            ) : (
              <span className={fieldValueClassName}>{data.olt}</span>
            )}
          </div>
          <div className="flex items-end justify-between gap-3 pt-0.5">
            <div className="flex min-w-0 gap-5">
              <div className="flex flex-col">
                <span className={fieldLabelClassName}>Placa</span>
                <span className="font-semibold">{data.placa}</span>
              </div>
              <div className="flex flex-col">
                <span className={fieldLabelClassName}>Puerto</span>
                <span className="font-semibold">{data.puerto}</span>
              </div>
            </div>
            {portHref ? (
              <Link to={portHref} className={portButtonClassName} title="Ir a placa y puerto">
                <span>Placa/Puerto</span>
                <IoOpenOutline className="h-4 w-4" aria-hidden />
              </Link>
            ) : null}
          </div>
        </section>

        <section className={`${columnClassName} ${columnDividerClassName}`} aria-label="Actividad">
          <div className={fieldRowClassName}>
            <span className={fieldLabelClassName}>Distancia</span>
            <span className={fieldValueClassName}>{data.distancia}</span>
          </div>
          <div className={fieldRowClassName}>
            <span className={fieldLabelClassName}>Últ. vez activa</span>
            <span className={`${fieldValueClassName} whitespace-nowrap`}>{data.ultimaVezActiva}</span>
          </div>
          <div className={fieldRowClassName}>
            <span className={fieldLabelClassName}>Últ. vez inactiva</span>
            <span className={`${fieldValueClassName} whitespace-nowrap`}>
              {data.ultimaVezInactiva}
            </span>
          </div>
          <div className={fieldRowClassName}>
            <span className={fieldLabelClassName}>Causa inactividad</span>
            <span className={`${fieldValueClassName} wrap-break-word`}>
              {data.causaUltimaInactividad}
            </span>
          </div>
        </section>
          </>
        ) : (
          <div className="flex h-full min-h-0 md:col-span-2">
            <OntCardEmptyBody />
          </div>
        )}

        {showBirthCertificate ? (
          <section className={`${columnDividerClassName} flex min-h-0 min-w-0 flex-col`} aria-label="Certificado">
            <OntBirthCertificateEmbedded
              birthCertificate={birthCertificate}
              loading={birthCertificateLoading}
              layout="column"
            />
          </section>
        ) : null}
      </div>
    </div>
  )
}

function formatVendor(vendor: string): string {
  if (!vendor) return 'Sin Datos'
  return vendor.replace(/^ONT_/, 'OLT-')
}

function getStatusTone(status: string): string {
  const normalized = normalizeOntStatusKey(status)
  if (normalized === 'GOOD') return 'bg-(--card-green)/40 border-(--card-green)'
  if (normalized === 'INTERRUPTED') return 'bg-(--card-red)/30 border-(--card-red)'
  if (normalized === 'REDUCED_ROBUSTNESS' || normalized === 'DEGRADED') {
    return 'bg-(--card-yellow)/35 border-(--card-yellow)'
  }
  return 'bg-(--text-secondary)/15 border-(--text-secondary)/40 text-(--text-secondary)'
}

function resolveStatusIcon(statusKey: string) {
  if (statusKey === 'GOOD') return FiCheck
  if (
    statusKey === 'INTERRUPTED' ||
    statusKey === 'REDUCED_ROBUSTNESS' ||
    statusKey === 'DEGRADED'
  ) {
    return FiAlertTriangle
  }
  if (statusKey === 'SWITCHED_OFF') return FiMinus
  return FiMinus
}
