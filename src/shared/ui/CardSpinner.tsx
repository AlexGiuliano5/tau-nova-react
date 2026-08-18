interface Props {
  label: string
}

export function CardSpinner({ label }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <span className="relative inline-flex h-11 w-11 items-center justify-center">
        <span className="absolute inset-0 rounded-full border-2 border-(--primary-2) opacity-30 dark:border-(--secondary)" />
        <span className="absolute inset-[2px] animate-spin rounded-full border-2 border-transparent border-t-(--primary-2) border-r-(--primary-2) dark:border-t-(--secondary) dark:border-r-(--secondary)" />
      </span>
      <span className="text-xs font-medium tracking-wide text-(--text-secondary)">{label}</span>
    </div>
  )
}
