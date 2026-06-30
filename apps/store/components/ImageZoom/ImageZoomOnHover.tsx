"use client";

import React, {
  useCallback, useEffect, useMemo, useReducer, useRef, useState,
} from "react";
import { useProduct } from "@/components/Product/product-context";

/* ─── Zoom constants ─────────────────────────────────────────────────────── */
const ZOOM = 2.5;   // magnification factor in hover panel
const PANEL = 440;  // hover panel size in px (square)

/* ─── Icons ──────────────────────────────────────────────────────────────── */
function Ico({ d, size = 18, sw = 1.75, style }: {
  d: string | string[]; size?: number; sw?: number; style?: React.CSSProperties;
}) {
  const paths = Array.isArray(d) ? d : [d];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" style={style}>
      {paths.map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}

const I = {
  close:   "M6 18L18 6M6 6l12 12",
  chevL:   "M15.75 19.5L8.25 12l7.5-7.5",
  chevR:   "M8.25 4.5l7.5 7.5-7.5 7.5",
  zoomIn:  "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6",
  zoomOut: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6",
  reset:   "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99",
  expand:  "M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15",
  play:    "M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347c-.75.412-1.667-.13-1.667-.986V5.653z",
  film:    "M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0a1.125 1.125 0 00-1.125 1.125v8.25a1.125 1.125 0 001.125 1.125m17.25-11.25h.008v.008H20.25V8.25m-17.25 0h17.25",
};

/* ─── Lightbox animation ─────────────────────────────────────────────────── */
const MODAL_STYLES = `
@keyframes apt-hover-modal-in {
  from { opacity: 0; transform: scale(0.975); }
  to   { opacity: 1; transform: scale(1); }
}
.apt-hover-modal-enter { animation: apt-hover-modal-in 220ms cubic-bezier(0.16,1,0.3,1) both; }
`;

/* ─── Lightbox zoom reducer ──────────────────────────────────────────────── */
interface ZoomState { zoom: number; px: number; py: number }
type ZoomAction =
  | { type: "zoom"; z: number; px?: number; py?: number }
  | { type: "wheelZoom"; newZoom: number; cx: number; cy: number; w: number; h: number }
  | { type: "pan"; dx: number; dy: number }
  | { type: "reset" };

const Z0: ZoomState = { zoom: 1, px: 0, py: 0 };

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function zoomReducer(s: ZoomState, a: ZoomAction): ZoomState {
  switch (a.type) {
    case "zoom": {
      const z = clamp(a.z, 1, 6);
      const half = (z - 1) * 50;
      return { zoom: z, px: clamp(a.px ?? s.px, -half, half), py: clamp(a.py ?? s.py, -half, half) };
    }
    case "wheelZoom": {
      const z = clamp(a.newZoom, 1, 6);
      const newPx = s.px + a.cx * (1 / z - 1 / s.zoom) / a.w * 100;
      const newPy = s.py + a.cy * (1 / z - 1 / s.zoom) / a.h * 100;
      const half = (z - 1) * 50;
      return { zoom: z, px: clamp(newPx, -half, half), py: clamp(newPy, -half, half) };
    }
    case "pan": {
      const half = (s.zoom - 1) * 50;
      return { ...s, px: clamp(s.px + a.dx, -half, half), py: clamp(s.py + a.dy, -half, half) };
    }
    case "reset": return Z0;
    default:      return s;
  }
}

/* ─── Media item ─────────────────────────────────────────────────────────── */
interface MediaItem {
  type: "image" | "video" | "cad";
  src: string;
  preview: string;
  zoomed?: string;
  title?: string;
}

/* ─── Video helpers ──────────────────────────────────────────────────────── */
function videoEmbedUrl(url: string): string {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1&rel=0`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}?autoplay=1`;
  return "";
}
function isDirectVideo(url: string) { return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url); }

