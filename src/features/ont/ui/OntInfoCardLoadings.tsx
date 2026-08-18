import { CardSpinner } from '@/shared/ui/CardSpinner'
import { ontInfoL1CardClassName } from '@/features/ont/ui/OntCardChrome'

const clientCardClassName = `${ontInfoL1CardClassName} p-3.5 md:min-h-0 md:m-3 md:h-full md:min-h-[224px] md:p-3 flex flex-col gap-3 md:gap-4`

const infoCardClassName = `${ontInfoL1CardClassName} p-3.5 md:min-h-0 md:m-3 md:h-full md:min-h-[224px] md:p-3 flex flex-col gap-3`

const interrupcionesCardClassName = `${ontInfoL1CardClassName} px-3 py-2 md:m-3 md:h-full md:min-h-0 md:p-3 flex flex-col gap-1.5 md:gap-2`

const metricsCardClassName =
  'm-4 rounded-xl border border-[#d9e0e8] bg-(--card) p-4 shadow-[0_1px_6px_rgb(15_23_42/0.05)] min-h-[220px] dark:border-white/10 dark:shadow-[0_8px_18px_rgb(0_0_0/0.3)] flex flex-col gap-4'

const vecinosCardClassName = `${ontInfoL1CardClassName} p-3.5 xl:m-3 xl:p-3 flex flex-col gap-3 md:gap-2.5`

const alertasCardClassName = `${ontInfoL1CardClassName} px-3 py-2 md:m-3 md:h-full md:min-h-0 md:p-3 flex flex-col gap-1.5`

export function OntClientCardLoading() {
  return (
    <div
      className={`${clientCardClassName} min-h-[148px] items-center justify-center md:min-h-[224px]`}
      aria-busy="true"
      aria-live="polite"
    >
      <CardSpinner label="Cargando cliente" />
    </div>
  )
}

export function OntInfoCardLoading() {
  return (
    <div
      className={`${infoCardClassName} min-h-[168px] items-center justify-center md:min-h-[224px]`}
      aria-busy="true"
      aria-live="polite"
    >
      <CardSpinner label="Cargando información de ONT" />
    </div>
  )
}

export function OntInterrupcionesCardLoading() {
  return (
    <div
      className={`${interrupcionesCardClassName} min-h-[64px] items-center justify-center`}
      aria-busy="true"
      aria-live="polite"
    >
      <CardSpinner label="Cargando interrupciones" />
    </div>
  )
}

export function OntMetricsCardGridLoading() {
  return (
    <div
      className={`${metricsCardClassName} items-center justify-center`}
      aria-busy="true"
      aria-live="polite"
    >
      <CardSpinner label="Cargando métricas" />
    </div>
  )
}

export function OntVecinosCardLoading() {
  return (
    <div
      className={`${vecinosCardClassName} min-h-[280px] items-center justify-center`}
      aria-busy="true"
      aria-live="polite"
    >
      <CardSpinner label="Cargando vecinos" />
    </div>
  )
}

export function OntAlertasCardLoading() {
  return (
    <div
      className={`${alertasCardClassName} min-h-[64px] items-center justify-center`}
      aria-busy="true"
      aria-live="polite"
    >
      <CardSpinner label="Cargando alertas" />
    </div>
  )
}

export function OntVecinosSectionLoading() {
  return (
    <>
      <div className="hidden md:block">
        <div
          className="mx-4 mb-4 flex min-h-[320px] items-center justify-center rounded-lg border border-black/10 bg-(--card) xl:mx-3 xl:mb-3 dark:border-white/10"
          aria-busy="true"
          aria-live="polite"
        >
          <CardSpinner label="Cargando vecinos" />
        </div>
      </div>
      <div className="md:hidden">
        <OntVecinosCardLoading />
      </div>
    </>
  )
}

export {
  clientCardClassName,
  infoCardClassName,
  interrupcionesCardClassName,
  metricsCardClassName,
  alertasCardClassName,
}
