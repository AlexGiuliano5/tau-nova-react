"use client";

import { useCallback, useRef } from "react";

import { Link } from 'react-router-dom';
import { buildOltPlacaPuertoHref } from '@/features/ftth/lib/tree-navigation';
import type { OltSlotPortGridModel } from '@/features/olt/types/slot-port';
import {
  type OltSlotPortCellView,
  SlotPortSeverity,
} from '@/features/olt/types/slot-port';

import { useOltSlotPortTooltip } from "./OltSlotPortTooltip";

export const OLT_DISTRIBUCION_COLS_PER_PAGE = 6;

export type OltDistribucionViewMode = "abstract" | "realistic";

const PAGE_INDICES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

const ROW_GAP = "gap-0.5 md:gap-1";
const COLUMN_GAP = "gap-x-1 md:gap-x-1.5";
const CELL_ROW_CLASS = "flex h-6 min-h-[1.5rem] items-center md:h-7";

/** Min track per slot so many columns stay legible; parent scrolls horizontally when needed. */
const SLOT_TRACK_MIN = "1.9rem";

const chassisPanelClass =
  "rounded-xl border border-(--table-stroke) bg-(--table-header) p-2 shadow-[inset_0_1px_0_rgb(255_255_255/0.65),0_1px_2px_rgb(15_23_42/0.04)] md:p-2.5 dark:bg-(--table-content)/90 dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.04),0_1px_3px_rgb(0_0_0/0.35)]";

const slotBayClass = `flex min-h-0 flex-col ${ROW_GAP} rounded-lg border border-(--table-stroke) bg-(--card)/50 px-0.5 py-0.5 shadow-[inset_0_2px_6px_rgb(15_23_42/0.05)] md:px-1 md:py-1 dark:border-white/10 dark:bg-(--table-content)/60 dark:shadow-[inset_0_2px_8px_rgb(0_0_0/0.35)]`;

const slotBayPlaceholderClass = `flex min-h-0 flex-col ${ROW_GAP} rounded-lg border border-dashed border-(--table-stroke)/70 bg-(--table-header)/40 opacity-50 dark:border-white/12 dark:bg-white/[0.03] dark:opacity-100`;

const ROW_GAP_REALISTIC = "gap-[2px]";

const chassisPanelRealisticClass =
  'relative overflow-hidden rounded-xl border border-[#8d98a8] bg-[linear-gradient(180deg,#7a8494_0%,#5c6674_8%,#454d58_42%,#323942_100%)] px-1.5 pt-2 pb-2 shadow-[inset_0_2px_0_rgb(255_255_255/0.28),inset_0_-8px_20px_rgb(0_0_0/0.55),0_10px_28px_rgb(0_0_0/0.45)] md:px-2 md:pt-2.5 md:pb-2.5 before:pointer-events-none before:absolute before:inset-x-4 before:top-1.5 before:h-px before:bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.45),transparent)] before:content-[""] after:pointer-events-none after:absolute after:inset-0 after:bg-[repeating-linear-gradient(90deg,rgb(255_255_255/0.025)_0px,rgb(255_255_255/0.025)_1px,transparent_1px,transparent_5px)] after:content-[""]';

const chassisFaceplateClass =
  "relative z-1 flex min-w-0 flex-1 items-stretch gap-0.5 rounded-md border border-[#252b33] bg-[linear-gradient(180deg,#2a3038_0%,#1a1f26_55%,#14181e_100%)] p-1 shadow-[inset_0_4px_12px_rgb(0_0_0/0.72),inset_0_1px_0_rgb(255_255_255/0.06)]";

const chassisFaceplateFitClass =
  "relative z-1 flex min-w-0 flex-1 items-stretch gap-0.5 rounded-md border border-[#252b33] bg-[linear-gradient(180deg,#2a3038_0%,#1a1f26_55%,#14181e_100%)] p-0.5 shadow-[inset_0_4px_12px_rgb(0_0_0/0.72)]";

const columnGapRealistic = "gap-x-[3px]";

const slotBayRealisticClass = `relative flex min-h-0 flex-col ${ROW_GAP_REALISTIC} rounded-[5px] border border-[#707b8a] bg-[linear-gradient(90deg,#3d4550_0%,#5a6472_18%,#4a5360_50%,#5a6472_82%,#3d4550_100%)] p-[3px] shadow-[inset_0_1px_0_rgb(255_255_255/0.18),inset_0_-4px_10px_rgb(0_0_0/0.45),0_1px_0_rgb(255_255_255/0.08)] before:pointer-events-none before:absolute before:inset-0 before:rounded-[5px] before:bg-[repeating-linear-gradient(0deg,rgb(255_255_255/0.03)_0px,rgb(255_255_255/0.03)_1px,transparent_1px,transparent_4px)] before:content-[""]`;

const slotBayPlaceholderRealisticClass = `flex min-h-0 flex-col ${ROW_GAP_REALISTIC} rounded-[5px] border border-dashed border-[#5a6472]/70 bg-[#252b33]/80 p-[3px] opacity-55`;

const axisLabelRealisticClass = "font-medium tracking-wide text-[#9aa5b4]";

