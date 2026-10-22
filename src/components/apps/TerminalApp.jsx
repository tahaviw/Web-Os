import { useEffect, useRef, useState } from "react";

/** Matches the account name the taskbar tray shows. */
const userName = "tahaviw";

/** Prefix every command is typed after. */
const PROMPT = `${userName}@webos:~$`;

/**
 * What `ls` reports. Static on purpose — the terminal is self-contained, so
 * it answers from a constant instead of walking a real filesystem. The
 * trailing slash marks directories, same convention a real `ls` uses.
 */
const DIRS = [
  "Desktop/",
  "Documents/",
  "Downloads/",
  "Pictures/",
  "Music/",
  "Projects/",
  "resume.pdf",
];

/**
 * Printed once when the window opens, so the three supported commands are
 * discoverable without a separate help page.
 */
const BOOT_LINES = [
  {
    kind: "boot",
    text: "TahaviwOS shell — everything here runs in the browser.",
  },
  { kind: "boot", text: "Try: whoami, ls, exit" },
];

/**
 * A shell with three commands:
 *   whoami — prints the signed-in account
 *   ls     — prints a fake directory listing
 *   exit   — closes this window through `onClose`
 *
 * Anything else gets a "command not found", because a shell that silently
 * ignores a typo teaches the user nothing.
 */
function TerminalApp({ onClose }) {
  const [draft, setDraft] = useState("");
  const [lines, setLines] = useState(() =>
    BOOT_LINES.map((line, index) => ({ id: index, ...line })),
  );

  // Output is append-only, so ids only ever go up. Kept in a ref because
  // bumping a counter must not trigger a render on its own.
  const nextIdRef = useRef(BOOT_LINES.length);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  // Follow the output, and put the caret back in the input after every
  // command so the next keystroke lands without clicking first.
  useEffect(() => {
    const area = scrollRef.current;
    if (area) area.scrollTop = area.scrollHeight;
    inputRef.current?.focus();
  }, [lines]);

  const push = (line) =>
    setLines((all) => [...all, { id: (nextIdRef.current += 1), ...line }]);

  const submit = (event) => {
    event.preventDefault();

    const input = draft.trim();
    setDraft("");
    // A bare Enter just advances the caret — echoing an empty line is noise.
    if (!input) return;

    push({ kind: "cmd", text: input });
    const [command] = input.split(/\s+/);

    switch (command) {
      case "whoami":
        push({ kind: "out", text: userName });
        break;
      case "ls":
        push({ kind: "dirs", items: DIRS });
        break;
      case "exit":
        // The state push above never renders — this window is about to
        // unmount — so closing is the whole effect of the command.
        onClose?.();
        break;
      default:
        push({ kind: "err", text: `command not found: ${command}` });
        push({ kind: "out", text: "Available commands: whoami, ls, exit" });
    }
  };

  return (
    <div
      className="terminal"
      // Clicking anywhere in the pane takes focus, like a real shell.
      onClick={() => inputRef.current?.focus()}
    >
      <div
        className="terminal-scroll"
        ref={scrollRef}
        role="log"
        aria-live="polite"
      >
        {lines.map((line) => {
          // `ls` gets a wrapped grid rather than one path per line, which is
          // how a shell with a wide enough terminal lays it out.
          if (line.kind === "dirs") {
            return (
              <div key={line.id} className="terminal-line terminal-line--dirs">
                {line.items.map((item) => (
                  <span
                    key={item}
                    className={
                      item.endsWith("/") ? "terminal-dir" : "terminal-file"
                    }
                  >
                    {item}
                  </span>
                ))}
              </div>
            );
          }

          return (
            <div
              key={line.id}
              className={`terminal-line terminal-line--${line.kind}`}
            >
              {line.kind === "cmd" ? (
                <>
                  <span className="terminal-prompt">{PROMPT}</span> {line.text}
                </>
              ) : (
                line.text
              )}
            </div>
          );
        })}
      </div>

      <form className="terminal-inputrow" onSubmit={submit}>
        <span className="terminal-prompt">{PROMPT}</span>
        <input
          ref={inputRef}
          className="terminal-input"
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          aria-label="Terminal command"
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
        />
      </form>
    </div>
  );
}

export default TerminalApp;
