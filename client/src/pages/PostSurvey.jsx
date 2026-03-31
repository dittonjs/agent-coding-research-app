import { useState } from "react";
import { useStudy } from "../hooks/useStudy";

const LIKERT_OPTIONS = [
  { value: "1", label: "Strongly Disagree" },
  { value: "2", label: "Disagree" },
  { value: "3", label: "Neutral" },
  { value: "4", label: "Agree" },
  { value: "5", label: "Strongly Agree" },
];

const SHARED_QUESTIONS = [
  {
    key: "difficulty",
    type: "likert",
    label: "I found the coding challenge difficult.",
  },
  {
    key: "confidence",
    type: "likert",
    label: "I am confident that my final code is correct.",
  },
  {
    key: "understanding",
    type: "likert",
    label: "I feel I understand the selection sort algorithm well.",
  },
  {
    key: "couldExplain",
    type: "likert",
    label: "I could explain selection sort to someone else after this exercise.",
  },
  {
    key: "engagement",
    type: "likert",
    label: "I felt engaged during the task.",
  },
  {
    key: "timeAdequate",
    type: "select",
    label: "Did you feel the time limit was adequate?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unsure", label: "Unsure" },
    ],
  },
  {
    key: "priorSelectionSort",
    type: "select",
    label: "Had you implemented selection sort before this study?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unsure", label: "Unsure" },
    ],
  },
  {
    key: "usedVisualization",
    type: "likert",
    label: "I used the visualization to help me understand the algorithm.",
  },
  {
    key: "strategy",
    type: "text",
    label: "What strategy did you use to complete the challenge?",
  },
  {
    key: "mostChallenging",
    type: "text",
    label: "What was the most challenging part?",
  },
];

const TEST_GROUP_QUESTIONS = [
  {
    key: "lookedAtCode",
    type: "likert",
    label: "I looked at the code the AI wrote to understand what it was doing.",
  },
  {
    key: "aiHelpful",
    type: "likert",
    label: "The AI assistant was helpful.",
  },
  {
    key: "aiLearning",
    type: "likert",
    label: "I felt I learned from the AI's code, rather than it just doing the work for me.",
  },
  {
    key: "aiControl",
    type: "likert",
    label: "I felt in control of the coding process while using the AI.",
  },
  {
    key: "aiLikeDislike",
    type: "text",
    label: "What did you like or dislike about working with the AI?",
  },
  {
    key: "aiThinking",
    type: "text",
    label: "What were you thinking about while using the AI to write code?",
  },
];

const CONTROL_GROUP_QUESTIONS = [
  {
    key: "codingThinking",
    type: "text",
    label: "What were you thinking about while writing the code?",
  },
];

function LikertField({ question, value, onChange, disabled }) {
  return (
    <fieldset className="survey-field" disabled={disabled}>
      <legend className="survey-label">{question.label}</legend>
      <div className="likert-group">
        {LIKERT_OPTIONS.map((opt) => (
          <label key={opt.value} className={`likert-option ${value === opt.value ? "likert-selected" : ""}`}>
            <input
              type="radio"
              name={question.key}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(question.key, opt.value)}
            />
            <span className="likert-label">{opt.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function SelectField({ question, value, onChange, disabled }) {
  return (
    <label className="survey-field">
      <span className="survey-label">{question.label}</span>
      <select
        value={value}
        onChange={(e) => onChange(question.key, e.target.value)}
        required
        disabled={disabled}
      >
        <option value="">Select...</option>
        {question.options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </label>
  );
}

function TextField({ question, value, onChange, disabled }) {
  return (
    <label className="survey-field">
      <span className="survey-label">{question.label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(question.key, e.target.value)}
        rows={3}
        required
        disabled={disabled}
        placeholder="Type your response here..."
      />
    </label>
  );
}

export default function PostSurvey() {
  const { participant, setParticipant } = useStudy();
  const [responses, setResponses] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isTestGroup = participant?.groupAssignment === "test";

  const groupQuestions = isTestGroup ? TEST_GROUP_QUESTIONS : CONTROL_GROUP_QUESTIONS;
  const allQuestions = [...SHARED_QUESTIONS, ...groupQuestions];

  function handleChange(key, value) {
    setResponses((prev) => ({ ...prev, [key]: value }));
  }

  function isComplete() {
    return allQuestions.every((q) => responses[q.key]?.trim());
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isComplete()) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/study/post-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses }),
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

  function renderQuestion(q) {
    const value = responses[q.key] || "";
    const disabled = submitting;

    switch (q.type) {
      case "likert":
        return <LikertField key={q.key} question={q} value={value} onChange={handleChange} disabled={disabled} />;
      case "select":
        return <SelectField key={q.key} question={q} value={value} onChange={handleChange} disabled={disabled} />;
      case "text":
        return <TextField key={q.key} question={q} value={value} onChange={handleChange} disabled={disabled} />;
      default:
        return null;
    }
  }

  return (
    <div className="survey-page">
      <h2>Post-Study Survey</h2>
      <p>Please answer the following questions about your experience.</p>

      <form onSubmit={handleSubmit}>
        {allQuestions.map(renderQuestion)}

        {error && <p className="error-message">{error}</p>}

        <button
          className="btn btn-primary"
          type="submit"
          disabled={submitting || !isComplete()}
        >
          {submitting ? "Submitting..." : "Submit Survey"}
        </button>
      </form>
    </div>
  );
}
