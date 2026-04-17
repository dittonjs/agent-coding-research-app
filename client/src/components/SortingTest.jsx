import { useState, useRef } from "react";
import { useStudy } from "../hooks/useStudy";
import { selectionSortSteps, checkStep } from "../utils/selectionSort";

export default function SortingTest({ title, description, endpoint, initialArrays, showIDontKnow }) {
  const { setParticipant } = useStudy();
  const startTimeRef = useRef(Date.now());

  // Per-question expected steps, computed once
  const expectedStepsByQuestion = useRef(
    initialArrays.map((arr) => selectionSortSteps(arr))
  ).current;

  // One history per question; each starts with the initial array
  const [histories, setHistories] = useState(
    initialArrays.map((arr) => [[...arr]])
  );
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const initialArray = initialArrays[questionIndex];
  const history = histories[questionIndex];
  const currentArray = history[history.length - 1];
  const currentStepIndex = history.length - 1;
  const isLastQuestion = questionIndex === initialArrays.length - 1;

  function updateCurrentHistory(newHistory) {
    setHistories((prev) => {
      const copy = [...prev];
      copy[questionIndex] = newHistory;
      return copy;
    });
  }

  function handleBoxClick(index) {
    if (submitted) return;

    if (selected.includes(index)) {
      setSelected(selected.filter((i) => i !== index));
      return;
    }

    if (selected.length === 0) {
      setSelected([index]);
    } else if (selected.length === 1) {
      const newArray = [...currentArray];
      const [first] = selected;
      [newArray[first], newArray[index]] = [newArray[index], newArray[first]];
      updateCurrentHistory([...history, newArray]);
      setSelected([]);
    }
  }

  function handleUndo() {
    if (history.length <= 1 || submitted) return;
    updateCurrentHistory(history.slice(0, -1));
    setSelected([]);
  }

  function handleNext() {
    setQuestionIndex(questionIndex + 1);
    setSelected([]);
  }

  async function submitResults(skipped) {
    if (submitted) return;
    setSubmitted(true);

    const durationMs = Date.now() - startTimeRef.current;

    let results;

    if (skipped) {
      results = {
        questions: initialArrays.map((arr) => ({
          initialArray: arr,
          totalSteps: selectionSortSteps(arr).length,
          correctCount: 0,
          incorrectCount: 0,
          steps: [],
        })),
        totalSteps: expectedStepsByQuestion.reduce((n, s) => n + s.length, 0),
        correctCount: 0,
        incorrectCount: 0,
        durationMs,
        skipped: true,
      };
    } else {
      const perQuestion = initialArrays.map((arr, qIdx) => {
        const expectedSteps = expectedStepsByQuestion[qIdx];
        const qHistory = histories[qIdx];

        const scoredSteps = expectedSteps.map((expected, stepIdx) => {
          const studentAnswer = qHistory[stepIdx + 1] || [];
          const correct = checkStep(expected, studentAnswer);
          return {
            step: stepIdx + 1,
            expected,
            studentAnswer,
            correct,
          };
        });

        const qCorrect = scoredSteps.filter((s) => s.correct).length;
        const allSwaps = qHistory.slice(1).map((state, idx) => ({
          swap: idx + 1,
          arrayState: state,
        }));

        return {
          initialArray: arr,
          totalSteps: expectedSteps.length,
          correctCount: qCorrect,
          incorrectCount: expectedSteps.length - qCorrect,
          steps: scoredSteps,
          allSwaps,
          totalSwapsPerformed: allSwaps.length,
        };
      });

      const totalSteps = perQuestion.reduce((n, q) => n + q.totalSteps, 0);
      const correctCount = perQuestion.reduce((n, q) => n + q.correctCount, 0);

      results = {
        questions: perQuestion,
        totalSteps,
        correctCount,
        incorrectCount: totalSteps - correctCount,
        durationMs,
        skipped: false,
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
        Question {questionIndex + 1} of {initialArrays.length}. Select two numbers to swap them.
      </p>

      <div className="sort-exercise">
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

        <p className="sort-step-counter">
          {currentStepIndex === 0
            ? "Select 2 numbers to swap"
            : `${currentStepIndex} swap${currentStepIndex !== 1 ? "s" : ""} performed`}
        </p>
      </div>

      {error && <p className="error-message">{error}</p>}

      {!submitted && (
        <div className="test-submit-actions">
          {isLastQuestion ? (
            <button className="btn btn-primary" onClick={() => submitResults(false)}>
              Submit Answers
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleNext}>
              Next Question
            </button>
          )}
          {history.length > 1 && (
            <button className="btn btn-secondary" onClick={handleUndo}>
              Undo Last Swap
            </button>
          )}
          {showIDontKnow && questionIndex === 0 && history.length === 1 && (
            <button className="btn btn-secondary" onClick={() => submitResults(true)}>
              I don't know selection sort
            </button>
          )}
        </div>
      )}
    </div>
  );
}