/** Desplazamiento mínimo horizontal para cambiar de bloque (px). */
const SWIPE_MIN_DX = 28;

/** Movimiento mínimo para cancelar click/tap por considerarse drag real (px). */
const CLICK_CANCEL_DX = 10;

/** Movimiento antes de decidir si el gesto es horizontal o vertical (px). */
const AXIS_LOCK_PX = 6;

/** Ratio mínimo para considerar un gesto claramente vertical. */
const VERTICAL_LOCK_RATIO = 1.25;

/** Factor de “goma” al arrastrar más allá del primer/último bloque. */
const EDGE_RUBBER = 0.35;

const SNAP_BACK_MS = 220;

interface Props {
  model: OltSlotPortGridModel;
  /** Segmento `[olt]` de la URL (mismo valor que recibe la página OLT). */
  oltRouteParam: string;
  page: number;
  onPageChange: (page: number) => void;
  colsPerPage?: number;
  hideNavigation?: boolean;
  hideIndicators?: boolean;
  disableSwipe?: boolean;
  fitToContainer?: boolean;
  viewMode?: OltDistribucionViewMode;
}

type AxisLock = "none" | "horizontal" | "vertical";

function rubberBandDx(dx: number, page: number, totalPages: number): number {
  if (totalPages <= 1) {
    return dx * EDGE_RUBBER;
  }
  if (page <= 0 && dx > 0) {
    return dx * EDGE_RUBBER;
  }
  if (page >= totalPages - 1 && dx < 0) {
    return dx * EDGE_RUBBER;
  }
  return dx;
}

const LINK_FOCUS_RING =
  "focus-visible:z-[1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--primary-2) dark:focus-visible:outline-(--secondary)";

