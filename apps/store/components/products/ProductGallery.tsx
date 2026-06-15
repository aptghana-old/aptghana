"use client";

import { useState, useEffect, useRef, useReducer, useCallback } from "react";

/* ─── Types ─────────────────────────────────────────────────────────────────── */
export interface GalleryImage {
  url:     string;
  alt:     string;
  zoomUrl?: string;
}
export interface GalleryVideo {
  title:     string;
  url:       string;
  thumbnail?: string;
  language?:  string;
}
interface Props {
  images:      GalleryImage[];
  videos?:     GalleryVideo[];
  productName: string;
  sku?:        string;
}

/* ─── CDN high-res URL upgrade ──────────────────────────────────────────────── */
function toHiRes(url: string): string {
  if (!url) return url;
  if (url.includes("download.schneider-electric.com"))
    return url.replace(/rendition_\d+_(jpg|png|webp)/i, "rendition_1500_$1");
  return url;
}

/* ─── SVG icon helper ───────────────────────────────────────────────────────── */
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
  expand:  "M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15",
  close:   "M6 18L18 6M6 6l12 12",
  chevL:   "M15.75 19.5L8.25 12l7.5-7.5",
  chevR:   "M8.25 4.5l7.5 7.5-7.5 7.5",
  play:    ["M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z"],
  tag:     "M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3zM6 6h.008v.008H6V6z",
  zoomIn:  "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6",
  zoomOut: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6",
  reset:   "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99",
  image:   "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
  film:    "M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM12 10.5h.008v.008H12V10.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
};

/* ─── Fullscreen reducer ────────────────────────────────────────────────────── */
type FsTab = "images" | "videos";
interface FsState {
  open:    boolean;
  idx:     number;
  zoom:    number;
  px:      number;
  py:      number;
  tab:     FsTab;
  vidIdx:  number;
}
type FsAction =
  | { type: "open"; idx: number; tab?: FsTab }
  | { type: "close" }
  | { type: "nav";  idx: number }
  | { type: "zoom"; zoom: number; px?: number; py?: number }
  | { type: "pan";  dx: number; dy: number }
  | { type: "tab";  tab: FsTab }
  | { type: "vid";  vidIdx: number };

const FS0: FsState = { open: false, idx: 0, zoom: 1, px: 0, py: 0, tab: "images", vidIdx: 0 };

function fsReducer(s: FsState, a: FsAction): FsState {
  switch (a.type) {
    case "open":  return { ...s, open: true,  idx: a.idx, zoom: 1, px: 0, py: 0, tab: a.tab ?? "images" };
    case "close": return { ...s, open: false, zoom: 1, px: 0, py: 0 };
    case "nav":   return { ...s, idx: a.idx,  zoom: 1, px: 0, py: 0 };
    case "tab":   return { ...s, tab: a.tab,  zoom: 1, px: 0, py: 0 };
    case "vid":   return { ...s, vidIdx: a.vidIdx };
    case "zoom":  return { ...s,
      zoom: Math.min(6, Math.max(1, a.zoom)),
      px: a.px ?? s.px,
      py: a.py ?? s.py,
    };
    case "pan": {
      const half = (s.zoom - 1) * 50;
      return { ...s,
        px: Math.min(half, Math.max(-half, s.px + a.dx)),
        py: Math.min(half, Math.max(-half, s.py + a.dy)),
      };
    }
    default: return s;
  }
}

/* ─── Thumbnail button ──────────────────────────────────────────────────────── */
function Thumb({ img, active, idx, onClick, small = false }: {
  img: GalleryImage; active: boolean; idx: number; onClick: () => void; small?: boolean;
}) {
  const [err, setErr] = useState(false);
  const sz = small ? 48 : 68;
  return (
    <button
      onClick={onClick}
      aria-label={`View image ${idx + 1}`}
      aria-pressed={active}
      className="shrink-0 rounded-lg overflow-hidden transition-all duration-150 focus-visible:outline-none"
      style={{
        width: sz, height: sz,
        background: "var(--bg-raised)",
        border: `2px solid ${active ? "#0057b8" : "var(--border)"}`,
        boxShadow: active ? "0 0 0 3px rgba(0,87,184,0.15)" : "none",
        opacity: active ? 1 : 0.7,
      }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.opacity = "0.7"; }}
    >
      {img.url && !err ? (
        <img src={img.url} alt={img.alt} className="w-full h-full object-contain p-1.5"
          loading="lazy" draggable={false} onError={() => setErr(true)} />
      ) : (
        <div className="w-full h-full flex items-center justify-center" style={{ color: "var(--text-4)" }}>
          <Ico d={I.tag} size={small ? 14 : 18} sw={1} />
        </div>
      )}
    </button>
  );
}

