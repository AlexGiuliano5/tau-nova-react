import { FiMap } from 'react-icons/fi'

import { ontInfoL1CardClassName } from '@/features/ont/ui/OntCardChrome'

/** Placeholder de mapa vecinos (sin MapLibre aún). Mantiene el slot en el orden mobile. */
export function NeighborsMapCardPlaceholder() {
  return (
    <div
      id="ont-neighbors-map"
      className={`${ontInfoL1CardClassName} m-4 flex min-h-[220px] flex-col gap-3 p-3.5 xl:m-3 xl:p-3`}
    >
      <header className="inline-flex items-center gap-2 text-base font-semibold leading-tight tracking-tight md:text-[1.05rem]">
        <FiMap className="size-[18px] shrink-0 text-(--text-primary)/75" aria-hidden />
        Mapa
      </header>
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-(--outline) bg-(--background)/60 px-4 py-10 text-center text-sm text-(--text-secondary) dark:border-white/15">
        El mapa de vecinos se mostrará acá.
      </div>
    </div>
  )
}
