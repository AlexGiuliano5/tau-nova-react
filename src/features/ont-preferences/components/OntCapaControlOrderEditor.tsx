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
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import clsx from 'clsx'
import { Fragment, useMemo, useState } from 'react'
import { LuGripVertical } from 'react-icons/lu'

import type {
  OntInfoOrderItem,
  OntInfoScreenViewport,
} from '@/features/ont-preferences/types/layout'

const CAPA_CONTROL_ORDER_DND_ID = 'ont-capa-control-order-dnd'

interface OntCapaControlOrderEditorProps {
  viewport: OntInfoScreenViewport;
  items: OntInfoOrderItem[];
  defaultItems: OntInfoOrderItem[];
  onChange: (items: OntInfoOrderItem[]) => void;
}

interface CapaItemProps {
  item: OntInfoOrderItem;
  layout: 'list' | 'row';
  dragging?: boolean;
  listeners?: ReturnType<typeof useSortable>['listeners'];
  attributes?: ReturnType<typeof useSortable>['attributes'];
  setNodeRef?: (element: HTMLElement | null) => void;
  transform?: string;
  transition?: string;
  onToggle: () => void;
}

function CapaItem({
  item,
  layout,
  dragging = false,
  isDraggingSource = false,
  listeners,
  attributes,
  setNodeRef,
  transform,
  transition,
  onToggle,
}: CapaItemProps & { isDraggingSource?: boolean }) {
  const isList = layout === 'list'

  return (
    <div
      ref={setNodeRef}
      style={{ transform, transition, touchAction: 'none' }}
      className={clsx(
        'select-none rounded-xl border border-black/8 bg-white shadow-[0_2px_8px_rgb(0_0_0/0.04)] dark:border-white/10 dark:bg-[#1f2430]',
        isList
          ? 'flex w-full items-center gap-3 px-3 py-3'
          : 'flex min-h-[4.5rem] w-[calc(25%-0.75rem)] min-w-[6.5rem] max-w-[11rem] flex-col items-center justify-between gap-2 px-2.5 py-2.5',
        !item.visible && !isDraggingSource && 'opacity-55',
        isDraggingSource && 'opacity-30',
        dragging
          ? 'z-10 scale-[1.03] cursor-grabbing border-(--primary-2)/40 bg-(--primary-2)/8 shadow-[0_16px_34px_rgb(0_0_0/0.18)] dark:border-(--secondary-3)/45 dark:bg-(--secondary-3)/18'
          : 'hover:border-(--primary-2)/20',
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
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-(--text-primary)">
            {item.label}
          </span>
          <VisibilityToggle item={item} onToggle={onToggle} size="md" />
        </>
      ) : (
        <>
          <div className="flex w-full items-center justify-between gap-1">
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
              <LuGripVertical size={16} />
            </button>
            <VisibilityToggle item={item} onToggle={onToggle} size="sm" />
          </div>
          <span className="line-clamp-2 text-center text-xs font-semibold leading-tight text-(--text-primary)">
            {item.label}
          </span>
        </>
      )}
    </div>
  )
}

function VisibilityToggle({
  item,
  onToggle,
  size
}: {
  item: OntInfoOrderItem;
  onToggle: () => void;
  size: 'sm' | 'md';
}) {
  const isSmall = size === 'sm';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={item.visible}
      aria-label={item.visible ? `Ocultar ${item.label}` : `Mostrar ${item.label}`}
      onPointerDown={event => event.stopPropagation()}
      onTouchStart={event => event.stopPropagation()}
      onClick={onToggle}
      className={clsx(
        'inline-flex shrink-0 cursor-pointer items-center rounded-full border p-0.5 transition-colors',
        isSmall ? 'h-6 w-10' : 'h-7 w-12',
        item.visible
          ? 'border-(--primary-2) bg-(--primary-2)/85 dark:border-(--secondary) dark:bg-(--secondary)'
          : 'border-(--outline) bg-(--gray-01) dark:border-white/20 dark:bg-white/10'
      )}
    >
      <span
        className={clsx(
          'rounded-full bg-white shadow transition-transform',
          isSmall ? 'h-4 w-4' : 'h-5 w-5',
          item.visible ? (isSmall ? 'translate-x-4' : 'translate-x-5') : 'translate-x-0'
        )}
      />
    </button>
  );
}

