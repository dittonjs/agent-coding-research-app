import { useState } from "react";
import { useStudy } from "../hooks/useStudy";

export default function DemographicSurvey() {
  const { setParticipant } = useStudy();
  const [form, setForm] = useState({
    ageRange: "",
    gender: "",
    csYear: "",
    priorProgrammingExperience: "",
    priorAiUsage: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/study/demographics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
      <h2>About You</h2>
      <p>Please answer the following questions before we begin.</p>

      <form onSubmit={handleSubmit}>
        <label>
          Age Range
          <select name="ageRange" value={form.ageRange} onChange={handleChange} required>
            <option value="">Select...</option>
            <option value="18-20">18–20</option>
            <option value="21-23">21–23</option>
            <option value="24-26">24–26</option>
            <option value="27-30">27–30</option>
            <option value="31+">31+</option>
          </select>
        </label>

        <label>
          Gender
          <select name="gender" value={form.gender} onChange={handleChange} required>
            <option value="">Select...</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non-binary">Non-binary</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </label>

        <label>
          Year in CS Program
          <select name="csYear" value={form.csYear} onChange={handleChange} required>
            <option value="">Select...</option>
            <option value="freshman">Freshman</option>
            <option value="sophomore">Sophomore</option>
            <option value="junior">Junior</option>
            <option value="senior">Senior</option>
            <option value="graduate">Graduate</option>
          </select>
        </label>

        <label>
          Prior Programming Experience
          <select
            name="priorProgrammingExperience"
            value={form.priorProgrammingExperience}
            onChange={handleChange}
            required
          >
            <option value="">Select...</option>
            <option value="none">None</option>
            <option value="less_than_1_year">Less than 1 year</option>
            <option value="1_2_years">1–2 years</option>
            <option value="3_plus_years">3+ years</option>
          </select>
        </label>

        <label>
          Prior AI Coding Tool Usage (e.g., ChatGPT, Copilot)
          <select name="priorAiUsage" value={form.priorAiUsage} onChange={handleChange} required>
            <option value="">Select...</option>
            <option value="never">Never</option>
            <option value="occasionally">Occasionally</option>
            <option value="frequently">Frequently</option>
          </select>
        </label>

        {import.meta.env.DEV && (
          <label>
            Dev: Group Assignment
            <select name="devGroupOverride" value={form.devGroupOverride || ""} onChange={handleChange}>
              <option value="">Random</option>
              <option value="control">Control</option>
              <option value="test">Test</option>
            </select>
          </label>
        )}

        {error && <p className="error-message">{error}</p>}

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Continue"}
        </button>
      </form>
    </div>
  );
}
