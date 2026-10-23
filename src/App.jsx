import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import Taskbar from "./components/Taskbar";
import Window from "./components/Window";
import NoteApp from "./components/apps/NoteApp";
import BrowserApp from "./components/apps/BrowserApp";
import TerminalApp from "./components/apps/TerminalApp";
import browserIcon from "./assets/Icons/browser-icon.png";

const STORAGE_PREFIX = "webos:v1";

const APPS = {
  welcome: {
    title: "Welcome to TahaviwOS",
    width: 460,
    content: (
      <>
        <h1 className="welcome-greeting">Hello there</h1>
        <p className="welcome-text">
          This is a desktop environment that runs entirely in your browser.
          Everything you see the wallpaper, the windows, the taskbar is built
          with React.
        </p>
        <p className="welcome-text">
          Drag any window by its title bar to move it around, and close it with
          the red dot in the corner.
        </p>
      </>
    ),
  },
  note: {
    title: "Note",
    width: 760,
    height: 480,
    bodyClassName: "windowbody--flush",
    content: <NoteApp />,
  },
  terminal: {
    title: "Terminal",
    width: 560,
    height: 360,
    bodyClassName: "windowbody--flush",
    Component: TerminalApp,
  },
  browser: {
    title: "Browser",
    width: 880,
    height: 580,
    bodyClassName: "windowbody--flush",
    content: <BrowserApp />,
  },
};

const DESKTOP_SHORTCUTS = [
  { id: "browser", label: "Browser", icon: browserIcon },
];

/** Load session from localStorage (open map + z counter). */
function loadSession() {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}:session`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

/** Debounced write for the session record. */
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

function App() {
  // ---- Session persistence (open windows + z-order) ----
  const savedSession = useMemo(() => loadSession(), []);

  const [openWindows, setOpenWindows] = useState(
    () => savedSession?.open ?? { welcome: 100 },
  );

  const zCounterRef = useRef(
    savedSession?.zCounter ??
      Math.max(100, ...Object.values(savedSession?.open ?? {})),
  );

  const bringToFront = useCallback((appId) => {
    zCounterRef.current += 1;
    const z = zCounterRef.current;
    setOpenWindows((cur) => (cur[appId] === z ? cur : { ...cur, [appId]: z }));
  }, []);

  const openWindow = useCallback(
    (appId) => {
      if (!APPS[appId]) return;
      bringToFront(appId);
    },
    [bringToFront],
  );

  const closeWindow = useCallback((appId) => {
    setOpenWindows((cur) => {
      if (cur[appId] === undefined) return cur;
      const next = { ...cur };
      delete next[appId];
      return next;
    });
  }, []);

  // Debounced write of the session (open map + z counter)
  useDebouncedWrite(
    `${STORAGE_PREFIX}:session`,
    useMemo(
      () => ({ open: openWindows, zCounter: zCounterRef.current }),
      [openWindows],
    ),
  );

  return (
    <div className="desktop">
      {Object.entries(openWindows).map(([appId, zIndex]) => {
        const app = APPS[appId];
        const AppComponent = app.Component;
        return (
          <Window
            key={appId}
            title={app.title}
            width={app.width}
            height={app.height}
            bodyClassName={app.bodyClassName}
            zIndex={zIndex}
            appId={appId}
            onFocus={() => bringToFront(appId)}
            onClose={() => closeWindow(appId)}
          >
            {AppComponent ? (
              <AppComponent
                onClose={() => closeWindow(appId)}
                onOpenApp={openWindow}
              />
            ) : (
              app.content
            )}
          </Window>
        );
      })}

      <div className="desktop-shortcuts">
        {DESKTOP_SHORTCUTS.filter((s) => APPS[s.id]).map((shortcut) => (
          <button
            key={shortcut.id}
            type="button"
            className="desktop-shortcut"
            onClick={() => openWindow(shortcut.id)}
            title={`Open ${shortcut.label}`}
          >
            <img
              className="desktop-shortcut-icon"
              src={shortcut.icon}
              alt=""
              draggable={false}
            />
            <span className="desktop-shortcut-label">{shortcut.label}</span>
          </button>
        ))}
      </div>

      <Taskbar onOpenApp={openWindow} />
    </div>
  );
}

export default App;
