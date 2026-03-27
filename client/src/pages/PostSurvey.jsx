import { useState } from "react";
import { useStudy } from "../hooks/useStudy";

export default function PostSurvey() {
  const { setParticipant } = useStudy();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/study/post-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses: {} }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setSubmitting(false);
        return;
      }

      setParticipant(data.participant);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="survey-page">
      <h2>Post-Study Survey</h2>
      <p>This survey is coming soon. For now, click continue to finish the study.</p>

      {error && <p className="error-message">{error}</p>}

      <button
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? "Submitting..." : "Continue"}
      </button>
    </div>
  );
}