/* ─── Video thumb button ────────────────────────────────────────────────────── */
function VideoThumb({ vid, active, onClick, small = false }: {
  vid: GalleryVideo; active: boolean; onClick: () => void; small?: boolean;
}) {
  const sz = small ? 48 : 68;
  return (
    <button
      onClick={onClick}
      aria-label={vid.title}
      aria-pressed={active}
      className="shrink-0 rounded-lg overflow-hidden relative transition-all duration-150 focus-visible:outline-none"
      style={{
        width: sz, height: sz,
        background: "#111827",
        border: `2px solid ${active ? "#0057b8" : "var(--border)"}`,
        boxShadow: active ? "0 0 0 3px rgba(0,87,184,0.15)" : "none",
        opacity: active ? 1 : 0.7,
      }}
    >
      {vid.thumbnail ? (
        <img src={vid.thumbnail} alt={vid.title} className="w-full h-full object-cover" loading="lazy" draggable={false} />
      ) : (
        <div className="w-full h-full flex items-center justify-center" style={{ color: "rgba(255,255,255,0.4)" }}>
          <Ico d={I.film} size={small ? 14 : 20} sw={1.25} />
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.65)" }}>
          <Ico d={I.play} size={10} sw={0} style={{ fill: "white", stroke: "none" }} />
        </div>
      </div>
    </button>
  );
}

/* ─── Fullscreen modal ──────────────────────────────────────────────────────── */
function FullscreenModal({ images, videos = [], productName, sku, state, dispatch }: {
  images: GalleryImage[];
  videos?: GalleryVideo[];
  productName: string;
  sku?: string;
  state: FsState;
  dispatch: React.Dispatch<FsAction>;
}) {
  const hasVideos   = videos.length > 0;
  const total       = images.length;
  const cur         = images[state.idx];
  const hiRes       = cur?.zoomUrl || toHiRes(cur?.url || "");
  const curVid      = videos[state.vidIdx];
  const [imgErr, setImgErr] = useState(false);

  // Pointer state for pinch zoom + pan
  const ptr1     = useRef<{ id: number; x: number; y: number } | null>(null);
  const ptr2     = useRef<{ id: number; x: number; y: number } | null>(null);
  const initDist = useRef(0);
  const initZoom = useRef(1);
  const lastPan  = useRef({ x: 0, y: 0 });

  // Swipe state
  const swipeX = useRef(0);
  const swipeY = useRef(0);

  useEffect(() => { setImgErr(false); }, [state.idx]);

  // Keyboard
  useEffect(() => {
    if (!state.open) return;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape")     dispatch({ type: "close" });
      if (e.key === "ArrowRight" && state.tab === "images")
        dispatch({ type: "nav", idx: (state.idx + 1) % total });
      if (e.key === "ArrowLeft" && state.tab === "images")
        dispatch({ type: "nav", idx: (state.idx - 1 + total) % total });
      if (e.key === "+" || e.key === "=") dispatch({ type: "zoom", zoom: state.zoom * 1.3 });
      if (e.key === "-")                  dispatch({ type: "zoom", zoom: state.zoom / 1.3 });
      if (e.key === "0")                  dispatch({ type: "zoom", zoom: 1, px: 0, py: 0 });
    }
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [state.open, state.idx, state.tab, state.zoom, total, dispatch]);

  function onPtrDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    if (!ptr1.current) {
      ptr1.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
      lastPan.current = { x: e.clientX, y: e.clientY };
    } else if (!ptr2.current) {
      ptr2.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
      initDist.current = Math.hypot(ptr2.current.x - ptr1.current.x, ptr2.current.y - ptr1.current.y);
      initZoom.current = state.zoom;
    }
  }
  function onPtrMove(e: React.PointerEvent) {
    if (ptr1.current?.id === e.pointerId) ptr1.current = { ...ptr1.current, x: e.clientX, y: e.clientY };
    if (ptr2.current?.id === e.pointerId) ptr2.current = { ...ptr2.current, x: e.clientX, y: e.clientY };
    if (ptr1.current && ptr2.current) {
      const d = Math.hypot(ptr2.current.x - ptr1.current.x, ptr2.current.y - ptr1.current.y);
      dispatch({ type: "zoom", zoom: initZoom.current * (d / initDist.current) });
    } else if (ptr1.current && state.zoom > 1) {
      const dx = (e.clientX - lastPan.current.x) / state.zoom * 0.6;
      const dy = (e.clientY - lastPan.current.y) / state.zoom * 0.6;
      lastPan.current = { x: e.clientX, y: e.clientY };
      dispatch({ type: "pan", dx, dy });
    }
  }
  function onPtrUp(e: React.PointerEvent) {
    if (ptr1.current?.id === e.pointerId) ptr1.current = null;
    if (ptr2.current?.id === e.pointerId) ptr2.current = null;
  }
  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 1) { swipeX.current = e.touches[0].clientX; swipeY.current = e.touches[0].clientY; }
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (state.zoom > 1 || state.tab !== "images") return;
    const dx = e.changedTouches[0].clientX - swipeX.current;
    const dy = e.changedTouches[0].clientY - swipeY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 48) {
      dispatch({ type: "nav", idx: dx < 0 ? (state.idx + 1) % total : (state.idx - 1 + total) % total });
    } else if (dy > 80 && Math.abs(dx) < 60) {
      dispatch({ type: "close" });
    }
  }

  if (!state.open) return null;

  const tabBtn = (tab: FsTab, icon: string, label: string) => (
    <button
      onClick={() => dispatch({ type: "tab", tab })}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
      style={{
        background: state.tab === tab ? "rgba(0,87,184,0.9)" : "rgba(255,255,255,0.08)",
        color: state.tab === tab ? "#fff" : "rgba(255,255,255,0.55)",
      }}
    >
      <Ico d={icon} size={13} sw={1.75} />
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[600] flex flex-col"
      style={{ background: "rgba(4,8,18,0.98)", backdropFilter: "blur(16px)" }}
      role="dialog" aria-modal="true" aria-label="Product media viewer">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2">
          {tabBtn("images", I.image, `Images${total > 1 ? ` (${total})` : ""}`)}
          {hasVideos && tabBtn("videos", I.film, `Videos (${videos.length})`)}
        </div>

        {state.tab === "images" && (
          <div className="flex items-center gap-1">
            {[
              { icon: I.zoomOut, label: "Zoom out", fn: () => dispatch({ type: "zoom", zoom: state.zoom / 1.4 }) },
              { icon: I.reset,   label: "Reset",    fn: () => dispatch({ type: "zoom", zoom: 1, px: 0, py: 0 }) },
              { icon: I.zoomIn,  label: "Zoom in",  fn: () => dispatch({ type: "zoom", zoom: state.zoom * 1.4 }) },
            ].map(({ icon, label, fn }) => (
              <button key={label} onClick={fn} aria-label={label}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.07)" }}>
                <Ico d={icon} size={15} sw={1.75} />
              </button>
            ))}
            {state.zoom > 1 && (
              <span className="text-[11px] tabular-nums px-1.5 py-0.5 rounded"
                style={{ color: "rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.08)" }}>
                {Math.round(state.zoom * 100)}%
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-[12px] hidden sm:block" style={{ color: "rgba(255,255,255,0.3)" }}>
            Press <kbd className="px-1.5 py-0.5 rounded text-[11px] font-mono"
              style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>Esc</kbd> to close
          </span>
          <button onClick={() => dispatch({ type: "close" })} aria-label="Close viewer"
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.07)" }}>
            <Ico d={I.close} size={16} sw={2} />
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left sidebar (desktop only) */}
        <div className="hidden lg:flex flex-col w-56 shrink-0 p-4 gap-4 overflow-y-auto"
          style={{ borderRight: "1px solid rgba(255,255,255,0.07)" }}>

          {/* Product info */}
          <div>
            <p className="text-[13px] font-semibold leading-snug line-clamp-3 mb-1"
              style={{ color: "rgba(255,255,255,0.85)" }}>{productName}</p>
            {sku && <p className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>{sku}</p>}
          </div>

          {/* Image thumbnails */}
          {state.tab === "images" && total > 1 && (
            <div>
              <p className="text-[11px] uppercase tracking-wider font-bold mb-2"
                style={{ color: "rgba(255,255,255,0.3)" }}>Images</p>
              <div className="flex flex-col gap-1.5">
                {images.map((img, i) => (
                  <Thumb key={i} img={img} active={i === state.idx} idx={i}
                    onClick={() => dispatch({ type: "nav", idx: i })} />
                ))}
              </div>
            </div>
          )}

          {/* Video list (sidebar) */}
          {state.tab === "videos" && hasVideos && (
            <div className="space-y-1.5">
              <p className="text-[11px] uppercase tracking-wider font-bold mb-2"
                style={{ color: "rgba(255,255,255,0.3)" }}>Videos</p>
              {videos.map((v, i) => (
                <button key={i} onClick={() => dispatch({ type: "vid", vidIdx: i })}
                  className="w-full flex items-start gap-2 p-2 rounded-lg text-left transition-colors"
                  style={{
                    background: i === state.vidIdx ? "rgba(0,87,184,0.25)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${i === state.vidIdx ? "rgba(0,87,184,0.5)" : "transparent"}`,
                  }}>
                  <div className="w-12 h-9 rounded shrink-0 relative overflow-hidden"
                    style={{ background: "#111" }}>
                    {v.thumbnail ? (
                      <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Ico d={I.play} size={14} sw={0} style={{ fill: "rgba(255,255,255,0.4)", stroke: "none" }} />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Ico d={I.play} size={12} sw={0} style={{ fill: "rgba(255,255,255,0.8)", stroke: "none" }} />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium line-clamp-2"
                      style={{ color: i === state.vidIdx ? "#fff" : "rgba(255,255,255,0.6)" }}>
                      {v.title}
                    </p>
                    {v.language && (
                      <span className="mt-0.5 inline-block text-[10px] px-1.5 py-0.5 rounded"
                        style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
                        {v.language.toUpperCase()}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Main content area ── */}
        {state.tab === "images" ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Image stage */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center"
              onPointerDown={onPtrDown} onPointerMove={onPtrMove}
              onPointerUp={onPtrUp} onPointerCancel={onPtrUp}
              onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
              style={{ cursor: state.zoom > 1 ? "grab" : "default", touchAction: "none" }}>

              {total > 1 && (
                <>
                  <button onClick={() => dispatch({ type: "nav", idx: (state.idx - 1 + total) % total })}
                    aria-label="Previous" className="absolute left-3 z-10 w-9 h-9 flex items-center justify-center rounded-full"
                    style={{ background: "rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.7)" }}>
                    <Ico d={I.chevL} size={16} sw={2.5} />
                  </button>
                  <button onClick={() => dispatch({ type: "nav", idx: (state.idx + 1) % total })}
                    aria-label="Next" className="absolute right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full"
                    style={{ background: "rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.7)" }}>
                    <Ico d={I.chevR} size={16} sw={2.5} />
                  </button>
                </>
              )}

              <div style={{
                transform: `scale(${state.zoom}) translate(${state.px}%, ${state.py}%)`,
                transition: "transform 150ms cubic-bezier(0.4,0,0.2,1)",
                transformOrigin: "center",
                pointerEvents: "none",
                userSelect: "none",
              }}>
                {hiRes && !imgErr ? (
                  <img src={hiRes} alt={cur?.alt || productName}
                    className="block"
                    style={{
                      maxWidth: "80vw",
                      maxHeight: "calc(100vh - 200px)",
                      objectFit: "contain",
                      filter: "drop-shadow(0 16px 56px rgba(0,0,0,0.75))",
                    }}
                    draggable={false}
                    onError={() => setImgErr(true)} />
                ) : (
                  <div className="flex flex-col items-center gap-4"
                    style={{ width: 280, height: 280, color: "rgba(255,255,255,0.2)" }}>
                    <Ico d={I.tag} size={56} sw={0.75} />
                    <p className="text-[13px]">Image unavailable</p>
                  </div>
                )}
              </div>

              {state.zoom === 1 && total > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[11px] px-3 py-1 rounded-full pointer-events-none"
                  style={{ background: "rgba(0,0,0,0.45)", color: "rgba(255,255,255,0.4)" }}>
                  {state.idx + 1} / {total} · Arrows to navigate · Pinch or scroll to zoom
                </div>
              )}
            </div>

            {/* Mobile thumbnail strip */}
            {total > 1 && (
              <div className="lg:hidden flex justify-center gap-2 px-4 py-3 shrink-0 overflow-x-auto scrollbar-hide"
                style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                {images.map((img, i) => (
                  <Thumb key={i} img={img} active={i === state.idx} idx={i} small
                    onClick={() => dispatch({ type: "nav", idx: i })} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ── Video tab ── */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Mobile video list */}
            {hasVideos && (
              <div className="lg:hidden flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide shrink-0"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {videos.map((v, i) => (
                  <VideoThumb key={i} vid={v} active={i === state.vidIdx}
                    onClick={() => dispatch({ type: "vid", vidIdx: i })} small />
                ))}
              </div>
            )}

            {/* Video player */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
              {curVid ? (
                <>
                  <div className="w-full max-w-4xl">
                    <div className="w-full aspect-video rounded-xl overflow-hidden"
                      style={{ background: "#000", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
                      <iframe
                        src={curVid.url}
                        title={curVid.title}
                        allowFullScreen
                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        className="w-full h-full"
                        aria-label={curVid.title}
                      />
                    </div>
                    <div className="mt-4 flex items-start justify-between gap-4">
                      <p className="text-[14px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
                        {curVid.title}
                      </p>
                      {curVid.language && (
                        <span className="shrink-0 text-[11px] px-2 py-0.5 rounded"
                          style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                          {curVid.language.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p style={{ color: "rgba(255,255,255,0.3)" }}>No video selected</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main gallery component ────────────────────────────────────────────────── */
export default function ProductGallery({ images, videos = [], productName, sku }: Props) {
  const [activeIdx, setActiveIdx]   = useState(0);
  const [mainErr, setMainErr]       = useState(false);
  const [hovering, setHovering]     = useState(false);
  const [mousePos, setMousePos]     = useState({ x: 0.5, y: 0.5 });
  const [hiResReady, setHiResReady] = useState(false);
  const [imgHeight, setImgHeight]   = useState(0);
  const [fs, dispatch]              = useReducer(fsReducer, FS0);

  const mainImgRef = useRef<HTMLDivElement>(null);
  const hasVideos  = videos.length > 0;
  const ZOOM       = 3;

  // Normalise images — always at least one entry
  const imgs = images.filter((i) => i?.url);
  if (imgs.length === 0) imgs.push({ url: "", alt: productName });

  const cur   = imgs[activeIdx];
  const hiUrl = cur?.zoomUrl || toHiRes(cur?.url || "");

  // Measure main image height for zoom panel sizing
  useEffect(() => {
    const el = mainImgRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setImgHeight(entry.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Preload hi-res on hover start / active change
  useEffect(() => {
    setHiResReady(false);
    if (!hiUrl) return;
    const img = new Image();
    img.onload = () => setHiResReady(true);
    img.src = hiUrl;
    return () => { img.onload = null; };
  }, [activeIdx, hiUrl]);

  // Reset error on tab change
  useEffect(() => { setMainErr(false); }, [activeIdx]);

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: Math.min(1, Math.max(0, (e.clientX - r.left)  / r.width)),
      y: Math.min(1, Math.max(0, (e.clientY - r.top)   / r.height)),
    });
  }

  // Mobile swipe
  const swipeX = useRef(0);
  function onTouchStart(e: React.TouchEvent) { swipeX.current = e.touches[0].clientX; }
  function onTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - swipeX.current;
    if (Math.abs(dx) > 48) setActiveIdx((p) => dx < 0 ? (p + 1) % imgs.length : (p - 1 + imgs.length) % imgs.length);
  }

  // Keyboard nav
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") setActiveIdx((p) => (p + 1) % imgs.length);
    if (e.key === "ArrowLeft")  setActiveIdx((p) => (p - 1 + imgs.length) % imgs.length);
    if (e.key === "Enter")      dispatch({ type: "open", idx: activeIdx });
  }

  const showZoomPanel = hovering && hiResReady && imgHeight > 0;

  return (
    <>
      {/* ── Gallery layout ── */}
      <div className="relative" onKeyDown={onKeyDown}>
        <div className="flex gap-3">

          {/* Vertical thumbnail strip (desktop) */}
          {imgs.length > 1 && (
            <div className="hidden sm:flex flex-col gap-2 overflow-y-auto scrollbar-hide shrink-0"
              style={{ width: 72, maxHeight: 520 }}
              aria-label="Product image thumbnails">
              {imgs.map((img, i) => (
                <Thumb key={i} img={img} active={i === activeIdx} idx={i}
                  onClick={() => { setActiveIdx(i); setMainErr(false); }} />
              ))}
              {/* Video play thumbnail */}
              {hasVideos && (
                <button
                  onClick={() => dispatch({ type: "open", idx: 0, tab: "videos" })}
                  aria-label="View videos"
                  className="shrink-0 rounded-lg overflow-hidden relative transition-all duration-150 focus-visible:outline-none"
                  style={{
                    width: 68, height: 68,
                    background: "#111827",
                    border: "2px solid var(--border)",
                    opacity: 0.7,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
                >
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                    <Ico d={I.play} size={20} sw={0} style={{ fill: "rgba(255,255,255,0.7)", stroke: "none" }} />
                    <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>
                      {videos.length} video{videos.length > 1 ? "s" : ""}
                    </span>
                  </div>
                </button>
              )}
            </div>
          )}

          {/* Main image */}
          <div className="relative flex-1 min-w-0">
            <div
              ref={mainImgRef}
              className="relative rounded-2xl overflow-hidden select-none"
              style={{
                aspectRatio: "1/1",
                background: "var(--bg-raised)",
                border: "1px solid var(--border)",
                cursor: hovering ? "crosshair" : "zoom-in",
              }}
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
              onMouseMove={onMouseMove}
              onClick={() => dispatch({ type: "open", idx: activeIdx })}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              tabIndex={0}
              role="button"
              aria-label={`${cur?.alt || productName} — click to view fullscreen`}
            >
              {/* Base image */}
              {cur?.url && !mainErr ? (
                <img
                  key={cur.url}
                  src={cur.url}
                  alt={cur.alt || productName}
                  className="absolute inset-0 w-full h-full object-contain p-6 md:p-8"
                  style={{
                    opacity: showZoomPanel ? 0 : 1,
                    transition: "opacity 100ms",
                  }}
                  draggable={false}
                  onError={() => setMainErr(true)}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ color: "var(--text-4)" }}>
                  <Ico d={I.tag} size={48} sw={0.75} />
                </div>
              )}

              {/* Hi-res zoom overlay (fades in when ready) */}
              {hiUrl && (
                <div
                  className="absolute inset-0"
                  aria-hidden="true"
                  style={{
                    backgroundImage: `url("${hiUrl}")`,
                    backgroundSize: `${ZOOM * 100}%`,
                    backgroundPosition: `${mousePos.x * 100}% ${mousePos.y * 100}%`,
                    backgroundRepeat: "no-repeat",
                    opacity: showZoomPanel ? 1 : 0,
                    transition: "opacity 100ms",
                    pointerEvents: "none",
                  }}
                />
              )}

              {/* Lens indicator */}
              {showZoomPanel && (
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    width: `${100 / ZOOM}%`,
                    height: `${100 / ZOOM}%`,
                    left: `${mousePos.x * 100}%`,
                    top:  `${mousePos.y * 100}%`,
                    transform: "translate(-50%,-50%)",
                    border: "1.5px solid rgba(0,87,184,0.7)",
                    borderRadius: 4,
                    background: "rgba(0,87,184,0.05)",
                    boxShadow: "0 0 0 1px rgba(255,255,255,0.1)",
                    pointerEvents: "none",
                  }}
                />
              )}

              {/* Hi-res loading spinner */}
              {hovering && !hiResReady && hiUrl && (
                <div className="absolute top-3 left-3 w-4 h-4 rounded-full border-2 border-transparent"
                  style={{
                    borderTopColor: "#0057b8",
                    animation: "spin 0.7s linear infinite",
                    pointerEvents: "none",
                  }}
                  aria-hidden="true"
                />
              )}

              {/* Expand to fullscreen */}
              <button
                onClick={(e) => { e.stopPropagation(); dispatch({ type: "open", idx: activeIdx }); }}
                aria-label="View fullscreen"
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                style={{
                  background: "rgba(0,0,0,0.45)",
                  backdropFilter: "blur(4px)",
                  color: "#fff",
                  opacity: hovering ? 1 : 0,
                  transition: "opacity 150ms",
                  pointerEvents: hovering ? "auto" : "none",
                }}
              >
                <Ico d={I.expand} size={13} sw={1.75} />
              </button>

              {/* Image counter */}
              {imgs.length > 1 && !hovering && (
                <div className="absolute bottom-3 right-3 text-[11px] font-semibold px-2 py-0.5 rounded-md text-white"
                  style={{ background: "rgba(0,0,0,0.4)" }}>
                  {activeIdx + 1} / {imgs.length}
                </div>
              )}

              {/* Zoom / hover hint */}
              <div
                className="absolute bottom-3 left-3 flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg text-white pointer-events-none"
                style={{
                  background: showZoomPanel ? "rgba(0,87,184,0.75)" : "rgba(0,0,0,0.38)",
                  backdropFilter: "blur(4px)",
                  opacity: hovering ? 1 : 0,
                  transition: "opacity 150ms, background 150ms",
                }}
              >
                <Ico d={I.zoomIn} size={11} sw={2} />
                {showZoomPanel ? `${ZOOM * 100}% zoom` : "Loading hi-res…"}
              </div>

              {/* Mobile nav arrows */}
              {imgs.length > 1 && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); setActiveIdx((p) => (p - 1 + imgs.length) % imgs.length); }}
                    aria-label="Previous" className="sm:hidden absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full"
                    style={{ background: "rgba(0,0,0,0.38)", color: "#fff" }}>
                    <Ico d={I.chevL} size={15} sw={2.5} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setActiveIdx((p) => (p + 1) % imgs.length); }}
                    aria-label="Next" className="sm:hidden absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full"
                    style={{ background: "rgba(0,0,0,0.38)", color: "#fff" }}>
                    <Ico d={I.chevR} size={15} sw={2.5} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Side zoom panel (desktop, floats over purchase panel) ── */}
        {showZoomPanel && (
          <div
            aria-hidden="true"
            aria-label="Zoomed product view"
            className="hidden xl:block absolute rounded-2xl overflow-hidden"
            style={{
              left: "calc(100% + 14px)",
              top: 0,
              width: 400,
              height: imgHeight,
              zIndex: 50,
              backgroundImage: `url("${hiUrl}")`,
              backgroundSize: `${ZOOM * 100}%`,
              backgroundPosition: `${mousePos.x * 100}% ${mousePos.y * 100}%`,
              backgroundRepeat: "no-repeat",
              border: "1.5px solid var(--border-hi)",
              boxShadow: "var(--shadow-3)",
              background: "var(--bg-surface)",
            }}
          >
            {/* Panel border overlay */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                backgroundImage: `url("${hiUrl}")`,
                backgroundSize: `${ZOOM * 100}%`,
                backgroundPosition: `${mousePos.x * 100}% ${mousePos.y * 100}%`,
                backgroundRepeat: "no-repeat",
              }}
            />
            {/* Zoom label */}
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg text-white pointer-events-none"
              style={{ background: "rgba(0,87,184,0.75)", backdropFilter: "blur(4px)" }}>
              <Ico d={I.zoomIn} size={11} sw={2} />
              {ZOOM}× zoom
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile horizontal thumbnails ── */}
      {imgs.length > 1 && (
        <div className="sm:hidden flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-0.5">
          {imgs.map((img, i) => (
            <Thumb key={i} img={img} active={i === activeIdx} idx={i}
              onClick={() => { setActiveIdx(i); setMainErr(false); }} />
          ))}
          {hasVideos && (
            <VideoThumb vid={videos[0]} active={false}
              onClick={() => dispatch({ type: "open", idx: 0, tab: "videos" })} />
          )}
        </div>
      )}

      {/* ── Fullscreen modal ── */}
      <FullscreenModal
        images={imgs}
        videos={videos}
        productName={productName}
        sku={sku}
        state={fs}
        dispatch={dispatch}
      />
    </>
  );
}
