import { useCallback, useEffect, useRef, useState } from "react";

/** Keep at least this many pixels of the window on screen. */
const MIN_VISIBLE = 80;
const TASKBAR_HEIGHT = 48;

/** A window can never be shrunk below these, or its app stops being usable. */
const MIN_WIDTH = 320;
const MIN_HEIGHT = 200;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
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
      {/* Back square: only the edges the front one doesn't cover are drawn,
          because the button has no solid fill to occlude them with. */}
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

/**
 * Draggable, resizable, maximizable window shell.
 *
 * Drag and resize listeners are bound to `window` (not the header or the
 * grip) for the duration of the gesture. Binding them to the element you
 * pressed is the usual mistake: move the pointer faster than that element
 * and it escapes, leaving the window stuck mid-drag until you happen to
 * mouse-up back over it.
 */
function Window({
  title,
  width = 460,
  height,
  initialX,
  initialY,
  zIndex = 100,
  bodyClassName = "",
  onFocus,
  onClose,
  children,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  // `null` means "not positioned yet" — the window is centred by CSS instead
  // of by guessing pixel coordinates. The real height isn't known on the first
  // render (the `height` prop is optional), so any computed value would be a
  // guess that drifts with the content and the viewport.
  const [position, setPosition] = useState(() =>
    initialX === undefined && initialY === undefined
      ? null
      : { x: initialX ?? 0, y: initialY ?? 0 },
  );
  // Same reasoning as `position`, but for sizing: it starts from the props and
  // only diverges once the user actually resizes.
  const [size, setSize] = useState({ width, height });

  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  /** Cursor position relative to the window origin, captured on mousedown. */
  const grabOffsetRef = useRef({ x: 0, y: 0 });
  /** The listeners bound for the in-flight gesture, so we can tear them down. */
  const listenersRef = useRef(null);
  /** The rect we maximized over, so restore can put the window back exactly. */
  const restoreRectRef = useRef(null);

  const stopInteraction = useCallback(() => {
    const listeners = listenersRef.current;
    if (!listeners) return;

    window.removeEventListener("mousemove", listeners.move);
    window.removeEventListener("mouseup", listeners.up);
    listenersRef.current = null;
    setIsDragging(false);
    document.body.classList.remove("window-dragging", "window-resizing");
  }, []);

  // If a gesture is in flight when this window unmounts, don't leak listeners.
  useEffect(() => stopInteraction, [stopInteraction]);

  const startDrag = useCallback(
    (event) => {
      // Right/middle click shouldn't drag.
      if (event.button !== 0) return;
      // Clicking a header button must not also start a drag.
      if (event.target.closest(".closebutton, .maximizebutton")) return;
      // A maximized window is pinned to the screen — there is nowhere to go.
      if (isMaximized) return;

      onFocus?.();

      // Read the real on-screen rect rather than trusting `position`: the
      // window may still be CSS-centred (position === null), and this keeps
      // the handoff seamless either way.
      const rect = sectionRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Subtract this offset on every move so the window doesn't jump so its
      // top-left corner snaps under the cursor.
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
          MIN_VISIBLE - width,
          window.innerWidth - MIN_VISIBLE,
        );
        const nextY = clamp(moveEvent.clientY - grabY, 0, maxY);

        // Bail out if nothing changed, so dragging along one axis doesn't
        // schedule extra renders.
        setPosition((current) =>
          current && current.x === nextX && current.y === nextY
            ? current
            : { x: nextX, y: nextY },
        );
      };

      const handleMouseUp = () => stopInteraction();

      listenersRef.current = { move: handleMouseMove, up: handleMouseUp };
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      // Suppress text selection everywhere, not just inside the header.
      document.body.classList.add("window-dragging");
      setIsDragging(true);
    },
    [isMaximized, onFocus, stopInteraction, width],
  );

  const startResize = useCallback(
    (event) => {
      if (event.button !== 0) return;
      if (isMaximized) return;

      onFocus?.();

      const rect = sectionRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Sync state to what is actually on screen before measuring the drag.
      // The width may be narrower than `size.width` — the CSS max-width caps
      // it on small viewports — and resizing from the stored value would
      // make the window jump by that difference on the first mouse move.
      setPosition((current) =>
        current && current.x === rect.left && current.y === rect.top
          ? current
          : { x: rect.left, y: rect.top },
      );
      setSize((current) =>
        current.width === rect.width && current.height === rect.height
          ? current
          : { width: rect.width, height: rect.height },
      );

      const startPointer = { x: event.clientX, y: event.clientY };
      const startSize = { width: rect.width, height: rect.height };
      // Computed once at mousedown: a resize should not start clamping
      // differently halfway through because the window moved.
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

        setSize((current) =>
          current.width === nextWidth && current.height === nextHeight
            ? current
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
      const saved = restoreRectRef.current;
      if (!saved) return;
      // Restore to the measured rect, not to `position`/`size` as they were —
      // the window may have been CSS-centred, and the rect is the one thing
      // that is guaranteed to describe where it really was.
      setPosition({ x: saved.x, y: saved.y });
      setSize({ width: saved.width, height: saved.height });
      return;
    }

    const rect = section.getBoundingClientRect();
    restoreRectRef.current = {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    };
    setPosition({ x: 0, y: 0 });
    setSize({
      width: window.innerWidth,
      height: window.innerHeight - TASKBAR_HEIGHT,
    });
    setIsMaximized(true);
  }, [isMaximized, onFocus]);

  // A maximized window is sized in pixels, so it has to follow the viewport —
  // rotating a phone or dragging the browser edge would otherwise leave a gap.
  useEffect(() => {
    if (!isMaximized) return undefined;

    const fitToViewport = () =>
      setSize({
        width: window.innerWidth,
        height: window.innerHeight - TASKBAR_HEIGHT,
      });

    fitToViewport();
    window.addEventListener("resize", fitToViewport);
    return () => window.removeEventListener("resize", fitToViewport);
  }, [isMaximized]);

  // Escape leaves fullscreen, the convention every fullscreen UI shares.
  useEffect(() => {
    if (!isMaximized) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") toggleMaximize();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMaximized, toggleMaximize]);

  return (
    <section
      ref={sectionRef}
      className={`window${position === null ? " window--centered" : ""}${
        isDragging ? " window--dragging" : ""
      }${isMaximized ? " window--maximized" : ""}`}
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

      {/* Invisible corner hotspot — the grip marks itself on window hover. */}
      <div
        className="resizehandle"
        onMouseDown={startResize}
        aria-hidden="true"
      />
    </section>
  );
}

export default Window;
