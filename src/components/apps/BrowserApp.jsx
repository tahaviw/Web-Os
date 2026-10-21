import { useCallback, useMemo, useState } from "react";

import browserIcon from "../../assets/Icons/browser-icon.png";
import googleIcon from "../../assets/Icons/Google-icon.png";
import browserHomeIcon from "../../assets/Icons/Browser-home-icone.png";
import browserDocsIcon from "../../assets/Icons/Browser-docs-icone.png";
import browserProfileIcon from "../../assets/Icons/Browser-profile.png";
import browserSearchIcon from "../../assets/Icons/Browser-search-icone.png";

const HOME_URL = "internal://home";
const SEARCH_PREFIX = "internal://search?q=";

const QUICK_LINKS = [
  { label: "React Docs", url: "https://react.dev" },
  { label: "MDN Web Docs", url: "https://developer.mozilla.org" },
  { label: "GitHub", url: "https://github.com" },
  { label: "Stack Overflow", url: "https://stackoverflow.com" },
  { label: "Vite", url: "https://vite.dev" },
  { label: "Can I Use", url: "https://caniuse.com" },
];

const SEARCH_TABS = [
  "All",
  "Images",
  "Videos",
  "News",
  "Maps",
  "Shopping",
  "More",
];

const isInternal = (url) => url.startsWith("internal://");

const toSearchUrl = (query) => SEARCH_PREFIX + encodeURIComponent(query);

const queryFromUrl = (url) =>
  url.startsWith(SEARCH_PREFIX)
    ? decodeURIComponent(url.slice(SEARCH_PREFIX.length))
    : "";

/**
 * Decide whether the user typed a URL or a search term.
 *
 * Deliberately broader than just `.com`/`http`/`www`: `.dev`, `.io`, `.ma`,
 * localhost and paths like `react.dev/learn` should all route as URLs, or the
 * address bar feels broken on anything that isn't a .com.
 */
function looksLikeUrl(raw) {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) return true; // any scheme
  if (/^www\./i.test(raw)) return true;
  if (/\s/.test(raw)) return false; // spaces ⇒ prose ⇒ search
  return /^[^\s/]+\.[a-z]{2,}(?:[/?#].*)?$/i.test(raw);
}

/** Turn raw address-bar text into an internal route. */
function normalizeInput(raw) {
  const text = raw.trim();
  if (!text) return HOME_URL;
  if (isInternal(text)) return text;
  if (looksLikeUrl(text)) {
    return /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`;
  }
  return toSearchUrl(text);
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** What Chrome puts in the tab label and the window title. */
function titleForUrl(url) {
  if (url === HOME_URL) return "New Tab";
  if (url.startsWith(SEARCH_PREFIX))
    return `${queryFromUrl(url)} - Google Search`;
  return hostnameOf(url);
}

/** What the omnibox shows when a tab becomes active. */
function displayUrl(url) {
  if (url === HOME_URL) return "";
  if (url.startsWith(SEARCH_PREFIX)) return queryFromUrl(url);
  return url.replace(/^https?:\/\//, "");
}

/**
 * Deterministic mock SERP. Derived from the query alone so re-renders and
 * back/forward navigation don't shuffle the results under the user.
 */
function buildResults(query) {
  const q = query.trim() || "the web";
  const slug =
    q
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "topic";

  return [
    {
      title: `${q} - Wikipedia`,
      url: `https://en.wikipedia.org/wiki/${slug}`,
      site: "https://en.wikipedia.org › wiki",
      snippet: `An overview of ${q}, including background, references and related topics. Free and open content.`,
    },
    {
      title: `${q} — Official Site`,
      url: `https://www.example.com/${slug}`,
      site: `https://www.example.com › ${slug}`,
      snippet: `The official resource for ${q}. Documentation, downloads and support.`,
    },
    {
      title: `Getting started with ${q}`,
      url: `https://www.example.org/getting-started-${slug}`,
      site: "https://www.example.org › getting-started",
      snippet: `A beginner-friendly walkthrough covering the fundamentals of ${q} in about 15 minutes.`,
    },
    {
      title: `${q} tutorial for beginners`,
      url: `https://www.example.net/tutorial-${slug}`,
      site: "https://www.example.net › tutorial",
      snippet: `Step-by-step tutorial with runnable examples. Learn ${q} by building a small project.`,
    },
    {
      title: `What is ${q}? — Explained`,
      url: `https://www.example.io/what-is-${slug}`,
      site: "https://www.example.io › what-is",
      snippet: `A concise explanation of ${q}, when to use it, and the common pitfalls to avoid.`,
    },
  ];
}

