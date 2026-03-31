import { useState } from "react";
import { useStudy } from "../hooks/useStudy";

export default function DemographicSurvey() {
  const { setParticipant } = useStudy();
  const [form, setForm] = useState({
    ageRange: "",
    gender: "",
    genderOther: "",
    ethnicity: "",
    ethnicityOther: "",
    csYear: "",
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

    const payload = {
      ...form,
      gender: form.gender === "other" ? `other: ${form.genderOther}` : form.gender,
      ethnicity: form.ethnicity === "other" ? `other: ${form.ethnicityOther}` : form.ethnicity,
    };
    delete payload.genderOther;
    delete payload.ethnicityOther;

    try {
      const res = await fetch("/api/study/demographics", {
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
            <option value="man">Man</option>
            <option value="woman">Woman</option>
            <option value="non-binary">Non-binary</option>
            <option value="other">Other (please specify)</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </label>

        {form.gender === "other" && (
          <label>
            Please specify gender
            <input
              type="text"
              name="genderOther"
              value={form.genderOther}
              onChange={handleChange}
              required
              placeholder="Enter your gender"
            />
          </label>
        )}

        <label>
          Ethnicity
          <select name="ethnicity" value={form.ethnicity} onChange={handleChange} required>
            <option value="">Select...</option>
            <option value="white">White</option>
            <option value="black">Black or African American</option>
            <option value="hispanic">Hispanic or Latino</option>
            <option value="asian">Asian</option>
            <option value="native-american">American Indian or Alaska Native</option>
            <option value="pacific-islander">Native Hawaiian or Pacific Islander</option>
            <option value="multiracial">Multiracial</option>
            <option value="other">Other (please specify)</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </label>

        {form.ethnicity === "other" && (
          <label>
            Please specify ethnicity
            <input
              type="text"
              name="ethnicityOther"
              value={form.ethnicityOther}
              onChange={handleChange}
              required
              placeholder="Enter your ethnicity"
            />
          </label>
        )}

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