/* ─── Main-page thumbnail ────────────────────────────────────────────────── */
function MainThumb({ media, isActive, label, onClick }: {
  media: MediaItem; isActive: boolean; label: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={isActive}
      className="shrink-0 relative rounded-lg overflow-hidden transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      style={{
        width: 60, height: 60,
        border: `2px solid ${isActive ? "#0057b8" : "var(--border)"}`,
        boxShadow: isActive ? "0 0 0 3px rgba(0,87,184,0.18)" : "none",
        background: "var(--bg-raised)",
        opacity: isActive ? 1 : 0.65,
        transition: "border-color 150ms, box-shadow 150ms, opacity 150ms",
      }}
      onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
      onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.opacity = "0.65"; }}
    >
      {media.preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={media.preview} alt={label} className="w-full h-full object-contain p-1" loading="lazy" draggable={false} />
      ) : (
        <div className="w-full h-full flex items-center justify-center" style={{ background: "#0e1b24" }}>
          <Ico d={I.film} size={18} sw={1.25} style={{ color: "rgba(255,255,255,0.5)" }} />
        </div>
      )}
      {media.type === "video" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
          <div className="w-5 h-5 rounded-full flex items-center justify-center bg-white/90">
            <svg width={9} height={9} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ marginLeft: 1 }}>
              <path d={I.play} />
            </svg>
          </div>
        </div>
      )}
    </button>
  );
}

