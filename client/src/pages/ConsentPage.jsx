import { useState } from "react";
import { useStudy } from "../hooks/useStudy";

export default function ConsentPage() {
  const { setParticipant } = useStudy();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleAccept() {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/study/begin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consentAccepted: true }),
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
    <div className="consent-page">
      <h2>Informed Consent</h2>
      <div className="consent-document">
        <h3>Research Study: How AI Affects Learning to Code</h3>

        <p>
          You are invited to participate in a research study examining how
          artificial intelligence tools affect the process of learning to write
          computer code.
        </p>

        <h4>What You Will Do</h4>
        <p>
          If you agree to participate, you will complete a brief survey, take a
          short pre-test, complete a coding challenge, take a post-test, and
          answer a brief follow-up survey. The entire process should take
          approximately 15–20 minutes.
        </p>

        <h4>Risks and Benefits</h4>
        <p>
          There are no known risks beyond those encountered in everyday life.
          Your participation will contribute to research on computer science
          education.
        </p>

        <h4>Confidentiality</h4>
        <p>
          Your responses are completely anonymous. No personally identifying
          information will be collected. Data will be stored securely and used
          only for research purposes.
        </p>

        <h4>Voluntary Participation</h4>
        <p>
          Your participation is voluntary. You may stop at any time without
          penalty.
        </p>
      </div>

      {error && <p className="error-message">{error}</p>}

      <button
        className="btn btn-primary"
        onClick={handleAccept}
        disabled={submitting}
      >
        {submitting ? "Starting..." : "I Agree — Begin Study"}
      </button>
    </div>
  );
}
