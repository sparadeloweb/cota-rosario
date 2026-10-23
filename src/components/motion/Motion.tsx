"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, type ReactNode } from "react";
import { MOTION_READY_FLAG } from "@/components/motion/flag";

gsap.registerPlugin(useGSAP);

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

function formatearCifra(valor: number, decimales: number): string {
  return valor.toFixed(decimales);
}

function animar(scope: HTMLElement) {
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
  scope.querySelectorAll<HTMLElement>("[data-count]").forEach((elemento) => {
    const destino = Number(elemento.dataset.count);
    const decimales = Number(elemento.dataset.decimals ?? 0);
    if (!Number.isFinite(destino)) {
      gsap.set(elemento, { opacity: 1 });
      return;
    }
    const estado = { valor: 0 };
    timeline.fromTo(elemento, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0);
    timeline.to(
      estado,
      {
        valor: destino,
        duration: COUNT_S,
        ease: "power2.out",
        onUpdate: () => {
          elemento.textContent = formatearCifra(estado.valor, decimales);
        },
        onComplete: () => {
          elemento.textContent = formatearCifra(destino, decimales);
        },
      },
      0,
    );
  });
  return timeline;
}

export function Motion({ children, className }: MotionProps) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const raiz = scope.current;
      (window as unknown as Record<string, boolean>)[MOTION_READY_FLAG] = true;
      if (!raiz || document.documentElement.dataset.motion !== "on") {
        return;
      }
      const timeline = animar(raiz);
      const observer = new IntersectionObserver(
        (entradas) => {
          if (entradas.some((entrada) => entrada.isIntersecting)) {
            observer.disconnect();
            requestAnimationFrame(() => {
              raiz.dataset.motionDone = "true";
              timeline.play();
            });
          }
        },
        { threshold: VISIBLE_THRESHOLD },
      );
      observer.observe(raiz);
      return () => observer.disconnect();
    },
    { scope },
  );

  return (
    <div ref={scope} data-motion-scope className={className}>
      {children}
    </div>
  );
}
