/**
 * animations.js
 * Scroll-triggered animations, reveal effects, and header state management.
 * Uses IntersectionObserver for performance.
 */

(function () {
  "use strict";

  const Tintim = window.Tintim || { track: () => {} };

  // ============================================================
  // SCROLL REVEAL — IntersectionObserver for .reveal and .stagger
  // ============================================================
  const revealElements = document.querySelectorAll(".reveal, .stagger");

  if ("IntersectionObserver" in window && revealElements.length) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);

            // Track first reveal of major sections
            const section = entry.target.closest("section");
            if (section && section.id && !section.dataset.tracked) {
              section.dataset.tracked = "true";
              Tintim.track("section_view", {
                section: section.id,
              });
            }
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -60px 0px",
      },
    );

    revealElements.forEach((el) => revealObserver.observe(el));
  } else {
    // Fallback for older browsers — show everything
    revealElements.forEach((el) => el.classList.add("is-visible"));
  }

  // ============================================================
  // HEADER SCROLL STATE
  // ============================================================
  const header = document.getElementById("header");
  let lastScrollY = 0;
  let ticking = false;

  function updateHeader() {
    const currentY = window.scrollY;

    if (header) {
      if (currentY > 24) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }
    }

    lastScrollY = currentY;
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  updateHeader();

  // ============================================================
  // SCROLL DEPTH MILESTONES (25%, 50%, 75%, 100%)
  // ============================================================
  const milestones = [25, 50, 75, 100];
  const reachedMilestones = new Set();

  function checkScrollDepth() {
    const scrollTop = window.scrollY;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;

    const percent = Math.round((scrollTop / docHeight) * 100);

    milestones.forEach((milestone) => {
      if (percent >= milestone && !reachedMilestones.has(milestone)) {
        reachedMilestones.add(milestone);
        Tintim.track("scroll_milestone", { percent: milestone });
      }
    });
  }

  let depthTicking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (!depthTicking) {
        window.requestAnimationFrame(() => {
          checkScrollDepth();
          depthTicking = false;
        });
        depthTicking = true;
      }
    },
    { passive: true },
  );

  // ============================================================
  // PARALLAX — subtle floating elements (respects prefers-reduced-motion)
  // ============================================================
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (!prefersReducedMotion) {
    const parallaxElements = document.querySelectorAll("[data-parallax]");

    if (parallaxElements.length) {
      let parallaxTicking = false;

      function updateParallax() {
        const scrollY = window.scrollY;
        parallaxElements.forEach((el) => {
          const speed = parseFloat(el.dataset.parallax) || 0.2;
          const offset = scrollY * speed;
          el.style.transform = `translateY(${offset}px)`;
        });
        parallaxTicking = false;
      }

      window.addEventListener(
        "scroll",
        () => {
          if (!parallaxTicking) {
            window.requestAnimationFrame(updateParallax);
            parallaxTicking = true;
          }
        },
        { passive: true },
      );
    }
  }

  // ============================================================
  // FAQ — track open events
  // ============================================================
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (item.open) {
        const summary = item.querySelector(".faq-item__summary");
        Tintim.track("faq_open", {
          id: item.dataset.faq || null,
          label: (summary ? summary.textContent : "").trim().slice(0, 80),
        });
      }
    });
  });
})();
