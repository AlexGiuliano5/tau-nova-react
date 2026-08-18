'use client';

import {
  closestCenter,
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { IoCloseSharp } from 'react-icons/io5';
import { LuGripVertical } from 'react-icons/lu';
import { MdLock, MdLockOpen } from 'react-icons/md';

export interface MobileColumnOrderItem {
  id: string;
  label: string;
  visible: boolean;
  locked?: boolean;
}

interface Props {
  open: boolean;
  title?: string;
  items: MobileColumnOrderItem[];
  defaultItems: MobileColumnOrderItem[];
  onClose: () => void;
  onApply: (items: MobileColumnOrderItem[]) => void;
}

interface ColumnRowProps {
  item: MobileColumnOrderItem;
  index: number;
  dragging?: boolean;
  listeners?: ReturnType<typeof useSortable>['listeners'];
  attributes?: ReturnType<typeof useSortable>['attributes'];
  setNodeRef?: (element: HTMLElement | null) => void;
  transform?: string;
  transition?: string;
  onToggle: () => void;
  onToggleLock: () => void;
  lockDisabled?: boolean;
}

function ColumnOrderRow({
  item,
  index,
  dragging = false,
  listeners,
  attributes,
  setNodeRef,
  transform,
  transition,
  onToggle,
  onToggleLock,
  lockDisabled = false
}: ColumnRowProps) {
  return (
    <li
      ref={setNodeRef}
      style={{
        transform,
        transition
      }}
      className={clsx(
        'relative flex items-center gap-3 rounded-xl border border-black/5 bg-white px-3 py-3 shadow-[0_2px_8px_rgb(0_0_0/0.04)] transition-[box-shadow,transform,background-color,border-color,opacity] duration-200 ease-out dark:border-white/8 dark:bg-[#1f2430]',
        dragging
          ? 'z-10 scale-[1.015] cursor-grabbing border-(--primary-2)/40 bg-(--primary-2)/8 shadow-[0_16px_34px_rgb(0_0_0/0.18)] dark:border-(--secondary-3)/45 dark:bg-(--secondary-3)/18 dark:shadow-[0_16px_38px_rgb(0_0_0/0.45)]'
          : 'cursor-grab hover:border-(--primary-2)/20 hover:shadow-[0_6px_18px_rgb(0_0_0/0.08)] dark:hover:border-(--secondary-3)/35 dark:hover:shadow-[0_8px_20px_rgb(0_0_0/0.35)]'
      )}
      {...attributes}
      {...listeners}
    >
      <span
        className={clsx(
          'inline-flex items-center text-(--text-secondary)',
          dragging ? 'cursor-grabbing' : 'cursor-grab'
        )}
        aria-hidden
      >
        <LuGripVertical size={18} />
      </span>
      <span className="min-w-4 text-sm font-semibold text-(--primary-2) dark:text-(--secondary)">
        {index + 1}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-(--text-primary)">
        {item.label}
      </span>
      <button
        type="button"
        aria-label={item.locked ? `Desfijar ${item.label}` : `Fijar ${item.label}`}
        aria-pressed={Boolean(item.locked)}
        disabled={lockDisabled}
        onPointerDown={event => event.stopPropagation()}
        onTouchStart={event => event.stopPropagation()}
        onClick={onToggleLock}
        className={clsx(
          'inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-45',
          item.locked
            ? 'border-amber-500/70 bg-amber-500/15 text-amber-600 dark:border-amber-300/70 dark:bg-amber-300/20 dark:text-amber-200'
            : 'border-(--outline) bg-(--gray-01) text-(--text-secondary) hover:bg-black/5 dark:border-white/20 dark:bg-white/10 dark:hover:bg-white/15'
        )}
      >
        {item.locked ? <MdLock size={16} /> : <MdLockOpen size={16} />}
      </button>
      <button
        type="button"
        role="switch"
        aria-checked={item.visible}
        onPointerDown={event => event.stopPropagation()}
        onTouchStart={event => event.stopPropagation()}
        onClick={onToggle}
        className={clsx(
          'inline-flex h-7 w-12 cursor-pointer items-center rounded-full border p-0.5 transition-colors',
          item.visible
            ? 'border-(--primary-2) bg-(--primary-2)/85 dark:border-(--secondary) dark:bg-(--secondary)'
            : 'border-(--outline) bg-(--gray-01) dark:border-white/20 dark:bg-white/10'
        )}
      >
        <span
          className={clsx(
            'h-5 w-5 rounded-full bg-white shadow transition-transform',
            item.visible ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </li>
  );
}

function SortableColumnOrderRow({
  item,
  index,
  onToggle,
  onToggleLock,
  lockDisabled = false
}: {
  item: MobileColumnOrderItem;
  index: number;
  onToggle: () => void;
  onToggleLock: () => void;
  lockDisabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id
  });

  return (
    <ColumnOrderRow
      item={item}
      index={index}
      dragging={isDragging}
      attributes={attributes}
      listeners={listeners}
      setNodeRef={setNodeRef}
      transform={CSS.Transform.toString(transform)}
      transition={transition}
      onToggle={onToggle}
      onToggleLock={onToggleLock}
      lockDisabled={lockDisabled}
    />
  );
}

export function MobileColumnOrderSheet({
  open,
  title = 'Ordenar columnas',
  items,
  defaultItems,
  onClose,
  onApply
}: Props) {
  const [draftItems, setDraftItems] = useState<MobileColumnOrderItem[]>(items);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraftItems(items);
      setResetFeedback(null);
    }
  }, [items, open]);

  useEffect(() => {
    if (!resetFeedback) {
      return;
    }
    const timeoutId = window.setTimeout(() => setResetFeedback(null), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [resetFeedback]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  const canApply = useMemo(() => draftItems.length > 0, [draftItems.length]);
  const lockedCount = useMemo(
    () => draftItems.filter(item => Boolean(item.locked) && item.visible).length,
    [draftItems]
  );
  const activeItem = activeItemId ? draftItems.find(item => item.id === activeItemId) ?? null : null;
  const activeItemIndex = activeItem ? draftItems.findIndex(item => item.id === activeItem.id) : -1;
  const itemIds = useMemo(() => draftItems.map(item => item.id), [draftItems]);
  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 90,
        tolerance: 5
      }
    }),
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  const onDragStart = (event: DragStartEvent) => {
    setActiveItemId(String(event.active.id));
  };

  const clearResetFeedback = () => {
    setResetFeedback(null);
  };

  const onReset = () => {
    setDraftItems(defaultItems);
    setResetFeedback('Las columnas se restablecieron al orden predeterminado.');
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItemId(null);
    if (!over || active.id === over.id) {
      return;
    }
    clearResetFeedback();
    setDraftItems(current => {
      const oldIndex = current.findIndex(item => item.id === String(active.id));
      const newIndex = current.findIndex(item => item.id === String(over.id));
      if (oldIndex < 0 || newIndex < 0) {
        return current;
      }
      return arrayMove(current, oldIndex, newIndex);
    });
  };

  const onDragCancel = () => {
    setActiveItemId(null);
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-3">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex h-[min(44rem,calc(100vh-1.5rem))] w-[min(26rem,100%)] flex-col overflow-hidden rounded-4xl border-2 border-(--outline) bg-(--card) shadow-[0_24px_60px_rgb(0_0_0/0.25)] dark:border-white/15 dark:bg-[#151822] dark:shadow-[0_28px_70px_rgb(0_0_0/0.58)]"
      >
        <header className="flex items-center justify-between border-b border-black/10 px-5 py-4 dark:border-white/10">
          <span aria-hidden className="inline-block h-8 w-8" />
          <h2 className="text-base font-semibold text-(--primary-2) dark:text-(--secondary)">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-(--text-secondary) hover:bg-black/5 hover:text-(--text-primary) dark:hover:bg-white/10"
            aria-label="Cerrar panel de orden de columnas"
          >
            <IoCloseSharp size={18} />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragCancel={onDragCancel}
            >
              <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                <ul className="space-y-2.5">
                  {draftItems.map((item, index) => (
                    <SortableColumnOrderRow
                      key={item.id}
                      item={item}
                      index={index}
                      onToggle={() => {
                        clearResetFeedback();
                        setDraftItems(current =>
                          current.map(currentItem =>
                            currentItem.id === item.id
                              ? {
                                  ...currentItem,
                                  visible: !currentItem.visible,
                                  locked: currentItem.visible ? false : currentItem.locked
                                }
                              : currentItem
                          )
                        );
                      }}
                      onToggleLock={() => {
                        clearResetFeedback();
                        setDraftItems(current =>
                          current.map(currentItem =>
                            currentItem.id === item.id
                              ? {
                                  ...currentItem,
                                  visible: currentItem.locked ? currentItem.visible : true,
                                  locked: !currentItem.locked
                                }
                              : currentItem
                          )
                        );
                      }}
                      lockDisabled={!item.locked && lockedCount >= 2}
                    />
                  ))}
                </ul>
              </SortableContext>
              <DragOverlay adjustScale={false}>
                {activeItem ? (
                  <ul className="pointer-events-none m-0 list-none p-0">
                    <ColumnOrderRow
                      item={activeItem}
                      index={activeItemIndex < 0 ? 0 : activeItemIndex}
                      dragging
                      onToggle={() => {}}
                      onToggleLock={() => {}}
                    />
                  </ul>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>

          {resetFeedback ? (
            <p
              className="mx-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-300"
              role="status"
              aria-live="polite"
            >
              {resetFeedback}
            </p>
          ) : null}

          <footer className="flex items-center justify-between gap-2 border-t border-black/10 bg-white/75 px-4 py-3 backdrop-blur-sm dark:border-white/10 dark:bg-[#121622]/85">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full border border-(--outline) px-4 text-xs font-semibold tracking-wide text-(--text-secondary) transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              RESTABLECER
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full border border-(--outline) px-4 text-sm font-medium text-(--text-secondary) hover:bg-black/5 dark:hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => onApply(draftItems)}
                disabled={!canApply}
                className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full bg-(--primary-2) px-5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-50 dark:bg-(--secondary-3)"
              >
                Aplicar
              </button>
            </div>
          </footer>
        </div>
      </div>
      <button
        type="button"
        aria-label="Cerrar panel"
        className="absolute inset-0 -z-10"
        onClick={onClose}
      />
    </div>
  );
}
