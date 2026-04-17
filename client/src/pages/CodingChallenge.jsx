import { useState, useRef, useCallback, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { useStudy } from "../hooks/useStudy";
import VisualizationFrame from "../components/VisualizationFrame";
import ChatPanel from "../components/ChatPanel";
import Modal from "../components/Modal";

const VISUALIZATION_URL = "https://sulovebhattarai.github.io/selection_sort_animation/";

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
}
`,
  python: `def selection_sort(arr):
    # Your implementation here
    pass
`,
  java: `public static void selectionSort(int[] arr) {
    // Your implementation here
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
  csharp: `public static void SelectionSort(int[] arr) {
    // Your implementation here
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
  const [confirmKind, setConfirmKind] = useState(null); // "submit" | "giveUp" | null
  const [error, setError] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [agentLoading, setAgentLoading] = useState(false);
  const editorRef = useRef(null);
  const codeRef = useRef(code);

  // Editor event recording
  const eventsBufferRef = useRef([]);
  const batchSeqRef = useRef(0);
  const flushTimerRef = useRef(null);
  const sessionStartRef = useRef(Date.now());
  const pastedRef = useRef(false);
  const programmaticChangeRef = useRef(false);

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

  // Flush buffered editor events to the server
  const flushEditorEvents = useCallback(() => {
    const events = eventsBufferRef.current;
    if (events.length === 0) return;

    eventsBufferRef.current = [];
    const seq = batchSeqRef.current++;

    fetch("/api/study/editor-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events, batchSeq: seq }),
    }).catch(() => {});
  }, []);

  // Prevent Ctrl+S from opening the browser save dialog
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Flush on an interval and on unmount
  useEffect(() => {
    flushTimerRef.current = setInterval(flushEditorEvents, 5000);
    return () => {
      clearInterval(flushTimerRef.current);
      flushEditorEvents();
    };
  }, [flushEditorEvents]);

  function classifySource(changes) {
    // Multiple ranges changed at once → likely autocomplete or bracket auto-close
    if (changes.length > 1) return "autocomplete";

    const change = changes[0];
    const inserted = change.text;
    const rangeLen =
      change.rangeLength !== undefined
        ? change.rangeLength
        : 0;

    // Pure deletion (no text inserted, range removed)
    if (inserted === "" && rangeLen > 0) return "delete";

    // Use the paste flag set by Monaco's onDidPaste
    if (pastedRef.current) {
      pastedRef.current = false;
      return "paste";
    }

    // Multi-char insert that wasn't a paste → autocomplete
    if (inserted.length > 2) return "autocomplete";
    if (inserted.includes("\n") && inserted.length > 1) return "autocomplete";

    // Single char or two chars (e.g. bracket auto-close) → typing
    return "type";
  }

  const handleVizEvent = useCallback((event) => {
    // Record visualization interactions (play/replay/randomize) as editor events
    eventsBufferRef.current.push({
      ts: Date.now() - sessionStartRef.current,
      source: "visualization",
      eventType: event.eventType,
      vizTimestamp: event.timestamp,
    });
  }, []);

  const handleEditorMount = useCallback((editor) => {
    editorRef.current = editor;

    // Flag paste events so classifySource can distinguish from autocomplete
    editor.onDidPaste(() => {
      pastedRef.current = true;
    });

    editor.onDidChangeModelContent((e) => {
      // Skip changes triggered by programmatic setCode (agent/language change)
      // — those are already recorded by their own source-specific event.
      if (programmaticChangeRef.current) {
        programmaticChangeRef.current = false;
        return;
      }

      let source = classifySource(e.changes);
      if (e.isUndoing) source = "undo";
      if (e.isRedoing) source = "redo";

      const event = {
        ts: Date.now() - sessionStartRef.current,
        source,
        changes: e.changes.map((c) => ({
          range: {
            startLine: c.range.startLineNumber,
            startCol: c.range.startColumn,
            endLine: c.range.endLineNumber,
            endCol: c.range.endColumn,
          },
          rangeLength: c.rangeLength,
          text: c.text,
        })),
      };

      eventsBufferRef.current.push(event);
    });
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

    // Record language change as an editor event
    eventsBufferRef.current.push({
      ts: Date.now() - sessionStartRef.current,
      source: "language-change",
      fromLanguage: oldLang,
      toLanguage: newLang,
      fullContent: STARTER_CODE[newLang],
    });

    setLanguage(newLang);
    const newCode = STARTER_CODE[newLang];
    programmaticChangeRef.current = true;
    setCode(newCode);
    codeRef.current = newCode;
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
        // Record agent code replacement as an editor event
        eventsBufferRef.current.push({
          ts: Date.now() - sessionStartRef.current,
          source: "agent",
          fullContent: data.code,
        });
        programmaticChangeRef.current = true;
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

  const handleSubmit = useCallback(async (gaveUp = false) => {
    if (submitted) return;
    setSubmitted(true);

    flushEditorEvents();

    const elapsed = Date.now() - sessionStartRef.current;

    try {
      const res = await fetch("/api/study/code-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: codeRef.current,
          durationMs: elapsed,
          gaveUp,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setSubmitted(false);
        return;
      }

      localStorage.removeItem("study_code");
      localStorage.removeItem("study_language");
      setParticipant(data.participant);
    } catch {
      setError("Network error. Please try again.");
      setSubmitted(false);
    }
  }, [submitted, setParticipant, flushEditorEvents]);

  return (
    <div className="coding-page">
      <div className="coding-sidebar">
        <h2>Coding Challenge</h2>

        {isTestGroup ? (
          <p>
            Use the AI assistant to implement <strong>selection sort</strong> based on
            the visualization. Sort the array in place; do not return a new
            array. When you believe you have a correct solution, click Submit to move on.
          </p>
        ) : (
          <p>
            Implement <strong>selection sort</strong> based on the
            visualization. Sort the array in place; do not return a new
            array. When you believe you have a correct solution, click Submit to move on.
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
          <button
            className="btn btn-primary"
            onClick={() => setConfirmKind("submit")}
            disabled={submitted}
          >
            {submitted ? "Submitting..." : "Submit Code"}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setConfirmKind("giveUp")}
            disabled={submitted}
          >
            I give up
          </button>
        </div>

        {error && <p className="error-message">{error}</p>}
      </div>

      <div className="coding-main">
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
      </div>

      {isTestGroup ? (
        <div className="editor-chat-container">
          <div className="editor-container">
            <Editor
              height="300px"
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
                tabSize: 4,
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
            height="300px"
            language={language}
            value={code}
            onChange={(value) => {
              setCode(value || "");
            }}
            onMount={handleEditorMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              readOnly: submitted,
              tabSize: 4,
            }}
          />
        </div>
      )}

      <VisualizationFrame
        src={VISUALIZATION_URL}
        onVizEvent={handleVizEvent}
      />

      </div>

      {confirmKind && (
        <Modal title={confirmKind === "giveUp" ? "Give up?" : "Ready to submit?"}>
          <p>
            {confirmKind === "giveUp"
              ? "Move on to the post-test without a working solution?"
              : "Submit your code and move on to the post-test?"}
          </p>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button
              className="btn"
              onClick={() => setConfirmKind(null)}
              disabled={submitted}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                const kind = confirmKind;
                setConfirmKind(null);
                handleSubmit(kind === "giveUp");
              }}
              disabled={submitted}
            >
              {submitted ? "Submitting..." : confirmKind === "giveUp" ? "I give up" : "Submit"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
