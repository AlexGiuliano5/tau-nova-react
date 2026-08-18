import clsx from 'clsx'
import { IoCheckmarkCircle, IoClose, IoWarning } from 'react-icons/io5'

interface PreferencesSaveFeedbackProps {
  type: 'success' | 'error'
  message: string
  onDismiss: () => void
}

export function PreferencesSaveFeedback({
  type,
  message,
  onDismiss,
}: PreferencesSaveFeedbackProps) {
  const isSuccess = type === 'success'

  return (
    <div
      role="status"
      className={clsx(
        'fixed inset-x-4 bottom-4 z-50 flex items-start gap-3 rounded-2xl border bg-(--card) p-4 shadow-[0_18px_40px_rgb(15_23_42/0.16)] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-sm dark:shadow-[0_18px_40px_rgb(0_0_0/0.45)]',
        isSuccess
          ? 'border-emerald-500/35 dark:border-emerald-400/25'
          : 'border-red-500/35 dark:border-red-400/25',
      )}
    >
      <span
        className={clsx(
          'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
          isSuccess
            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
            : 'bg-red-500/15 text-red-600 dark:text-red-300',
        )}
        aria-hidden="true"
      >
        {isSuccess ? <IoCheckmarkCircle size={22} /> : <IoWarning size={22} />}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-(--text-primary)">
          {isSuccess ? 'Preferencias guardadas' : 'No se pudo guardar'}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-(--text-secondary)">{message}</p>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-(--text-secondary) transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        aria-label="Cerrar aviso"
      >
        <IoClose size={18} />
      </button>
    </div>
  )
}
