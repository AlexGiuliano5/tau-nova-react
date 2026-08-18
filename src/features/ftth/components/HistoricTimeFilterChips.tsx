import clsx from 'clsx'

interface HistoricTimeFilterOption<T extends string> {
  value: T
  label: string
}

interface Props<T extends string> {
  value: T
  options: ReadonlyArray<HistoricTimeFilterOption<T>>
  onChange: (value: T) => void
  disabled?: boolean
  className?: string
}

export function HistoricTimeFilterChips<T extends string>({
  value,
  options,
  onChange,
  disabled = false,
  className,
}: Props<T>) {
  return (
    <div className={clsx('flex min-w-0 flex-wrap items-center justify-center gap-2', className)}>
      {options.map((option) => {
        const active = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            disabled={disabled}
            aria-pressed={active}
            className={clsx(
              'min-w-11 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors md:text-[12px]',
              disabled && 'cursor-wait opacity-70',
              active
                ? 'border-(--primary) bg-(--primary)/20 text-(--text-primary) dark:border-(--secondary) dark:bg-(--secondary)/35 dark:text-white'
                : 'border-(--table-stroke) text-(--text-secondary) hover:text-(--text-primary) dark:border-white/20 dark:text-white/80 dark:hover:text-white',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
