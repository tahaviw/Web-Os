import { useState } from "react";
import Taskbar from "./components/Taskbar";

function WelcomeWindow({ onClose }) {
  return (
    <div className="welcome-window">
      <div className="welcome-header">
        <span className="welcome-title">Welcome to TahaviwOS</span>
        <button
          type="button"
          className="welcome-close"
          onClick={onClose}
          aria-label="Close welcome window"
        >
          X
        </button>
      </div>

      <div className="welcome-body">
        <h1 className="welcome-greeting">Hello there</h1>
        <p className="welcome-text">
          This is a desktop environment that runs entirely in your browser.
          Everything you see the wallpaper, the windows, the taskbar is built
          with React.
        </p>
      </div>
    </div>
  );
}

function App() {
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(true);
  function handleOpenApp(appId) {
    console.log("Launching app:", appId);
  }

  return (
    <div className="desktop">
      {isWelcomeOpen && (
        <WelcomeWindow onClose={() => setIsWelcomeOpen(false)} />
      )}
      <Taskbar onOpenApp={handleOpenApp} />
    </div>
  );
}

export default App;
