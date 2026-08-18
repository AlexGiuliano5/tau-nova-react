import clsx from 'clsx'
import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { IoArrowBack, IoOpenOutline } from 'react-icons/io5'

import { parseOltPlacaPuertoSegments } from '@/features/port/lib/olt-placa-puerto-route'
import { BreadcrumbPlacaPuertoEstado } from '@/features/shell/components/BreadcrumbPlacaPuertoEstado'

export interface FtthBreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbPlacaPuertoContext {
  olt: string
  placa: number
  puerto: number
}

interface Props {
  title: string
  backHref?: string
  showLinkIndicator?: boolean
  desktopItems?: FtthBreadcrumbItem[]
  lookerHref?: string | null
  lookerTitle?: string
  placaPuertoContext?: BreadcrumbPlacaPuertoContext | null
  placaPuertoEstadoSlot?: ReactNode
  mobileEstadoSlot?: ReactNode
}

const mobileBarClassName =
  'flex h-[50px] w-full items-center justify-between border-t border-white/20 bg-(--primary-2) px-5 text-white dark:bg-(--secondary-4)'

const desktopBarClassName =
  'hidden h-9 w-full items-center gap-2 overflow-hidden border-b border-black/8 bg-[#f8fafc] px-6 text-[11px] text-black/65 dark:border-white/8 dark:bg-(--card) dark:text-white/70 md:flex'

