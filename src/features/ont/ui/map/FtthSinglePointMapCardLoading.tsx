const mapCardClassName =
  'shadow-sm rounded-lg p-4 bg-(--card) dark:border dark:border-white/15 dark:shadow-[0_10px_20px_rgb(0_0_0/0.45)] flex flex-col gap-3'

/**
 * Spinner de mapa sin importar MapLibre.
 * Mantener separado de `FtthSinglePointMapCard.tsx` para loading livianos.
 */
export function FtthSinglePointMapCardLoading({
  className = '',
  title = 'Mapa',
}: {
  className?: string
  title?: string
}) {
  return (
    <section className={`${mapCardClassName} ${className}`.trim()} aria-busy="true" aria-live="polite">
      <h2 className="sr-only">{title}</h2>
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-2">
        <span
          className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-(--outline) border-t-(--primary) dark:border-t-(--secondary)"
          aria-hidden
        />
        <span className="text-sm text-(--text-secondary)">Cargando mapa de vecinos</span>
      </div>
    </section>
  )
}
