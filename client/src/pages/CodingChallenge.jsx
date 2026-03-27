import { useState, useRef, useCallback, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { useStudy } from "../hooks/useStudy";
import Timer from "../components/Timer";
import VisualizationFrame from "../components/VisualizationFrame";
import ChatPanel from "../components/ChatPanel";

const CHALLENGE_DURATION = 480; // 8 minutes
const VISUALIZATION_URL = import.meta.env.VITE_VISUALIZATION_URL || null;

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
];

const STARTER_CODE = {
  javascript: `function selectionSort(arr) {
  // Your implementation here

  return arr;
}
`,
  python: `def selection_sort(arr):
    # Your implementation here

    return arr
`,
  java: `public static int[] selectionSort(int[] arr) {
    // Your implementation here

    return arr;
}
`,
  c: `void selectionSort(int arr[], int n) {
    // Your implementation here
}
`,
  cpp: `void selectionSort(int arr[], int n) {
    // Your implementation here
}
`,
  csharp: `public static int[] SelectionSort(int[] arr) {
    // Your implementation here

    return arr;
}
`,
};

function loadSaved(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? val : fallback;
  } catch {
    return fallback;
  }
}

export default function CodingChallenge() {
  const { participant, setParticipant } = useStudy();
  const savedLang = loadSaved("study_language", "javascript");
  const savedCode = loadSaved("study_code", STARTER_CODE[savedLang] || STARTER_CODE.javascript);
  const [language, setLanguage] = useState(savedLang);
  const [code, setCode] = useState(savedCode);
  const [submitted, setSubmitted] = useState(false);
  const [vizReady, setVizReady] = useState(false);
  const [error, setError] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [agentLoading, setAgentLoading] = useState(false);
  const [checkResult, setCheckResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const timerRef = useRef(null);
  const iframeRef = useRef(null);
  const editorRef = useRef(null);
  const codeRef = useRef(code);

  codeRef.current = code;

  const isTestGroup = participant?.groupAssignment === "test";

  // Persist code and language to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("study_code", code);
    } catch {}
  }, [code]);

  useEffect(() => {
    try {
      localStorage.setItem("study_language", language);
    } catch {}
  }, [language]);

  useEffect(() => {
    if (isTestGroup) {
      fetch("/api/study/chat-history")
        .then((res) => res.json())
        .then((data) => {
          if (data.messages?.length) {
            setChatMessages(data.messages);
          }
        })
        .catch(() => {});
    }
  }, [isTestGroup]);

  const handleVizReady = useCallback(() => {
    setVizReady(true);
    iframeRef.current?.send({ type: "START", payload: { algorithm: "selection_sort" } });
  }, []);

  const handleEditorMount = useCallback((editor) => {
    editorRef.current = editor;
  }, []);

  function handleLanguageChange(e) {
    const newLang = e.target.value;
    const oldLang = language;

    // Record the switch
    fetch("/api/study/language-change", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromLanguage: oldLang,
        toLanguage: newLang,
        codeSnapshot: codeRef.current,
      }),
    }).catch(() => {});

    setLanguage(newLang);
    const newCode = STARTER_CODE[newLang];
    setCode(newCode);
    codeRef.current = newCode;
    setCheckResult(null);
  }

  function getSelection() {
    const editor = editorRef.current;
    if (!editor) return null;
    const sel = editor.getSelection();
    if (!sel || sel.isEmpty()) return null;
    return {
      startLine: sel.startLineNumber,
      endLine: sel.endLineNumber,
      startCol: sel.startColumn,
      endCol: sel.endColumn,
      text: editor.getModel().getValueInRange(sel),
    };
  }

  async function handleSendMessage(prompt) {
    setAgentLoading(true);
    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: prompt, id: `u-${Date.now()}` },
    ]);

    try {
      const res = await fetch("/api/study/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          code: codeRef.current,
          language,
          selection: getSelection(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.error, id: `a-${Date.now()}` },
        ]);
      } else {
        setCode(data.code);
        codeRef.current = data.code;
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message, id: `a-${Date.now()}` },
        ]);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Network error. Please try again.", id: `a-${Date.now()}` },
      ]);
    } finally {
      setAgentLoading(false);
    }
  }

  async function handleCheckCode() {
    setChecking(true);
    setCheckResult(null);

    try {
      const res = await fetch("/api/study/check-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeRef.current, language }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCheckResult({ correct: false, message: data.error || "Check failed." });
      } else {
        setCheckResult(data);
      }
    } catch {
      setCheckResult({ correct: false, message: "Network error. Please try again." });
    } finally {
      setChecking(false);
    }
  }

  const handleSubmit = useCallback(async () => {
    if (submitted) return;
    setSubmitted(true);

    if (timerRef.current) timerRef.current.stop();

    const elapsed = timerRef.current?.getElapsedMs?.() || CHALLENGE_DURATION * 1000;

    try {
      const res = await fetch("/api/study/code-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: codeRef.current,
          durationMs: elapsed,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setSubmitted(false);
        return;
      }

      // Clean up localStorage on successful submit
      localStorage.removeItem("study_code");
      localStorage.removeItem("study_language");
      localStorage.removeItem("study_timer_start");
      setParticipant(data.participant);
    } catch {
      setError("Network error. Please try again.");
      setSubmitted(false);
    }
  }, [submitted, setParticipant]);

  return (
    <div className="coding-page">
      <h2>Coding Challenge</h2>

      {isTestGroup ? (
        <p>
          Use the AI assistant to implement <strong>selection sort</strong> based on
          the visualization below. You have 8 minutes.
        </p>
      ) : (
        <p>
          Implement <strong>selection sort</strong> in JavaScript based on the
          visualization below. You have 8 minutes.
        </p>
      )}

      <Timer ref={timerRef} durationSeconds={CHALLENGE_DURATION} onExpire={handleSubmit} storageKey="study_timer_start" />

      <div className="editor-toolbar">
        <select
          className="language-picker"
          value={language}
          onChange={handleLanguageChange}
          disabled={submitted}
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
        <button
          className="btn btn-run"
          onClick={handleCheckCode}
          disabled={checking || submitted}
        >
          {checking ? "Checking..." : "Run"}
        </button>
      </div>

      {isTestGroup ? (
        <div className="editor-chat-container">
          <div className="editor-container">
            <Editor
              height="500px"
              language={language}
              value={code}
              onMount={handleEditorMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                readOnly: true,
              }}
            />
          </div>
          <ChatPanel
            messages={chatMessages}
            onSend={handleSendMessage}
            isLoading={agentLoading}
            disabled={submitted}
          />
        </div>
      ) : (
        <div className="editor-container">
          <Editor
            height="500px"
            language={language}
            value={code}
            onChange={(value) => {
              setCode(value || "");
              setCheckResult(null);
            }}
            onMount={handleEditorMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>
      )}

      {checkResult && (
        <div className={`check-result ${checkResult.correct ? "check-pass" : "check-fail"}`}>
          <strong>{checkResult.correct ? "Pass" : "Not quite"}:</strong>{" "}
          {checkResult.message}
        </div>
      )}

      <VisualizationFrame
        ref={iframeRef}
        src={VISUALIZATION_URL}
        onReady={handleVizReady}
      />

      <div className="viz-controls">
        <button
          className="btn btn-viz-control"
          onClick={() => iframeRef.current?.send({ type: "START", payload: { algorithm: "selection_sort" } })}
          disabled={!vizReady || submitted}
        >
          Play
        </button>
        <button
          className="btn btn-viz-control"
          onClick={() => iframeRef.current?.send({ type: "RESTART" })}
          disabled={!vizReady || submitted}
        >
          Restart
        </button>
        <button
          className="btn btn-viz-control"
          onClick={() => iframeRef.current?.send({ type: "RANDOMIZE" })}
          disabled={!vizReady || submitted}
        >
          Randomize
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      <button
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={submitted}
      >
        {submitted ? "Submitting..." : "Submit Code"}
      </button>
    </div>
  );
}
