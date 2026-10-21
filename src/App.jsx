import { useCallback, useRef, useState } from "react";
import Taskbar from "./components/Taskbar";
import Window from "./components/Window";
import NoteApp from "./components/apps/NoteApp";

/** Catalogue of launchable apps. `content` is whatever the window body renders. */
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
    width: 720,
    content: <p>Browser goes here.</p>,
  },
};

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

      <Taskbar onOpenApp={openWindow} />
    </div>
  );
}

export default App;
