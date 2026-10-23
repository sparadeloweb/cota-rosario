"use client";

import type { gsap as Gsap } from "gsap";
import { useEffect, useRef, type ReactNode } from "react";
import { MOTION_READY_FLAG } from "@/components/motion/flag";

type GsapApi = typeof Gsap;

const VISIBLE_THRESHOLD = 0.12;
const EASE = "power3.out";
const REVEAL_S = 0.7;
const GROW_S = 0.9;
const COUNT_S = 1.1;
const DRAW_S = 1.4;
const STAGGER_S = 0.06;
const REVEAL_OFFSET_PX = 14;

interface MotionProps {
  children: ReactNode;
  className?: string;
}

function formatFigure(value: number, decimals: number): string {
  return value.toFixed(decimals);
}

function animate(gsap: GsapApi, scope: HTMLElement) {
  const timeline = gsap.timeline({ paused: true, defaults: { ease: EASE } });
  const reveal = scope.querySelectorAll<HTMLElement>("[data-reveal]");
  if (reveal.length) {
    timeline.fromTo(reveal, { opacity: 0, y: REVEAL_OFFSET_PX }, { opacity: 1, y: 0, duration: REVEAL_S, stagger: STAGGER_S }, 0);
  }
  const growX = scope.querySelectorAll<HTMLElement>("[data-grow-x]");
  if (growX.length) {
    timeline.fromTo(growX, { scaleX: 0 }, { scaleX: 1, duration: GROW_S, stagger: STAGGER_S / 2, transformOrigin: "left center" }, 0.1);
  }
  const growY = scope.querySelectorAll<SVGElement | HTMLElement>("[data-grow-y]");
  if (growY.length) {
    timeline.fromTo(growY, { scaleY: 0 }, { scaleY: 1, duration: GROW_S, stagger: STAGGER_S / 3, transformOrigin: "center bottom" }, 0.1);
  }
  const draw = scope.querySelectorAll<SVGPathElement>("[data-draw]");
  if (draw.length) {
    timeline.fromTo(draw, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: DRAW_S, ease: "power2.inOut" }, 0.05);
  }
  scope.querySelectorAll<HTMLElement>("[data-count]").forEach((element) => {
    const target = Number(element.dataset.count);
    const decimals = Number(element.dataset.decimals ?? 0);
    if (!Number.isFinite(target)) {
      gsap.set(element, { opacity: 1 });
      return;
    }
    const status = { value: 0 };
    timeline.fromTo(element, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0);
    timeline.to(
      status,
      {
        value: target,
        duration: COUNT_S,
        ease: "power2.out",
        onUpdate: () => {
          element.textContent = formatFigure(status.value, decimals);
        },
        onComplete: () => {
          element.textContent = formatFigure(target, decimals);
        },
      },
      0,
    );
  });
  return timeline;
}

function markDone(root: HTMLElement) {
  root.dataset.motionDone = "true";
}

export function Motion({ children, className }: MotionProps) {
  const scope = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = scope.current;
    Reflect.set(window, MOTION_READY_FLAG, true);
    if (!root || document.documentElement.dataset.motion !== "on") {
      return;
    }
    let context: ReturnType<GsapApi["context"]> | null = null;
    let disposed = false;
    const play = async () => {
      try {
        const { gsap } = await import("gsap");
        if (disposed) {
          return;
        }
        context = gsap.context(() => {
          const timeline = animate(gsap, root);
          requestAnimationFrame(() => {
            markDone(root);
            timeline.play();
          });
        }, root);
      } catch (error: unknown) {
        console.warn("Motion library unavailable; showing content without animation.", error);
        markDone(root);
      }
    };
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          void play();
        }
      },
      { threshold: VISIBLE_THRESHOLD },
    );
    observer.observe(root);
    return () => {
      disposed = true;
      observer.disconnect();
      context?.revert();
    };
  }, []);

  return (
    <div ref={scope} data-motion-scope className={className}>
      {children}
    </div>
  );
}
