import { useEffect, useRef } from "react";

export default function VisualizationFrame({ src, onVizEvent }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    function handleMessage(event) {
      if (src) {
        try {
          const allowedOrigin = new URL(src).origin;
          if (event.origin !== allowedOrigin) return;
        } catch {
          return;
        }
      }

      const data = event.data;
      if (data && data.eventType) {
        onVizEvent?.(data);
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [src, onVizEvent]);

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
}