/* --------------------------------------------------------------------------
   Chrome-shaped icons
   -------------------------------------------------------------------------- */

function AppsGridIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <g fill="currentColor">
        {[5, 12, 19].map((y) =>
          [5, 12, 19].map((x) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="2.1" />
          )),
        )}
      </g>
    </svg>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-2.08A7 7 0 0 0 19 12h-2z"
      />
    </svg>
  );
}

function LensIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm0 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"
      />
      <path
        fill="currentColor"
        d="M3 9V5h4v2H5v2H3zm14-4h4v4h-2V7h-2V5zM3 15h2v2h2v2H3v-4zm16 0h2v4h-4v-2h2v-2z"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2l1.9 5.6L19.5 9l-4.4 3.3L16.4 18 12 14.7 7.6 18l1.3-5.7L4.5 9l5.6-1.4L12 2z"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        d="M12 4.8l2.2 4.5 4.9.7-3.6 3.4.9 4.9-4.4-2.4-4.4 2.4.9-4.9L4.9 10l4.9-.7L12 4.8z"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <g fill="currentColor">
        <circle cx="12" cy="5.5" r="1.8" />
        <circle cx="12" cy="12" r="1.8" />
        <circle cx="12" cy="18.5" r="1.8" />
      </g>
    </svg>
  );
}

let tabCounter = 0;
const createTab = (url = HOME_URL) => {
  tabCounter += 1;
  return {
    id: `tab-${tabCounter}`,
    url,
    draft: displayUrl(url),
    history: [url],
    historyIndex: 0,
  };
};

/** Single write path for a new location: truncates any forward history. */
function navigateTab(tab, nextUrl) {
  const trimmed = tab.history.slice(0, tab.historyIndex + 1);
  const history =
    trimmed[trimmed.length - 1] === nextUrl ? trimmed : [...trimmed, nextUrl];
  return {
    ...tab,
    url: nextUrl,
    draft: displayUrl(nextUrl),
    history,
    historyIndex: history.length - 1,
  };
}

function jumpTab(tab, offset) {
  const target = tab.historyIndex + offset;
  if (target < 0 || target >= tab.history.length) return tab;
  const url = tab.history[target];
  return { ...tab, url, draft: displayUrl(url), historyIndex: target };
}