function decodePathSegment(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

/** Segments navegables para rutas `/ftth/olt/...` (como tau-nova). */
function buildDesktopBreadcrumbItemsForOltPath(
  pathname: string,
  titleChunks: string[],
): FtthBreadcrumbItem[] | null {
  const pathChunks = pathname.split('/').filter(Boolean)
  if (pathChunks.length < 3 || pathChunks[0] !== 'ftth' || pathChunks[1] !== 'olt') {
    return null
  }

  const oltPathSegment = pathChunks[2]
  const decodedOlt = decodePathSegment(oltPathSegment).trim()
  if (!decodedOlt) return null

  const items: FtthBreadcrumbItem[] = [
    { label: 'Home', href: '/ftth' },
    { label: 'OLT' },
  ]

  const oltHref = `/ftth/olt/${encodeURIComponent(decodedOlt)}`
  const pathHasMoreLevels = pathChunks.length > 3
  items.push({
    label: decodedOlt,
    href: pathHasMoreLevels ? oltHref : undefined,
  })

  const hasPortSegments =
    pathChunks[3] === 'placa' &&
    Boolean(pathChunks[4]) &&
    pathChunks[5] === 'puerto' &&
    Boolean(pathChunks[6])

  let trailingTitleChunks = titleChunks.slice(1)
  if (hasPortSegments) {
    const decodedPlaca = decodePathSegment(pathChunks[4]).trim()
    const decodedPuerto = decodePathSegment(pathChunks[6]).trim()
    const placaPuertoLabel = `Placa ${decodedPlaca} / Puerto ${decodedPuerto}`
    const portHref = `/ftth/olt/${encodeURIComponent(decodedOlt)}/placa/${encodeURIComponent(decodedPlaca)}/puerto/${encodeURIComponent(decodedPuerto)}`
    const pathHasPortSubroute = pathChunks.length > 7

    items.push({
      label: placaPuertoLabel,
      href: pathHasPortSubroute ? portHref : undefined,
    })

    if (trailingTitleChunks[0] === placaPuertoLabel) {
      trailingTitleChunks = trailingTitleChunks.slice(1)
    }
  }

  if (trailingTitleChunks.length > 0) {
    items.push(...trailingTitleChunks.map((chunk) => ({ label: chunk })))
  }

  return items
}

function buildDesktopBreadcrumbItems(title: string, pathname: string): FtthBreadcrumbItem[] {
  const normalizedTitle = title.trim()
  if (!normalizedTitle) {
    return [{ label: 'Home', href: '/ftth' }]
  }

  const titleChunks = normalizedTitle
    .split('·')
    .map((chunk) => chunk.trim())
    .filter(Boolean)

  const oltPathItems = buildDesktopBreadcrumbItemsForOltPath(pathname, titleChunks)
  if (oltPathItems) return oltPathItems

  const segments: FtthBreadcrumbItem[] = [{ label: 'Home', href: '/ftth' }]
  if (titleChunks.length === 0) return segments

  const firstChunk = titleChunks[0]
  if (firstChunk.startsWith('OLT ')) {
    const oltName = firstChunk.replace(/^OLT\s+/, '').trim()
    segments.push({ label: 'OLT' })
    if (oltName) {
      segments.push({
        label: oltName,
        href: `/ftth/olt/${encodeURIComponent(oltName)}`,
      })
    }
  } else if (firstChunk.startsWith('ONT ')) {
    const ontName = firstChunk.replace(/^ONT\s+/, '').trim()
    segments.push({ label: 'ONT' })
    if (ontName) segments.push({ label: ontName })
  } else {
    segments.push({ label: firstChunk })
  }

  if (titleChunks.length > 1) {
    segments.push(...titleChunks.slice(1).map((chunk) => ({ label: chunk })))
  }

  return segments
}

function resolvePlacaPuertoFromPath(pathname: string): BreadcrumbPlacaPuertoContext | null {
  const pathChunks = pathname.split('/').filter(Boolean)
  if (pathChunks.length < 7 || pathChunks[0] !== 'ftth' || pathChunks[1] !== 'olt') {
    return null
  }
  if (pathChunks[3] !== 'placa' || pathChunks[5] !== 'puerto') return null

  const olt = decodePathSegment(pathChunks[2]).trim()
  const parsed = parseOltPlacaPuertoSegments(
    decodePathSegment(pathChunks[4]),
    decodePathSegment(pathChunks[6]),
  )
  if (!olt || !parsed) return null
  return { olt, placa: parsed.placa, puerto: parsed.puerto }
}

export function FtthBreadcrumb({
  title,
  backHref = '/ftth',
  showLinkIndicator = false,
  desktopItems = [],
  lookerHref = null,
  lookerTitle = 'Histórico de Indisponibilidad',
  placaPuertoContext = null,
  placaPuertoEstadoSlot = null,
  mobileEstadoSlot = null,
}: Props) {
  const { pathname } = useLocation()

  const items =
    desktopItems.length > 0
      ? desktopItems
      : buildDesktopBreadcrumbItems(title, pathname)

  const estadoContext = placaPuertoContext ?? resolvePlacaPuertoFromPath(pathname)

  const resolvedDesktopEstado =
    placaPuertoEstadoSlot ??
    (estadoContext ? (
      <BreadcrumbPlacaPuertoEstado
        olt={estadoContext.olt}
        placa={estadoContext.placa}
        puerto={estadoContext.puerto}
        variant="desktop"
      />
    ) : null)

  const resolvedMobileEstado =
    mobileEstadoSlot ??
    (estadoContext ? (
      <BreadcrumbPlacaPuertoEstado
        olt={estadoContext.olt}
        placa={estadoContext.placa}
        puerto={estadoContext.puerto}
        variant="mobile"
      />
    ) : null)

  return (
    <>
      <div className={`${mobileBarClassName} md:hidden`}>
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to={backHref}
            aria-label="Volver"
            className="inline-flex shrink-0 items-center text-white/90"
          >
            <IoArrowBack size={22} />
          </Link>
          <h1 className="truncate text-xl font-semibold leading-snug tracking-tight">{title}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {resolvedMobileEstado}
          {showLinkIndicator ? (
            <span className="inline-flex items-center justify-center text-white/85" aria-hidden>
              <IoOpenOutline size={18} />
            </span>
          ) : null}
        </div>
      </div>

      <nav aria-label="Breadcrumb" className={desktopBarClassName}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const isLink = Boolean(item.href) && !isLast
          return (
            <div
              key={`${item.href ?? 'current'}-${item.label}-${index}`}
              className="inline-flex min-w-0 items-center gap-2"
            >
              {index > 0 ? <span className="text-black/40 dark:text-white/45">{'>'}</span> : null}
              {isLink ? (
                <Link
                  to={item.href!}
                  className="truncate font-normal text-black/65 underline-offset-2 hover:underline dark:text-white/70"
                  title={item.label}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={clsx(
                    'truncate',
                    isLast
                      ? 'font-semibold text-black dark:text-white'
                      : 'font-normal text-black/65 dark:text-white/70',
                  )}
                  title={item.label}
                >
                  {item.label}
                </span>
              )}
            </div>
          )
        })}

        {resolvedDesktopEstado}

        {lookerHref ? (
          <div className="ml-auto inline-flex items-center gap-2">
            <a
              href={lookerHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={lookerTitle}
              title={lookerTitle}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#93d6ff] bg-[#dff3ff] text-[#1677b3] transition-colors hover:bg-[#ccecff] dark:border-[#7f63ff] dark:bg-[#3e2a7a] dark:text-[#d9ccff] dark:hover:bg-[#4a3392]"
            >
              <IoOpenOutline size={16} className="block" />
            </a>
          </div>
        ) : null}
      </nav>
    </>
  )
}
