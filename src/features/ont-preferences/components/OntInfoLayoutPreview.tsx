import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import clsx from 'clsx'
import { useCallback, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { LuGripVertical } from 'react-icons/lu'

import {
  composeOntInfoCardItems,
  normalizeOntInfoCardItemsOrder,
  partitionOntInfoCardItems,
  resolveOntInfoDesktopItemWidthClass,
  toggleOntInfoCardVisibility,
} from '@/features/ont-preferences/lib/card-order'
import {
  applyOntInfoCardMove,
  areOntInfoCardOrdersEqual,
  buildDesktopVisualRows,
  isValidOntInfoDesktopCardOrder,
  resolveDesktopInsertAtIndex,
  simulateDesktopCardInsert,
} from '@/features/ont-preferences/lib/layout-validation'
import type {
  OntInfoCardSpan,
  OntInfoOrderItem,
  OntInfoScreenViewport,
} from '@/features/ont-preferences/types/layout'

const LAYOUT_PREVIEW_DND_ID = 'ont-info-layout-preview-dnd'

function createLayoutPreviewCollisionDetection(
  pointerCoordinatesRef: MutableRefObject<{ x: number; y: number } | null>
): CollisionDetection {
  return args => {
    pointerCoordinatesRef.current = args.pointerCoordinates;

    const pointerHits = pointerWithin(args);
    if (pointerHits.length > 0) {
      return pointerHits;
    }

    return closestCenter(args);
  };
}

function resolveDragOverId(
  event: DragOverEvent | DragEndEvent,
  items: OntInfoOrderItem[]
): string | null {
  const activeId = String(event.active.id);

  if (event.over && event.over.id !== event.active.id) {
    const overId = String(event.over.id);

    if (items.some(item => item.id === overId)) {
      return overId;
    }
  }

  for (const collision of event.collisions ?? []) {
    const id = String(collision.id);

    if (id !== activeId && items.some(item => item.id === id)) {
      return id;
    }
  }

  return null;
}

interface OntInfoLayoutPreviewProps {
  viewport: OntInfoScreenViewport;
  items: OntInfoOrderItem[];
  defaultItems: OntInfoOrderItem[];
  onChange: (items: OntInfoOrderItem[]) => void;
}

export function OntInfoLayoutPreview({
  viewport,
  items,
  defaultItems,
  onChange
}: OntInfoLayoutPreviewProps) {
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [overlayWidth, setOverlayWidth] = useState<number | null>(null)
  const [resetFeedback, setResetFeedback] = useState<string | null>(null)
  const [overItemId, setOverItemId] = useState<string | null>(null)
  const [dropIsValid, setDropIsValid] = useState<boolean | null>(null)
  const itemsRef = useRef(items);
  const pointerCoordinatesRef = useRef<{ x: number; y: number } | null>(null);
  const lastDropTargetRef = useRef<{
    overId: string;
    overRect: { top: number; left: number; width: number; height: number };
  } | null>(null);
  /** Evita re-commitear el mismo over en cada frame de dragOver (mobile). */
  const lastLiveOverIdRef = useRef<string | null>(null);
  const collisionDetection = useMemo(
    () => createLayoutPreviewCollisionDetection(pointerCoordinatesRef),
    []
  );
  itemsRef.current = items;
  const isDesktop = viewport === 'desktop';
  const normalizedItems = useMemo(() => normalizeOntInfoCardItemsOrder(items), [items]);
  const { hidden: hiddenItems, visible: visibleItems } = useMemo(
    () => partitionOntInfoCardItems(normalizedItems),
    [normalizedItems]
  );

  const activeItem = activeItemId
    ? normalizedItems.find(item => item.id === activeItemId) ?? null
    : null;
  const itemIds = useMemo(() => normalizedItems.map(item => item.id), [normalizedItems]);
  const desktopRows = useMemo(
    () => (isDesktop ? buildDesktopVisualRows(visibleItems) : []),
    [isDesktop, visibleItems]
  );
  const visibleCount = visibleItems.length;

  // Sin PointerSensor: en touch compite con TouchSensor y el drop queda desalineado.
  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: isDesktop ? 120 : 180,
        tolerance: isDesktop ? 6 : 12,
      },
    }),
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  const activeCollisionDetection = useMemo(
    () => (isDesktop ? collisionDetection : closestCenter),
    [collisionDetection, isDesktop],
  )

  const commitSectionMove = useCallback(
    (
      activeId: string,
      overId: string,
      isDesktopMove: boolean,
      event?: DragEndEvent | DragOverEvent,
    ): boolean => {
      const currentItems = normalizeOntInfoCardItemsOrder(itemsRef.current)
      const { hidden, visible } = partitionOntInfoCardItems(currentItems)
      const activeInHidden = hidden.some((item) => item.id === activeId)
      const overInHidden = hidden.some((item) => item.id === overId)

      if (activeInHidden !== overInHidden) {
        return false
      }

      const sectionItems = activeInHidden ? hidden : visible
      const oldIndex = sectionItems.findIndex((item) => item.id === activeId)
      const overIndex = sectionItems.findIndex((item) => item.id === overId)

      if (oldIndex < 0 || overIndex < 0) {
        return false
      }

      let nextSectionItems: OntInfoOrderItem[]

      if (isDesktopMove && !activeInHidden) {
        const pointer = pointerCoordinatesRef.current
        const cachedTarget = lastDropTargetRef.current
        const overRect = event?.over?.rect ?? cachedTarget?.overRect

        if (pointer && overRect) {
          const insertAt = resolveDesktopInsertAtIndex(
            sectionItems,
            activeId,
            overId,
            pointer,
            overRect,
          )

          nextSectionItems = applyOntInfoCardMove(sectionItems, oldIndex, overIndex, true, {
            insertAtIndex: insertAt,
          })
        } else {
          nextSectionItems = applyOntInfoCardMove(sectionItems, oldIndex, overIndex, true)
        }

        // Rechazar filas inválidas (⅔+⅔, ⅓+⅓, overflow)
        if (!isValidOntInfoDesktopCardOrder(nextSectionItems)) {
          return false
        }
      } else {
        if (oldIndex === overIndex) {
          return false
        }
        nextSectionItems = applyOntInfoCardMove(sectionItems, oldIndex, overIndex, false)
      }

      const nextItems = activeInHidden
        ? composeOntInfoCardItems(nextSectionItems, visible)
        : composeOntInfoCardItems(hidden, nextSectionItems)

      if (!areOntInfoCardOrdersEqual(currentItems, nextItems)) {
        onChange(nextItems)
        return true
      }
      return false
    },
    [onChange],
  )

  const previewDropValidity = useCallback(
    (activeId: string, overId: string, event?: DragOverEvent | DragEndEvent): boolean | null => {
      if (!isDesktop) return true

      const currentItems = normalizeOntInfoCardItemsOrder(itemsRef.current)
      const { hidden, visible } = partitionOntInfoCardItems(currentItems)
      const activeInHidden = hidden.some((item) => item.id === activeId)
      const overInHidden = hidden.some((item) => item.id === overId)
      if (activeInHidden !== overInHidden) return null
      if (activeInHidden) return true

      const sectionItems = visible
      const oldIndex = sectionItems.findIndex((item) => item.id === activeId)
      const overIndex = sectionItems.findIndex((item) => item.id === overId)
      if (oldIndex < 0 || overIndex < 0) return null

      const pointer = pointerCoordinatesRef.current
      const cachedTarget = lastDropTargetRef.current
      const overRect = event?.over?.rect ?? cachedTarget?.overRect
      if (!pointer || !overRect) return null

      const nextSectionItems = simulateDesktopCardInsert(
        sectionItems,
        activeId,
        overId,
        pointer,
        overRect,
      )

      if (areOntInfoCardOrdersEqual(sectionItems, nextSectionItems)) {
        return true
      }
      return isValidOntInfoDesktopCardOrder(nextSectionItems)
    },
    [isDesktop],
  )

  const onDragStart = (event: DragStartEvent) => {
    setActiveItemId(String(event.active.id))
    setOverlayWidth(event.active.rect.current.initial?.width ?? null)
    setOverItemId(null)
    setDropIsValid(null)
    pointerCoordinatesRef.current = null
    lastDropTargetRef.current = null
    lastLiveOverIdRef.current = null
    setResetFeedback(null)
  }

  const onDragOver = (event: DragOverEvent) => {
    const normalizedCurrent = normalizeOntInfoCardItemsOrder(itemsRef.current)
    const nextOverId = resolveDragOverId(event, normalizedCurrent)

    setOverItemId(nextOverId)

    if (nextOverId && event.over?.rect) {
      lastDropTargetRef.current = {
        overId: nextOverId,
        overRect: event.over.rect,
      }
    }

    if (!nextOverId) {
      setDropIsValid(null)
      return
    }

    const activeId = String(event.active.id)

    if (isDesktop) {
      // Solo feedback visual: reordenar en cada dragOver re-mide y puede oscilar
      // hasta Maximum update depth / pantallazo blanco.
      setDropIsValid(previewDropValidity(activeId, nextOverId, event))
      return
    }

    setDropIsValid(true)
    // Mobile: live reorder, pero solo cuando cambia el target (evita thrashing).
    if (lastLiveOverIdRef.current === nextOverId) return
    lastLiveOverIdRef.current = nextOverId
    commitSectionMove(activeId, nextOverId, false)
  }

  const onDragEnd = (event: DragEndEvent) => {
    // Desktop: commit al soltar (no reordenamos en dragOver).
    // Mobile: el orden se actualiza en dragOver; re-commitear al drop mueve de más.
    if (isDesktop) {
      const activeId = String(event.active.id)
      const normalizedCurrent = normalizeOntInfoCardItemsOrder(itemsRef.current)
      const nextOverId =
        resolveDragOverId(event, normalizedCurrent) ?? lastDropTargetRef.current?.overId ?? null

      if (nextOverId) {
        commitSectionMove(activeId, nextOverId, true, event)
      }
    }

    setActiveItemId(null)
    setOverlayWidth(null)
    setOverItemId(null)
    setDropIsValid(null)
    pointerCoordinatesRef.current = null
    lastDropTargetRef.current = null
    lastLiveOverIdRef.current = null
  }

  const onDragCancel = () => {
    setActiveItemId(null)
    setOverlayWidth(null)
    setOverItemId(null)
    setDropIsValid(null)
    pointerCoordinatesRef.current = null
    lastDropTargetRef.current = null
    lastLiveOverIdRef.current = null
  }

  const onToggleVisibility = (itemId: string) => {
    setResetFeedback(null);
    onChange(toggleOntInfoCardVisibility(normalizedItems, itemId));
  };

  const onReset = () => {
    onChange(normalizeOntInfoCardItemsOrder(defaultItems));
    setResetFeedback('Se restableció el orden predeterminado.');
    window.setTimeout(() => setResetFeedback(null), 4000);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-black/8 bg-(--card) dark:border-white/10">
      <div className="flex flex-col gap-3 border-b border-black/8 bg-[#f8fafc] px-4 py-3 dark:border-white/10 dark:bg-white/4 sm:flex-row sm:items-center sm:justify-between md:px-5">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-(--text-primary)">Distribución de cards</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-(--primary)/10 px-3 py-1 text-xs font-semibold text-(--primary) dark:bg-(--secondary)/16 dark:text-(--secondary)">
            {visibleCount} / {normalizedItems.length} visibles
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

      <div className="p-4 md:p-5">
        {normalizedItems.length === 0 ? (
          <p className="rounded-xl border border-dashed border-black/12 px-4 py-8 text-center text-sm text-(--text-secondary) dark:border-white/15">
            No hay cards para este modo.
          </p>
        ) : (
          <DndContext
            id={LAYOUT_PREVIEW_DND_ID}
            sensors={sensors}
            collisionDetection={activeCollisionDetection}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            onDragCancel={onDragCancel}
          >
            <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
              {isDesktop ? (
                <div className="flex flex-col gap-4">
                  {hiddenItems.length > 0 ? (
                    <section className="flex flex-col gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-(--text-secondary)">
                        Ocultas
                      </p>
                      <div className="flex flex-col gap-2">
                        {hiddenItems.map(item => (
                          <SortablePreviewBlock
                            key={item.id}
                            item={item}
                            isDesktop
                            isDropTarget={overItemId === item.id}
                            dropIsValid={overItemId === item.id ? dropIsValid : null}
                            onToggleVisibility={() => onToggleVisibility(item.id)}
                          />
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {visibleItems.length > 0 ? (
                    <section className="flex flex-col gap-2">
                      {hiddenItems.length > 0 ? (
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-(--text-secondary)">
                          Visibles
                        </p>
                      ) : null}
                      {desktopRows.map(rowIndices => (
                        <div key={rowIndices.join('-')} className="flex w-full gap-2">
                          {rowIndices.map(itemIndex => {
                            const item = visibleItems[itemIndex];

                            if (!item) {
                              return null;
                            }

                            return (
                              <SortablePreviewBlock
                                key={item.id}
                                item={item}
                                isDesktop
                                isDropTarget={overItemId === item.id}
                                dropIsValid={overItemId === item.id ? dropIsValid : null}
                                onToggleVisibility={() => onToggleVisibility(item.id)}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </section>
                  ) : null}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {hiddenItems.length > 0 ? (
                    <section className="flex flex-col gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-(--text-secondary)">
                        Ocultas
                      </p>
                      {hiddenItems.map(item => (
                        <SortablePreviewBlock
                          key={item.id}
                          item={item}
                          isDesktop={false}
                          isDropTarget={overItemId === item.id}
                          dropIsValid={null}
                          onToggleVisibility={() => onToggleVisibility(item.id)}
                        />
                      ))}
                    </section>
                  ) : null}

                  {visibleItems.length > 0 ? (
                    <section className="flex flex-col gap-2">
                      {hiddenItems.length > 0 ? (
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-(--text-secondary)">
                          Visibles
                        </p>
                      ) : null}
                      {visibleItems.map(item => (
                        <SortablePreviewBlock
                          key={item.id}
                          item={item}
                          isDesktop={false}
                          isDropTarget={overItemId === item.id}
                          dropIsValid={null}
                          onToggleVisibility={() => onToggleVisibility(item.id)}
                        />
                      ))}
                    </section>
                  ) : null}
                </div>
              )}
            </SortableContext>

            <DragOverlay dropAnimation={null}>
              {activeItem ? (
                <PreviewBlock
                  item={activeItem}
                  isDesktop={isDesktop}
                  dragging
                  overlayWidth={overlayWidth}
                  dropIsValid={dropIsValid}
                  onToggleVisibility={() => {}}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  )
}

interface PreviewBlockProps {
  item: OntInfoOrderItem
  isDesktop: boolean
  dragging?: boolean
  isDraggingSource?: boolean
  isDropTarget?: boolean
  dropIsValid?: boolean | null
  overlayWidth?: number | null
  listeners?: ReturnType<typeof useSortable>['listeners']
  attributes?: ReturnType<typeof useSortable>['attributes']
  setNodeRef?: (element: HTMLElement | null) => void
  transform?: string
  transition?: string
  onToggleVisibility: () => void
}

function SortablePreviewBlock({
  item,
  isDesktop,
  isDropTarget = false,
  dropIsValid = null,
  onToggleVisibility,
}: {
  item: OntInfoOrderItem
  isDesktop: boolean
  isDropTarget?: boolean
  dropIsValid?: boolean | null
  onToggleVisibility: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    animateLayoutChanges: () => false,
  })

  // Con DragOverlay el item fuente no debe deformarse: evita saltos al soltar en touch.
  const styleTransform = isDragging ? undefined : CSS.Transform.toString(transform)

  return (
    <PreviewBlock
      item={item}
      isDesktop={isDesktop}
      dragging={false}
      isDraggingSource={isDragging}
      isDropTarget={isDropTarget}
      dropIsValid={dropIsValid}
      attributes={attributes}
      listeners={listeners}
      setNodeRef={setNodeRef}
      transform={styleTransform}
      transition={isDragging ? undefined : transition}
      onToggleVisibility={onToggleVisibility}
    />
  )
}

function resolveDesktopItemWidthClass(item: OntInfoOrderItem): string {
  return resolveOntInfoDesktopItemWidthClass(item)
}

function PreviewBlock({
  item,
  isDesktop,
  dragging = false,
  isDraggingSource = false,
  isDropTarget = false,
  dropIsValid = null,
  overlayWidth,
  listeners,
  attributes,
  setNodeRef,
  transform,
  transition,
  onToggleVisibility,
}: PreviewBlockProps) {
  const invalidDrop = isDropTarget && dropIsValid === false
  const validDrop = isDropTarget && dropIsValid !== false

  return (
    <div
      ref={setNodeRef}
      style={{
        transform,
        transition,
        width: dragging && overlayWidth ? overlayWidth : undefined,
        touchAction: 'none',
      }}
      className={clsx(
        'box-border flex min-h-12 items-center gap-2 rounded-lg border px-2.5 py-2 sm:px-3 select-none',
        isDesktop ? resolveDesktopItemWidthClass(item) : 'w-full',
        !item.visible && !isDraggingSource && 'border-dashed opacity-55',
        isDraggingSource &&
          'pointer-events-none border-dashed border-(--primary-2)/35 bg-(--primary-2)/5 opacity-30',
        invalidDrop && 'border-red-500/55 ring-2 ring-red-500/25 dark:border-red-400/55 dark:ring-red-400/25',
        validDrop &&
          !invalidDrop &&
          'border-(--primary-2)/55 ring-2 ring-(--primary-2)/20 dark:border-(--secondary)/55 dark:ring-(--secondary)/20',
        dragging
          ? invalidDrop
            ? 'cursor-grabbing border-red-500/50 bg-red-500/10 shadow-[0_12px_28px_rgb(0_0_0/0.16)]'
            : 'cursor-grabbing border-(--primary-2)/50 bg-(--primary-2)/14 shadow-[0_12px_28px_rgb(0_0_0/0.16)] dark:border-(--secondary)/50 dark:bg-(--secondary)/20 dark:shadow-[0_14px_32px_rgb(0_0_0/0.45)]'
          : !isDraggingSource &&
              !isDropTarget &&
              (item.visible
                ? 'border-(--primary-2)/25 bg-(--primary-2)/8 dark:border-(--secondary)/30 dark:bg-(--secondary)/12'
                : 'border-black/12 bg-black/3 dark:border-white/12 dark:bg-white/4'),
      )}
    >
      <button
        type="button"
        className={clsx(
          'inline-flex shrink-0 touch-none items-center rounded-md border-0 bg-transparent p-0.5 text-(--text-secondary) hover:bg-black/5 dark:hover:bg-white/10',
          dragging || isDraggingSource ? 'cursor-grabbing' : 'cursor-grab',
        )}
        aria-label={`Reordenar ${item.label}`}
        {...attributes}
        {...listeners}
      >
        <LuGripVertical size={18} />
      </button>

      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-(--text-primary) sm:text-sm">
        {item.label}
      </span>

      {!item.visible && !isDraggingSource ? (
        <span className="shrink-0 rounded-full bg-black/6 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-(--text-secondary) dark:bg-white/10">
          Oculta
        </span>
      ) : null}

      {isDesktop && item.span ? (
        <span className="hidden shrink-0 rounded-full bg-(--card) px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-(--text-secondary) dark:bg-white/8 sm:inline">
          {formatPreviewSpanBadge(item.span)}
        </span>
      ) : null}

      <button
        type="button"
        role="switch"
        aria-checked={item.visible}
        aria-label={item.visible ? `Ocultar ${item.label}` : `Mostrar ${item.label}`}
        onPointerDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
        onClick={onToggleVisibility}
        className={clsx(
          'inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border p-0.5 transition-colors',
          item.visible
            ? 'border-(--primary-2) bg-(--primary-2)/85 dark:border-(--secondary) dark:bg-(--secondary)'
            : 'border-(--outline) bg-(--gray-01) dark:border-white/20 dark:bg-white/10',
        )}
      >
        <span
          className={clsx(
            'h-5 w-5 rounded-full bg-white shadow transition-transform',
            item.visible ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
    </div>
  )
}

function formatPreviewSpanBadge(span: OntInfoCardSpan | string): string {
  switch (span) {
    case 'full':
      return 'Completo'
    case 'third':
      return '⅓'
    case 'two-thirds':
      return '⅔'
    case 'half':
    default:
      return '½'
  }
}
