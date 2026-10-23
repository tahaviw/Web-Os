import { useEffect, useRef, useState } from "react";

// --- All your REAL icons ---
import browserIcon from "../assets/Icons/browser-icon.png";
import noteIcon from "../assets/Icons/note-icon.png";
import terminalIcon from "../assets/Icons/terminal-icon.png";
import calculatorIcon from "../assets/Icons/calculator-icon.png";
import filesIcon from "../assets/Icons/files-icon.png";
import musicIcon from "../assets/Icons/music-icon.png";
import photosIcon from "../assets/Icons/photos-icon.png";
import calendarIcon from "../assets/Icons/calendar-icon.png";
import mailIcon from "../assets/Icons/mail-icon.png";
import storeIcon from "../assets/Icons/store-icon.png";
import settingsIcon from "../assets/Icons/settings-icon.png";
import powerIcon from "../assets/Icons/battery-icon.png"; // battery used as power
import searchIcon from "../assets/Icons/Browser-search-icone.png";
import userAvatar from "../assets/Icons/user-avatar.png";

const ALL_APPS = [
  { id: "browser", label: "Browser", icon: browserIcon, appId: "browser" },
  { id: "note", label: "Notes", icon: noteIcon, appId: "note" },
  { id: "terminal", label: "Terminal", icon: terminalIcon, appId: "terminal" },
  { id: "calculator", label: "Calculator", icon: calculatorIcon, appId: null },
  { id: "files", label: "File Manager", icon: filesIcon, appId: null },
  { id: "music", label: "Music", icon: musicIcon, appId: null },
  { id: "photos", label: "Photos", icon: photosIcon, appId: null },
  { id: "calendar", label: "Calendar", icon: calendarIcon, appId: null },
  { id: "mail", label: "Mail", icon: mailIcon, appId: null },
  { id: "store", label: "Store", icon: storeIcon, appId: null },
];

const PINNED = ["browser", "note", "terminal", "files", "settings"];

function StartMenu({ isOpen, onClose, onOpenApp }) {
  const [query, setQuery] = useState("");
  const menuRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    function onDown(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    }
    if (isOpen) {
      document.addEventListener("mousedown", onDown);
      setTimeout(() => searchRef.current?.focus(), 0);
    }
    return () => document.removeEventListener("mousedown", onDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      window.addEventListener("keydown", onKey);
    }
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = ALL_APPS.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase()),
  );

  const handleAppClick = (app) => {
    if (app.appId) {
      onOpenApp(app.appId);
    } else if (app.id === "settings") {
      alert("Settings — not implemented yet");
    } else if (app.id === "power") {
      alert("Power options — not implemented yet");
    } else {
      alert(`${app.label} — coming soon`);
    }
    onClose();
  };

  return (
    <>
      <div
        className="startmenu-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="startmenu"
        ref={menuRef}
        role="menu"
        aria-label="Start menu"
      >
        <div className="startmenu-left">
          <div className="startmenu-search" role="search">
            <img
              src={searchIcon}
              alt=""
              draggable={false}
              className="startmenu-search-icon"
            />
            <input
              ref={searchRef}
              type="text"
              className="startmenu-search-input"
              placeholder="Search apps…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div className="startmenu-section">
            <div className="startmenu-pinned" role="list">
              {PINNED.map((id) => {
                const app = ALL_APPS.find((a) => a.id === id);
                if (!app) return null;
                return (
                  <button
                    key={app.id}
                    type="button"
                    className="startmenu-pinned-item"
                    role="listitem"
                    onClick={() => handleAppClick(app)}
                    aria-label={app.label}
                  >
                    <img
                      src={app.icon}
                      alt=""
                      draggable={false}
                      className="startmenu-pinned-icon"
                    />
                    <span>{app.label}</span>
                  </button>
                );
              })}
              <button
                type="button"
                className="startmenu-pinned-item"
                role="listitem"
                onClick={() => {
                  alert("Settings — not implemented yet");
                  onClose();
                }}
                aria-label="Settings"
              >
                <img
                  src={settingsIcon}
                  alt=""
                  draggable={false}
                  className="startmenu-pinned-icon"
                />
                <span>Settings</span>
              </button>
            </div>
          </div>

          <div className="startmenu-section">
            <div className="startmenu-allapps" role="list">
              {filtered.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  className="startmenu-app"
                  role="listitem"
                  onClick={() => handleAppClick(app)}
                  aria-label={app.label}
                >
                  <img
                    src={app.icon}
                    alt=""
                    draggable={false}
                    className="startmenu-app-icon"
                  />
                  <span>{app.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="startmenu-right">
          <div className="startmenu-user">
            <img
              src={userAvatar}
              alt=""
              draggable={false}
              className="startmenu-avatar"
            />
            <div className="startmenu-user-info">
              <span className="startmenu-user-name">Tahaviw</span>
              <span className="startmenu-user-email">tahaviw@webos.local</span>
            </div>
          </div>
          <div className="startmenu-power">
            <button
              type="button"
              className="startmenu-power-btn"
              onClick={() => {
                alert("Power options — not implemented yet");
                onClose();
              }}
              aria-label="Power options"
            >
              <img src={powerIcon} alt="" draggable={false} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default StartMenu;
