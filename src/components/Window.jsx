import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** Keep at least this many pixels of the window on screen. */
const MIN_VISIBLE = 80;
const TASKBAR_HEIGHT = 48;
const MIN_WIDTH = 320;
const MIN_HEIGHT = 200;
const STORAGE_PREFIX = "webos:v1";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/** Debounced localStorage write with unmount flush. */
function useDebouncedWrite(key, value, delay = 250) {
  const pendingRef = useRef(value);
  const timerRef = useRef(null);

  useEffect(() => {
    pendingRef.current = value;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {}
      timerRef.current = null;
    }, delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [key, value, delay]);

  useEffect(
    () => () => {
      if (pendingRef.current !== undefined) {
        try {
          localStorage.setItem(key, JSON.stringify(pendingRef.current));
        } catch {}
      }
    },
    [key],
  );
}

/** Read a single window's geometry. */
function loadWindowGeometry(appId) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}:win:${appId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

/** Clamp a restored rect so the window is never stranded off-screen. */
function clampIntoView(
  geom,
  { minVisible = 80, taskbarHeight = 48, headerHeight = 40 } = {},
) {
  if (!geom || geom.maximized) return geom;
  const w = geom.width ?? 460;
  const h = geom.height ?? 300;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const maxX = vw - minVisible;
  const minX = minVisible - w;
  const maxY = vh - taskbarHeight - headerHeight;
  const minY = 0;
  return {
    ...geom,
    x:
      geom.x !== null && geom.x !== undefined
        ? Math.min(Math.max(geom.x, minX), maxX)
        : null,
    y:
      geom.y !== null && geom.y !== undefined
        ? Math.min(Math.max(geom.y, minY), maxY)
        : null,
  };
}

function MaximizeGlyph() {
  return (
    <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
      <rect
        x="2.5"
        y="2.5"
        width="7"
        height="7"
        rx="0.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function RestoreGlyph() {
  return (
    <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
      <path
        d="M5 2 H10 V7 H7 M5 2 V5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <rect
        x="2"
        y="5"
        width="5"
        height="5"
        rx="0.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function Window({
  title,
  width = 460,
  height,
  initialX,
  initialY,
  zIndex = 100,
  bodyClassName = "",
  appId,
  onFocus,
  onClose,
  children,
}) {
  // ----- Persisted geometry (hydrated once on mount) -----
  const saved = useMemo(() => {
    if (!appId) return null;
    const raw = loadWindowGeometry(appId);
    return raw
      ? clampIntoView(raw, {
          minVisible: MIN_VISIBLE,
          taskbarHeight: TASKBAR_HEIGHT,
        })
      : null;
  }, [appId]);

  // ----- Local state mirrors the saved shape -----
  const [position, setPosition] = useState(() => {
    if (
      saved?.x !== undefined &&
      saved?.y !== undefined &&
      saved.x !== null &&
      saved.y !== null
    ) {
      return { x: saved.x, y: saved.y };
    }
    if (initialX !== undefined && initialY !== undefined) {
      return { x: initialX, y: initialY };
    }
    return null;
  });

  const [size, setSize] = useState(() => ({
    width: saved?.width ?? width,
    height: saved?.height ?? height,
  }));

  const [isMaximized, setIsMaximized] = useState(saved?.maximized ?? false);
  const [restoreRect, setRestoreRect] = useState(saved?.restore ?? null);

  // ----- Persist whenever geometry changes -----
  const snapshot = useMemo(
    () => ({
      x: position?.x ?? null,
      y: position?.y ?? null,
      width: size.width,
      height: size.height,
      maximized: isMaximized,
      restore: restoreRect,
    }),
    [position, size, isMaximized, restoreRect],
  );

  useDebouncedWrite(appId ? `${STORAGE_PREFIX}:win:${appId}` : "", snapshot);

  // ----- Drag / resize / maximize logic -----
  const [isDragging, setIsDragging] = useState(false);

  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const grabOffsetRef = useRef({ x: 0, y: 0 });
  const listenersRef = useRef(null);

  const stopInteraction = useCallback(() => {
    const listeners = listenersRef.current;
    if (!listeners) return;
    window.removeEventListener("mousemove", listeners.move);
    window.removeEventListener("mouseup", listeners.up);
    listenersRef.current = null;
    setIsDragging(false);
    document.body.classList.remove("window-dragging", "window-resizing");
  }, []);

  useEffect(() => stopInteraction, [stopInteraction]);

  const startDrag = useCallback(
    (event) => {
      if (event.button !== 0) return;
      if (event.target.closest(".closebutton, .maximizebutton")) return;
      if (isMaximized) return;
      onFocus?.();

      const rect = sectionRef.current?.getBoundingClientRect();
      if (!rect) return;

      grabOffsetRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };

      const headerHeight = headerRef.current?.offsetHeight ?? 40;
      const maxY = window.innerHeight - TASKBAR_HEIGHT - headerHeight;

      const handleMouseMove = (moveEvent) => {
        const { x: grabX, y: grabY } = grabOffsetRef.current;
        const nextX = clamp(
          moveEvent.clientX - grabX,
          MIN_VISIBLE - size.width,
          window.innerWidth - MIN_VISIBLE,
        );
        const nextY = clamp(moveEvent.clientY - grabY, 0, maxY);
        setPosition((cur) =>
          cur && cur.x === nextX && cur.y === nextY
            ? cur
            : { x: nextX, y: nextY },
        );
      };
      const handleMouseUp = () => stopInteraction();

      listenersRef.current = { move: handleMouseMove, up: handleMouseUp };
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.classList.add("window-dragging");
      setIsDragging(true);
    },
    [isMaximized, onFocus, stopInteraction, size.width],
  );

  const startResize = useCallback(
    (event) => {
      if (event.button !== 0) return;
      if (isMaximized) return;
      onFocus?.();

      const rect = sectionRef.current?.getBoundingClientRect();
      if (!rect) return;

      setPosition((cur) =>
        cur && cur.x === rect.left && cur.y === rect.top
          ? cur
          : { x: rect.left, y: rect.top },
      );
      setSize((cur) =>
        cur.width === rect.width && cur.height === rect.height
          ? cur
          : { width: rect.width, height: rect.height },
      );

      const startPointer = { x: event.clientX, y: event.clientY };
      const startSize = { width: rect.width, height: rect.height };
      const maxW = Math.max(
        MIN_WIDTH,
        window.innerWidth - rect.left - MIN_VISIBLE,
      );
      const maxH = Math.max(
        MIN_HEIGHT,
        window.innerHeight - TASKBAR_HEIGHT - rect.top,
      );

      const handleMouseMove = (moveEvent) => {
        const nextWidth = clamp(
          startSize.width + (moveEvent.clientX - startPointer.x),
          MIN_WIDTH,
          maxW,
        );
        const nextHeight = clamp(
          startSize.height + (moveEvent.clientY - startPointer.y),
          MIN_HEIGHT,
          maxH,
        );
        setSize((cur) =>
          cur.width === nextWidth && cur.height === nextHeight
            ? cur
            : { width: nextWidth, height: nextHeight },
        );
      };
      const handleMouseUp = () => stopInteraction();

      listenersRef.current = { move: handleMouseMove, up: handleMouseUp };
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.classList.add("window-resizing");
    },
    [isMaximized, onFocus, stopInteraction],
  );

  const toggleMaximize = useCallback(() => {
    const section = sectionRef.current;
    if (!section) return;
    onFocus?.();

    if (isMaximized) {
      setIsMaximized(false);
      if (restoreRect) {
        setPosition({ x: restoreRect.x, y: restoreRect.y });
        setSize({ width: restoreRect.width, height: restoreRect.height });
      }
      return;
    }

    const rect = section.getBoundingClientRect();
    setRestoreRect({
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    });
    setPosition({ x: 0, y: 0 });
    setSize({
      width: window.innerWidth,
      height: window.innerHeight - TASKBAR_HEIGHT,
    });
    setIsMaximized(true);
  }, [isMaximized, onFocus, restoreRect]);

  useEffect(() => {
    if (!isMaximized) return undefined;
    const fit = () =>
      setSize({
        width: window.innerWidth,
        height: window.innerHeight - TASKBAR_HEIGHT,
      });
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [isMaximized]);

  useEffect(() => {
    if (!isMaximized) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") toggleMaximize();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMaximized, toggleMaximize]);

  // ----- Render -----
  return (
    <section
      ref={sectionRef}
      className={`window${position === null ? " window--centered" : ""}${isDragging ? " window--dragging" : ""}${isMaximized ? " window--maximized" : ""}`}
      style={{
        width: size.width,
        height: size.height,
        zIndex,
        ...(position
          ? { transform: `translate3d(${position.x}px, ${position.y}px, 0)` }
          : null),
      }}
      onMouseDown={onFocus}
      aria-label={title}
    >
      <header
        ref={headerRef}
        className="windowheader"
        onMouseDown={startDrag}
        role="button"
        tabIndex={-1}
        aria-label={`${title} — drag to move`}
      >
        <span className="windowtitle">{title}</span>
        <div className="windowcontrols">
          <button
            type="button"
            className="maximizebutton"
            onClick={toggleMaximize}
            title={isMaximized ? "Restore" : "Maximize"}
            aria-label={isMaximized ? `Restore ${title}` : `Maximize ${title}`}
          >
            {isMaximized ? <RestoreGlyph /> : <MaximizeGlyph />}
          </button>
          <button
            type="button"
            className="closebutton"
            onClick={onClose}
            aria-label={`Close ${title}`}
          >
            ×
          </button>
        </div>
      </header>

      <div className={`windowbody${bodyClassName ? ` ${bodyClassName}` : ""}`}>
        {children}
      </div>

      <div
        className="resizehandle"
        onMouseDown={startResize}
        aria-hidden="true"
      />
    </section>
  );
}

export default Window;
