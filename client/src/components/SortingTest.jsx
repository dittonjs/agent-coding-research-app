import { useState, useRef } from "react";
import { useStudy } from "../hooks/useStudy";
import { selectionSortSteps, checkStep } from "../utils/selectionSort";

export default function SortingTest({ title, description, endpoint, initialArray, showIDontKnow }) {
  const { setParticipant } = useStudy();
  const expectedSteps = selectionSortSteps(initialArray);
  const startTimeRef = useRef(Date.now());

  // History of array states: starts with the initial array
  const [history, setHistory] = useState([[...initialArray]]);
  // Which indices are selected for swapping (0, 1, or 2 selected)
  const [selected, setSelected] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const currentArray = history[history.length - 1];
  const currentStepIndex = history.length - 1; // 0 = initial, 1 = after swap 1, etc.
  function handleBoxClick(index) {
    if (submitted) return;

    if (selected.includes(index)) {
      // Deselect if clicking the same box
      setSelected(selected.filter((i) => i !== index));
      return;
    }

    if (selected.length === 0) {
      setSelected([index]);
    } else if (selected.length === 1) {
      // Two selected — perform the swap
      const newArray = [...currentArray];
      const [first] = selected;
      [newArray[first], newArray[index]] = [newArray[index], newArray[first]];
      setHistory([...history, newArray]);
      setSelected([]);
    }
  }

  function handleUndo() {
    if (history.length <= 1 || submitted) return;
    setHistory(history.slice(0, -1));
    setSelected([]);
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
      // Score against the expected selection sort steps
      const scoredSteps = expectedSteps.map((expected, stepIdx) => {
        const studentAnswer = history[stepIdx + 1] || [];
        const correct = checkStep(expected, studentAnswer);
        return {
          step: stepIdx + 1,
          expected,
          studentAnswer,
          correct,
        };
      });

      const correctCount = scoredSteps.filter((s) => s.correct).length;

      // Save all swaps the user performed (for admin dashboard)
      const allSwaps = history.slice(1).map((state, idx) => ({
        swap: idx + 1,
        arrayState: state,
      }));

      results = {
        initialArray,
        totalSteps: expectedSteps.length,
        correctCount,
        incorrectCount: expectedSteps.length - correctCount,
        durationMs,
        skipped: false,
        steps: scoredSteps,
        allSwaps,
        totalSwapsPerformed: allSwaps.length,
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
      <p className="sort-instructions">
        Select two numbers to swap them. Submit when you believe the array is sorted.
      </p>

      <div className="sort-exercise">
        {/* Show completed steps as read-only rows */}
        {history.length > 1 && (
          <div className="sort-row">
            <span className="sort-row-label">Initial:</span>
            <div className="sort-boxes">
              {initialArray.map((num, i) => (
                <div key={i} className="sort-box sort-box-fixed">{num}</div>
              ))}
            </div>
          </div>
        )}

        {history.slice(1, -1).map((stepArray, idx) => (
          <div key={idx} className="sort-row">
            <span className="sort-row-label">Swap {idx + 1}:</span>
            <div className="sort-boxes">
              {stepArray.map((num, i) => (
                <div key={i} className="sort-box sort-box-fixed">{num}</div>
              ))}
            </div>
          </div>
        ))}

        {/* Current interactive row */}
        <div className="sort-row">
          <span className="sort-row-label">
            {currentStepIndex === 0 ? "Initial:" : `Swap ${currentStepIndex}:`}
          </span>
          <div className="sort-boxes">
            {currentArray.map((num, i) => {
              const isSelected = selected.includes(i);
              const classes = [
                "sort-box",
                submitted ? "sort-box-fixed" : "sort-box-clickable",
                isSelected ? "sort-box-selected" : "",
              ].join(" ");
              return (
                <div
                  key={i}
                  className={classes}
                  onClick={() => handleBoxClick(i)}
                >
                  {num}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step counter */}
        <p className="sort-step-counter">
          {currentStepIndex === 0
            ? "Select 2 numbers to swap"
            : `${currentStepIndex} swap${currentStepIndex !== 1 ? "s" : ""} performed`}
        </p>
      </div>

      {error && <p className="error-message">{error}</p>}

      {!submitted && (
        <div className="test-submit-actions">
          <button className="btn btn-primary" onClick={() => submitResults(false)}>
            Submit Answers
          </button>
          {history.length > 1 && (
            <button className="btn btn-secondary" onClick={handleUndo}>
              Undo Last Swap
            </button>
          )}
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
