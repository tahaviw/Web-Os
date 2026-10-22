import { useState } from "react";

import noteIcon from "../../assets/Icons/note-icon.png";

/**
 * Seed notes. `content` is JSX rather than an HTML string on purpose:
 * rendering raw HTML would need dangerouslySetInnerHTML, and this content
 * never leaves the app, so there is no reason to take that risk.
 */
const NOTES = [
  {
    title: "Welcome",
    date: "10/21/2026",
    content: (
      <>
        <h2>Welcome to Notes</h2>
        <p>
          This is your note-taking app inside TahaviwOS. Pick any note from the
          list on the left to read it here.
        </p>
        <blockquote>
          Everything is a window this one is draggable, closable, and stackable
          like every other app in the system.
        </blockquote>
      </>
    ),
  },
  {
    title: "Personal Goals",
    date: "10/19/2026",
    content: (
      <>
        <h2>Personal Goals</h2>
        <h3>Short term</h3>
        <ul>
          <li>Finish the window manager</li>
          <li>Add resize support</li>
          <li>Persist window positions</li>
        </ul>
        <h3>Long term</h3>
        <p>Ship a browser based desktop people actually want to use.</p>
      </>
    ),
  },
  {
    title: "Code Snippets",
    date: "10/12/2026",
    content: (
      <>
        <h2>Code Snippets</h2>
        <h3>Debounce</h3>
        <pre>
          <code>{`const debounce = (fn, ms) => {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
};`}</code>
        </pre>
        <h3>Clamp</h3>
        <pre>
          <code>{`const clamp = (v, min, max) =>
  Math.min(Math.max(v, min), max);`}</code>
        </pre>
      </>
    ),
  },
  {
    title: "Meeting Notes",
    date: "10/08/2026",
    content: (
      <>
        <h2>Meeting Notes 10/08/2026</h2>
        <p>
          <strong>Attendees:</strong> Tahaviw, design, QA
        </p>
        <p>
          <strong>Decisions:</strong> Ship the frosted-glass taskbar as-is. Hold
          on window snapping until V2.
        </p>
        <p>
          <strong>Next:</strong> Note app split pane, then Terminal.
        </p>
      </>
    ),
  },
];

function NoteApp() {
  // Index into NOTES, not the note object itself cheaper to compare and it
  // survives edits to the note contents.
  const [activeIndex, setActiveIndex] = useState(0);
  const activeNote = NOTES[activeIndex];

  return (
    <div className="noteapp">
      <aside className="noteapp-sidebar">
        <div className="noteapp-sidebar-head">
          <img src={noteIcon} alt="" draggable={false} />
          <span>Notes</span>
          <span className="noteapp-count">{NOTES.length}</span>
        </div>

        <ul className="noteapp-list">
          {NOTES.map((note, index) => (
            <li key={note.title}>
              <button
                type="button"
                className={`noteapp-item${
                  index === activeIndex ? " noteapp-item--active" : ""
                }`}
                onClick={() => setActiveIndex(index)}
                aria-current={index === activeIndex ? "true" : undefined}
              >
                <span className="noteapp-item-title">{note.title}</span>
                <span className="noteapp-item-date">{note.date}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <article className="noteapp-view">
        <header className="noteapp-view-head">
          <h2 className="noteapp-view-title">{activeNote.title}</h2>
          <span className="noteapp-view-date">{activeNote.date}</span>
        </header>
        <div className="noteapp-view-body">{activeNote.content}</div>
      </article>
    </div>
  );
}

export default NoteApp;
