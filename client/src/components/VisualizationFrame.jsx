import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";

const VisualizationFrame = forwardRef(function VisualizationFrame(
  { src, onMessage, onReady },
  ref
) {
  const iframeRef = useRef(null);

  function sendToIframe(message) {
    if (iframeRef.current?.contentWindow && src) {
      const origin = new URL(src).origin;
      iframeRef.current.contentWindow.postMessage(message, origin);
    }
  }

  useImperativeHandle(ref, () => ({
    send: sendToIframe,
  }));

  useEffect(() => {
    function handleMessage(event) {
      if (src) {
        try {
          const allowedOrigin = new URL(src).origin;
          if (event.origin !== allowedOrigin) return;
        } catch {
          // If src is not a valid URL yet, skip origin check
        }
      }

      const { type, payload } = event.data || {};

      if (type === "READY") {
        onReady?.();
      } else if (type === "SHOW_ALGORITHM" || type === "IDENTIFICATION_RESULT") {
        onMessage?.({ type, ...payload });
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [src, onMessage, onReady]);

  if (!src) {
    return (
      <div className="visualization-placeholder">
        <p>Visualization will appear here</p>
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      src={src}
      className="visualization-iframe"
      title="Algorithm Visualization"
    />
  );
});

export default VisualizationFrame;
