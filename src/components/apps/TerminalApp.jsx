import { useEffect, useRef, useState } from "react";

/** Matches the account name the taskbar tray shows. */
const userName = "tahaviw";

const HOSTNAME = "webos";
const PWD = `/home/${userName}`;
const PROMPT = `${userName}@${HOSTNAME}:~$`;

const DIRS = [
  "Desktop/",
  "Documents/",
  "Downloads/",
  "Pictures/",
  "Music/",
  "Projects/",
];
const FILES = ["readme.txt", "todo.md", "resume.pdf"];

const CONTENT = {
  "readme.txt": [
    "TahaviwOS",
    "=========",
    "",
    "A desktop environment that runs entirely in your browser.",
    "Windows, taskbar and apps are all React components no iframe,",
    "no canvas, no native code anywhere in this project.",
    "",
    "Everything you can do here with a mouse is a real, focusable",
    "button or input underneath.",
  ],
  "todo.md": [
    "# TODO",
    "",
    "- [x] Draggable windows",
    "- [x] Taskbar with quick launch",
    "- [x] Terminal with a working shell",
    "- [ ] Window resizing",
    "- [ ] Persist window positions",
    "- [ ] Start menu",
  ],
};

/**
 * What `open <app>` accepts. The values double as the APPS keys in
 * App.jsx, so a title in here is guaranteed to be something that can
 * actually be opened.
 */
const OPENABLE = {
  welcome: "Welcome",
  note: "Note",
  notes: "Note",
  terminal: "Terminal",
  shell: "Terminal",
  browser: "Browser",
  web: "Browser",
};

/** `help` output, grouped so it scans instead of reading as one flat wall. */
const HELP_GROUPS = [
  {
    section: "Files",
    rows: [
      ["ls", "list this directory"],
      ["cat <file>", "print a file"],
      ["pwd", "print the working directory"],
    ],
  },
  {
    section: "System",
    rows: [
      ["open <app>", "launch an app window"],
      ["neofetch", "system info"],
      ["date", "current date and time"],
    ],
  },
  {
    section: "Shell",
    rows: [
      ["echo <text>", "print text"],
      ["help", "this list"],
      ["clear", "clear the screen"],
      ["exit", "close the terminal"],
    ],
  },
];

/** `neofetch` logo — a window, because that is what this OS is made of. */
const FETCH_LOGO = [
  "  ┌───────────────┐",
  "  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓ │",
  "  │ ▓           ▓ │",
  "  │ ▓           ▓ │",
  "  │ ▓           ▓ │",
  "  └───────────────┘",
];

/**
 * Live values for `neofetch`, measured when the command runs rather than
 * at mount — an uptime captured on first render goes stale immediately.
 */
function fetchInfo() {
  const seconds = Math.floor(performance.now() / 1000);
  const uptime =
    seconds >= 60
      ? `${Math.floor(seconds / 60)}m ${seconds % 60}s`
      : `${seconds}s`;

  return [
    ["OS", "TahaviwOS 0.1 — runs in your browser"],
    ["Build", "React + Vite"],
    ["Shell", "tahaviw-sh 1.0"],
    ["User", userName],
    ["Display", `${window.innerWidth} × ${window.innerHeight}`],
    ["Uptime", uptime],
  ];
}

/**
 * Printed once when the window opens, so the entry point is obvious
 * without a separate help page.
 */
const BOOT_LINES = [
  {
    kind: "boot",
    text: "TahaviwOS shell — everything here runs in the browser.",
  },
  { kind: "boot", text: "Type help for the command list." },
];

/**
 * A shell that runs entirely in the DOM. Output is an array of line
 * objects rather than one string, because some commands emit structure
 * (`ls` wants a grid, `help` wants columns) and flattening that into text
 * first would only mean re-splitting it on the way back out.
 *
 * Props:
 *   onClose    — closes the window; wired to `exit`
 *   onOpenApp  — opens/focuses another window; wired to `open`
 */