/* ─── Lightbox thumbnail ─────────────────────────────────────────────────── */
function Thumb({ src, isActive, label, isVideo, onClick }: {
  src: string; isActive: boolean; label: string; isVideo?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={isActive}
      className="shrink-0 relative rounded-lg overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
      style={{
        width: 48, height: 48,
        border: `2px solid ${isActive ? "#0057b8" : "rgba(255,255,255,0.15)"}`,
        boxShadow: isActive ? "0 0 0 3px rgba(0,87,184,0.3)" : "none",
        opacity: isActive ? 1 : 0.55,
        background: src ? "rgba(255,255,255,0.05)" : "#0e1b24",
        transition: "opacity 150ms, border-color 150ms, box-shadow 150ms",
      }}
      onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
      onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.opacity = "0.55"; }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={label} className="w-full h-full object-contain p-1" loading="lazy" draggable={false} />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Ico d={I.film} size={16} sw={1.25} style={{ color: "rgba(255,255,255,0.5)" }} />
        </div>
      )}
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-4 h-4 rounded-full flex items-center justify-center bg-white/85">
            <svg width={7} height={7} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ marginLeft: 1 }}>
              <path d={I.play} />
            </svg>
          </div>
        </div>
      )}
    </button>
  );
}

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function ImageZoomOnHover() {
  const {
    product: { image, alternativeImages, cadUrl, brand, supplierRef, videos },
    active,
    updateActive,
  } = useProduct();

  /* Lightbox */
  const [open, setOpen] = useState(false);
  const [zs, zdispatch] = useReducer(zoomReducer, Z0);

  /* Hover zoom */
  const [hovered, setHovered] = useState(false);
  const [cursor, setCursor] = useState({ x: 50, y: 50 }); // % within container
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0, fits: false });
  const containerRef = useRef<HTMLDivElement>(null);

  /* Pointer state for lightbox pan/pinch */
  const ptr1       = useRef<{ id: number; x: number; y: number } | null>(null);
  const ptr2       = useRef<{ id: number; x: number; y: number } | null>(null);
  const initDist   = useRef(0);
  const initZoom   = useRef(1);
  const lastPan    = useRef({ x: 0, y: 0 });
  const isPinching = useRef(false);
  const lastTap    = useRef<{ time: number; x: number; y: number } | null>(null);
  const swipeX     = useRef(0);
  const swipeY     = useRef(0);
  const modalRef   = useRef<HTMLDivElement>(null);
  const stageRef   = useRef<HTMLDivElement>(null);

  /* Unified media list */
  const mediaItems: MediaItem[] = useMemo(() => [
    ...(image ? [{ type: "image" as const, src: image.preview, preview: image.preview, zoomed: image.zoomed }] : []),
    ...(alternativeImages?.map((a) => ({ type: "image" as const, src: a.preview, preview: a.preview, zoomed: a.zoomed })) ?? []),
    ...(cadUrl ? [{ type: "cad" as const, src: cadUrl, preview: "", title: "CAD File" }] : []),
    ...(videos?.map((v) => ({ type: "video" as const, src: v.url, preview: v.thumbnail ?? "", title: v.title })) ?? []),
  ], [image, alternativeImages, cadUrl, videos]);

  const currentIdx  = mediaItems.findIndex((m) => m.src === active.item);
  const activeMedia = mediaItems[Math.max(0, currentIdx)];
  const hiResSrc    = active.type === "image" ? (activeMedia?.zoomed ?? active.item) : active.item;
  const hasMultiple = mediaItems.length > 1;
  const altStr      = `${brand ?? ""} ${supplierRef ?? ""}`.trim() || "Product";
  const canZoom     = active.type === "image" && !!activeMedia?.zoomed;

  /* ── Hover zoom handlers ── */
  function calcPanelPos() {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const left  = rect.right + 16;
    const top   = Math.max(8, rect.top + rect.height / 2 - PANEL / 2);
    const fits  = left + PANEL <= window.innerWidth - 8;
    setPanelPos({ top, left, fits });
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setCursor({ x, y });
  }

  function handleMouseEnter() {
    if (!canZoom) return;
    calcPanelPos();
    setHovered(true);
  }

  useEffect(() => {
    if (!hovered) return;
    const handler = () => calcPanelPos();
    window.addEventListener("scroll", handler, { passive: true });
    window.addEventListener("resize", handler, { passive: true });
    return () => {
      window.removeEventListener("scroll", handler);
      window.removeEventListener("resize", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hovered]);

  /* Background position: centers zoom panel on cursor */
  const bgX = Math.max(0, Math.min(100, (cursor.x * ZOOM - 50) / (ZOOM - 1)));
  const bgY = Math.max(0, Math.min(100, (cursor.y * ZOOM - 50) / (ZOOM - 1)));

  /* Lens on main image: 1/ZOOM fraction, clamped to stay inside */
  const lensHalf = 50 / ZOOM;
  const lensX    = Math.max(lensHalf, Math.min(100 - lensHalf, cursor.x)) - lensHalf;
  const lensY    = Math.max(lensHalf, Math.min(100 - lensHalf, cursor.y)) - lensHalf;
  const lensSize = 100 / ZOOM;

  /* ── Lightbox navigation ── */
  const navigate = useCallback((dir: -1 | 1) => {
    const next = currentIdx + dir;
    if (next < 0 || next >= mediaItems.length) return;
    const m = mediaItems[next];
    updateActive({ type: m.type, item: m.src });
    zdispatch({ type: "reset" });
  }, [currentIdx, mediaItems, updateActive]);

  const closeModal = useCallback(() => {
    setOpen(false);
    zdispatch({ type: "reset" });
  }, []);

  const selectMedia = (m: MediaItem) => {
    updateActive({ type: m.type, item: m.src });
    zdispatch({ type: "reset" });
  };

  /* ── Lightbox keyboard + focus trap ── */
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const container = modalRef.current;
    const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const getFocusable = () => container
      ? Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)) : [];
    requestAnimationFrame(() => { getFocusable()[0]?.focus(); });

    function onKey(e: KeyboardEvent) {
      if (e.key === "Tab") {
        const els = getFocusable();
        if (!els.length) return;
        const first = els[0], last = els[els.length - 1];
        if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
        else            { if (document.activeElement === last)  { e.preventDefault(); first.focus(); } }
        return;
      }
      if (e.key === "Escape")     closeModal();
      if (e.key === "ArrowRight") navigate(1);
      if (e.key === "ArrowLeft")  navigate(-1);
      if (active.type === "image") {
        if (e.key === "+" || e.key === "=") zdispatch({ type: "zoom", z: zs.zoom * 1.35 });
        if (e.key === "-")                  zdispatch({ type: "zoom", z: zs.zoom / 1.35 });
        if (e.key === "0")                  zdispatch({ type: "reset" });
      }
    }
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, closeModal, navigate, active.type, zs.zoom]);

  /* ── Lightbox wheel zoom ── */
  useEffect(() => {
    if (!open || active.type !== "image") return;
    const el = stageRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const rect = el!.getBoundingClientRect();
      zdispatch({
        type: "wheelZoom",
        newZoom: zs.zoom * (e.deltaY < 0 ? 1.18 : 1 / 1.18),
        cx: e.clientX - rect.left - rect.width / 2,
        cy: e.clientY - rect.top - rect.height / 2,
        w: rect.width, h: rect.height,
      });
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [open, active.type, zs.zoom]);

  /* ── Lightbox pointer (pan + pinch) ── */
  function onPtrDown(e: React.PointerEvent<HTMLDivElement>) {
    if (active.type !== "image") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    if (!ptr1.current) {
      ptr1.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
      lastPan.current = { x: e.clientX, y: e.clientY };
      isPinching.current = false;
    } else if (!ptr2.current) {
      ptr2.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
      initDist.current  = Math.hypot(ptr2.current.x - ptr1.current.x, ptr2.current.y - ptr1.current.y);
      initZoom.current  = zs.zoom;
      isPinching.current = true;
    }
  }

  function onPtrMove(e: React.PointerEvent<HTMLDivElement>) {
    if (active.type !== "image") return;
    if (ptr1.current?.id === e.pointerId) ptr1.current = { ...ptr1.current, x: e.clientX, y: e.clientY };
    if (ptr2.current?.id === e.pointerId) ptr2.current = { ...ptr2.current, x: e.clientX, y: e.clientY };
    if (ptr1.current && ptr2.current && isPinching.current) {
      const d = Math.hypot(ptr2.current.x - ptr1.current.x, ptr2.current.y - ptr1.current.y);
      const midX = (ptr1.current.x + ptr2.current.x) / 2;
      const midY = (ptr1.current.y + ptr2.current.y) / 2;
      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
      zdispatch({
        type: "wheelZoom",
        newZoom: initZoom.current * (d / initDist.current),
        cx: midX - rect.left - rect.width / 2,
        cy: midY - rect.top - rect.height / 2,
        w: rect.width, h: rect.height,
      });
    } else if (ptr1.current && zs.zoom > 1) {
      const dx = (e.clientX - lastPan.current.x) / zs.zoom * 0.9;
      const dy = (e.clientY - lastPan.current.y) / zs.zoom * 0.9;
      lastPan.current = { x: e.clientX, y: e.clientY };
      zdispatch({ type: "pan", dx, dy });
    }
  }

  function onPtrUp(e: React.PointerEvent<HTMLDivElement>) {
    if (ptr1.current?.id === e.pointerId) ptr1.current = null;
    if (ptr2.current?.id === e.pointerId) ptr2.current = null;
    if (!ptr1.current && !ptr2.current) isPinching.current = false;
  }

  function onDoubleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (active.type !== "image") return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const cx   = e.clientX - rect.left - rect.width / 2;
    const cy   = e.clientY - rect.top  - rect.height / 2;
    if (zs.zoom > 1.1) zdispatch({ type: "reset" });
    else zdispatch({ type: "wheelZoom", newZoom: 2.5, cx, cy, w: rect.width, h: rect.height });
  }

  function onTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    if (e.touches.length === 1) {
      swipeX.current = e.touches[0].clientX;
      swipeY.current = e.touches[0].clientY;
    }
  }

  function onTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    if (isPinching.current || e.changedTouches.length !== 1) return;
    const touch = e.changedTouches[0];
    const now   = Date.now();
    if (lastTap.current) {
      const dt   = now - lastTap.current.time;
      const dist = Math.hypot(touch.clientX - lastTap.current.x, touch.clientY - lastTap.current.y);
      if (dt < 320 && dist < 36 && active.type === "image") {
        e.preventDefault();
        lastTap.current = null;
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        const cx   = touch.clientX - rect.left - rect.width / 2;
        const cy   = touch.clientY - rect.top  - rect.height / 2;
        if (zs.zoom > 1.1) zdispatch({ type: "reset" });
        else zdispatch({ type: "wheelZoom", newZoom: 2.5, cx, cy, w: rect.width, h: rect.height });
        return;
      }
    }
    lastTap.current = { time: now, x: touch.clientX, y: touch.clientY };
    if (zs.zoom > 1 || active.type !== "image") return;
    const dx = touch.clientX - swipeX.current;
    const dy = touch.clientY - swipeY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 52) navigate(dx < 0 ? 1 : -1);
    else if (dy > 90 && Math.abs(dx) < 60) closeModal();
  }

  /* ── Render ── */
  const showZoomPanel = hovered && canZoom && panelPos.fits;

  return (
    <>
      <div>
        {/* ── Main image with hover zoom ── */}
        {(active.type === "image" || active.type === "cad") && (
          <div
            ref={active.type === "image" ? containerRef : undefined}
            className="relative border rounded-xl overflow-hidden transition-colors"
            onClick={() => setOpen(true)}
            onMouseMove={active.type === "image" ? handleMouseMove : undefined}
            onMouseEnter={active.type === "image" ? handleMouseEnter : undefined}
            onMouseLeave={() => setHovered(false)}
            style={{
              borderColor: showZoomPanel ? "rgba(0,87,184,0.4)" : "var(--border)",
              background: "var(--bg-raised)",
              minHeight: 240,
              cursor: active.type === "image"
                ? (canZoom ? "crosshair" : "zoom-in")
                : "pointer",
            }}
          >
            {active.type === "image" && (
              <div
                className="relative flex w-full h-72 sm:h-105 items-center justify-center p-4"
                style={{ aspectRatio: "1/1" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={altStr}
                  src={active.item}
                  className="max-w-full max-h-full object-contain"
                  fetchPriority="high"
                  loading="eager"
                  draggable={false}
                  style={{ userSelect: "none" }}
                />

                {/* Hover lens */}
                {showZoomPanel && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute rounded"
                    style={{
                      left: `${lensX}%`,
                      top:  `${lensY}%`,
                      width:  `${lensSize}%`,
                      height: `${lensSize}%`,
                      border: "2px solid rgba(0,87,184,0.7)",
                      background: "rgba(0,87,184,0.07)",
                      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.35)",
                      transition: "left 30ms linear, top 30ms linear",
                    }}
                  />
                )}

                {/* Expand hint */}
                {!showZoomPanel && (
                  <div
                    className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg text-white pointer-events-none"
                    style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
                    aria-hidden="true"
                  >
                    <Ico d={I.expand} size={13} sw={1.75} />
                  </div>
                )}

                {/* Hover label */}
                {canZoom && !showZoomPanel && (
                  <div
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] px-3 py-1.5 rounded-full pointer-events-none whitespace-nowrap hidden lg:flex items-center gap-1.5"
                    style={{ background: "rgba(0,0,0,0.45)", color: "rgba(255,255,255,0.75)", backdropFilter: "blur(4px)" }}
                    aria-hidden="true"
                  >
                    <Ico d={I.zoomIn} size={11} sw={2} />
                    Hover to zoom · Click for full view
                  </div>
                )}
              </div>
            )}

            {active.type === "cad" && (
              <embed src={active.item} className="w-full h-72 sm:h-105" aria-hidden="true" />
            )}
          </div>
        )}

        {/* ── Video inline player ── */}
        {active.type === "video" && (() => {
          const embed  = videoEmbedUrl(active.item);
          const direct = isDirectVideo(active.item);
          return (
            <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ aspectRatio: "16/9" }}>
              {embed ? (
                <iframe
                  src={embed}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                  title={altStr}
                />
              ) : direct ? (
                <video src={active.item} controls className="absolute inset-0 w-full h-full" playsInline />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm">
                  Video unavailable
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Thumbnail strip ── */}
        {hasMultiple && (
          <div
            className="flex gap-2 mt-3 overflow-x-auto py-0.5 px-0.5"
            style={{ scrollbarWidth: "none" }}
            role="list"
            aria-label="Product media thumbnails"
          >
            {mediaItems.map((media, i) => (
              <div key={i} role="listitem">
                <MainThumb
                  media={media}
                  isActive={active.item === media.src}
                  label={media.type === "video" ? (media.title ?? `Video ${i + 1}`) : `View image ${i + 1}`}
                  onClick={() => selectMedia(media)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Hover zoom panel (fixed, appears to the right of the image) ── */}
      {showZoomPanel && (
        <div
          aria-hidden="true"
          className="rounded-xl overflow-hidden pointer-events-none"
          style={{
            position: "fixed",
            top:    panelPos.top,
            left:   panelPos.left,
            width:  PANEL,
            height: PANEL,
            backgroundImage:    `url(${activeMedia!.zoomed})`,
            backgroundSize:     `${ZOOM * 100}%`,
            backgroundPosition: `${bgX}% ${bgY}%`,
            backgroundRepeat:   "no-repeat",
            backgroundColor:    "var(--bg-raised)",
            zIndex: 9999,
            border: "2px solid rgba(0,87,184,0.35)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          }}
        />
      )}

      {/* ── Fullscreen lightbox ── */}
      {open && (
        <>
          <style>{MODAL_STYLES}</style>
          <div
            ref={modalRef}
            className="fixed inset-0 z-600 flex flex-col apt-hover-modal-enter"
            style={{ background: "rgba(4,8,18,0.97)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
            role="dialog"
            aria-modal="true"
            aria-label={`${altStr} — full screen viewer`}
          >
            <div aria-live="polite" className="sr-only">
              {active.type === "image"
                ? (zs.zoom > 1 ? `Zoomed to ${Math.round(zs.zoom * 100)}%` : "Normal size")
                : active.type === "video" ? "Video" : "CAD file"}
            </div>

            {/* Top bar */}
            <div
              className="flex items-center justify-between px-3 sm:px-5 py-2.5 shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="flex items-center gap-1">
                {active.type === "image" && [
                  { icon: I.zoomOut, label: "Zoom out (–)", fn: () => zdispatch({ type: "zoom", z: zs.zoom / 1.4 }) },
                  { icon: I.reset,   label: "Reset zoom (0)", fn: () => zdispatch({ type: "reset" }) },
                  { icon: I.zoomIn,  label: "Zoom in (+)",  fn: () => zdispatch({ type: "zoom", z: zs.zoom * 1.4 }) },
                ].map(({ icon, label, fn }) => (
                  <button key={label} onClick={fn} aria-label={label}
                    className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-400"
                    style={{ color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.07)" }}>
                    <Ico d={icon} size={14} sw={1.75} />
                  </button>
                ))}
                {active.type === "image" && zs.zoom !== 1 && (
                  <span className="text-[11px] tabular-nums ml-1 px-1.5 py-0.5 rounded"
                    style={{ color: "rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.08)" }}>
                    {Math.round(zs.zoom * 100)}%
                  </span>
                )}
                {active.type === "video" && (
                  <span className="text-[12px] font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {activeMedia?.title ?? "Video"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {active.type === "image" && (
                  <span className="hidden md:block text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                    <kbd className="px-1.5 py-0.5 rounded font-mono text-[10px]"
                      style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)" }}>Esc</kbd>
                    {" "}close · double-click to zoom
                  </span>
                )}
                <button onClick={closeModal} aria-label="Close viewer"
                  className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-400"
                  style={{ color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.07)" }}>
                  <Ico d={I.close} size={16} sw={2} />
                </button>
              </div>
            </div>

            {/* Stage */}
            <div
              ref={stageRef}
              className="flex-1 relative overflow-hidden flex items-center justify-center select-none"
              style={{
                cursor: active.type === "image" ? (zs.zoom > 1 ? "grab" : "zoom-in") : "default",
                touchAction: active.type === "image" ? "none" : "auto",
              }}
              onPointerDown={onPtrDown}
              onPointerMove={onPtrMove}
              onPointerUp={onPtrUp}
              onPointerCancel={onPtrUp}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              onDoubleClick={onDoubleClick}
            >
              {/* Prev / Next */}
              {hasMultiple && currentIdx > 0 && (
                <button onClick={(e) => { e.stopPropagation(); navigate(-1); }} aria-label="Previous"
                  className="absolute left-3 z-10 w-10 h-10 flex items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-400"
                  style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", backdropFilter: "blur(4px)", minWidth: 40, minHeight: 40 }}>
                  <Ico d={I.chevL} size={18} sw={2.5} />
                </button>
              )}
              {hasMultiple && currentIdx < mediaItems.length - 1 && (
                <button onClick={(e) => { e.stopPropagation(); navigate(1); }} aria-label="Next"
                  className="absolute right-3 z-10 w-10 h-10 flex items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-400"
                  style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", backdropFilter: "blur(4px)", minWidth: 40, minHeight: 40 }}>
                  <Ico d={I.chevR} size={18} sw={2.5} />
                </button>
              )}

              {/* Image */}
              {active.type === "image" && (
                <div
                  aria-hidden="true"
                  style={{
                    transform: `scale(${zs.zoom}) translate(${zs.px}%, ${zs.py}%)`,
                    transition: "transform 150ms cubic-bezier(0.4,0,0.2,1)",
                    transformOrigin: "center",
                    pointerEvents: "none",
                    userSelect: "none",
                    willChange: "transform",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={hiResSrc}
                    alt={altStr}
                    className="block"
                    style={{
                      maxWidth: "min(80vw, 900px)",
                      maxHeight: "calc(100svh - 160px)",
                      objectFit: "contain",
                      filter: "drop-shadow(0 16px 60px rgba(0,0,0,0.8))",
                    }}
                    draggable={false}
                  />
                </div>
              )}

              {/* CAD */}
              {active.type === "cad" && (
                <embed src={active.item} style={{ width: "80vw", height: "70svh" }} aria-hidden="true" />
              )}

              {/* Video */}
              {active.type === "video" && (() => {
                const embed  = videoEmbedUrl(active.item);
                const direct = isDirectVideo(active.item);
                return (
                  <div style={{ width: "min(80vw, 900px)", aspectRatio: "16/9", position: "relative" }}>
                    {embed ? (
                      <iframe src={embed} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen
                        className="absolute inset-0 w-full h-full rounded-xl" title={altStr} />
                    ) : direct ? (
                      <video src={active.item} controls autoPlay
                        className="absolute inset-0 w-full h-full rounded-xl" playsInline />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-white/40">
                        Video unavailable
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Zoom hint */}
              {active.type === "image" && zs.zoom === 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[11px] px-3 py-1.5 rounded-full pointer-events-none whitespace-nowrap"
                  style={{ background: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.38)", backdropFilter: "blur(4px)" }}>
                  {mediaItems.length > 1
                    ? `${currentIdx + 1} / ${mediaItems.length} · ← → navigate · scroll or pinch to zoom`
                    : "Scroll or double-click to zoom"}
                </div>
              )}
              {active.type === "image" && zs.zoom > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full pointer-events-none"
                  style={{ background: "rgba(0,87,184,0.75)", color: "#fff", backdropFilter: "blur(4px)" }}>
                  <Ico d={I.zoomIn} size={11} sw={2} />
                  {Math.round(zs.zoom * 100)}% · double-click or press 0 to reset
                </div>
              )}
            </div>

            {/* Lightbox thumbnail strip */}
            {hasMultiple && (
              <div
                className="flex justify-center gap-2 px-4 py-3 shrink-0 overflow-x-auto"
                style={{ borderTop: "1px solid rgba(255,255,255,0.07)", scrollbarWidth: "none" }}
              >
                {mediaItems.map((media, i) => (
                  <Thumb
                    key={i}
                    src={media.preview}
                    isActive={active.item === media.src}
                    isVideo={media.type === "video"}
                    label={media.title ?? (media.type === "image" ? `Image ${i + 1}` : `Item ${i + 1}`)}
                    onClick={() => selectMedia(media)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