export function OltDistribucionCarousel({
  model,
  oltRouteParam,
  page,
  onPageChange,
  colsPerPage = OLT_DISTRIBUCION_COLS_PER_PAGE,
  hideNavigation = false,
  hideIndicators = false,
  disableSwipe = false,
  fitToContainer = false,
  viewMode = "realistic",
}: Props) {
  const isRealistic = viewMode === "realistic";
  const activeChassisPanelClass = isRealistic
    ? chassisPanelRealisticClass
    : chassisPanelClass;
  const activeSlotBayClass = isRealistic ? slotBayRealisticClass : slotBayClass;
  const activeSlotBayPlaceholderClass = isRealistic
    ? slotBayPlaceholderRealisticClass
    : slotBayPlaceholderClass;
  const axisLabelClass = isRealistic
    ? axisLabelRealisticClass
    : "text-(--text-secondary)";
  const totalSlots = Math.max(model.totalSlots, 1);
  const totalPages = Math.ceil(totalSlots / Math.max(colsPerPage, 1));
  const gridColKeys = Array.from(
    { length: Math.max(colsPerPage, 1) },
    (_, i) => `gc${i}`,
  );
  const abstractSlotTrackMin = fitToContainer ? "0" : SLOT_TRACK_MIN;
  const realisticSlotTrackMin = fitToContainer ? "1.35rem" : SLOT_TRACK_MIN;
  const slotTrackMin = isRealistic
    ? realisticSlotTrackMin
    : abstractSlotTrackMin;
  const showRackEars = isRealistic && !fitToContainer;
  const activeFaceplateClass = isRealistic
    ? fitToContainer
      ? chassisFaceplateFitClass
      : chassisFaceplateClass
    : "min-w-0";
  const layoutGapClass = fitToContainer
    ? "gap-0.5 md:gap-1"
    : "gap-1 md:gap-1.5";
  const sideGapClass = fitToContainer ? "gap-0" : "gap-0 md:gap-0.5";
  const columnGapClass = fitToContainer ? "gap-x-0.5 md:gap-x-0.5" : COLUMN_GAP;
  const activeColumnGapClass = isRealistic
    ? columnGapRealistic
    : columnGapClass;
  const puertoLabelWidthClass = fitToContainer
    ? "w-[0.875rem] md:w-[1rem]"
    : "w-[0.875rem] md:w-[1rem]";
  const puertoNumbersWidthClass = fitToContainer
    ? "w-[1rem] sm:w-[1.125rem]"
    : "w-[1.125rem] sm:w-[1.25rem]";
  const puertoRowsInsetClass = fitToContainer
    ? "pt-[2px] pb-[2px] md:pt-[3px] md:pb-[3px]"
    : "pt-[3px] pb-[3px] md:pt-[5px] md:pb-[5px]";
  const swipeStartRef = useRef<{
    x: number;
    y: number;
    pointerId: number;
  } | null>(null);
  const axisLockRef = useRef<AxisLock>("none");
  const lastDxRef = useRef(0);
  const slideDragActiveRef = useRef(false);
  const didDragRef = useRef(false);
  const slideRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const startCol = page * colsPerPage;
  const colCount = Math.min(colsPerPage, totalSlots - startCol);

  const slotBayElements = gridColKeys.map((colKey, slotIndex) => {
    if (slotIndex >= colCount) {
      return (
        <div
          key={`slot-bay-empty-${colKey}`}
          className={activeSlotBayPlaceholderClass}
          aria-hidden
        >
          {isRealistic ? <OltLineCardHandleSpacer /> : null}
          <div
            className={
              isRealistic
                ? `relative z-1 flex flex-col ${ROW_GAP_REALISTIC} rounded-[3px] bg-[#1a1f26]/40 p-[2px]`
                : "contents"
            }
          >
            {model.rows.map((row) => (
              <div
                key={`pad-${row.port}-${colKey}`}
                className={`${CELL_ROW_CLASS} w-full`}
              />
            ))}
          </div>
        </div>
      );
    }
    const colIndex = startCol + slotIndex;
    const placa = colIndex + 1;
    return (
      <div key={`slot-bay-${colIndex}`} className={activeSlotBayClass}>
        {isRealistic ? <OltLineCardHandle /> : null}
        <div
          className={
            isRealistic
              ? `relative z-1 flex flex-col ${ROW_GAP_REALISTIC} rounded-[3px] bg-[#1a1f26] p-[2px] shadow-[inset_0_3px_8px_rgb(0_0_0/0.65)]`
              : "contents"
          }
        >
          {model.rows.map((row) => {
            const cell = row.cells[colIndex] ?? null;
            return (
              <OltCarouselCell
                key={`${row.port}-${colIndex}`}
                oltRouteParam={oltRouteParam}
                cell={cell}
                placa={placa}
                port={row.port}
                viewMode={viewMode}
              />
            );
          })}
        </div>
      </div>
    );
  });

  const goPrev = useCallback(() => {
    onPageChange(Math.max(0, page - 1));
  }, [page, onPageChange]);

  const goNext = useCallback(() => {
    onPageChange(Math.min(totalPages - 1, page + 1));
  }, [page, onPageChange, totalPages]);

  const goPage = useCallback(
    (i: number) => {
      onPageChange(Math.max(0, Math.min(totalPages - 1, i)));
    },
    [onPageChange, totalPages],
  );

  const resetSlideTransform = useCallback(() => {
    const el = slideRef.current;
    if (!el) {
      return;
    }
    el.style.transition = "";
    el.style.transform = "";
  }, []);

  const snapSlideToZero = useCallback(() => {
    const el = slideRef.current;
    if (!el) {
      return;
    }
    el.style.transition = `transform ${SNAP_BACK_MS}ms ease-out`;
    el.style.transform = "translateX(0)";
    window.setTimeout(() => {
      if (slideRef.current === el) {
        el.style.transition = "";
        el.style.transform = "";
      }
    }, SNAP_BACK_MS + 40);
  }, []);

  const endPointerGesture = useCallback(
    (target: HTMLElement, pointerId: number) => {
      if (swipeStartRef.current?.pointerId === pointerId) {
        swipeStartRef.current = null;
      }
      axisLockRef.current = "none";
      lastDxRef.current = 0;
      try {
        target.releasePointerCapture(pointerId);
      } catch {
        // ya liberado
      }
      if (sectionRef.current) {
        sectionRef.current.style.touchAction = "none";
      }
    },
    [],
  );

  const onSwipePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) {
        return;
      }
      axisLockRef.current = "none";
      lastDxRef.current = 0;
      slideDragActiveRef.current = false;
      didDragRef.current = false;
      resetSlideTransform();
      swipeStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        pointerId: e.pointerId,
      };
      if (e.pointerType !== "mouse") {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // entorno sin captura
        }
      }
    },
    [resetSlideTransform],
  );

  const onSwipePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const start = swipeStartRef.current;
      if (!start || start.pointerId !== e.pointerId) {
        return;
      }

      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (axisLockRef.current === "none") {
        if (Math.hypot(dx, dy) < AXIS_LOCK_PX) {
          return;
        }

        // En touch real hay jitter inicial; evitamos "soltar" por una lectura vertical temprana.
        if (absDx >= absDy) {
          axisLockRef.current = "horizontal";
          slideDragActiveRef.current = true;
          didDragRef.current = absDx >= CLICK_CANCEL_DX;
          if (sectionRef.current) {
            sectionRef.current.style.touchAction = "none";
          }
          const slide = slideRef.current;
          if (slide) {
            slide.style.transition = "none";
          }
        } else if (absDy >= absDx * VERTICAL_LOCK_RATIO) {
          axisLockRef.current = "vertical";
          endPointerGesture(e.currentTarget, e.pointerId);
        } else {
          // Zona ambigua: esperamos más movimiento para decidir eje.
          return;
        }
      }

      if (axisLockRef.current !== "horizontal") {
        return;
      }

      didDragRef.current = absDx >= CLICK_CANCEL_DX;

      if (e.cancelable) {
        e.preventDefault();
      }

      const rubberDx = rubberBandDx(dx, page, totalPages);
      lastDxRef.current = rubberDx;
      const slide = slideRef.current;
      if (slide) {
        slide.style.transform = `translateX(${rubberDx}px)`;
      }
    },
    [page, totalPages, endPointerGesture],
  );

  const onSwipePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const start = swipeStartRef.current;
      if (!start || start.pointerId !== e.pointerId) {
        return;
      }

      const wasHorizontal = axisLockRef.current === "horizontal";
      const rawDx = e.clientX - start.x;
      const rawDy = e.clientY - start.y;
      const dragDx = lastDxRef.current;

      endPointerGesture(e.currentTarget, e.pointerId);

      if (!wasHorizontal) {
        if (
          totalPages > 1 &&
          Math.abs(rawDx) >= SWIPE_MIN_DX &&
          Math.abs(rawDx) > Math.abs(rawDy)
        ) {
          if (rawDx > 0) {
            goPrev();
          } else {
            goNext();
          }
        }
        return;
      }

      slideDragActiveRef.current = false;
      const dx = dragDx;

      if (totalPages <= 1) {
        snapSlideToZero();
        return;
      }

      if (Math.abs(dx) >= SWIPE_MIN_DX) {
        if (dx > 0) {
          goPrev();
        } else {
          goNext();
        }
        resetSlideTransform();
        return;
      }

      snapSlideToZero();
    },
    [
      totalPages,
      goPrev,
      goNext,
      endPointerGesture,
      snapSlideToZero,
      resetSlideTransform,
    ],
  );

  const onSwipePointerCancel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (swipeStartRef.current?.pointerId === e.pointerId) {
        const wasHorizontal = slideDragActiveRef.current;
        endPointerGesture(e.currentTarget, e.pointerId);
        if (wasHorizontal) {
          slideDragActiveRef.current = false;
          snapSlideToZero();
        }
        didDragRef.current = false;
      } else {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
    },
    [endPointerGesture, snapSlideToZero],
  );

  const onSwipeLostPointerCapture = useCallback(() => {
    if (slideDragActiveRef.current) {
      slideDragActiveRef.current = false;
      snapSlideToZero();
    }
    swipeStartRef.current = null;
    axisLockRef.current = "none";
    lastDxRef.current = 0;
    didDragRef.current = false;
    if (sectionRef.current) {
      sectionRef.current.style.touchAction = "none";
    }
  }, [snapSlideToZero]);

  const onSwipeClickCapture = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!didDragRef.current) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      didDragRef.current = false;
    },
    [],
  );

  const onSwipeDragStart = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
  }, []);

  return (
    <div
      className={`flex flex-col gap-3 md:gap-2.5 ${isRealistic ? "min-h-0 w-full flex-1" : ""}`}
    >
      {!hideNavigation ? (
        <nav
          className="flex items-center justify-between gap-2 rounded-lg border border-(--table-stroke) bg-(--table-header) px-2 py-2 md:px-3"
          aria-label="Navegación por bloque de placas"
        >
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-lg font-semibold text-(--primary-2) disabled:cursor-not-allowed disabled:opacity-30 md:text-base dark:text-(--secondary)"
            onClick={goPrev}
            disabled={page <= 0}
            aria-label="Bloque anterior"
          >
            ‹
          </button>
          <span className="min-w-0 flex-1 text-center text-sm font-semibold text-(--text-primary) md:text-[12px]">
            Bloque {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-lg font-semibold text-(--primary-2) disabled:cursor-not-allowed disabled:opacity-30 md:text-base dark:text-(--secondary)"
            onClick={goNext}
            disabled={page >= totalPages - 1}
            aria-label="Bloque siguiente"
          >
            ›
          </button>
        </nav>
      ) : null}

      <section
        ref={sectionRef}
        className={`min-w-0 select-none ${isRealistic ? "flex min-h-0 flex-1 flex-col" : ""} overflow-x-hidden ${disableSwipe ? "" : "cursor-grab active:cursor-grabbing"}`}
        style={{ touchAction: disableSwipe ? "auto" : "none" }}
        aria-label="Grilla de placa y puerto. Arrastrá horizontalmente para cambiar de bloque."
        onClickCapture={disableSwipe ? undefined : onSwipeClickCapture}
        onDragStart={disableSwipe ? undefined : onSwipeDragStart}
        onPointerDown={disableSwipe ? undefined : onSwipePointerDown}
        onPointerMove={disableSwipe ? undefined : onSwipePointerMove}
        onPointerUp={disableSwipe ? undefined : onSwipePointerUp}
        onPointerCancel={disableSwipe ? undefined : onSwipePointerCancel}
        onLostPointerCapture={
          disableSwipe ? undefined : onSwipeLostPointerCapture
        }
      >
        {isRealistic ? (
          <div
            className={`min-w-0 w-full flex-1 ${fitToContainer ? "overflow-x-auto overscroll-x-contain" : "overflow-x-auto overscroll-x-contain"}`}
          >
            <div
              key={page}
              ref={slideRef}
              className={`will-change-transform w-full ${fitToContainer ? "min-w-full" : "inline-block w-max min-w-full"}`}
            >
              <div
                className={`${activeChassisPanelClass} w-full ${fitToContainer ? "flex min-h-0 flex-1 flex-col px-1 py-1" : ""}`}
              >
                <OltChassisTopPanel compact={fitToContainer} />
                <div
                  className={`${activeFaceplateClass} w-full ${fitToContainer ? "min-h-0 flex-1" : ""}`}
                >
                  {showRackEars ? <OltChassisRackEar side="left" /> : null}
                  <div
                    className={`grid min-h-0 min-w-0 w-full flex-1 grid-cols-[auto_1fr] grid-rows-[auto_auto] gap-x-0.5 gap-y-1`}
                  >
                    <OltDistribucionPuertoAxis
                      rows={model.rows}
                      isRealistic
                      axisLabelClass={axisLabelClass}
                      puertoLabelWidthClass={puertoLabelWidthClass}
                      puertoNumbersWidthClass={puertoNumbersWidthClass}
                      puertoRowsInsetClass={puertoRowsInsetClass}
                    />
                    <section
                      className={`col-start-2 row-start-1 grid min-w-0 w-full ${activeColumnGapClass}`}
                      style={{
                        gridTemplateColumns: `repeat(${Math.max(colsPerPage, 1)}, minmax(${slotTrackMin}, 1fr))`,
                      }}
                      aria-label={`Placas ${startCol + 1} a ${startCol + colCount} para OLT ${model.oltDisplay}`}
                    >
                      {slotBayElements}
                    </section>
                    <OltDistribucionPlacaAxis
                      isRealistic
                      axisLabelClass={axisLabelClass}
                      activeColumnGapClass={activeColumnGapClass}
                      colsPerPage={colsPerPage}
                      slotTrackMin={slotTrackMin}
                      gridColKeys={gridColKeys}
                      colCount={colCount}
                      startCol={startCol}
                    />
                  </div>
                  {showRackEars ? <OltChassisRackEar side="right" /> : null}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`flex min-w-0 items-stretch ${layoutGapClass}`}>
            <div
              className={`flex shrink-0 items-stretch py-2 md:py-2.5 ${sideGapClass}`}
            >
              <div
                className={`flex items-center justify-center self-stretch ${puertoLabelWidthClass}`}
              >
                <span className="inline-block -rotate-90 text-nowrap text-[11px] font-semibold tracking-wide text-(--text-secondary) sm:text-xs md:text-[10px]">
                  Puerto
                </span>
              </div>
              <div
                className={`flex ${puertoNumbersWidthClass} ${puertoRowsInsetClass} flex-col ${ROW_GAP} text-center text-[10px] font-medium text-(--text-secondary) sm:text-xs md:text-[10px]`}
              >
                {model.rows.map((row) => (
                  <div
                    key={row.port}
                    className={`${CELL_ROW_CLASS} justify-center tabular-nums`}
                  >
                    {row.port}
                  </div>
                ))}
              </div>
            </div>

            <div
              className={`min-w-0 flex-1 ${fitToContainer ? "overflow-x-hidden" : "overflow-x-auto overscroll-x-contain"}`}
            >
              <div
                key={page}
                ref={slideRef}
                className="will-change-transform inline-block min-w-full w-max"
              >
                <div
                  className={`${chassisPanelClass} ${fitToContainer ? "px-1.5 py-1.5 md:px-2 md:py-2" : ""}`}
                >
                  <section
                    className={`grid w-full ${columnGapClass}`}
                    style={{
                      gridTemplateColumns: `repeat(${Math.max(colsPerPage, 1)}, minmax(${slotTrackMin}, 1fr))`,
                    }}
                    aria-label={`Placas ${startCol + 1} a ${startCol + colCount} para OLT ${model.oltDisplay}`}
                  >
                    {slotBayElements}
                  </section>

                  <div className="mt-2 border-t border-(--table-stroke) pt-2 dark:border-white/10">
                    <div
                      className={`grid w-full ${columnGapClass} text-center text-[10px] font-semibold tabular-nums text-(--text-secondary) sm:text-xs md:text-[10px]`}
                      style={{
                        gridTemplateColumns: `repeat(${Math.max(colsPerPage, 1)}, minmax(${slotTrackMin}, 1fr))`,
                      }}
                    >
                      {gridColKeys.map((colKey, j) => (
                        <div
                          key={
                            j < colCount
                              ? `placa-h-${startCol + j}`
                              : `placa-h-${colKey}-empty`
                          }
                        >
                          {j < colCount ? startCol + j + 1 : "\u00a0"}
                        </div>
                      ))}
                    </div>
                    <p className="mt-1 text-center text-[10px] font-semibold tracking-wide text-(--text-secondary) sm:text-xs md:text-[10px]">
                      Placa
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {!hideIndicators ? (
        <section
          className="flex justify-center gap-1.5"
          aria-label="Indicadores de bloque"
        >
          {PAGE_INDICES.filter((i) => i < totalPages).map((i) => (
            <button
              key={`olt-dist-block-${i}`}
              type="button"
              aria-current={i === page ? "step" : undefined}
              aria-label={`Ir al bloque ${i + 1}`}
              className={`h-2 w-2 cursor-pointer rounded-full transition-colors md:h-2.5 md:w-2.5 ${
                i === page
                  ? "bg-(--primary-2) dark:bg-(--secondary)"
                  : "bg-(--outline) opacity-70 dark:bg-(--secondary)/35 dark:opacity-100"
              }`}
              onClick={() => goPage(i)}
            />
          ))}
        </section>
      ) : null}
    </div>
  );
}

function OltCarouselCell({
  oltRouteParam,
  cell,
  placa,
  port,
  viewMode,
}: {
  oltRouteParam: string;
  cell: OltSlotPortCellView | null;
  placa: number;
  port: number;
  viewMode: OltDistribucionViewMode;
}) {
  const href = buildOltPlacaPuertoHref(oltRouteParam, placa, port);

  if (viewMode === "realistic") {
    return (
      <OltCarouselCellRealistic
        href={href}
        cell={cell}
        placa={placa}
        port={port}
      />
    );
  }

  if (!cell) {
    return (
      <div
        className={`${CELL_ROW_CLASS} ${LINK_FOCUS_RING} w-full min-w-0 justify-center rounded-full border border-dashed border-(--table-stroke) bg-(--card)/35 text-(--text-primary) no-underline shadow-[inset_0_1px_2px_rgb(15_23_42/0.05)] dark:border-white/18 dark:bg-white/4 dark:shadow-[inset_0_1px_2px_rgb(0_0_0/0.25)]`}
        aria-label={`Placa ${placa}, puerto ${port}, vacío. Ver detalle`}
      >
        <span className="sr-only">Vacío</span>
      </div>
    );
  }

  return (
    <OltCarouselCellAbstractFilled
      href={href}
      cell={cell}
      placa={placa}
      port={port}
    />
  );
}

function OltCarouselCellAbstractFilled({
  href,
  cell,
  placa,
  port,
}: {
  href: string;
  cell: OltSlotPortCellView;
  placa: number;
  port: number;
}) {
  const { triggerProps, overlay } = useOltSlotPortTooltip({
    placa,
    port,
    totals: cell.totals,
  });

  return (
    <>
      <Link
        {...triggerProps}
        to={href}
        draggable={false}
        className={`${CELL_ROW_CLASS} ${LINK_FOCUS_RING} w-full min-w-0 justify-center rounded-full text-[9px] font-semibold leading-none no-underline transition-[box-shadow,transform] duration-150 sm:text-[10px] md:text-[9px] active:scale-[0.98] ${severityCellClass(cell.severity)}`}
        aria-label={`Placa ${placa}, puerto ${port}, severidad ${cell.severity}. Ver detalle`}
      >
        <span className="whitespace-nowrap px-0.5 text-center tabular-nums">
          {cell.label}
        </span>
      </Link>
      {overlay}
    </>
  );
}

const _sfpMetalBezelClass =
  "relative flex h-full min-h-[1.5rem] w-full rounded-[4px] bg-[linear-gradient(180deg,#a8b2c0_0%,#7a8494_28%,#5c6674_62%,#4a5360_100%)] p-[2px] shadow-[inset_0_1px_0_rgb(255_255_255/0.42),0_1px_0_rgb(0_0_0/0.5)] transition-[transform,filter] duration-150 hover:brightness-[1.05] active:scale-[0.98]";

const _sfpPortOpeningClass =
  'relative flex h-full min-h-0 w-full items-center justify-center overflow-hidden rounded-[2px] before:pointer-events-none before:absolute before:inset-0 before:content-[""]';

const _sfpEmptyOpeningClass =
  "relative flex h-full min-h-0 w-full overflow-hidden rounded-[2px] bg-[linear-gradient(180deg,#0a0d12_0%,#151a22_100%)] shadow-[inset_0_4px_10px_rgb(0_0_0/0.85)]";

function OltCarouselCellRealistic({
  href,
  cell,
  placa,
  port,
}: {
  href: string;
  cell: OltSlotPortCellView | null;
  placa: number;
  port: number;
}) {
  if (!cell) {
    return (
      <div
        className={`${CELL_ROW_CLASS} ${LINK_FOCUS_RING} h-full w-full min-w-0 justify-center no-underline`}
        aria-label={`Placa ${placa}, puerto ${port}, vacío. Ver detalle`}
      >
        <span className={_sfpMetalBezelClass} aria-hidden>
          <span className={_sfpEmptyOpeningClass}>
            <span className="absolute inset-x-1.5 top-1 h-px bg-[rgb(255_255_255/0.06)]" />
            <span className="absolute inset-x-1 bottom-1 h-[3px] rounded-[1px] bg-[linear-gradient(90deg,#6b5a3e,#c9a227,#6b5a3e)] shadow-[0_0_4px_rgb(201_162_39/0.35)]" />
          </span>
        </span>
        <span className="sr-only">Vacío</span>
      </div>
    );
  }

  return (
    <OltCarouselCellRealisticFilled
      href={href}
      cell={cell}
      placa={placa}
      port={port}
    />
  );
}

function OltCarouselCellRealisticFilled({
  href,
  cell,
  placa,
  port,
}: {
  href: string;
  cell: OltSlotPortCellView;
  placa: number;
  port: number;
}) {
  const { triggerProps, overlay } = useOltSlotPortTooltip({
    placa,
    port,
    totals: cell.totals,
  });

  return (
    <>
      <Link
        {...triggerProps}
        to={href}
        draggable={false}
        className={`${CELL_ROW_CLASS} ${LINK_FOCUS_RING} h-full w-full min-w-0 justify-center no-underline`}
        aria-label={`Placa ${placa}, puerto ${port}, severidad ${cell.severity}. Ver detalle`}
      >
        <span className={_sfpMetalBezelClass} aria-hidden>
          <span
            className={`${_sfpPortOpeningClass} ${realisticPortLightClass(cell.severity)}`}
          >
            <span className="relative z-1 whitespace-nowrap px-0.5 text-center text-[9px] font-bold leading-none tabular-nums drop-shadow-[0_1px_1px_rgb(0_0_0/0.45)] sm:text-[10px] md:text-[9px]">
              {cell.label}
            </span>
          </span>
        </span>
      </Link>
      {overlay}
    </>
  );
}

function realisticPortLightClass(severity: SlotPortSeverity): string {
  const lensHighlight =
    "before:bg-[radial-gradient(ellipse_75%_50%_at_50%_22%,rgb(255_255_255/0.38),transparent_70%)]";

  switch (severity) {
    case SlotPortSeverity.Ok:
      return `bg-[var(--card-green)] text-white ${lensHighlight} shadow-[inset_0_1px_0_rgb(255_255_255/0.4),inset_0_-2px_6px_rgb(0_0_0/0.25),0_0_6px_1px_var(--card-green)]`;
    case SlotPortSeverity.Warning:
      return `bg-[var(--card-yellow)] text-black ${lensHighlight} shadow-[inset_0_1px_0_rgb(255_255_255/0.5),inset_0_-2px_6px_rgb(0_0_0/0.1),0_0_6px_1px_var(--card-yellow)]`;
    case SlotPortSeverity.Critical:
      return `bg-[var(--card-red)] text-white ${lensHighlight} shadow-[inset_0_1px_0_rgb(255_255_255/0.35),inset_0_-2px_6px_rgb(0_0_0/0.3),0_0_6px_1px_var(--card-red)]`;
    default:
      return `bg-[var(--card-green)] text-white ${lensHighlight} shadow-[inset_0_1px_0_rgb(255_255_255/0.4),inset_0_-2px_6px_rgb(0_0_0/0.25),0_0_6px_1px_var(--card-green)]`;
  }
}

const _axisPuertoRealisticClass = "flex shrink-0 self-stretch py-0.5 pr-0.5";

const _axisStripAbstractClass =
  "flex shrink-0 items-stretch self-stretch rounded-md border border-(--table-stroke) bg-(--table-header) px-0.5 py-0.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.5)] dark:border-white/12 dark:bg-(--table-content)/80";

const _portRowsChannelClass = `flex flex-col ${ROW_GAP_REALISTIC} rounded-[3px] p-[2px]`;

function OltDistribucionPuertoAxis({
  rows,
  isRealistic,
  axisLabelClass,
  puertoLabelWidthClass,
  puertoNumbersWidthClass,
  puertoRowsInsetClass,
}: {
  rows: OltSlotPortGridModel["rows"];
  isRealistic: boolean;
  axisLabelClass: string;
  puertoLabelWidthClass: string;
  puertoNumbersWidthClass: string;
  puertoRowsInsetClass: string;
}) {
  const rowGapClass = isRealistic ? ROW_GAP_REALISTIC : ROW_GAP;
  const stripClass = isRealistic
    ? _axisPuertoRealisticClass
    : _axisStripAbstractClass;

  return (
    <div className={`col-start-1 row-start-1 self-stretch ${stripClass}`}>
      <div className="flex items-stretch gap-0.5">
        <div
          className={`flex items-center justify-center self-stretch ${puertoLabelWidthClass}`}
        >
          <span
            className={`inline-block -rotate-90 text-nowrap text-[11px] font-semibold tracking-wide sm:text-xs md:text-[10px] ${axisLabelClass}`}
          >
            Puerto
          </span>
        </div>
        <div
          className={`flex min-h-0 flex-col ${puertoNumbersWidthClass} ${isRealistic ? "" : puertoRowsInsetClass}`}
        >
          {isRealistic ? <OltLineCardHandleSpacer /> : null}
          <div
            className={
              isRealistic
                ? _portRowsChannelClass
                : `flex flex-col ${rowGapClass}`
            }
          >
            {rows.map((row) => (
              <div
                key={`axis-puerto-${row.port}`}
                className={`${CELL_ROW_CLASS} justify-center text-center text-[10px] font-semibold tabular-nums sm:text-xs md:text-[10px] ${axisLabelClass}`}
              >
                {row.port}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function OltDistribucionPlacaAxis({
  isRealistic,
  axisLabelClass,
  activeColumnGapClass,
  colsPerPage,
  slotTrackMin,
  gridColKeys,
  colCount,
  startCol,
}: {
  isRealistic: boolean;
  axisLabelClass: string;
  activeColumnGapClass: string;
  colsPerPage: number;
  slotTrackMin: string;
  gridColKeys: string[];
  colCount: number;
  startCol: number;
}) {
  const borderClass = isRealistic
    ? "border-[#3d4550]/90"
    : "border-(--table-stroke) dark:border-white/10";

  return (
    <div
      className={`col-start-2 row-start-2 min-w-0 border-t pt-2 ${borderClass}`}
    >
      <div
        className={`grid w-full ${activeColumnGapClass} text-center text-[10px] font-semibold tabular-nums sm:text-xs md:text-[10px] ${axisLabelClass}`}
        style={{
          gridTemplateColumns: `repeat(${Math.max(colsPerPage, 1)}, minmax(${slotTrackMin}, 1fr))`,
        }}
      >
        {gridColKeys.map((colKey, j) => (
          <div
            key={
              j < colCount
                ? `placa-h-${startCol + j}`
                : `placa-h-${colKey}-empty`
            }
          >
            {j < colCount ? startCol + j + 1 : "\u00a0"}
          </div>
        ))}
      </div>
      <p
        className={`mt-1 text-center text-[10px] font-semibold tracking-wide sm:text-xs md:text-[10px] ${axisLabelClass}`}
      >
        Placa
      </p>
    </div>
  );
}

function OltLineCardHandleSpacer() {
  return (
    <div
      className="relative z-1 mb-[2px] flex shrink-0 justify-center"
      aria-hidden
    >
      <span className="h-[3px] w-[72%] max-w-[1.75rem] opacity-0" />
    </div>
  );
}

function OltChassisTopPanel({ compact = false }: { compact?: boolean }) {
  const ventCount = compact ? 18 : 14;
  const ventSlotClass = compact
    ? "h-1 w-2.5 shrink-0 rounded-[1px] bg-[linear-gradient(180deg,#1a1f26,#0d1014)] shadow-[inset_0_2px_3px_rgb(0_0_0/0.8)]"
    : "h-1.5 w-3 shrink-0 rounded-[2px] bg-[linear-gradient(180deg,#1a1f26,#0d1014)] shadow-[inset_0_2px_3px_rgb(0_0_0/0.8)]";

  return (
    <div
      className={`relative z-1 flex shrink-0 items-center justify-center gap-[3px] border-b border-[#3d4550]/80 pb-1.5 ${compact ? "mb-1 px-2" : "mb-2 px-6"}`}
      aria-hidden
    >
      {Array.from({ length: ventCount }, (_, i) => (
        <span key={`olt-vent-${i}`} className={ventSlotClass} />
      ))}
    </div>
  );
}

function OltChassisRackEar({ side }: { side: "left" | "right" }) {
  const shellClass =
    side === "left"
      ? "rounded-l-md bg-[linear-gradient(90deg,#8a939f_0%,#5c6674_55%,#4a5360_100%)] shadow-[inset_0_1px_0_rgb(255_255_255/0.2),inset_1px_0_rgb(0_0_0/0.35)]"
      : "rounded-r-md bg-[linear-gradient(270deg,#8a939f_0%,#5c6674_55%,#4a5360_100%)] shadow-[inset_0_1px_0_rgb(255_255_255/0.2),inset_-1px_0_rgb(0_0_0/0.35)]";

  return (
    <div
      className={`hidden w-2.5 shrink-0 self-stretch sm:flex sm:flex-col sm:items-center sm:justify-center sm:gap-4 sm:py-5 ${shellClass}`}
      aria-hidden
    >
      {[0, 1, 2].map((i) => (
        <span
          key={`rack-screw-${side}-${i}`}
          className="h-1.5 w-1.5 rounded-full bg-[#1a1f26] shadow-[inset_0_1px_2px_rgb(0_0_0/0.9),0_0_0_1px_rgb(255_255_255/0.12)]"
        />
      ))}
    </div>
  );
}

function OltLineCardHandle() {
  return (
    <div className="relative z-1 mb-[2px] flex justify-center" aria-hidden>
      <span className="h-[3px] w-[72%] max-w-[1.75rem] rounded-[2px] bg-[linear-gradient(180deg,#9aa5b4,#6b7685)] shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_1px_0_rgb(0_0_0/0.35)]" />
    </div>
  );
}

function severityCellClass(severity: SlotPortSeverity): string {
  const hoverLift = "hover:brightness-[1.03]";
  switch (severity) {
    case SlotPortSeverity.Ok:
      return `bg-[var(--card-green)] text-white ${hoverLift} shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_1px_2px_rgb(0_0_0/0.12),0_0_14px_-6px_var(--card-green)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.1),0_1px_2px_rgb(0_0_0/0.45),0_0_16px_-5px_var(--card-green)]`;
    case SlotPortSeverity.Warning:
      return `bg-[var(--card-yellow)] text-black ${hoverLift} shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_1px_2px_rgb(0_0_0/0.1),0_0_14px_-6px_var(--card-yellow)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_1px_2px_rgb(0_0_0/0.4),0_0_16px_-5px_var(--card-yellow)]`;
    case SlotPortSeverity.Critical:
      return `bg-[var(--card-red)] text-white ${hoverLift} shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_1px_2px_rgb(0_0_0/0.14),0_0_14px_-6px_var(--card-red)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_1px_2px_rgb(0_0_0/0.5),0_0_16px_-5px_var(--card-red)]`;
    default:
      return `bg-[var(--card-green)] text-white ${hoverLift} shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_1px_2px_rgb(0_0_0/0.12),0_0_14px_-6px_var(--card-green)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.1),0_1px_2px_rgb(0_0_0/0.45),0_0_16px_-5px_var(--card-green)]`;
  }
}
