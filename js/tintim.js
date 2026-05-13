/**
 * ============================================
 * TINTIM API — Event Logging & Tracking
 * ============================================
 *
 * Lightweight wrapper for tracking user interactions, CTAs,
 * form submissions, scroll milestones, etc.
 *
 * Public methods:
 *   Tintim.init(config)
 *   Tintim.track(eventName, payload)
 *   Tintim.identify(userId, traits)
 *   Tintim.page(name, props)
 */

(function (global) {
  "use strict";

  const DEFAULT_CONFIG = {
    endpoint: "https://api.tintim.app/v1/events",
    projectId: "max-monitoramento",
    debug: false,
    batchSize: 10,
    flushInterval: 5000, // ms
  };

  const Tintim = {
    config: { ...DEFAULT_CONFIG },
    queue: [],
    session: null,
    timer: null,

    /**
     * Initialize the tracker with custom configuration.
     */
    init(userConfig = {}) {
      this.config = { ...DEFAULT_CONFIG, ...userConfig };
      this.session = this._getOrCreateSession();
      this._startAutoFlush();
      this._bindUnload();
      this.log("Tintim initialized", this.config);
      this.page("landing-home");
    },

    /**
     * Track an event with optional payload.
     */
    track(eventName, payload = {}) {
      if (!eventName) return;

      const event = {
        event: eventName,
        projectId: this.config.projectId,
        sessionId: this.session.id,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        referrer: document.referrer || null,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        payload,
      };

      this.queue.push(event);
      this.log("Event queued:", event);

      if (this.queue.length >= this.config.batchSize) {
        this.flush();
      }
    },

    /**
     * Identify a user.
     */
    identify(userId, traits = {}) {
      this.track("identify", { userId, traits });
    },

    /**
     * Track a page view.
     */
    page(name, props = {}) {
      this.track("page_view", { name, ...props });
    },

    /**
     * Send queued events to the backend.
     * Falls back to console.info if endpoint is unreachable.
     */
    flush() {
      if (this.queue.length === 0) return;
      const batch = this.queue.splice(0, this.queue.length);

      try {
        // Use sendBeacon when possible (more reliable on page unload)
        const payload = JSON.stringify({ events: batch });
        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: "application/json" });
          navigator.sendBeacon(this.config.endpoint, blob);
          this.log(`Flushed ${batch.length} events via sendBeacon`);
        } else {
          fetch(this.config.endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true,
          }).catch((err) => {
            // Silent fallback: log locally
            this.log("Tintim flush failed (offline OK):", err.message);
          });
        }
      } catch (err) {
        this.log("Tintim flush error:", err.message);
      }
    },

    /**
     * Internal: get or create a session for this browsing context.
     */
    _getOrCreateSession() {
      const KEY = "tintim_session";
      const SESSION_TTL = 30 * 60 * 1000; // 30 min
      try {
        const stored = sessionStorage.getItem(KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Date.now() - parsed.lastSeen < SESSION_TTL) {
            parsed.lastSeen = Date.now();
            sessionStorage.setItem(KEY, JSON.stringify(parsed));
            return parsed;
          }
        }
        const fresh = {
          id: this._generateId(),
          startedAt: Date.now(),
          lastSeen: Date.now(),
        };
        sessionStorage.setItem(KEY, JSON.stringify(fresh));
        return fresh;
      } catch (e) {
        // sessionStorage blocked (private browsing) — fall back to in-memory
        return {
          id: this._generateId(),
          startedAt: Date.now(),
          lastSeen: Date.now(),
        };
      }
    },

    _generateId() {
      return (
        "tt_" +
        Date.now().toString(36) +
        Math.random().toString(36).slice(2, 10)
      );
    },

    _startAutoFlush() {
      if (this.timer) clearInterval(this.timer);
      this.timer = setInterval(() => this.flush(), this.config.flushInterval);
    },

    _bindUnload() {
      window.addEventListener("beforeunload", () => this.flush());
      window.addEventListener("pagehide", () => this.flush());
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") this.flush();
      });
    },

    log(...args) {
      if (this.config.debug) {
        console.info("[Tintim]", ...args);
      }
    },
  };

  // ===== Auto-init on DOM ready =====
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () =>
      Tintim.init({ debug: true }),
    );
  } else {
    Tintim.init({ debug: true });
  }

  // ===== Expose globally =====
  global.Tintim = Tintim;
})(window);