function BrowserApp() {
  const [tabs, setTabs] = useState(() => [createTab()]);
  const [activeId, setActiveId] = useState(() => tabs[0].id);
  // Bumped on refresh so the iframe remounts and actually reloads —
  // setting `src` to the same value is a no-op for the browser.
  const [reloadKey, setReloadKey] = useState(0);

  const activeTab = tabs.find((t) => t.id === activeId) ?? tabs[0];
  const currentUrl = activeTab.url;
  const query = queryFromUrl(currentUrl);

  const results = useMemo(() => (query ? buildResults(query) : []), [query]);

  /** Apply a patch to the active tab only. */
  const patchActive = useCallback(
    (updater) => {
      setTabs((all) =>
        all.map((t) => (t.id === activeTab.id ? updater(t) : t)),
      );
    },
    [activeTab.id],
  );

  const navigate = useCallback(
    (nextUrl) => {
      patchActive((t) => navigateTab(t, nextUrl));
      setReloadKey((k) => k + 1);
    },
    [patchActive],
  );

  const jumpTo = useCallback(
    (offset) => {
      patchActive((t) => jumpTab(t, offset));
      setReloadKey((k) => k + 1);
    },
    [patchActive],
  );

  const setDraft = useCallback(
    (value) => patchActive((t) => ({ ...t, draft: value })),
    [patchActive],
  );

  const submit = useCallback(
    (event) => {
      event.preventDefault();
      navigate(normalizeInput(activeTab.draft));
    },
    [activeTab.draft, navigate],
  );

  const newTab = useCallback(() => {
    const tab = createTab();
    setTabs((all) => [...all, tab]);
    setActiveId(tab.id);
    setReloadKey((k) => k + 1);
  }, []);

  const closeTab = useCallback(
    (tabId, event) => {
      event?.stopPropagation();
      setTabs((all) => {
        const next = all.filter((t) => t.id !== tabId);
        // Never leave the window with zero tabs — Chrome opens a New Tab.
        if (next.length === 0) {
          const fresh = createTab();
          setActiveId(fresh.id);
          return [fresh];
        }
        if (tabId === activeId) setActiveId(next[next.length - 1].id);
        return next;
      });
      setReloadKey((k) => k + 1);
    },
    [activeId],
  );

  const canGoBack = activeTab.historyIndex > 0;
  const canGoForward = activeTab.historyIndex < activeTab.history.length - 1;
  const isExternal = !isInternal(currentUrl);

  return (
    <div className="chr">
      {/* ---- Tab strip ---- */}
      <div className="chr-tabstrip">
        <div className="chr-tabs">
          {tabs.map((tab) => {
            const isActive = tab.id === activeId;
            return (
              <div
                key={tab.id}
                className={`chr-tab${isActive ? " chr-tab--active" : ""}`}
                onClick={() => setActiveId(tab.id)}
                role="button"
                tabIndex={-1}
                title={titleForUrl(tab.url)}
              >
                <img
                  className="chr-tab-favicon"
                  src={googleIcon}
                  alt=""
                  draggable={false}
                />
                <span className="chr-tab-title">{titleForUrl(tab.url)}</span>
                <button
                  type="button"
                  className="chr-tab-close"
                  onClick={(e) => closeTab(tab.id, e)}
                  aria-label="Close tab"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          className="chr-newtab"
          onClick={newTab}
          aria-label="New tab"
          title="New tab"
        >
          +
        </button>
      </div>

      {/* ---- Toolbar ---- */}
      <form className="chr-toolbar" onSubmit={submit}>
        <div className="chr-navgroup">
          <button
            type="button"
            className="chr-navbtn"
            onClick={() => jumpTo(-1)}
            disabled={!canGoBack}
            aria-label="Back"
            title="Back"
          >
            ‹
          </button>
          <button
            type="button"
            className="chr-navbtn"
            onClick={() => jumpTo(1)}
            disabled={!canGoForward}
            aria-label="Forward"
            title="Forward"
          >
            ›
          </button>
          <button
            type="button"
            className="chr-navbtn"
            onClick={() => setReloadKey((k) => k + 1)}
            aria-label="Reload"
            title="Reload"
          >
            ↻
          </button>
          <button
            type="button"
            className="chr-navbtn"
            onClick={() => navigate(HOME_URL)}
            aria-label="Home"
            title="Home"
          >
            <img
              className="chr-navbtn-icon"
              src={browserHomeIcon}
              alt=""
              draggable={false}
            />
          </button>
        </div>

        <div className="chr-omnibox">
          <img
            className="chr-omnibox-favicon"
            src={googleIcon}
            alt=""
            draggable={false}
          />
          <input
            className="chr-omnibox-input"
            type="text"
            value={activeTab.draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Search Google or type a URL"
            aria-label="Address and search bar"
            spellCheck={false}
            autoComplete="off"
          />
          <button
            type="button"
            className="chr-omnibox-icon"
            aria-label="Bookmark this tab"
            title="Bookmark this tab"
          >
            <StarIcon />
          </button>
        </div>

        <button
          type="button"
          className="chr-toolbar-icon"
          aria-label="Documents"
          title="Documents"
        >
          <img
            className="chr-toolbar-icon-img"
            src={browserDocsIcon}
            alt=""
            draggable={false}
          />
        </button>
        <img
          className="chr-avatar"
          src={browserProfileIcon}
          alt="Account"
          draggable={false}
        />
        <button
          type="button"
          className="chr-toolbar-icon"
          aria-label="Customize and control"
          title="Customize and control"
        >
          <MenuIcon />
        </button>
      </form>

      {isExternal && (
        <div className="chr-notice">
          <span>
            Some sites refuse to be embedded. If this page stays blank, open{" "}
            <strong>{hostnameOf(currentUrl)}</strong> in a real tab.
          </span>
          <button
            type="button"
            className="chr-notice-btn"
            onClick={() =>
              window.open(currentUrl, "_blank", "noopener,noreferrer")
            }
          >
            Open in new tab
          </button>
        </div>
      )}

      {/* ---- Viewport ---- */}
      <div className="chr-viewport">
        {currentUrl === HOME_URL && (
          <div className="gg">
            <header className="gg-topbar">
              <nav className="gg-toplinks">
                <a href="#" onClick={(e) => e.preventDefault()}>
                  Gmail
                </a>
                <a href="#" onClick={(e) => e.preventDefault()}>
                  Images
                </a>
              </nav>
              <button
                type="button"
                className="gg-apps"
                aria-label="Google apps"
              >
                <AppsGridIcon />
              </button>
              <img
                className="gg-account"
                src={browserProfileIcon}
                alt="Account"
                draggable={false}
              />
            </header>

            <div className="gg-center">
              <h1 className="gg-logo">
                <span className="gg-l-blue">G</span>
                <span className="gg-l-red">o</span>
                <span className="gg-l-yellow">o</span>
                <span className="gg-l-blue">g</span>
                <span className="gg-l-green">l</span>
                <span className="gg-l-red">e</span>
              </h1>

              <form className="gg-searchwrap" onSubmit={submit}>
                <span className="gg-plus" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path
                      fill="currentColor"
                      d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z"
                    />
                  </svg>
                </span>
                <input
                  className="gg-input"
                  type="text"
                  value={activeTab.draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Search Google or type a URL"
                  aria-label="Search Google"
                  spellCheck={false}
                  autoComplete="off"
                />
                <div className="gg-actions">
                  <button
                    type="button"
                    className="gg-actionbtn"
                    aria-label="Search by voice"
                    title="Search by voice"
                  >
                    <MicIcon />
                  </button>
                  <button
                    type="button"
                    className="gg-actionbtn"
                    aria-label="Search by image"
                    title="Search by image"
                  >
                    <LensIcon />
                  </button>
                  <button
                    type="button"
                    className="gg-aibtn"
                    aria-label="AI Mode"
                  >
                    <SparkIcon />
                    <span>AI Mode</span>
                  </button>
                </div>
              </form>

              <div className="gg-buttons">
                <button
                  type="button"
                  className="gg-btn"
                  onClick={() => navigate(normalizeInput(activeTab.draft))}
                >
                  Google Search
                </button>
                <button
                  type="button"
                  className="gg-btn"
                  onClick={() => navigate(toSearchUrl("I'm feeling lucky"))}
                >
                  I'm Feeling Lucky
                </button>
              </div>

              <div className="gg-quick">
                {QUICK_LINKS.map((link) => (
                  <button
                    key={link.url}
                    type="button"
                    className="gg-quickcard"
                    onClick={() => navigate(link.url)}
                  >
                    <img
                      className="gg-quickcard-icon"
                      src={
                        link.url.includes("react.dev")
                          ? browserIcon
                          : googleIcon
                      }
                      alt=""
                      draggable={false}
                    />
                    <span className="gg-quickcard-label">{link.label}</span>
                  </button>
                ))}
              </div>

              <p className="gg-footer">
                Google available in: <span className="gg-lang">العربية</span>
              </p>
            </div>
          </div>
        )}

        {query && (
          <div className="srp">
            <div className="srp-topbar">
              <img
                className="srp-logo"
                src={googleIcon}
                alt="Google"
                draggable={false}
                onClick={() => navigate(HOME_URL)}
              />
              <form className="srp-searchform" onSubmit={submit}>
                <div className="srp-searchbox">
                  <input
                    className="srp-searchinput"
                    type="text"
                    value={activeTab.draft}
                    onChange={(e) => setDraft(e.target.value)}
                    aria-label="Search results"
                    spellCheck={false}
                    autoComplete="off"
                  />
                  <div className="srp-searchicons">
                    <button
                      type="button"
                      className="gg-actionbtn"
                      aria-label="Search by voice"
                    >
                      <MicIcon />
                    </button>
                    <button
                      type="button"
                      className="gg-actionbtn"
                      aria-label="Search by image"
                    >
                      <LensIcon />
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  className="srp-searchbtn"
                  aria-label="Search"
                >
                  <img
                    className="srp-searchbtn-icon"
                    src={browserSearchIcon}
                    alt=""
                    draggable={false}
                  />
                </button>
              </form>
            </div>

            <nav className="srp-tabs">
              {SEARCH_TABS.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  className={`srp-tab${i === 0 ? " srp-tab--active" : ""}`}
                >
                  {label}
                </button>
              ))}
            </nav>

            <div className="srp-body">
              <p className="srp-count">
                About {(results.length * 1234567).toLocaleString()} results
                (0.42 seconds)
              </p>

              {results.map((result) => (
                <article key={result.url} className="srp-result">
                  <div className="srp-result-site">
                    <img
                      className="srp-result-favicon"
                      src={googleIcon}
                      alt=""
                      draggable={false}
                    />
                    <div className="srp-result-titles">
                      <span className="srp-result-name">
                        {hostnameOf(result.url)}
                      </span>
                      <span className="srp-result-url">
                        {result.url.replace("https://", "")}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="srp-result-title"
                    onClick={() => navigate(result.url)}
                  >
                    {result.title}
                  </button>
                  <p className="srp-result-snippet">{result.snippet}</p>
                </article>
              ))}
            </div>
          </div>
        )}

        {isExternal && (
          <iframe
            key={`${activeTab.id}:${currentUrl}:${reloadKey}`}
            className="chr-frame"
            src={currentUrl}
            title={hostnameOf(currentUrl)}
            sandbox="allow-scripts allow-forms allow-popups allow-same-origin"
            referrerPolicy="no-referrer"
          />
        )}
      </div>
    </div>
  );
}

export default BrowserApp;