function TerminalApp({ onClose, onOpenApp }) {
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
    const [command, ...args] = input.split(/\s+/);

    switch (command) {
      case "help":
        push({ kind: "help", groups: HELP_GROUPS });
        break;

      case "clear":
        // The only command that removes lines instead of adding one.
        setLines([]);
        break;

      case "whoami":
        push({ kind: "out", text: userName });
        break;

      case "pwd":
        push({ kind: "out", text: PWD });
        break;

      case "ls":
        // Directories first, then files — the sort order a real ls uses.
        push({ kind: "dirs", items: [...DIRS, ...FILES] });
        break;

      case "echo":
        // Slice from after the command word, so internal spacing survives.
        push({ kind: "out", text: input.slice(command.length).trim() });
        break;

      case "date":
        push({
          kind: "out",
          text: new Date().toLocaleString(undefined, {
            dateStyle: "full",
            timeStyle: "medium",
          }),
        });
        break;

      case "cat": {
        const target = args[0];
        if (!target) {
          push({ kind: "err", text: "cat: missing file operand" });
        } else if (target.endsWith("/")) {
          push({ kind: "err", text: `cat: ${target}: Is a directory` });
        } else if (CONTENT[target]) {
          CONTENT[target].forEach((text) => push({ kind: "out", text }));
        } else if (FILES.includes(target)) {
          push({
            kind: "err",
            text: `cat: ${target}: binary file (not shown)`,
          });
        } else {
          push({
            kind: "err",
            text: `cat: ${target}: No such file or directory`,
          });
        }
        break;
      }

      case "open": {
        const target = (args[0] ?? "").toLowerCase();
        const title = OPENABLE[target];
        if (!title) {
          push({
            kind: "err",
            text: `open: unknown app${target ? ` "${target}"` : ""}`,
          });
          push({
            kind: "out",
            text: `Try: ${Object.keys(OPENABLE).join(", ")}`,
          });
        } else if (onOpenApp) {
          onOpenApp(title.toLowerCase());
          push({ kind: "out", text: `launched ${title}` });
        } else {
          push({ kind: "err", text: "open: no window manager attached" });
        }
        break;
      }

      case "neofetch":
        push({ kind: "fetch", logo: FETCH_LOGO, info: fetchInfo() });
        break;

      case "exit":
        onClose?.();
        break;

      default:
        push({ kind: "err", text: `command not found: ${command}` });
        push({ kind: "out", text: "Type help for the command list." });
    }
  };

  /**
   * Four line shapes render structurally different output. Kept as a
   * function rather than nested ternaries in the map — by the third shape
   * a ternary chain stops being readable.
   */
  const renderLine = (line) => {
    if (line.kind === "dirs") {
      return (
        <div key={line.id} className="terminal-line terminal-line--dirs">
          {line.items.map((item) => (
            <span
              key={item}
              className={item.endsWith("/") ? "terminal-dir" : "terminal-file"}
            >
              {item}
            </span>
          ))}
        </div>
      );
    }

    if (line.kind === "help") {
      return (
        <div key={line.id} className="terminal-line terminal-line--help">
          {line.groups.map((group) => (
            <div key={group.section} className="terminal-help-group">
              <div className="terminal-help-section">{group.section}</div>
              {group.rows.map(([cmd, desc]) => (
                <div key={cmd} className="terminal-help-row">
                  <span className="terminal-help-cmd">{cmd}</span>
                  <span className="terminal-help-desc">{desc}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    }

    if (line.kind === "fetch") {
      return (
        <div key={line.id} className="terminal-line terminal-line--fetch">
          <pre className="terminal-fetch-logo">{line.logo.join("\n")}</pre>
          <div className="terminal-fetch-info">
            <div className="terminal-fetch-name">
              <span className="terminal-fetch-user">
                {userName}@{HOSTNAME}
              </span>
              <span className="terminal-fetch-rule">──────────</span>
            </div>
            {line.info.map(([label, value]) => (
              <div key={label} className="terminal-fetch-row">
                <span className="terminal-fetch-label">{label}</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
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
        {lines.map(renderLine)}
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
