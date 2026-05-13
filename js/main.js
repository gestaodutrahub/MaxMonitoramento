/**
 * main.js
 * Application bootstrap. Smooth scrolling, CTA click tracking,
 * page lifecycle events, and small UX enhancements.
 *
 * Expects Tintim, animations, menu, counters, and form modules
 * to be loaded before this file (or in parallel — order tolerant).
 */

(function () {
  "use strict";

  const Tintim = window.Tintim || { track: () => {}, page: () => {} };

  // ============================================================
  // PAGE VIEW
  // ============================================================
  Tintim.page("landing", {
    path: window.location.pathname,
    referrer: document.referrer || null,
  });

  // ============================================================
  // SMOOTH SCROLL — anchor links with header offset
  // ============================================================
  const header = document.getElementById("header");

  function getHeaderOffset() {
    if (!header) return 0;
    return header.offsetHeight + 12;
  }

  function smoothScrollTo(target) {
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const top = rect.top + window.scrollY - getHeaderOffset();
    window.scrollTo({
      top,
      behavior: "smooth",
    });
  }

  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const href = link.getAttribute("href");
    if (!href || href === "#" || href.length < 2) return;

    const target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();
    smoothScrollTo(target);

    // Update hash without jumping
    if (history.pushState) {
      history.pushState(null, "", href);
    }

    Tintim.track("anchor_click", {
      target: href,
      text: (link.textContent || "").trim().slice(0, 60),
    });
  });

  // ============================================================
  // CTA TRACKING — every [data-cta] element
  // ============================================================
  const ctaElements = document.querySelectorAll("[data-cta]");
  ctaElements.forEach((el) => {
    el.addEventListener("click", () => {
      const cta = el.dataset.cta;
      const section = el.closest("section");
      const location = section
        ? section.id || section.className.split(" ")[0]
        : "global";
      const text = (el.textContent || "").trim().slice(0, 60);
      const href = el.getAttribute("href") || null;

      Tintim.track("cta_click", {
        cta,
        location,
        text,
        href,
      });
    });
  });

  // ============================================================
  // EXTERNAL LINK TRACKING (WhatsApp, social, etc.)
  // ============================================================
  document
    .querySelectorAll('a[href^="http"], a[href^="mailto"], a[href^="tel"]')
    .forEach((link) => {
      link.addEventListener("click", () => {
        const href = link.getAttribute("href");
        let kind = "external";
        if (href.startsWith("mailto")) kind = "email";
        else if (href.startsWith("tel")) kind = "phone";
        else if (href.includes("wa.me") || href.includes("whatsapp"))
          kind = "whatsapp";

        Tintim.track("external_link_click", {
          kind,
          host: (() => {
            try {
              return new URL(href).hostname;
            } catch (_) {
              return null;
            }
          })(),
        });
      });
    });

  // ============================================================
  // TIME ON PAGE
  // ============================================================
  const startTime = Date.now();

  function reportTimeOnPage() {
    const seconds = Math.round((Date.now() - startTime) / 1000);
    Tintim.track("time_on_page", { seconds });
  }

  window.addEventListener("beforeunload", reportTimeOnPage);
  window.addEventListener("pagehide", reportTimeOnPage);

  // ============================================================
  // VISIBILITY — track tab focus changes
  // ============================================================
  document.addEventListener("visibilitychange", () => {
    Tintim.track("visibility_change", {
      state: document.visibilityState,
    });
  });

  // ============================================================
  // YEAR INJECTION (footer)
  // ============================================================
  const yearEl = document.querySelector("[data-year]");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // ============================================================
  // KEYBOARD ACCESSIBILITY — focus-visible polyfill light
  // ============================================================
  function handleFirstTab(e) {
    if (e.key === "Tab") {
      document.body.classList.add("user-is-tabbing");
      window.removeEventListener("keydown", handleFirstTab);
      window.addEventListener("mousedown", handleMouseDownOnce);
    }
  }

  function handleMouseDownOnce() {
    document.body.classList.remove("user-is-tabbing");
    window.removeEventListener("mousedown", handleMouseDownOnce);
    window.addEventListener("keydown", handleFirstTab);
  }

  window.addEventListener("keydown", handleFirstTab);

  // ============================================================
  // CONSOLE BRAND TOUCH
  // ============================================================
  if (typeof console !== "undefined" && console.log) {
    console.log(
      "%c MAX MONITORAMENTO %c proteção inteligente ",
      "background:#0A2540;color:#fff;padding:6px 10px;border-radius:4px 0 0 4px;font-weight:700;letter-spacing:1px;",
      "background:#1E6FD9;color:#fff;padding:6px 10px;border-radius:0 4px 4px 0;",
    );
  }
})();
