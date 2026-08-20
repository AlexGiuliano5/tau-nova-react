import { useEffect, useId, useState, type FormEvent } from 'react'
import { IoSearch } from 'react-icons/io5'
import { useLocation, useNavigate } from 'react-router-dom'

import {
  networkElementInvalidSearchMessage,
  resolveNetworkElementSearchHref,
} from '@/features/ftth/lib/network-element-search'

interface Props {
  placeholder?: string
}

export function FtthQuickSearchCompact({
  placeholder = 'OLT · ONT',
}: Props) {
  const location = useLocation()
  const navigate = useNavigate()
  const inputId = useId()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    setValue('')
    setError(null)
  }, [location.pathname])

  const runSearch = (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) {
      setError('Ingresá una OLT o una ONT para buscar.')
      return
    }

    const href = resolveNetworkElementSearchHref(trimmed, [])
    if (!href) {
      setError(networkElementInvalidSearchMessage)
      return
    }

    setPending(true)
    setError(null)
    navigate(href)
    setValue('')
    setPending(false)
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    runSearch(value)
  }

  return (
    <form onSubmit={onSubmit} className="flex min-w-0 flex-1 items-center gap-2" aria-busy={pending}>
      <div className="flex h-10 min-w-[220px] max-w-[360px] flex-1 items-center gap-2 rounded-md border border-black/10 px-3 dark:border-white/15 dark:bg-white/[0.04]">
        <button
          type="button"
          className="inline-flex shrink-0 items-center text-(--text-secondary) outline-none disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={pending ? 'Buscando elemento de red' : 'Buscar elemento de red'}
          disabled={pending}
          onClick={() => runSearch(value)}
        >
          {pending ? (
            <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <IoSearch size={16} aria-hidden />
          )}
        </button>
        <input
          id={inputId}
          name="networkElementHeader"
          value={value}
          placeholder={placeholder}
          enterKeyHint="search"
          disabled={pending}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-(--text-primary) placeholder:text-(--text-secondary)/60 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-transparent dark:placeholder:text-(--text-secondary)/55"
          onChange={(event) => {
            setValue(event.target.value)
            if (error) setError(null)
          }}
        />
      </div>
      <button type="submit" className="sr-only" tabIndex={-1} aria-hidden disabled={pending}>
        Buscar
      </button>
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="sr-only">
          {error}
        </p>
      ) : null}
    </form>
  )
}
