import { useCallback, useEffect, useRef, useState } from "react";

/** Keep at least this many pixels of the window on screen. */
const MIN_VISIBLE = 80;
const TASKBAR_HEIGHT = 48;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Draggable, closable window shell.
 *
 * Drag listeners are bound to `window` (not the header) for the duration of
 * the drag. Binding them to the header is the usual mistake: move the mouse
 * faster than the header and the pointer escapes it, leaving the window stuck
 * mid-drag until you happen to mouse-up back over the header.
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
  const [position, setPosition] = useState(() => ({
    // Default to horizontally centred, a little below the top edge.
    x: initialX ?? Math.max(MIN_VISIBLE, (window.innerWidth - width) / 2),
    y: initialY ?? Math.round(window.innerHeight * 0.15),
  }));

  const headerRef = useRef(null);
  /** Cursor position relative to the window origin, captured on mousedown. */
  const grabOffsetRef = useRef({ x: 0, y: 0 });
  /** The listeners bound for the in-flight drag, so we can tear them down. */
  const listenersRef = useRef(null);

  const stopDrag = useCallback(() => {
    const listeners = listenersRef.current;
    if (!listeners) return;

    window.removeEventListener("mousemove", listeners.move);
    window.removeEventListener("mouseup", listeners.up);
    listenersRef.current = null;
    setIsDragging(false);
    document.body.classList.remove("window-dragging");
  }, []);

  // If a drag is in flight when this window unmounts, don't leak the listeners.
  useEffect(() => stopDrag, [stopDrag]);

  const startDrag = useCallback(
    (event) => {
      // Right/middle click shouldn't drag.
      if (event.button !== 0) return;
      // Clicking the close button must not also start a drag.
      if (event.target.closest(".closebutton")) return;

      onFocus?.();

      // Subtract this offset on every move so the window doesn't jump so its
      // top-left corner snaps under the cursor.
      grabOffsetRef.current = {
        x: event.clientX - position.x,
        y: event.clientY - position.y,
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
          current.x === nextX && current.y === nextY
            ? current
            : { x: nextX, y: nextY },
        );
      };

      const handleMouseUp = () => stopDrag();

      listenersRef.current = { move: handleMouseMove, up: handleMouseUp };
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      // Suppress text selection everywhere, not just inside the header.
      document.body.classList.add("window-dragging");
      setIsDragging(true);
    },
    [onFocus, position.x, position.y, stopDrag, width],
  );

  return (
    <section
      className={`window${isDragging ? " window--dragging" : ""}`}
      style={{
        width,
        height,
        zIndex,
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
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
        <button
          type="button"
          className="closebutton"
          onClick={onClose}
          aria-label={`Close ${title}`}
        >
          ×
        </button>
      </header>

      <div className={`windowbody${bodyClassName ? ` ${bodyClassName}` : ""}`}>
        {children}
      </div>
    </section>
  );
}

export default Window;
