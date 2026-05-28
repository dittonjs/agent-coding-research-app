import { useState } from "react";
import { useStudy } from "../hooks/useStudy";

export default function IncentivePage() {
  const { setParticipant } = useStudy();
  const [form, setForm] = useState({ name: "", email: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function submit(payload) {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/study/incentive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  async function handleSubmit(e) {
    e.preventDefault();
    await submit({ name: form.name.trim(), email: form.email.trim() });
  }

  async function handleDecline() {
    await submit({ declined: true });
  }

  return (
    <div className="survey-page">
      <h2>Claim Your Gift Card</h2>
      <p>
        As a thank-you for participating, we'd like to send you a virtual Amazon
        gift card. Please enter the name and email address we should send it to.
      </p>
      <p>
        Your contact information is stored separately from your anonymous study
        responses and will only be used to deliver your gift card.
      </p>

      <form onSubmit={handleSubmit}>
        <label>
          Name
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            disabled={submitting}
            placeholder="Your full name"
          />
        </label>

        <label>
          Email Address
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            disabled={submitting}
            placeholder="you@example.com"
          />
        </label>

        {error && <p className="error-message">{error}</p>}

        <button
          className="btn btn-primary"
          type="submit"
          disabled={submitting || !form.name.trim() || !form.email.trim()}
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>

        <button
          type="button"
          className="btn"
          onClick={handleDecline}
          disabled={submitting}
          style={{ marginLeft: "0.5rem" }}
        >
          No thanks, skip
        </button>
      </form>
    </div>
  );
}
