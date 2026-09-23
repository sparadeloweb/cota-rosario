"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

const SNAP_RATIO = 0.35;
const FLICK_PX = 18;
const SNAP_TRANSITION = "translate 320ms cubic-bezier(0.32, 0.72, 0, 1)";

interface BottomSheetProps {
  children: ReactNode;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

function peekPx(): number {
  return Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--sheet-peek")) || 0;
}

export function BottomSheet({ children }: BottomSheetProps) {
  const [open, setOpen] = useState(false);
  const [dragPx, setDragPx] = useState<number | null>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const dragStart = useRef<{ y: number; open: boolean; travel: number } | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    document.documentElement.dataset.sheetOpen = String(open);
    return () => {
      delete document.documentElement.dataset.sheetOpen;
    };
  }, [open]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const height = sheetRef.current?.offsetHeight ?? 0;
    dragStart.current = { y: event.clientY, open, travel: Math.max(0, height - peekPx()) };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = dragStart.current;
    if (!start) {
      return;
    }
    const base = start.open ? 0 : start.travel;
    setDragPx(Math.min(start.travel, Math.max(0, base + event.clientY - start.y)));
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = dragStart.current;
    if (!start) {
      return;
    }
    const delta = event.clientY - start.y;
    dragStart.current = null;
    setDragPx(null);
    if (Math.abs(delta) < FLICK_PX) {
      setOpen(!start.open);
      return;
    }
    const position = start.open ? delta : start.travel + delta;
    setOpen(position < start.travel * (1 - SNAP_RATIO));
  };

  const restingClass = open ? "translate-y-0" : "translate-y-[calc(100%-var(--sheet-peek))]";
  const style: CSSProperties = dragPx !== null ? { translate: `0 ${dragPx}px`, transition: "none" } : { transition: reduced ? "none" : SNAP_TRANSITION };

  return (
    <aside
      ref={sheetRef}
      data-sheet-open={open}
      className={`glass-sheet lg:glass-rail fixed inset-x-0 bottom-0 z-30 flex h-[86dvh] flex-col rounded-t-2xl border-t border-rule shadow-[0_-18px_48px_-24px_rgb(0_0_0/0.9)] ${restingClass} lg:static lg:z-20 lg:h-auto lg:w-[27rem] lg:shrink-0 lg:translate-y-0 lg:rounded-none lg:border-t-0 lg:border-r lg:shadow-none xl:w-[30rem]`}
      style={style}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-label={open ? "Contraer el panel" : "Expandir el panel"}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen((current) => !current);
          }
        }}
        className="flex shrink-0 cursor-grab touch-none select-none items-center justify-center py-3 active:cursor-grabbing lg:hidden"
      >
        <span className="h-1 w-10 rounded-full bg-rule" aria-hidden="true" />
      </div>
      <div className={`min-h-0 flex-1 lg:overflow-y-auto ${open ? "overflow-y-auto" : "overflow-hidden"}`}>{children}</div>
    </aside>
  );
}
