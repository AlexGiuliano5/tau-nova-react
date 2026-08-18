import {
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'

import { useFtthOltNames } from '@/features/ftth/hooks/use-ftth-olt-names'
import { filterOltsByPrefix, OLT_AUTOCOMPLETE_MIN_CHARS } from '@/features/ftth/lib/olt-names'

const INPUT_BASE =
  'w-full rounded-md border border-black/10 p-2 text-sm placeholder:text-(--text-secondary)/65 dark:border-white/15 dark:bg-white/[0.07] dark:text-white dark:placeholder:text-white/55'

const DEFAULT_MAX = 15

export type OltAutocompleteProps = {
  value: string
  onValueChange: (next: string) => void
  /** Si no se pasa, los nombres salen del árbol FTTH (store + caché en localStorage). */
  oltNames?: string[]
  minChars?: number
  maxSuggestions?: number
  /** Si es true, al seleccionar con Enter una sugerencia también intenta enviar el form contenedor. */
  submitOnEnterPick?: boolean
  /**
   * Enter cuando no se confirma una sugerencia del listado.
   * Útil para valores libres (p. ej. serial ONT).
   */
  onEnterWithoutSuggestion?: (event: ReactKeyboardEvent<HTMLInputElement>) => void
  onSuggestionPick?: (value: string) => void
  id?: string
  name?: string
  placeholder?: string
  enterKeyHint?: HTMLAttributes<HTMLInputElement>['enterKeyHint']
  autoFocus?: boolean
  disabled?: boolean
  className?: string
  inputClassName?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

export function OltAutocomplete({
  value,
  onValueChange,
  oltNames: oltNamesProp,
  minChars = OLT_AUTOCOMPLETE_MIN_CHARS,
  maxSuggestions = DEFAULT_MAX,
  submitOnEnterPick = false,
  onEnterWithoutSuggestion,
  onSuggestionPick,
  id: idProp,
  name,
  placeholder = 'OLT',
  enterKeyHint,
  autoFocus = false,
  disabled,
  className = '',
  inputClassName = '',
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}: OltAutocompleteProps) {
  const namesFromTree = useFtthOltNames()
  const oltNames = oltNamesProp ?? namesFromTree

  const reactId = useId()
  const listboxId = `${reactId}-listbox`
  const inputId = idProp ?? `${reactId}-input`

  const containerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const matches = useMemo(() => {
    const raw = filterOltsByPrefix(oltNames, value, minChars)
    return raw.slice(0, maxSuggestions)
  }, [oltNames, value, minChars, maxSuggestions])

  const showPanel = open && value.trim().length >= minChars

  const close = useCallback(() => {
    setOpen(false)
    setActiveIndex(-1)
  }, [])

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        close()
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [close])

  const pick = useCallback(
    (pickedName: string) => {
      onValueChange(pickedName)
      close()
      onSuggestionPick?.(pickedName)
    },
    [onValueChange, close, onSuggestionPick],
  )

  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      const pickingFromList =
        showPanel &&
        matches.length > 0 &&
        activeIndex >= 0 &&
        Boolean(matches[activeIndex])
      if (pickingFromList) {
        event.preventDefault()
        pick(matches[activeIndex])
        if (submitOnEnterPick && !onSuggestionPick) {
          const form = event.currentTarget.form
          window.setTimeout(() => form?.requestSubmit(), 0)
        }
        return
      }
      onEnterWithoutSuggestion?.(event)
      return
    }

    if (!showPanel || matches.length === 0) {
      if (event.key === 'Escape') {
        close()
      }
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      close()
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (index + 1 >= matches.length ? 0 : index + 1))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => (index <= 0 ? matches.length - 1 : index - 1))
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        id={inputId}
        name={name}
        type="text"
        autoComplete="off"
        spellCheck={false}
        autoFocus={autoFocus}
        disabled={disabled}
        value={value}
        aria-expanded={showPanel && matches.length > 0}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        role="combobox"
        className={`${INPUT_BASE} ${inputClassName}`.trim()}
        placeholder={placeholder}
        enterKeyHint={enterKeyHint}
        onChange={(event) => {
          onValueChange(event.target.value)
          setOpen(true)
          setActiveIndex(-1)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />

      {showPanel && matches.length > 0 ? (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border border-black/15 bg-white py-1 shadow-lg dark:border-white/20 dark:bg-(--card)"
        >
          {matches.map((opt, idx) => (
            <button
              key={opt}
              type="button"
              role="option"
              aria-selected={idx === activeIndex}
              className={`flex w-full px-3 py-2 text-left text-sm text-(--text-primary) hover:bg-black/5 dark:hover:bg-white/10 ${
                idx === activeIndex ? 'bg-black/5 dark:bg-white/10' : ''
              }`}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(idx)}
              onClick={() => pick(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
