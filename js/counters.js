/**
 * counters.js
 * Animates [data-counter] elements from 0 to their target value
 * when they enter the viewport. Supports custom suffix and prefix.
 */

(function () {
  "use strict";

  const Tintim = window.Tintim || { track: () => {} };

  const counters = document.querySelectorAll("[data-counter]");
  if (!counters.length) return;

  // Easing function — easeOutQuart for natural deceleration
  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function formatNumber(value, isLarge) {
    const rounded = Math.floor(value);
    if (isLarge && rounded >= 1000) {
      // Brazilian format: 15.000
      return rounded.toLocaleString("pt-BR");
    }
    return String(rounded);
  }

  function animateCounter(el) {
    const rawTarget = el.dataset.counter || el.textContent.trim();
    const suffix = el.dataset.suffix || "";
    const prefix = el.dataset.prefix || "";
    const customText = el.dataset.text; // e.g., "24/7" — no animation, just display

    // Special handling: non-numeric values (like "24/7")
    if (customText) {
      el.textContent = customText;
      return;
    }

    // Parse target — remove non-numeric chars
    const target = parseFloat(String(rawTarget).replace(/[^\d.-]/g, ""));
    if (isNaN(target)) return;

    const isLarge = target >= 1000;
    const duration = el.dataset.duration
      ? parseInt(el.dataset.duration, 10)
      : 2000;
    const startTime = performance.now();

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuart(progress);
      const currentValue = target * eased;

      el.textContent = prefix + formatNumber(currentValue, isLarge) + suffix;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = prefix + formatNumber(target, isLarge) + suffix;
        el.classList.add("is-counted");
      }
    }

    requestAnimationFrame(tick);
  }

  // IntersectionObserver — animate once when in view
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            entry.isIntersecting &&
            !entry.target.classList.contains("is-counted")
          ) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 },
    );

    counters.forEach((el) => {
      // Initialize at 0 to avoid layout shift
      const customText = el.dataset.text;
      const suffix = el.dataset.suffix || "";
      const prefix = el.dataset.prefix || "";
      if (!customText) {
        el.textContent = prefix + "0" + suffix;
      }
      observer.observe(el);
    });
  } else {
    // Fallback — just display final values
    counters.forEach((el) => {
      const target = el.dataset.counter || "";
      const suffix = el.dataset.suffix || "";
      const prefix = el.dataset.prefix || "";
      const customText = el.dataset.text;
      el.textContent = customText || prefix + target + suffix;
    });
  }
})();
