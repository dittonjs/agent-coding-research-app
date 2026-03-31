import { useState } from "react";
import { useStudy } from "../hooks/useStudy";

export default function Instructions() {
  const { participant, setParticipant } = useStudy();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isTestGroup = participant?.groupAssignment === "test";

  async function handleContinue() {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/study/instructions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    <div className="instructions-page">
      <h2>Coding Challenge Instructions</h2>

      <div className="instructions-content">
        <p>
          In the next step, you will see a visualization of the <strong>selection sort</strong> algorithm.
          Your task is to implement the selection sort algorithm based on what you observe
          in the visualization. You can select your preferred programming language from the
          dropdown menu above the editor.
        </p>

        {isTestGroup ? (
          <div className="instructions-group">
            <p>
              You will be using an <strong>AI assistant</strong> to write your code.
              You will not be able to edit the code directly. Instead, you will type
              instructions to the AI describing what code to write, and it will make
              the changes for you.
            </p>
            <p>
              The AI will write whatever code you tell it to, but it won't think for
              you. It will not explain algorithms, solve problems, or decide what to
              write next — you need to tell it exactly what to add or change.
            </p>
            <p><strong>Examples of things you can tell the AI:</strong></p>
            <ul>
              <li>"Add a for loop that goes from 0 to 10"</li>
              <li>"Declare a variable called temp"</li>
              <li>"Add an if statement that checks if x is less than y"</li>
              <li>"Add a return statement"</li>
              <li>"Delete line 3"</li>
              <li>"Move the if statement inside the for loop"</li>
            </ul>
            <p>
              When you are finished, click the <strong>Submit</strong> button.
            </p>
          </div>
        ) : (
          <div className="instructions-group">
            <p>
              You will write your code directly in the code editor provided.
              When you are finished, click the <strong>Submit</strong> button.
            </p>
          </div>
        )}
      </div>

      {error && <p className="error-message">{error}</p>}

      <button
        className="btn btn-primary"
        onClick={handleContinue}
        disabled={submitting}
      >
        {submitting ? "Loading..." : "I'm Ready — Start Coding"}
      </button>
    </div>
  );
}
