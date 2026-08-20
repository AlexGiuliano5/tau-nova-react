import clsx from 'clsx'
import { useEffect, useState, type ReactNode } from 'react'
import type { IconType } from 'react-icons'
import {
  IoArrowBack,
  IoCheckmark,
  IoCopyOutline,
  IoHomeOutline,
  IoOpenOutline,
  IoServerOutline,
} from 'react-icons/io5'
import { LuRouter } from 'react-icons/lu'
import { TbPlugConnected } from 'react-icons/tb'
import { Link, useLocation } from 'react-router-dom'

import { parseOltPlacaPuertoSegments } from '@/features/port/lib/olt-placa-puerto-route'
import { BreadcrumbPlacaPuertoEstado } from '@/features/shell/components/BreadcrumbPlacaPuertoEstado'

export type FtthBreadcrumbIcon = 'home' | 'olt' | 'port' | 'ont'

export interface FtthBreadcrumbItem {
  label: string
  href?: string
  icon?: FtthBreadcrumbIcon
  /** Si está, muestra el botón de copiar con este valor (p. ej. serial completo). */
  copyValue?: string
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
  /**
   * Desktop: borde inferior que cierra el grupo de navegación.
   * En vistas con tabs propias (detalle ONT) va en `false`.
   */
  desktopBottomRule?: boolean
}

const ONT_SEARCH_HREF = '/ftth/busqueda/elemento-de-red'

const mobileBarClassName =
  'flex h-[50px] w-full items-center justify-between border-t border-white/20 bg-(--primary-2) px-5 text-white dark:bg-(--secondary-4)'

const desktopBarClassName =
  'sticky top-0 z-40 hidden h-8 w-full shrink-0 items-center gap-1.5 overflow-hidden bg-(--background) px-6 text-[12px] leading-none md:flex lg:px-8'

const crumbClassName =
  'inline-flex min-w-0 items-center gap-1 font-normal'

const BREADCRUMB_ICONS: Record<FtthBreadcrumbIcon, IconType> = {
  home: IoHomeOutline,
  olt: IoServerOutline,
  port: TbPlugConnected,
  ont: LuRouter,
}

function decodePathSegment(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function formatPuertoLabel(placa: string, puerto: string): string {
  return `Puerto ${placa}/${puerto}`
}

function inferItemIcon(item: FtthBreadcrumbItem): FtthBreadcrumbIcon | undefined {
  if (item.icon) return item.icon
  if (item.label === 'Home') return 'home'
  if (item.label === 'OLT') return 'olt'
  if (item.label === 'ONT' || item.copyValue) return 'ont'
  if (/^Puerto\s/i.test(item.label) || /^Placa\s/i.test(item.label)) return 'port'
  return undefined
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
    const puertoLabel = formatPuertoLabel(decodedPlaca, decodedPuerto)
    const legacyPlacaPuertoLabel = `Placa ${decodedPlaca} / Puerto ${decodedPuerto}`
    const portHref = `/ftth/olt/${encodeURIComponent(decodedOlt)}/placa/${encodeURIComponent(decodedPlaca)}/puerto/${encodeURIComponent(decodedPuerto)}`
    const pathHasPortSubroute = pathChunks.length > 7

    items.push({
      label: puertoLabel,
      href: pathHasPortSubroute ? portHref : undefined,
    })

    if (
      trailingTitleChunks[0] === puertoLabel ||
      trailingTitleChunks[0] === legacyPlacaPuertoLabel
    ) {
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
    segments.push({ label: 'ONT', href: ONT_SEARCH_HREF })
    if (ontName) segments.push({ label: ontName, copyValue: ontName })
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

function BreadcrumbCopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timeoutId = window.setTimeout(() => setCopied(false), 1500)
    return () => window.clearTimeout(timeoutId)
  }, [copied])

  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(value).then(
          () => setCopied(true),
          () => undefined,
        )
      }}
      aria-label={copied ? 'Copiado' : `Copiar ${value}`}
      title={copied ? 'Copiado' : 'Copiar'}
      className="inline-flex shrink-0 items-center text-[#374151] transition-colors hover:text-[#1f2937] dark:text-white/80 dark:hover:text-white"
    >
      {copied ? <IoCheckmark size={14} /> : <IoCopyOutline size={14} />}
    </button>
  )
}

function BreadcrumbItemContent({
  item,
  isLast,
}: {
  item: FtthBreadcrumbItem
  isLast: boolean
}) {
  const iconKind = inferItemIcon(item)
  const Icon = iconKind ? BREADCRUMB_ICONS[iconKind] : null

  return (
    <>
      {Icon ? <Icon size={13} className="shrink-0 opacity-80" aria-hidden /> : null}
      <span className={isLast ? 'whitespace-nowrap' : 'truncate'} title={item.label}>
        {item.label}
      </span>
      {isLast && item.copyValue ? <BreadcrumbCopyButton value={item.copyValue} /> : null}
    </>
  )
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
  desktopBottomRule = true,
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

      <nav
        aria-label="Breadcrumb"
        className={clsx(
          desktopBarClassName,
          desktopBottomRule && 'border-b border-[#e5e7eb] dark:border-white/10',
        )}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const isLink = Boolean(item.href) && !isLast
          return (
            <div
              key={`${item.href ?? 'current'}-${item.label}-${index}`}
              className={clsx(
                'inline-flex items-center gap-1.5',
                isLast ? 'shrink-0' : 'min-w-0',
              )}
            >
              {index > 0 ? (
                <span className="text-[#9ca3af]/70 dark:text-white/25" aria-hidden>
                  {'>'}
                </span>
              ) : null}
              {isLink ? (
                <Link
                  to={item.href!}
                  className={clsx(
                    crumbClassName,
                    'text-[#9ca3af] transition-colors hover:text-[#6b7280] dark:text-white/40 dark:hover:text-white/65',
                  )}
                  title={item.label}
                >
                  <BreadcrumbItemContent item={item} isLast={false} />
                </Link>
              ) : (
                <span
                  className={clsx(
                    crumbClassName,
                    isLast
                      ? 'text-[#374151] dark:text-white/85'
                      : 'text-[#9ca3af] dark:text-white/40',
                  )}
                >
                  <BreadcrumbItemContent item={item} isLast={isLast} />
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
