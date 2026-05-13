/**
 * menu.js
 * Mobile menu toggle, accessibility, and Tintim tracking.
 */

(function () {
  "use strict";

  const Tintim = window.Tintim || { track: () => {} };

  const toggle = document.getElementById("menuToggle");
  const menu = document.getElementById("mobileMenu");
  const body = document.body;

  if (!toggle || !menu) return;

  let isOpen = false;

  function openMenu() {
    isOpen = true;
    menu.classList.add("is-open");
    toggle.classList.add("is-active");
    toggle.setAttribute("aria-expanded", "true");
    body.classList.add("menu-open");
    body.style.overflow = "hidden";

    Tintim.track("menu_toggle", { state: "open" });
  }

  function closeMenu() {
    isOpen = false;
    menu.classList.remove("is-open");
    toggle.classList.remove("is-active");
    toggle.setAttribute("aria-expanded", "false");
    body.classList.remove("menu-open");
    body.style.overflow = "";

    Tintim.track("menu_toggle", { state: "close" });
  }

  function toggleMenu() {
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  // Click toggle
  toggle.addEventListener("click", (e) => {
    e.preventDefault();
    toggleMenu();
  });

  // Close on link click inside the menu
  const menuLinks = menu.querySelectorAll("a[href]");
  menuLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (isOpen) closeMenu();
    });
  });

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) {
      closeMenu();
      toggle.focus();
    }
  });

  // Close when resizing up to desktop
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth > 992 && isOpen) {
        closeMenu();
      }
    }, 150);
  });

  // Close on click outside menu (on backdrop)
  menu.addEventListener("click", (e) => {
    if (e.target === menu) {
      closeMenu();
    }
  });
})();
