import { useEffect, useRef } from "react";

const FLUSH_INTERVAL = 5000;
const SESSION_KEY = "event_tracker_session_id";

function getSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function describeTarget(el) {
  if (!el || !el.tagName) return null;
  const info = {
    tag: el.tagName.toLowerCase(),
  };
  if (el.id) info.id = el.id;
  if (el.className && typeof el.className === "string") {
    info.className = el.className.slice(0, 100);
  }
  if (el.name) info.name = el.name;
  if (el.type) info.type = el.type;

  // Capture text for buttons and labels
  const tag = info.tag;
  if (tag === "button" || tag === "a" || tag === "option") {
    info.text = (el.textContent || "").trim().slice(0, 80);
  }
  if (tag === "label") {
    // First line of label text
    info.text = (el.textContent || "").trim().split("\n")[0].slice(0, 80);
  }
  if (tag === "select") {
    const selected = el.options?.[el.selectedIndex];
    if (selected) info.selectedText = selected.text.slice(0, 80);
    info.value = el.value;
  }

  // data-testid or aria-label for additional context
  if (el.dataset?.testid) info.testId = el.dataset.testid;
  if (el.getAttribute?.("aria-label")) info.ariaLabel = el.getAttribute("aria-label");

  return info;
}

function getPath(el) {
  const parts = [];
  let node = el;
  while (node && node !== document.body && parts.length < 5) {
    let selector = node.tagName?.toLowerCase();
    if (!selector) break;
    if (node.id) {
      selector += `#${node.id}`;
      parts.unshift(selector);
      break;
    }
    if (node.className && typeof node.className === "string") {
      const cls = node.className.trim().split(/\s+/).slice(0, 2).join(".");
      if (cls) selector += `.${cls}`;
    }
    parts.unshift(selector);
    node = node.parentElement;
  }
  return parts.join(" > ");
}

export default function EventTracker({ children }) {
  const bufferRef = useRef([]);
  const batchSeqRef = useRef(0);
  const sessionStartRef = useRef(Date.now());
  const sessionIdRef = useRef(getSessionId());
  const lastScrollRef = useRef(0);

  function pushEvent(type, data) {
    bufferRef.current.push({
      ts: Date.now() - sessionStartRef.current,
      type,
      url: window.location.pathname,
      ...data,
    });
  }

  useEffect(() => {
    function flush() {
      const events = bufferRef.current;
      if (events.length === 0) return;

      bufferRef.current = [];
      const seq = batchSeqRef.current++;

      fetch("/api/study/interaction-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          events,
          batchSeq: seq,
          sessionId: sessionIdRef.current,
        }),
      }).catch(() => {});
    }

    function handleClick(e) {
      const target = describeTarget(e.target);
      if (!target) return;
      pushEvent("click", {
        target,
        path: getPath(e.target),
        x: e.clientX,
        y: e.clientY,
      });
    }

    function handleKeydown(e) {
      // Skip modifier-only keys
      if (["Shift", "Control", "Alt", "Meta"].includes(e.key)) return;

      const target = describeTarget(e.target);
      const data = {
        target,
        key: e.key,
      };

      // Record modifier combos
      const mods = [];
      if (e.ctrlKey) mods.push("ctrl");
      if (e.altKey) mods.push("alt");
      if (e.shiftKey) mods.push("shift");
      if (e.metaKey) mods.push("meta");
      if (mods.length) data.modifiers = mods;

      pushEvent("keydown", data);
    }

    function handleInput(e) {
      const target = describeTarget(e.target);
      if (!target) return;
      // For selects, record the new value
      if (e.target.tagName === "SELECT") {
        pushEvent("input", { target, value: e.target.value });
      } else {
        // For text inputs/textareas, record value length to avoid storing sensitive data
        pushEvent("input", {
          target,
          valueLength: (e.target.value || "").length,
        });
      }
    }

    function handleChange(e) {
      const target = describeTarget(e.target);
      if (!target) return;
      if (e.target.tagName === "SELECT") {
        pushEvent("change", { target, value: e.target.value });
      } else if (e.target.type === "radio" || e.target.type === "checkbox") {
        pushEvent("change", { target, value: e.target.value, checked: e.target.checked });
      }
    }

    function handleFocus(e) {
      const target = describeTarget(e.target);
      if (target) pushEvent("focus", { target });
    }

    function handleBlur(e) {
      const target = describeTarget(e.target);
      if (target) pushEvent("blur", { target });
    }

    function handleScroll() {
      // Throttle scroll events to at most one per 500ms
      const now = Date.now();
      if (now - lastScrollRef.current < 500) return;
      lastScrollRef.current = now;

      pushEvent("scroll", {
        scrollX: Math.round(window.scrollX),
        scrollY: Math.round(window.scrollY),
      });
    }

    function handleCopy() {
      pushEvent("copy", {
        target: describeTarget(document.activeElement),
      });
    }

    function handlePaste() {
      pushEvent("paste", {
        target: describeTarget(document.activeElement),
      });
    }

    function handleVisibilityChange() {
      pushEvent("visibility", {
        state: document.visibilityState,
      });
    }

    document.addEventListener("click", handleClick, true);
    document.addEventListener("keydown", handleKeydown, true);
    document.addEventListener("input", handleInput, true);
    document.addEventListener("change", handleChange, true);
    document.addEventListener("focus", handleFocus, true);
    document.addEventListener("blur", handleBlur, true);
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("copy", handleCopy, true);
    document.addEventListener("paste", handlePaste, true);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const flushTimer = setInterval(flush, FLUSH_INTERVAL);

    // Flush on page unload
    function handleBeforeUnload() {
      flush();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("keydown", handleKeydown, true);
      document.removeEventListener("input", handleInput, true);
      document.removeEventListener("change", handleChange, true);
      document.removeEventListener("focus", handleFocus, true);
      document.removeEventListener("blur", handleBlur, true);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("copy", handleCopy, true);
      document.removeEventListener("paste", handlePaste, true);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      clearInterval(flushTimer);
      flush();
    };
  }, []);

  return children;
}
