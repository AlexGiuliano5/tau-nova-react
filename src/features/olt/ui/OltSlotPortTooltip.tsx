'use client';

import {
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useRef,
  useState
} from 'react';
import { createPortal } from 'react-dom';

import type { OltSlotPortCellTotals } from '@/features/olt/types/slot-port';
import { formatOntAggregateMetricLabel } from '@/features/ont/lib/ont-status-labels';

interface TooltipArgs {
  placa: number;
  port: number;
  totals: OltSlotPortCellTotals;
}

interface TriggerProps {
  ref: (node: HTMLElement | null) => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  onPointerDown: () => void;
  onFocus: () => void;
  onBlur: () => void;
}

interface TriggerRect {
  top: number;
  bottom: number;
  centerX: number;
}

/** Filas del tooltip, en el mismo orden que la versión anterior de TAU. */
const TOTAL_ROWS: ReadonlyArray<{
  key: keyof OltSlotPortCellTotals;
  label: string;
}> = [
  { key: 'good', label: formatOntAggregateMetricLabel('Good') },
  { key: 'reducedRobustness', label: formatOntAggregateMetricLabel('Reduced Robustness') },
  { key: 'switchedOff', label: formatOntAggregateMetricLabel('Switched Off') },
  { key: 'degraded', label: formatOntAggregateMetricLabel('Degraded') },
  { key: 'interrupted', label: formatOntAggregateMetricLabel('Interrupted') }
];

/** Separación entre la celda y el tooltip (px). */
const GAP = 8;

/** Margen mínimo respecto al borde del viewport (px). */
const VIEWPORT_MARGIN = 8;

export function useOltSlotPortTooltip({ placa, port, totals }: TooltipArgs): {
  triggerProps: TriggerProps;
  overlay: ReactNode;
} {
  const triggerRef = useRef<HTMLElement | null>(null);
  const [rect, setRect] = useState<TriggerRect | null>(null);

  const show = useCallback(() => {
    const el = triggerRef.current;
    if (!el) {
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, bottom: r.bottom, centerX: r.left + r.width / 2 });
  }, []);

  const hide = useCallback(() => {
    setRect(null);
  }, []);

  const setRefNode = useCallback((node: HTMLElement | null) => {
    triggerRef.current = node;
  }, []);

  const triggerProps: TriggerProps = {
    ref: setRefNode,
    onPointerEnter: show,
    onPointerLeave: hide,
    onPointerDown: hide,
    onFocus: show,
    onBlur: hide
  };

  const overlay =
    rect && typeof document !== 'undefined'
      ? createPortal(
          <OltSlotPortTooltipCard
            placa={placa}
            port={port}
            totals={totals}
            rect={rect}
          />,
          document.body
        )
      : null;

  return { triggerProps, overlay };
}

function OltSlotPortTooltipCard({
  placa,
  port,
  totals,
  rect
}: TooltipArgs & { rect: TriggerRect }) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) {
      return;
    }
    const { width, height } = card.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = rect.centerX - width / 2;
    left = Math.max(
      VIEWPORT_MARGIN,
      Math.min(left, vw - width - VIEWPORT_MARGIN)
    );

    let top = rect.top - GAP - height;
    if (top < VIEWPORT_MARGIN) {
      const below = rect.bottom + GAP;
      top = below + height <= vh - VIEWPORT_MARGIN ? below : VIEWPORT_MARGIN;
    }

    setPos({ top, left });
  }, [rect]);

  return (
    <div
      ref={cardRef}
      role="tooltip"
      style={{
        position: 'fixed',
        top: pos?.top ?? rect.top,
        left: pos?.left ?? rect.centerX,
        visibility: pos ? 'visible' : 'hidden'
      }}
      className="pointer-events-none z-[1000] w-max max-w-[15rem] rounded-lg border border-black/10 bg-(--card)/98 px-3 py-2 text-[11px] text-(--text-primary) shadow-[0_8px_22px_rgb(0_0_0/0.22)] backdrop-blur-[1px] dark:border-white/15 dark:bg-(--card)"
    >
      <p className="mb-1 border-b border-black/10 pb-1 font-semibold dark:border-white/15">
        Placa: {placa} / Puerto: {port}
      </p>
      <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5">
        {TOTAL_ROWS.map(({ key, label }) => (
          <div key={key} className="contents">
            <dt className="text-(--text-secondary)">{label}</dt>
            <dd className="text-right font-semibold tabular-nums">
              {totals[key]}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
