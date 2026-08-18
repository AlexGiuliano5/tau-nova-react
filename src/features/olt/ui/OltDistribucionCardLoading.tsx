import { CardSpinner } from '@/features/ftth/components/CardSpinner'

const cardClassName =
  'm-4 rounded-xl border border-[#d9e0e8] bg-(--card) p-3.5 shadow-[0_1px_6px_rgb(15_23_42/0.05)] xl:m-0 xl:h-full xl:p-3 dark:border-white/10 dark:shadow-[0_8px_18px_rgb(0_0_0/0.3)] flex flex-col gap-3 md:gap-2.5'

export function OltDistribucionCardLoading() {
  return (
    <div
      className={`${cardClassName} min-h-[280px] items-center justify-center`}
      aria-busy="true"
      aria-live="polite"
    >
      <CardSpinner label="Cargando distribución OLT" />
    </div>
  )
}
