/**
 * theme.js
 * Theme switching: light / dark with persistence and system-preference sync.
 * The initial theme is already applied via inline script in <head> to avoid FOUC.
 */

(function () {
  "use strict";

  const Tintim = window.Tintim || { track: () => {} };
  const STORAGE_KEY = "max-theme";
  const root = document.documentElement;
  const toggle = document.getElementById("themeToggle");

  if (!toggle) return;

  function getTheme() {
    return root.getAttribute("data-theme") || "light";
  }

  function setTheme(theme, persist = true) {
    root.setAttribute("data-theme", theme);

    // Update meta theme-color for mobile browser chrome
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute(
        "content",
        theme === "dark" ? "#07101F" : "#FFFFFF",
      );
    }

    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch (e) {
        // localStorage might be disabled — fail silently
      }
    }

    toggle.setAttribute(
      "aria-label",
      theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro",
    );
  }

  // Initialize aria-label on first load
  setTheme(getTheme(), false);

  // Toggle on click
  toggle.addEventListener("click", () => {
    const current = getTheme();
    const next = current === "dark" ? "light" : "dark";
    setTheme(next);
    Tintim.track("theme_toggle", { from: current, to: next });
  });

  // Listen to system preference changes — only apply if user hasn't manually chosen
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleSystemChange = (e) => {
    let stored = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch (_) {}
    if (!stored) {
      setTheme(e.matches ? "dark" : "light", false);
    }
  };

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener("change", handleSystemChange);
  } else if (mediaQuery.addListener) {
    // Older browsers
    mediaQuery.addListener(handleSystemChange);
  }
})();
