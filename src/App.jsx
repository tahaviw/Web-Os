import { useCallback, useRef, useState } from "react";
import Taskbar from "./components/Taskbar";
import Window from "./components/Window";
import NoteApp from "./components/apps/NoteApp";
import BrowserApp from "./components/apps/BrowserApp";
import browserIcon from "./assets/Icons/browser-icon.png";

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
    content: <p>Terminal goes here.</p>,
  },
  browser: {
    title: "Browser",
    width: 880,
    height: 580,
    bodyClassName: "windowbody--flush",
    content: <BrowserApp />,
  },
};

/**
 * Icons pinned to the desktop itself, stacked down the left edge.
 * `id` must be a key of APPS so the shortcut can only ever open a real app.
 */
const DESKTOP_SHORTCUTS = [
  { id: "browser", label: "Browser", icon: browserIcon },
];

function App() {
  // appId -> z-index. Presence in this object is what "is open" means.
  // z-index is only used for stacking, so it can live entirely in a ref —
  // no need to make it state and re-render the whole tree on every focus.
  const [openWindows, setOpenWindows] = useState({ welcome: 100 });
  const zCounterRef = useRef(100);

  const bringToFront = useCallback((appId) => {
    zCounterRef.current += 1;
    const z = zCounterRef.current;
    setOpenWindows((current) =>
      current[appId] === z ? current : { ...current, [appId]: z },
    );
  }, []);

  // Opens the app, or just re-focuses it if it is already open.
  const openWindow = useCallback(
    (appId) => {
      if (!APPS[appId]) return;
      bringToFront(appId);
    },
    [bringToFront],
  );

  const closeWindow = useCallback((appId) => {
    setOpenWindows((current) => {
      if (current[appId] === undefined) return current;
      const next = { ...current };
      delete next[appId];
      return next;
    });
  }, []);

  return (
    <div className="desktop">
      {Object.entries(openWindows).map(([appId, zIndex]) => {
        const app = APPS[appId];
        return (
          <Window
            key={appId}
            title={app.title}
            width={app.width}
            height={app.height}
            bodyClassName={app.bodyClassName}
            zIndex={zIndex}
            onFocus={() => bringToFront(appId)}
            onClose={() => closeWindow(appId)}
          >
            {app.content}
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
