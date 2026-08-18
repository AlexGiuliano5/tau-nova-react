import { type FormEvent, useId, useState } from 'react'
import { FiChevronRight, FiClock } from 'react-icons/fi'
import { IoSearch } from 'react-icons/io5'

import { OltAutocomplete } from '@/features/ftth/components/OltAutocomplete'
import { useNetworkElementSearchNavigation } from '@/features/ftth/hooks/use-network-element-search-navigation'
import { resolveNetworkElementSearchHref } from '@/features/ftth/lib/network-element-search'
import type { RecentNetworkElementSearch } from '@/features/ftth/types/recent-search'
import { FtthButton } from '@/features/shell/components/FtthButton'

interface Props {
  recentSearches: RecentNetworkElementSearch[]
}

export function NetworkElementSearchForm({ recentSearches }: Props) {
  const { submit, oltNames } = useNetworkElementSearchNavigation()
  const fieldId = useId()
  const [searchValue, setSearchValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const trimmedValue = searchValue.trim()
  const destination = resolveNetworkElementSearchHref(trimmedValue, oltNames)
  const canNavigate = Boolean(destination)

  const resolvedRecentSearches = recentSearches
    .map((search) => ({
      ...search,
      href: resolveNetworkElementSearchHref(search.value, oltNames),
    }))
    .filter(
      (search): search is RecentNetworkElementSearch & { href: string } =>
        typeof search.href === 'string',
    )

  const navigateByValue = (raw: string) => {
    submit(raw, setError)
  }

  const onSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    navigateByValue(searchValue)
  }

  return (
    <form
      onSubmit={onSearchSubmit}
      className="m-5 flex h-[calc(100dvh-250px)] flex-col justify-between gap-5 rounded-md p-3 dark:border dark:border-white/15 dark:bg-(--card) dark:shadow-[0_10px_20px_rgb(0_0_0/0.45)]"
    >
      <div className="flex flex-col gap-7">
        <div className="flex flex-col gap-2">
          <label htmlFor={fieldId} className="text-lg font-semibold">
            Ingrese elemento de red
          </label>
          <OltAutocomplete
            id={fieldId}
            name="networkElement"
            submitOnEnterPick
            value={searchValue}
            onValueChange={(next) => {
              setSearchValue(next)
              if (error) setError(null)
            }}
            onEnterWithoutSuggestion={(event) => {
              const next = event.currentTarget.value.trim()
              if (!next) return
              event.preventDefault()
              navigateByValue(next)
            }}
            placeholder="ingrese un elemento de red"
            enterKeyHint="search"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'network-element-search-error' : undefined}
          />
          <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">
            Buscar
          </button>
          {error ? (
            <p
              id="network-element-search-error"
              role="alert"
              className="text-sm text-red-600 dark:text-red-400"
            >
              {error}
            </p>
          ) : null}
        </div>

        {resolvedRecentSearches.length > 0 ? (
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-(--text-secondary)/70">
              Búsquedas recientes
            </p>
            <div className="divide-y divide-black/8 dark:divide-white/10">
              {resolvedRecentSearches.map((search) => (
                <button
                  key={`${search.value}-${search.updatedAt}`}
                  type="button"
                  className="group flex w-full items-center justify-between py-3 text-left"
                  onClick={() => navigateByValue(search.value)}
                >
                  <span className="flex items-center gap-3">
                    <FiClock
                      className="text-(--text-secondary)/40 transition-colors group-hover:text-(--text-secondary)/60"
                      size={16}
                    />
                    <span className="flex flex-col gap-0.5">
                      <span className="font-semibold leading-none text-(--text-secondary)/80">
                        {search.value}
                      </span>
                      <span className="text-xs leading-none text-(--text-secondary)/45">
                        {formatRecentSearchDate(search.updatedAt)}
                      </span>
                    </span>
                  </span>
                  <FiChevronRight
                    className="text-(--text-secondary)/28 transition-colors group-hover:text-(--text-secondary)/55"
                    size={16}
                  />
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <FtthButton
        title="Buscar"
        icon={<IoSearch />}
        onClick={() => navigateByValue(searchValue)}
        disabled={!canNavigate}
        className="flex w-full items-center justify-center"
      />
    </form>
  )
}

function formatRecentSearchDate(isoDate: string): string {
  const parsedDate = new Date(isoDate)
  if (Number.isNaN(parsedDate.getTime())) return ''

  return parsedDate.toLocaleString('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
