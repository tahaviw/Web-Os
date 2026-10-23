import { useEffect, useState } from "react";
import StartMenu from "./StartMenu";

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
  const [battery] = useState(() => Math.floor(Math.random() * 21) + 80);
  const [time, setTime] = useState(() => formatClock(new Date()));
  const [startOpen, setStartOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(formatClock(new Date())), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleStart = () => setStartOpen((prev) => !prev);
  const closeStart = () => setStartOpen(false);

  return (
    <>
      <footer className="taskbar">
        <div className="taskbar-left">
          <button
            type="button"
            className="taskbar-start"
            aria-label="Start"
            aria-expanded={startOpen}
            aria-haspopup="true"
            onClick={toggleStart}
          >
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
                onClick={() => {
                  onOpenApp?.(app.id);
                  closeStart();
                }}
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

          <button
            type="button"
            className="taskbar-user"
            aria-label="Account"
            onClick={() => onOpenApp?.("welcome")}
          >
            <img src={userIcon} alt="" draggable={false} />
            <span>{USER_NAME}</span>
          </button>
        </div>
      </footer>

      <StartMenu
        isOpen={startOpen}
        onClose={closeStart}
        onOpenApp={onOpenApp}
      />
    </>
  );
}

export default Taskbar;
