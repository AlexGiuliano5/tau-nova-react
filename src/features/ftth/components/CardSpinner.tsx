interface Props {
  label: string
  className?: string
}

export function CardSpinner({ label, className }: Props) {
  return (
    <div
      className={className}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="flex flex-col items-center gap-3 text-sm text-(--text-secondary)">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-(--primary-2) border-t-transparent dark:border-(--secondary)" />
        <span>{label}</span>
      </div>
    </div>
  )
}