function SortableCapaItem({
  item,
  layout,
  onToggle
}: {
  item: OntInfoOrderItem;
  layout: 'list' | 'row';
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    animateLayoutChanges: () => false,
  })

  return (
    <CapaItem
      item={item}
      layout={layout}
      isDraggingSource={isDragging}
      attributes={attributes}
      listeners={listeners}
      setNodeRef={setNodeRef}
      transform={isDragging ? undefined : CSS.Transform.toString(transform)}
      transition={isDragging ? undefined : transition}
      onToggle={onToggle}
    />
  )
}

export function OntCapaControlOrderEditor({
  viewport,
  items,
  defaultItems,
  onChange
}: OntCapaControlOrderEditorProps) {
  const isDesktopViewport = viewport === 'desktop';
  const layout = isDesktopViewport ? 'row' : 'list';
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);

  const activeItem = activeItemId ? items.find(item => item.id === activeItemId) ?? null : null;
  const itemIds = useMemo(() => items.map(item => item.id), [items]);
  const visibleCount = items.filter(item => item.visible).length;

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
    setActiveItemId(String(event.active.id));
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItemId(null);

    if (!over || active.id === over.id) {
      return;
    }

    setResetFeedback(null);
    const oldIndex = items.findIndex(item => item.id === String(active.id));
    const newIndex = items.findIndex(item => item.id === String(over.id));

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    onChange(arrayMove(items, oldIndex, newIndex));
  };

  const onDragCancel = () => {
    setActiveItemId(null);
  };

  const onToggleVisibility = (itemId: string) => {
    setResetFeedback(null);
    onChange(
      items.map(item =>
        item.id === itemId
          ? {
              ...item,
              visible: !item.visible
            }
          : item
      )
    );
  };

  const onReset = () => {
    onChange(defaultItems);
    setResetFeedback('Se restableció el orden predeterminado.');
    window.setTimeout(() => setResetFeedback(null), 4000);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-black/8 bg-(--card) dark:border-white/10">
      <div className="flex flex-col gap-3 border-b border-black/8 bg-[#f8fafc] px-4 py-3 dark:border-white/10 dark:bg-white/4 sm:flex-row sm:items-center sm:justify-between md:px-5">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-(--text-primary)">Capa de control</p>
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
        id={CAPA_CONTROL_ORDER_DND_ID}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <SortableContext
          items={itemIds}
          strategy={
            isDesktopViewport ? horizontalListSortingStrategy : verticalListSortingStrategy
          }
        >
          <div className="p-3 md:p-4">
            {isDesktopViewport ? (
              <>
                <div className="rounded-2xl border border-dashed border-black/10 bg-[#f8fafc]/80 p-3 dark:border-white/12 dark:bg-white/3">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {items.map((item, index) => (
                      <Fragment key={item.id}>
                        <SortableCapaItem
                          item={item}
                          layout={layout}
                          onToggle={() => onToggleVisibility(item.id)}
                        />
                        {index === 1 ? (
                          <span
                            className="shrink-0 px-0.5 text-lg font-light text-(--text-secondary)"
                            aria-hidden
                          >
                            |
                          </span>
                        ) : null}
                      </Fragment>
                    ))}
                  </div>
                </div>

                <p className="mt-3 text-center text-[11px] leading-relaxed text-(--text-secondary)">
                  Vista previa:{' '}
                  <span className="font-medium text-(--text-primary)">
                    {items
                      .slice(0, 2)
                      .map(entry => entry.label)
                      .join(' · ')}
                  </span>
                  {' | '}
                  <span className="font-medium text-(--text-primary)">
                    {items
                      .slice(2)
                      .map(entry => entry.label)
                      .join(' · ')}
                  </span>
                </p>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                {items.map((item, index) => (
                  <Fragment key={item.id}>
                    <SortableCapaItem
                      item={item}
                      layout={layout}
                      onToggle={() => onToggleVisibility(item.id)}
                    />
                    {index === 1 ? (
                      <div className="flex items-center py-0.5" aria-hidden>
                        <span className="h-px flex-1 bg-black/10 dark:bg-white/12" />
                        <span className="px-2 text-sm font-light text-(--text-secondary)">|</span>
                        <span className="h-px flex-1 bg-black/10 dark:bg-white/12" />
                      </div>
                    ) : null}
                  </Fragment>
                ))}
              </div>
            )}
          </div>
        </SortableContext>

        <DragOverlay dropAnimation={null}>
          {activeItem ? (
            <CapaItem item={activeItem} layout={layout} dragging onToggle={() => {}} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
