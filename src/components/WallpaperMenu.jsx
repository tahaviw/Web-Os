import { useEffect, useRef } from "react";

const WALLPAPERS = [
  {
    id: "wallpaper-1",
    label: "Light Blue",
    src: "/src/assets/WallPaper/WallPaper-1.jpg",
  },
  {
    id: "wallpaper-3",
    label: "Dark Blue",
    src: "/src/assets/WallPaper/WallPaper-3.jpg",
  },
  {
    id: "wallpaper-2",
    label: "Red",
    src: "/src/assets/WallPaper/WallPaper-2.jpg",
  },
];

const STORAGE_KEY = "webos:v1:wallpaper";

function loadSavedWallpaper() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return WALLPAPERS[0].id;
}

function saveWallpaper(id) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(id));
  } catch {}
}

function WallpaperMenu({ isOpen, onClose, onSelect, anchor }) {
  const menuRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function onDown(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [isOpen, onClose]);

  // Escape closes
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const style = anchor
    ? { top: anchor.y, left: anchor.x, transform: "translate(0, 0)" }
    : {};

  return (
    <>
      <div
        className="wallpaper-menu-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={menuRef}
        className="wallpaper-menu"
        style={style}
        role="menu"
        aria-label="Choose wallpaper"
      >
        {WALLPAPERS.map((wp) => (
          <button
            key={wp.id}
            type="button"
            className="wallpaper-menu-item"
            role="menuitem"
            onClick={() => {
              onSelect(wp.id);
              onClose();
            }}
          >
            <span className="wallpaper-menu-label">{wp.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}

/** Hook to provide current wallpaper + setter (persisted). */
export function useWallpaper() {
  const [currentId, setCurrentId] = useState(() => loadSavedWallpaper());

  const setWallpaper = useCallback((id) => {
    setCurrentId(id);
    saveWallpaper(id);
  }, []);

  const current = WALLPAPERS.find((w) => w.id === currentId) ?? WALLPAPERS[0];
  return { current, setWallpaper, all: WALLPAPERS };
}

// Need to import useState/useCallback for the hook above
import { useState, useCallback } from "react";

export default WallpaperMenu;
