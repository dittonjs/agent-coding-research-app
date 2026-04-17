import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useAdmin } from "./AdminLayout";

export default function ParticipantDetail() {
  const { studyId, participantId } = useParams();
  const { handleLogout } = useAdmin();
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    fetch(`/api/admin/participants/${participantId}`)
      .then((res) => res.json())
      .then((data) => setDetail(data))
      .catch(() => {});
  }, [participantId]);

  if (!detail) return <p>Loading...</p>;

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h2>Participant #{detail.participant.id}</h2>
        <button className="btn btn-logout" onClick={handleLogout}>Logout</button>
      </div>

      <Link to={`/admin/studies/${studyId}`} className="btn btn-secondary btn-sm">
        &larr; Back to Participants
      </Link>

      <div className="admin-detail">
        <div className="detail-section">
          <h4>Demographics</h4>
          <dl>
            <dt>Group</dt><dd>{detail.participant.group_assignment}</dd>
            <dt>Age Range</dt><dd>{detail.participant.age_range || "\u2014"}</dd>
            <dt>Gender</dt><dd>{detail.participant.gender || "\u2014"}</dd>
            <dt>Ethnicity</dt><dd>{detail.participant.ethnicity || "\u2014"}</dd>
            <dt>CS Year</dt><dd>{detail.participant.cs_year || "\u2014"}</dd>
            <dt>AI Usage</dt><dd>{detail.participant.prior_ai_usage || "\u2014"}</dd>
            <dt>Current Step</dt><dd>{detail.participant.current_step}/8</dd>
          </dl>
        </div>

        {detail.testResults.length > 0 && (
          <div className="detail-section">
            <h4>Test Results</h4>
            {detail.testResults.map((t) => (
              <div key={t.id} style={{ marginBottom: "1rem" }}>
                <strong>{t.test_type}-test</strong>
                {" \u2014 "}
                {t.results.correctCount}/{t.results.totalSteps} correct
                {t.results.durationMs && ` in ${(t.results.durationMs / 1000).toFixed(1)}s`}
                <pre className="code-block">
                  {JSON.stringify(t.results, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}

        {detail.codeSubmission && (
          <div className="detail-section">
            <h4>Code Submission{detail.codeSubmission.gave_up ? " (gave up)" : ""}</h4>
            <p>Duration: {detail.codeSubmission.duration_ms ? `${(detail.codeSubmission.duration_ms / 1000).toFixed(1)}s` : "\u2014"}</p>
            <pre className="code-block">{detail.codeSubmission.code}</pre>
          </div>
        )}

        {detail.surveyResponses.length > 0 && (
          <div className="detail-section">
            <h4>Survey Responses</h4>
            <pre className="code-block">
              {JSON.stringify(detail.surveyResponses, null, 2)}
            </pre>
          </div>
        )}

        {detail.chatMessages?.length > 0 && (
          <div className="detail-section">
            <h4>Chat Messages ({detail.chatMessages.length})</h4>
            <div className="admin-chat-log">
              {detail.chatMessages.map((m) => (
                <div key={m.id} className={`admin-chat-msg admin-chat-${m.role}`}>
                  <strong>{m.role === "user" ? "Student" : "Agent"}:</strong>{" "}
                  {m.content}
                </div>
              ))}
            </div>
          </div>
        )}

        {detail.editorEvents?.length > 0 && (() => {
          const allEvents = detail.editorEvents
            .flatMap((batch) => batch.events)
            .sort((a, b) => a.ts - b.ts);
          return (
            <div className="detail-section">
              <h4>Editor Events ({allEvents.length})</h4>
              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                <table className="admin-table" style={{ fontSize: "0.8rem" }}>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Source</th>
                      <th>Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allEvents.map((ev, idx) => {
                      const secs = (ev.ts / 1000).toFixed(1);
                      const mins = Math.floor(ev.ts / 60000);
                      const remSecs = ((ev.ts % 60000) / 1000).toFixed(1);
                      const timeStr = mins > 0 ? `${mins}m ${remSecs}s` : `${secs}s`;

                      let changeDesc = "";
                      if (ev.fullContent !== undefined) {
                        changeDesc = ev.source === "language-change"
                          ? `${ev.fromLanguage} \u2192 ${ev.toLanguage}`
                          : "Full content replaced";
                      } else if (ev.changes) {
                        changeDesc = ev.changes.map((c) => {
                          const loc = `L${c.range.startLine}:${c.range.startCol}`;
                          if (c.text === "" && c.rangeLength > 0) {
                            return `deleted ${c.rangeLength} chars at ${loc}`;
                          }
                          const preview = c.text.length > 50
                            ? c.text.slice(0, 50) + "..."
                            : c.text;
                          const escaped = preview.replace(/\n/g, "\\n");
                          if (c.rangeLength > 0) {
                            return `replaced ${c.rangeLength} chars with "${escaped}" at ${loc}`;
                          }
                          return `inserted "${escaped}" at ${loc}`;
                        }).join("; ");
                      }

                      return (
                        <tr key={idx}>
                          <td style={{ whiteSpace: "nowrap" }}>{timeStr}</td>
                          <td>
                            <span className={`event-source event-source-${ev.source}`}>
                              {ev.source}
                            </span>
                          </td>
                          <td style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                            {changeDesc}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
