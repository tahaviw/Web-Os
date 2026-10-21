import { useEffect, useState } from "react";

import startIcon from "../assets/Icons/start-icon.png";
import noteIcon from "../assets/Icons/note-icon.png";
import terminalIcon from "../assets/Icons/terminal-icon.png";
import browserIcon from "../assets/Icons/browser-icon.png";
import batteryIcon from "../assets/Icons/battery-icon.png";
import weatherIcon from "../assets/Icons/weather-icon.png";
import userIcon from "../assets/Icons/user-icon.png";

const QUICK_LAUNCH = [
  { id: "note", label: "Note App", icon: noteIcon },
  { id: "terminal", label: "Terminal", icon: terminalIcon },
  { id: "browser", label: "Browser", icon: browserIcon },
];

const WEATHER_TEXT = "22°C Clear";
const USER_NAME = "Tahaviw";

/** "Wed 11:34 AM" */

function formatClock(date) {
  const day = date.toLocaleDateString(undefined, { weekday: "short" });

  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${day} ${time}`;
}

function Taskbar({ onOpenApp }) {
  // Lazy initializer so the level is picked once on mount, not on every render.

  const [battery] = useState(() => Math.floor(Math.random() * 21) + 80);

  const [time, setTime] = useState(() => formatClock(new Date()));

  useEffect(() => {
    const timer = setInterval(() => setTime(formatClock(new Date())), 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <footer className="taskbar">
      <div className="taskbar-left">
        <button type="button" className="taskbar-start" aria-label="Start">
          <img src={startIcon} alt="" draggable={false} />
        </button>

        <div className="taskbar-divider" aria-hidden="true" />

        <div className="taskbar-apps">
          {QUICK_LAUNCH.map((app) => (
            <button
              key={app.id}
              type="button"
              className="taskbar-app"
              aria-label={app.label}
              title={app.label}
              onClick={() => onOpenApp?.(app.id)}
            >
              <img src={app.icon} alt="" draggable={false} />
            </button>
          ))}
        </div>
      </div>

      <div className="taskbar-tray">
        <div className="taskbar-chip">
          <img src={weatherIcon} alt="" draggable={false} />
          <span>{WEATHER_TEXT}</span>
        </div>

        <div className="taskbar-chip">
          <img src={batteryIcon} alt="" draggable={false} />
          <span>{battery}%</span>
        </div>

        <div className="taskbar-clock">{time}</div>

        <button type="button" className="taskbar-user" aria-label="Account">
          <img src={userIcon} alt="" draggable={false} />
          <span>{USER_NAME}</span>
        </button>
      </div>
    </footer>
  );
}
export default Taskbar;
