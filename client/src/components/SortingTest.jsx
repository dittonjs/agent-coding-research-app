import { useState, useRef } from "react";
import { useStudy } from "../hooks/useStudy";
import { selectionSortSteps, checkStep } from "../utils/selectionSort";

export default function SortingTest({ title, description, endpoint, initialArray, showIDontKnow }) {
  const { setParticipant } = useStudy();
  const expectedSteps = selectionSortSteps(initialArray);
  const startTimeRef = useRef(Date.now());

  // Each row is an array of strings (one per box)
  const [answers, setAnswers] = useState(
    expectedSteps.map(() => initialArray.map(() => ""))
  );
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function handleChange(stepIdx, boxIdx, value) {
    const cleaned = value.replace(/[^0-9]/g, "");
    setAnswers((prev) => {
      const updated = prev.map((row) => [...row]);
      updated[stepIdx][boxIdx] = cleaned;
      return updated;
    });
  }

  async function submitResults(skipped) {
    if (submitted) return;
    setSubmitted(true);

    const durationMs = Date.now() - startTimeRef.current;

    let results;

    if (skipped) {
      results = {
        initialArray,
        totalSteps: expectedSteps.length,
        correctCount: 0,
        incorrectCount: 0,
        durationMs,
        skipped: true,
        steps: [],
      };
    } else {
      const steps = expectedSteps.map((expected, stepIdx) => {
        const studentAnswer = answers[stepIdx].map((v) => parseInt(v, 10));
        const correct = checkStep(expected, studentAnswer);
        return {
          step: stepIdx + 1,
          expected,
          studentAnswer,
          correct,
        };
      });

      const correctCount = steps.filter((s) => s.correct).length;

      results = {
        initialArray,
        totalSteps: steps.length,
        correctCount,
        incorrectCount: steps.length - correctCount,
        durationMs,
        skipped: false,
        steps,
      };
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setSubmitted(false);
        return;
      }

      setParticipant(data.participant);
    } catch {
      setError("Network error. Please try again.");
      setSubmitted(false);
    }
  }

  return (
    <div className="test-page">
      <h2>{title}</h2>
      <p>{description}</p>

      <div className="sort-exercise">
        <div className="sort-row">
          <span className="sort-row-label">Initial:</span>
          <div className="sort-boxes">
            {initialArray.map((num, i) => (
              <div key={i} className="sort-box sort-box-fixed">{num}</div>
            ))}
          </div>
        </div>

        {expectedSteps.map((_, stepIdx) => (
          <div key={stepIdx} className="sort-row">
            <span className="sort-row-label">Swap {stepIdx + 1}:</span>
            <div className="sort-boxes">
              {initialArray.map((_, boxIdx) => (
                <input
                  key={boxIdx}
                  type="text"
                  inputMode="numeric"
                  className="sort-box sort-box-input"
                  value={answers[stepIdx][boxIdx]}
                  onChange={(e) => handleChange(stepIdx, boxIdx, e.target.value)}
                  disabled={submitted}
                  maxLength={3}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="error-message">{error}</p>}

      {!submitted && (
        <div className="test-submit-actions">
          <button className="btn btn-primary" onClick={() => submitResults(false)}>
            Submit Answers
          </button>
          {showIDontKnow && (
            <button className="btn btn-secondary" onClick={() => submitResults(true)}>
              I don't know selection sort
            </button>
          )}
        </div>
      )}
    </div>
  );
}
