/**
 * Blog page — Card expansion logic
 *
 * Behavior:
 *  - Clicking a card expands it in place, showing the full article
 *  - Only ONE card can be expanded at a time (closes others automatically)
 *  - Expanded card spans the full grid width
 *  - Close button collapses back to original grid
 *  - Smooth scroll into view when expanding
 *  - Tracks events via window.Tintim if available
 */
(function () {
  "use strict";

  var grid = document.getElementById("blogGrid");
  if (!grid) return;

  var cards = grid.querySelectorAll(".blog-card");
  var currentlyExpanded = null;

  function track(eventName, data) {
    if (window.Tintim && typeof window.Tintim.track === "function") {
      try {
        window.Tintim.track(eventName, data || {});
      } catch (e) {
        /* silent */
      }
    }
  }

  function collapseCard(card) {
    if (!card) return;
    var trigger = card.querySelector(".blog-card__trigger");
    var expansion = card.querySelector(".blog-card__expansion");

    card.classList.remove("is-expanded");
    if (trigger) trigger.setAttribute("aria-expanded", "false");
    if (expansion) expansion.setAttribute("aria-hidden", "true");
  }

  function expandCard(card) {
    if (!card) return;

    // Collapse the currently expanded card first
    if (currentlyExpanded && currentlyExpanded !== card) {
      collapseCard(currentlyExpanded);
    }

    var trigger = card.querySelector(".blog-card__trigger");
    var expansion = card.querySelector(".blog-card__expansion");
    var postId = card.getAttribute("data-post");

    card.classList.add("is-expanded");
    if (trigger) trigger.setAttribute("aria-expanded", "true");
    if (expansion) expansion.setAttribute("aria-hidden", "false");

    currentlyExpanded = card;

    track("blog_post_open", { post_id: postId });

    // Smooth scroll the card into view (offset for sticky header)
    setTimeout(function () {
      var rect = card.getBoundingClientRect();
      var headerHeight = 90;
      var scrollTarget = window.pageYOffset + rect.top - headerHeight;
      window.scrollTo({
        top: scrollTarget,
        behavior: "smooth",
      });
    }, 100);
  }

  function toggleCard(card) {
    if (card.classList.contains("is-expanded")) {
      collapseCard(card);
      currentlyExpanded = null;
      track("blog_post_close", {
        post_id: card.getAttribute("data-post"),
      });
    } else {
      expandCard(card);
    }
  }

  // Attach click handlers to each card trigger
  cards.forEach(function (card) {
    var trigger = card.querySelector(".blog-card__trigger");
    var closeBtn = card.querySelector(".blog-card__close");

    if (trigger) {
      trigger.addEventListener("click", function (e) {
        e.preventDefault();
        toggleCard(card);
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        collapseCard(card);
        currentlyExpanded = null;
        track("blog_post_close", {
          post_id: card.getAttribute("data-post"),
        });

        // Scroll back to card position
        setTimeout(function () {
          var rect = card.getBoundingClientRect();
          var headerHeight = 90;
          var scrollTarget = window.pageYOffset + rect.top - headerHeight;
          window.scrollTo({
            top: scrollTarget,
            behavior: "smooth",
          });
        }, 100);
      });
    }
  });

  // ESC key collapses the expanded card
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && currentlyExpanded) {
      collapseCard(currentlyExpanded);
      track("blog_post_close", {
        post_id: currentlyExpanded.getAttribute("data-post"),
        trigger: "esc",
      });
      currentlyExpanded = null;
    }
  });

  // Support deep linking — open a specific post if URL has #post-xxx
  function openFromHash() {
    var hash = window.location.hash;
    if (!hash) return;

    var match = hash.match(/^#post-(.+)$/);
    if (!match) return;

    var postId = match[1];
    var card = grid.querySelector('[data-post="' + postId + '"]');
    if (card) {
      expandCard(card);
    }
  }

  window.addEventListener("load", openFromHash);
  window.addEventListener("hashchange", openFromHash);

  // Track page view
  track("blog_page_view", { url: window.location.href });
})();
