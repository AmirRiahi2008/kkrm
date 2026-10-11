"use client";

import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";
import Link from "./localized-link";
import "@/app/system-pointer.css";

export function PointerSystemLink({
  href,
  className,
  external = false,
  children,
}: {
  href: string;
  className: string;
  external?: boolean;
  children: ReactNode;
}) {
  const frame = useRef<number | null>(null);
  const element = useRef<HTMLAnchorElement | null>(null);
  const point = useRef({ x: 0, y: 0 });
  const finePointer = useRef<MediaQueryList | null>(null);
  const reducedMotion = useRef<MediaQueryList | null>(null);

  useEffect(() => {
    finePointer.current = window.matchMedia("(hover: hover) and (pointer: fine)");
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)");
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, []);

  function reset() {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    const card = element.current;
    if (!card) return;
    delete card.dataset.pointerActive;
    for (const property of [
      "--pointer-x",
      "--pointer-y",
      "--pointer-rotate-x",
      "--pointer-rotate-y",
    ])
      card.style.removeProperty(property);
  }

  function move(event: PointerEvent<HTMLAnchorElement>) {
    element.current = event.currentTarget;
    if (
      event.pointerType !== "mouse" ||
      !finePointer.current?.matches ||
      reducedMotion.current?.matches
    ) {
      reset();
      return;
    }
    point.current = { x: event.clientX, y: event.clientY };
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const card = element.current;
      if (!card?.isConnected) return;
      const bounds = card.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const x = Math.min(
        1,
        Math.max(0, (point.current.x - bounds.left) / bounds.width),
      );
      const y = Math.min(
        1,
        Math.max(0, (point.current.y - bounds.top) / bounds.height),
      );
      card.style.setProperty("--pointer-x", `${(x * 100).toFixed(2)}%`);
      card.style.setProperty("--pointer-y", `${(y * 100).toFixed(2)}%`);
      card.style.setProperty(
        "--pointer-rotate-x",
        `${((0.5 - y) * 10).toFixed(2)}deg`,
      );
      card.style.setProperty(
        "--pointer-rotate-y",
        `${((x - 0.5) * 10).toFixed(2)}deg`,
      );
      card.dataset.pointerActive = "true";
    });
  }

  const props = {
    className: `${className} system-pointer-card`,
    onPointerEnter: move,
    onPointerMove: move,
    onPointerLeave: reset,
    onPointerCancel: reset,
    onBlur: reset,
  };

  return external ? (
    <a {...props} href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ) : (
    <Link {...props} href={href} prefetch={false}>
      {children}
    </Link>
  );
}
