import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import {
  ONT_STATUS_FILTER_OPTIONS,
  type OntStatusFilterBucket,
} from '@/features/ont/lib/ont-status-labels'

interface Props {
  selected: OntStatusFilterBucket[]
  counts: Record<OntStatusFilterBucket, number>
  onChange: (next: OntStatusFilterBucket[]) => void
}

export function EstadoColumnFilter({ selected, counts, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0, width: 0 })

  useEffect(() => {
    if (!open) return
    const button = buttonRef.current
    if (button) {
      const rect = button.getBoundingClientRect()
      setPanelPos({ top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 196) })
    }
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const selectedSet = new Set(selected)
  const summary =
    selected.length === 0
      ? 'Todos'
      : selected.length === 1
        ? (ONT_STATUS_FILTER_OPTIONS.find((option) => option.bucket === selected[0])?.label ??
          '1 estado')
        : `${selected.length} estados`

  const toggle = (bucket: OntStatusFilterBucket) => {
    if (selectedSet.has(bucket)) {
      onChange(selected.filter((item) => item !== bucket))
      return
    }
    onChange([...selected, bucket])
  }

  return (
    <div className="ftth-estado-filter-slot min-w-0 w-full">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Filtrar por estado"
        onClick={() => setOpen((value) => !value)}
        className={clsx(
          'flex h-7 w-full min-w-0 items-center justify-between gap-1 rounded-md border bg-(--card) px-2 text-left text-[11px] font-medium',
          selected.length > 0
            ? 'border-(--primary-2)/40 text-(--primary-2) dark:border-(--secondary)/45 dark:text-(--secondary)'
            : 'border-(--table-stroke) text-(--text-primary)',
        )}
      >
        <span className="min-w-0 truncate">{summary}</span>
        <span className="shrink-0 text-[9px] text-(--text-secondary)" aria-hidden>
          ▾
        </span>
      </button>
      {open
        ? createPortal(
            <div
              ref={panelRef}
              role="listbox"
              aria-multiselectable="true"
              className="ftth-estado-filter-overlay rounded-lg border border-(--table-stroke) bg-(--card) p-1.5 shadow-[0_14px_28px_rgba(15,23,42,0.16)] dark:border-white/12"
              style={{
                position: 'fixed',
                top: panelPos.top,
                left: panelPos.left,
                width: panelPos.width,
                zIndex: 80,
              }}
            >
              {ONT_STATUS_FILTER_OPTIONS.map((option) => {
                const checked = selectedSet.has(option.bucket)
                const count = counts[option.bucket] ?? 0
                return (
                  <label
                    key={option.bucket}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[12px] hover:bg-black/5 dark:hover:bg-white/8"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(option.bucket)}
                      className="size-3.5 accent-(--primary-2) dark:accent-(--secondary)"
                    />
                    <span className="min-w-0 flex-1 truncate text-(--text-primary)">
                      {option.label}
                    </span>
                    <span className="tabular-nums text-[11px] font-semibold text-(--text-secondary)">
                      {count}
                    </span>
                  </label>
                )
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
