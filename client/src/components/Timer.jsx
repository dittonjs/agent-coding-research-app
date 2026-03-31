import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";

const Timer = forwardRef(function Timer({ durationSeconds, onExpire, autoStart = true, storageKey, hidden = false }, ref) {
  const resolvedKey = storageKey || null;

  function getSavedStartTime() {
    if (!resolvedKey) return null;
    const saved = localStorage.getItem(resolvedKey);
    return saved ? parseInt(saved, 10) : null;
  }

  function computeInitialSeconds() {
    const savedStart = getSavedStartTime();
    if (savedStart) {
      const elapsed = Math.floor((Date.now() - savedStart) / 1000);
      return Math.max(0, durationSeconds - elapsed);
    }
    return durationSeconds;
  }

  const [secondsLeft, setSecondsLeft] = useState(computeInitialSeconds);
  const [running, setRunning] = useState(false);
  const startTimeRef = useRef(getSavedStartTime());
  const intervalRef = useRef(null);
  const expiredRef = useRef(false);

  function beginInterval() {
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }

    if (resolvedKey) {
      localStorage.setItem(resolvedKey, String(startTimeRef.current));
    }

    expiredRef.current = false;

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, durationSeconds - Math.floor(elapsed / 1000));
      setSecondsLeft(remaining);

      if (remaining <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        onExpire?.();
      }
    }, 250);
  }

  useImperativeHandle(ref, () => ({
    start() {
      if (!running) {
        setRunning(true);
        beginInterval();
      }
    },
    stop() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (resolvedKey) {
        localStorage.removeItem(resolvedKey);
      }
    },
    getElapsedMs() {
      if (!startTimeRef.current) return 0;
      return Date.now() - startTimeRef.current;
    },
  }));

  useEffect(() => {
    const savedStart = getSavedStartTime();

    if (savedStart) {
      // Timer was already running before refresh — resume it
      startTimeRef.current = savedStart;
      setRunning(true);
      beginInterval();
    } else if (autoStart) {
      setRunning(true);
      beginInterval();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [durationSeconds]);

  if (hidden) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const isLow = running && secondsLeft <= 10;

  return (
    <div className={`timer ${isLow ? "timer-low" : ""}`}>
      {String(minutes).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </div>
  );
});

export default Timer;
