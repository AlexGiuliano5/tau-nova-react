import {
  type FormEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { IoChevronBack, IoChevronForward, IoGitNetworkOutline, IoSearch } from 'react-icons/io5'
import { useNavigate } from 'react-router-dom'

import { filterOltsByPrefix } from '@/features/ftth/lib/olt-names'
import {
  networkElementInvalidSearchMessage,
  resolveNetworkElementSearchHref,
} from '@/features/ftth/lib/network-element-search'
import type { RecentNetworkElementSearch } from '@/features/ftth/types/recent-search'
import { DARK_HEADER_BRAND_ICON_HREF, LIGHT_HEADER_BRAND_ICON_HREF } from '@/shared/lib/theme'

const recentSearchChipClassName =
  'inline-flex shrink-0 cursor-pointer whitespace-nowrap rounded-full border border-sky-300/40 bg-(--card) px-3 py-1.5 text-left transition-colors hover:border-sky-400/60 hover:bg-sky-50 dark:border-sky-400/30 dark:bg-[rgb(12_22_38)] dark:hover:border-sky-300/50 dark:hover:bg-[rgb(18_36_56)]'

const homeSearchSubmitButtonClassName =
  'inline-flex h-[52px] cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0d9488_0%,#0ea5e9_50%,#0284c7_100%)] px-7 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(14,165,233,0.25)] transition-all hover:-translate-y-px hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:w-[170px] dark:bg-[linear-gradient(135deg,#0284c7_0%,#0076c7_42%,#0369a1_88%,#075985_100%)] dark:text-white dark:shadow-[0_16px_40px_rgba(2,132,199,0.38)]'

const recentSearchNavButtonClassName =
  'inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-sky-300/40 bg-(--card) text-sky-800 transition-colors hover:border-sky-400/60 hover:bg-sky-50 disabled:pointer-events-none disabled:opacity-30 dark:border-sky-400/30 dark:bg-[rgb(12_22_38)] dark:text-sky-100 dark:hover:border-sky-300/50 dark:hover:bg-[rgb(18_36_56)]'

function preventCarouselFocusScroll(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault()
}

interface FtthDesktopHomeHeroProps {
  oltNameList: string[]
  recentSearches: RecentNetworkElementSearch[]
}

export function FtthDesktopHomeHero({
  oltNameList,
  recentSearches,
}: FtthDesktopHomeHeroProps) {
  const inputId = useId()
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [recentSearchReferenceNowMs, setRecentSearchReferenceNowMs] = useState<number | null>(
    null,
  )
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)

  const trimmedValue = value.trim()
  const destination = resolveNetworkElementSearchHref(trimmedValue, oltNameList)
  const suggestions = useMemo(
    () => filterOltsByPrefix(oltNameList, value).slice(0, 8),
    [oltNameList, value],
  )

  useEffect(() => {
    setRecentSearchReferenceNowMs(Date.now())
    const intervalId = window.setInterval(() => {
      setRecentSearchReferenceNowMs(Date.now())
    }, 60_000)
    return () => window.clearInterval(intervalId)
  }, [])

  const navigateByValue = (raw: string) => {
    const next = raw.trim()
    if (!next) {
      setError('Ingresá una OLT o una ONT para buscar.')
      return
    }
    const href = resolveNetworkElementSearchHref(next, oltNameList)
    if (!href) {
      setError(networkElementInvalidSearchMessage)
      return
    }
    setError(null)
    void navigate(href)
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    navigateByValue(value)
  }

  return (
    <section className="ftth-home-hero relative hidden min-h-0 md:flex md:h-full md:min-h-0 md:flex-1 md:flex-col md:overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[linear-gradient(165deg,#f4f9fc_0%,#eef6fb_45%,#e8f2f8_100%)] dark:bg-[linear-gradient(165deg,#0b1a2e_0%,#081422_42%,#050a12_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_18%,rgba(14,165,233,0.12),transparent_58%)] dark:bg-[radial-gradient(90%_70%_at_50%_12%,rgba(14,165,233,0.22),transparent_54%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_92%_42%,rgba(2,132,199,0.08),transparent_58%)] dark:bg-[radial-gradient(72%_58%_at_86%_36%,rgba(91,155,245,0.22),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,118,110,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(15,118,110,0.07)_1px,transparent_1px)] bg-size-[44px_44px] opacity-[0.55] dark:bg-[linear-gradient(rgba(125,211,252,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(125,211,252,0.09)_1px,transparent_1px)] dark:opacity-[0.32]" />
        <div className="absolute -left-44 top-[46%] h-[400px] w-[400px] -translate-y-1/2 rounded-full border border-sky-200/22 dark:border-sky-400/14" />
        <div className="absolute -left-20 top-[18%] h-[300px] w-[300px] rounded-full border border-sky-300/20 dark:border-sky-300/12" />
        <div className="absolute -left-8 bottom-[12%] h-[190px] w-[190px] rounded-full border border-sky-200/30 dark:border-sky-200/11" />
        <div className="absolute -right-40 top-10 h-[520px] w-[520px] rounded-full border border-sky-300/25 dark:border-sky-400/18" />
        <div className="absolute -right-24 top-24 h-[380px] w-[380px] rounded-full border border-sky-200/30 dark:border-sky-300/14" />
        <div className="absolute -right-10 top-40 h-[240px] w-[240px] rounded-full border border-sky-200/35 dark:border-sky-200/12" />
      </div>

      <div className="relative z-10 flex h-full min-h-0 flex-1 flex-col overflow-hidden border-x border-t border-black/10 text-(--text-primary) shadow-[0_12px_40px_rgb(8_47_73/0.08)] md:border-b-0 dark:border-sky-400/15 dark:shadow-[0_25px_70px_rgb(0_0_0/0.55),0_0_80px_rgb(2_132_199/0.08)]">
        <div className="relative z-10 flex min-h-0 flex-1 flex-col px-6 py-5 lg:px-10 lg:py-6">
          <div className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden">
            <div className="translate-y-0 lg:-translate-y-2 xl:-translate-y-6 2xl:-translate-y-10">
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="h-14 w-14 shrink-0 sm:h-16 sm:w-16">
                    <img
                      src={LIGHT_HEADER_BRAND_ICON_HREF}
                      alt=""
                      className="h-full w-full rounded-xl object-cover shadow-[0_8px_22px_rgba(14,165,233,0.2)] dark:hidden"
                      aria-hidden
                    />
                    <img
                      src={DARK_HEADER_BRAND_ICON_HREF}
                      alt=""
                      className="hidden h-full w-full rounded-xl object-cover shadow-[0_12px_26px_rgba(2,132,199,0.35)] dark:block"
                      aria-hidden
                    />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-semibold tracking-[0.2em] text-sky-800/85 uppercase dark:text-sky-200/92">
                      Home FTTH
                    </p>
                    <h1 className="mt-1 text-3xl leading-none font-semibold tracking-tight sm:text-4xl lg:text-[2.65rem]">
                      <span className="text-(--text-primary)">TAU</span>{' '}
                      <span className="bg-[linear-gradient(90deg,#0e7490_0%,#0284c7_100%)] bg-clip-text text-transparent dark:bg-[linear-gradient(90deg,#bae6fd_0%,#7dd3fc_38%,#5b9bf5_100%)]">
                        Nova
                      </span>
                    </h1>
                  </div>
                </div>

                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-sky-800/88 sm:mt-4 sm:text-base dark:font-medium dark:text-[#b9dff5] dark:[text-shadow:0_1px_2px_rgb(8_47_73/0.5),0_0_14px_rgb(8_47_73/0.22)]">
                  Estado de la red, en un sólo lugar. Métricas actualizadas y navegación en tiempo
                  real.
                </p>
              </div>

              <form onSubmit={onSubmit} className="mx-auto mt-5 w-full max-w-4xl md:mt-6">
                <label
                  htmlFor={inputId}
                  className="text-[11px] font-semibold tracking-[0.14em] text-sky-800/90 dark:text-sky-200/95"
                >
                  Búsqueda Rápida
                </label>

                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-stretch">
                  <div className="relative flex min-h-[52px] flex-1 items-center gap-2 rounded-2xl border border-sky-200/60 bg-(--card) px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md sm:px-4 dark:border-sky-400/18 dark:bg-[rgb(12_22_38/0.88)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_0_1px_rgba(2,132,199,0.08)]">
                    <IoSearch
                      className="shrink-0 text-sky-700/70 dark:text-sky-200/85"
                      size={18}
                      aria-hidden
                    />
                    <input
                      id={inputId}
                      name="networkElementHome"
                      value={value}
                      autoFocus
                      autoComplete="off"
                      placeholder="OLT · ONT"
                      enterKeyHint="search"
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? 'desktop-home-network-element-error' : undefined}
                      className="flex-1 border-0 bg-transparent p-0 text-[15px] text-(--text-primary) placeholder:text-(--text-secondary)/60 focus:ring-0 focus:outline-none dark:bg-transparent dark:placeholder:text-(--text-secondary)/55"
                      onChange={(event) => {
                        setValue(event.target.value)
                        setSuggestionsOpen(true)
                        if (error) setError(null)
                      }}
                      onFocus={() => setSuggestionsOpen(true)}
                      onBlur={() => {
                        window.setTimeout(() => setSuggestionsOpen(false), 150)
                      }}
                    />
                    {suggestionsOpen && suggestions.length > 0 ? (
                      <ul className="absolute top-full right-0 left-0 z-20 mt-2 max-h-56 overflow-auto rounded-xl border border-(--outline) bg-(--card) py-1 shadow-lg">
                        {suggestions.map((name) => (
                          <li key={name}>
                            <button
                              type="button"
                              className="w-full px-4 py-2 text-left text-sm text-(--text-primary) hover:bg-black/5 dark:hover:bg-white/8"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => {
                                setValue(name)
                                setSuggestionsOpen(false)
                                navigateByValue(name)
                              }}
                            >
                              {name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>

                  <button
                    type="submit"
                    className={homeSearchSubmitButtonClassName}
                    disabled={!destination}
                  >
                    <IoGitNetworkOutline size={18} aria-hidden />
                    Buscar
                  </button>
                </div>

                {recentSearches.length > 0 ? (
                  <RecentSearchesCarousel
                    recentSearches={recentSearches}
                    oltNameList={oltNameList}
                    referenceNowMs={recentSearchReferenceNowMs}
                    onSelect={navigateByValue}
                  />
                ) : null}

                {error ? (
                  <p
                    id="desktop-home-network-element-error"
                    role="alert"
                    className="mt-3 text-center text-sm font-medium text-red-600 dark:text-red-400"
                  >
                    {error}
                  </p>
                ) : null}
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function readCarouselScrollState(scroller: HTMLDivElement) {
  const maxScrollLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth)
  return {
    canScrollLeft: scroller.scrollLeft > 4,
    canScrollRight: scroller.scrollLeft < maxScrollLeft - 4,
  }
}

function RecentSearchesCarousel({
  recentSearches,
  oltNameList,
  referenceNowMs,
  onSelect,
}: {
  recentSearches: RecentNetworkElementSearch[]
  oltNameList: string[]
  referenceNowMs: number | null
  onSelect: (value: string) => void
}) {
  const navigate = useNavigate()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = useCallback(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const next = readCarouselScrollState(scroller)
    setCanScrollLeft(next.canScrollLeft)
    setCanScrollRight(next.canScrollRight)
  }, [])

  useLayoutEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return

    updateScrollState()
    scroller.addEventListener('scroll', updateScrollState, { passive: true })

    const observer = new ResizeObserver(() => updateScrollState())
    observer.observe(scroller)
    const firstChild = scroller.firstElementChild
    if (firstChild) observer.observe(firstChild)

    return () => {
      scroller.removeEventListener('scroll', updateScrollState)
      observer.disconnect()
    }
  }, [recentSearches, updateScrollState])

  const scrollByDirection = (direction: -1 | 1) => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const amount = Math.max(Math.round(scroller.clientWidth * 0.72), 180)
    scroller.scrollBy({ left: direction * amount, behavior: 'smooth' })
  }

  return (
    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <p className="shrink-0 text-[11px] font-semibold tracking-[0.18em] text-(--text-secondary) uppercase">
        Recientes
      </p>
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <button
          type="button"
          className={recentSearchNavButtonClassName}
          aria-label="Ver búsquedas anteriores"
          disabled={!canScrollLeft}
          onMouseDown={preventCarouselFocusScroll}
          onClick={() => scrollByDirection(-1)}
        >
          <IoChevronBack size={16} aria-hidden />
        </button>
        <div
          ref={scrollerRef}
          className="flex min-w-0 flex-1 gap-2 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {recentSearches.map((search) => {
            const recentHref = resolveNetworkElementSearchHref(search.value, oltNameList)
            return (
              <button
                key={`${search.value}-${search.updatedAt}`}
                type="button"
                onMouseDown={preventCarouselFocusScroll}
                onClick={() => {
                  if (recentHref) {
                    void navigate(recentHref)
                    return
                  }
                  onSelect(search.value)
                }}
                className={recentSearchChipClassName}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-sky-900 dark:text-sky-100">
                    {search.value}
                  </span>
                  <span
                    className="text-[11px] font-semibold text-sky-800/55 dark:text-sky-100/45"
                    aria-hidden
                  >
                    ·
                  </span>
                  <span className="text-[11px] font-semibold text-sky-800/70 dark:text-sky-100/65">
                    {formatRecentSearchDate(search.updatedAt, referenceNowMs)}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
        <button
          type="button"
          className={recentSearchNavButtonClassName}
          aria-label="Ver búsquedas siguientes"
          disabled={!canScrollRight}
          onMouseDown={preventCarouselFocusScroll}
          onClick={() => scrollByDirection(1)}
        >
          <IoChevronForward size={16} aria-hidden />
        </button>
      </div>
    </div>
  )
}

function formatRecentSearchDate(isoDate: string, referenceNowMs: number | null): string {
  const parsedDate = new Date(isoDate)
  if (Number.isNaN(parsedDate.getTime())) return ''
  if (referenceNowMs === null) return 'reciente'

  const diffMs = referenceNowMs - parsedDate.getTime()
  if (diffMs < 0) return 'ahora'

  const diffMinutes = Math.floor(diffMs / 60_000)
  if (diffMinutes < 1) return 'ahora'
  if (diffMinutes < 60) return `${diffMinutes}m`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h`
  if (diffHours < 48) return 'ayer'

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d`

  return parsedDate.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
  })
}
