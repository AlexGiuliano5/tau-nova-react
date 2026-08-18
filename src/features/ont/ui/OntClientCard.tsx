import { useState } from 'react'
import { FiMapPin, FiPhone, FiUser } from 'react-icons/fi'

import type { OntClientInfo } from '@/features/ont/types/ont'
import { OntCardTitle } from '@/features/ont/ui/OntCardChrome'
import { clientCardClassName } from '@/features/ont/ui/OntInfoCardLoadings'
import { useAuthStore } from '@/features/auth/store/auth-store'

interface Props {
  clientInfo: OntClientInfo | null
}

export function OntClientCard({ clientInfo }: Props) {
  const legajo = useAuthStore((s) => s.user?.legajo)
  const data = {
    nombre: displayOrNoData(clientInfo?.nombre),
    numeroCliente: displayOrNoData(clientInfo?.numeroCliente),
    provincia: displayOrNoData(clientInfo?.provincia),
    localidad: displayOrNoData(clientInfo?.localidad),
    direccion: displayOrNoData(clientInfo?.direccion),
    pisoDpto: displayOrNoData(clientInfo?.pisoDpto),
    telefonoFijo: displayOrNoData(clientInfo?.telefonoFijo),
    telefonoMovil: displayOrNoData(clientInfo?.telefonoMovil),
  }

  const [confirming, setConfirming] = useState<null | 'fijo' | 'movil'>(null)
  const [revealed, setRevealed] = useState({ fijo: false, movil: false })

  const masked = {
    fijo: maskPhone(data.telefonoFijo),
    movil: maskPhone(data.telefonoMovil),
  }

  const canRevealFijo = data.telefonoFijo !== 'Sin Datos' && data.telefonoFijo.trim().length > 0
  const canRevealMovil = data.telefonoMovil !== 'Sin Datos' && data.telefonoMovil.trim().length > 0

  return (
    <div className={clientCardClassName}>
      <header className="space-y-0.5">
        <OntCardTitle icon={FiUser} className="text-lg md:text-[1.05rem]">
          {data.nombre}
        </OntCardTitle>
        <h2 className="pl-[26px] text-xs text-(--text-secondary)">
          Nro. de cliente: <span className="font-semibold">{data.numeroCliente}</span>
        </h2>
      </header>
      <main className="grid gap-2 text-sm md:grid-cols-2 md:gap-x-5 md:gap-y-1 md:text-[12px] xl:gap-y-2">
        <Field label="Provincia" value={data.provincia} order="md:order-1" />
        <Field label="Localidad" value={data.localidad} order="md:order-3" />
        <div className="flex items-center justify-between gap-3 md:order-2">
          <span className="inline-flex items-center gap-1.5 text-(--text-secondary)">
            <FiMapPin className="size-3.5 shrink-0 opacity-80" aria-hidden />
            Domicilio
          </span>
          <span className="text-right font-semibold">{data.direccion}</span>
        </div>
        <Field label="Piso / dpto" value={data.pisoDpto} order="md:order-4" />
        <div className="flex items-center justify-between gap-3 md:order-5">
          <span className="inline-flex items-center gap-1.5 text-(--text-secondary)">
            <FiPhone className="size-3.5 shrink-0 opacity-80" aria-hidden />
            Teléfono fijo
          </span>
          <span className="flex items-center gap-2 text-right font-semibold">
            <span>{revealed.fijo ? data.telefonoFijo : masked.fijo}</span>
            {canRevealFijo && !revealed.fijo ? (
              <button
                type="button"
                className="text-xs font-semibold text-(--primary-2) underline decoration-(--primary-2)/50 underline-offset-2 dark:text-(--secondary)"
                onClick={() => setConfirming('fijo')}
              >
                Ver
              </button>
            ) : null}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 md:order-6">
          <span className="text-(--text-secondary)">Teléfono móvil</span>
          <span className="flex items-center gap-2 text-right font-semibold">
            <span>{revealed.movil ? data.telefonoMovil : masked.movil}</span>
            {canRevealMovil && !revealed.movil ? (
              <button
                type="button"
                className="text-xs font-semibold text-(--primary-2) underline decoration-(--primary-2)/50 underline-offset-2 dark:text-(--secondary)"
                onClick={() => setConfirming('movil')}
              >
                Ver
              </button>
            ) : null}
          </span>
        </div>
      </main>

      {confirming ? (
        <div className="rounded-xl border border-amber-500/50 bg-amber-50 px-3 py-2 text-xs text-amber-900 shadow-sm dark:border-amber-400/50 dark:bg-[rgb(24_20_10)] dark:text-amber-300 dark:shadow-[0_4px_12px_rgb(0_0_0/0.35)]">
          <p className="font-medium">
            ¿Mostrar el teléfono {confirming === 'fijo' ? 'fijo' : 'móvil'}?
          </p>
          <p className="mt-1">
            Esta acción quedará registrada bajo su legajo: {legajo ?? 'Sin legajo'}.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="h-8 rounded-lg bg-(--primary-2) px-3 font-semibold text-white dark:bg-(--secondary-3)"
              onClick={() => {
                const phoneType = confirming
                setConfirming(null)
                setRevealed((prev) => ({ ...prev, [phoneType]: true }))
              }}
            >
              Ver teléfono
            </button>
            <button
              type="button"
              className="h-8 rounded-lg border border-(--outline) px-3 font-semibold text-(--text-secondary)"
              onClick={() => setConfirming(null)}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Field({ label, value, order }: { label: string; value: string; order: string }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${order}`}>
      <span className="text-(--text-secondary)">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  )
}

function displayOrNoData(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? ''
  return trimmed.length > 0 ? trimmed : 'Sin Datos'
}

function maskPhone(value: string): string {
  const raw = value?.trim()
  if (!raw || raw === 'Sin Datos') return value
  const digits = raw.replace(/\D/g, '')
  if (digits.length <= 4) return '••••'
  return `••••••••${digits.slice(-2)}`
}
