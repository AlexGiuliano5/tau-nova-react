import {
  closestCenter,
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import clsx from 'clsx'
import { useMemo, useState, type ReactNode } from 'react'
import { LuGripVertical } from 'react-icons/lu'

import type {
  OntInfoOrderItem,
  OntInfoScreenViewport,
} from '@/features/ont-preferences/types/layout'

const METRICS_ORDER_DND_ID = 'ont-info-metrics-order-dnd'

interface OntInfoOrderEditorProps {
  title: string
  description?: string
  viewport: OntInfoScreenViewport
  items: OntInfoOrderItem[]
  defaultItems: OntInfoOrderItem[]
  onChange: (items: OntInfoOrderItem[]) => void
  renderTrailingBadge?: (item: OntInfoOrderItem) => ReactNode
}

interface OrderItemProps {
  item: OntInfoOrderItem
  index: number
  layout: 'list' | 'grid'
  dragging?: boolean
  isDraggingSource?: boolean
  listeners?: ReturnType<typeof useSortable>['listeners']
  attributes?: ReturnType<typeof useSortable>['attributes']
  setNodeRef?: (element: HTMLElement | null) => void
  transform?: string
  transition?: string
  onToggle: () => void
  trailingBadge?: ReactNode
}

function OrderItem({
  item,
  index,
  layout,
  dragging = false,
  isDraggingSource = false,
  listeners,
  attributes,
  setNodeRef,
  transform,
  transition,
  onToggle,
  trailingBadge,
}: OrderItemProps) {
  const isList = layout === 'list'

  return (
    <li
      ref={setNodeRef}
      style={{ transform, transition, touchAction: 'none' }}
      className={clsx(
        'relative select-none rounded-xl border border-black/5 bg-white shadow-[0_2px_8px_rgb(0_0_0/0.04)] transition-[box-shadow,transform,background-color,border-color,opacity] duration-200 ease-out dark:border-white/8 dark:bg-[#1f2430]',
        isList
          ? 'flex items-center gap-3 px-3 py-3'
          : 'flex min-h-[5.5rem] flex-col justify-between gap-2 px-3 py-3',
        !item.visible && !isDraggingSource && 'opacity-60',
        isDraggingSource && 'opacity-30',
        dragging
          ? 'z-10 scale-[1.015] cursor-grabbing border-(--primary-2)/40 bg-(--primary-2)/8 shadow-[0_16px_34px_rgb(0_0_0/0.18)] dark:border-(--secondary-3)/45 dark:bg-(--secondary-3)/18 dark:shadow-[0_16px_38px_rgb(0_0_0/0.45)]'
          : 'hover:border-(--primary-2)/20 hover:shadow-[0_6px_18px_rgb(0_0_0/0.08)] dark:hover:border-(--secondary-3)/35 dark:hover:shadow-[0_8px_20px_rgb(0_0_0/0.35)]',
      )}
    >
      {isList ? (
        <>
          <button
            type="button"
            className={clsx(
              'inline-flex touch-none items-center rounded-md border-0 bg-transparent p-0.5 text-(--text-secondary)',
              dragging || isDraggingSource ? 'cursor-grabbing' : 'cursor-grab',
            )}
            aria-label={`Reordenar ${item.label}`}
            {...attributes}
            {...listeners}
          >
            <LuGripVertical size={18} />
          </button>
          <span className="min-w-4 text-sm font-semibold text-(--primary-2) dark:text-(--secondary)">
            {index + 1}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-(--text-primary)">
            {item.label}
          </span>
          {trailingBadge ? <span className="shrink-0">{trailingBadge}</span> : null}
          <VisibilityToggle item={item} onToggle={onToggle} />
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              className={clsx(
                'inline-flex touch-none items-center rounded-md border-0 bg-transparent p-0.5 text-(--text-secondary)',
                dragging || isDraggingSource ? 'cursor-grabbing' : 'cursor-grab',
              )}
              aria-label={`Reordenar ${item.label}`}
              {...attributes}
              {...listeners}
            >
              <LuGripVertical size={18} />
            </button>
            <span className="min-w-4 text-sm font-semibold text-(--primary-2) dark:text-(--secondary)">
              {index + 1}
            </span>
            <VisibilityToggle item={item} onToggle={onToggle} className="ml-auto" />
          </div>
          <div className="flex min-w-0 items-end gap-2">
            <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-(--text-primary)">
              {item.label}
            </span>
            {trailingBadge ? <span className="shrink-0">{trailingBadge}</span> : null}
          </div>
        </>
      )}
    </li>
  )
}

function VisibilityToggle({
  item,
  onToggle,
  className,
}: {
  item: OntInfoOrderItem
  onToggle: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={item.visible}
      aria-label={item.visible ? `Ocultar ${item.label}` : `Mostrar ${item.label}`}
      onPointerDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
      onClick={onToggle}
      className={clsx(
        'inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border p-0.5 transition-colors',
        item.visible
          ? 'border-(--primary-2) bg-(--primary-2)/85 dark:border-(--secondary) dark:bg-(--secondary)'
          : 'border-(--outline) bg-(--gray-01) dark:border-white/20 dark:bg-white/10',
        className,
      )}
    >
      <span
        className={clsx(
          'h-5 w-5 rounded-full bg-white shadow transition-transform',
          item.visible ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  )
}

function SortableOrderItem({
  item,
  index,
  layout,
  onToggle,
  trailingBadge,
}: {
  item: OntInfoOrderItem
  index: number
  layout: 'list' | 'grid'
  onToggle: () => void
  trailingBadge?: ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    animateLayoutChanges: () => false,
  })

  return (
    <OrderItem
      item={item}
      index={index}
      layout={layout}
      isDraggingSource={isDragging}
      attributes={attributes}
      listeners={listeners}
      setNodeRef={setNodeRef}
      transform={isDragging ? undefined : CSS.Transform.toString(transform)}
      transition={isDragging ? undefined : transition}
      onToggle={onToggle}
      trailingBadge={trailingBadge}
    />
  )
}

export function OntInfoOrderEditor({
  title,
  description,
  viewport,
  items,
  defaultItems,
  onChange,
  renderTrailingBadge,
}: OntInfoOrderEditorProps) {
  const isDesktopViewport = viewport === 'desktop'
  const layout = isDesktopViewport ? 'grid' : 'list'
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [resetFeedback, setResetFeedback] = useState<string | null>(null)

  const activeItem = activeItemId ? (items.find((item) => item.id === activeItemId) ?? null) : null
  const activeItemIndex = activeItem ? items.findIndex((item) => item.id === activeItem.id) : -1
  const itemIds = useMemo(() => items.map((item) => item.id), [items])

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: isDesktopViewport ? 90 : 180,
        tolerance: isDesktopViewport ? 5 : 12,
      },
    }),
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  const onDragStart = (event: DragStartEvent) => {
    setActiveItemId(String(event.active.id))
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveItemId(null)

    if (!over || active.id === over.id) {
      return
    }

    setResetFeedback(null)
    const oldIndex = items.findIndex((item) => item.id === String(active.id))
    const newIndex = items.findIndex((item) => item.id === String(over.id))

    if (oldIndex < 0 || newIndex < 0) {
      return
    }

    onChange(arrayMove(items, oldIndex, newIndex))
  }

  const onDragCancel = () => {
    setActiveItemId(null)
  }

  const onToggleVisibility = (itemId: string) => {
    setResetFeedback(null)
    onChange(
      items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              visible: !item.visible,
            }
          : item,
      ),
    )
  }

  const onReset = () => {
    onChange(defaultItems)
    setResetFeedback('Se restableció el orden predeterminado.')
    window.setTimeout(() => setResetFeedback(null), 4000)
  }

  const visibleCount = items.filter((item) => item.visible).length

  return (
    <div className="overflow-hidden rounded-2xl border border-black/8 bg-(--card) dark:border-white/10">
      <div className="flex flex-col gap-3 border-b border-black/8 bg-[#f8fafc] px-4 py-3 dark:border-white/10 dark:bg-white/4 sm:flex-row sm:items-center sm:justify-between md:px-5">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-(--text-primary)">{title}</p>
          {description ? (
            <p className="mt-0.5 text-xs leading-relaxed text-(--text-secondary)">{description}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-(--primary)/10 px-3 py-1 text-xs font-semibold text-(--primary) dark:bg-(--secondary)/16 dark:text-(--secondary)">
            {visibleCount} / {items.length} visibles
          </span>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-8 cursor-pointer items-center justify-center rounded-lg border border-(--outline) bg-(--card) px-3 text-xs font-semibold text-(--text-primary) transition-colors hover:bg-black/4 dark:border-white/15 dark:hover:bg-white/8"
          >
            Restablecer
          </button>
        </div>
      </div>

      {resetFeedback ? (
        <p
          role="status"
          className="border-b border-emerald-500/20 bg-emerald-500/8 px-4 py-2 text-xs text-emerald-800 dark:text-emerald-200 md:px-5"
        >
          {resetFeedback}
        </p>
      ) : null}

      <DndContext
        id={METRICS_ORDER_DND_ID}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <SortableContext
          items={itemIds}
          strategy={isDesktopViewport ? rectSortingStrategy : verticalListSortingStrategy}
        >
          <ul
            className={clsx(
              'gap-2 p-3 md:p-4',
              isDesktopViewport ? 'grid grid-cols-4' : 'flex flex-col',
            )}
          >
            {items.map((item, index) => (
              <SortableOrderItem
                key={item.id}
                item={item}
                index={index}
                layout={layout}
                onToggle={() => onToggleVisibility(item.id)}
                trailingBadge={renderTrailingBadge?.(item)}
              />
            ))}
          </ul>
        </SortableContext>

        <DragOverlay dropAnimation={null}>
          {activeItem && activeItemIndex >= 0 ? (
            <OrderItem
              item={activeItem}
              index={activeItemIndex}
              layout={layout}
              dragging
              onToggle={() => {}}
              trailingBadge={renderTrailingBadge?.(activeItem)}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
