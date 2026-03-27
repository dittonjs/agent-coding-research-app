import { useState, useEffect } from "react";

export default function Admin() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // Login form
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Dashboard data
  const [participants, setParticipants] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((res) => res.json())
      .then((data) => {
        setAdmin(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (admin) loadParticipants();
  }, [admin]);

  async function loadParticipants() {
    const res = await fetch("/api/admin/participants");
    const data = await res.json();
    if (res.ok) setParticipants(data.participants);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setLoginError(data.error || "Login failed.");
      return;
    }

    setAdmin(data.user);
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAdmin(null);
    setSelected(null);
    setDetail(null);
  }

  async function viewDetail(id) {
    setSelected(id);
    setDetail(null);
    const res = await fetch(`/api/admin/participants/${id}`);
    const data = await res.json();
    if (res.ok) setDetail(data);
  }

  if (loading) return <p>Loading...</p>;

  if (!admin) {
    return (
      <div className="admin-login">
        <h2>Admin Login</h2>
        <form onSubmit={handleLogin}>
          <label>
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {loginError && <p className="error-message">{loginError}</p>}
          <button className="btn btn-primary" type="submit">
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h2>Admin Dashboard</h2>
        <button className="btn btn-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <h3>Participants ({participants.length})</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Group</th>
            <th>Step</th>
            <th>CS Year</th>
            <th>Experience</th>
            <th>AI Usage</th>
            <th>Created</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {participants.map((p) => (
            <tr key={p.id} className={selected === p.id ? "selected-row" : ""}>
              <td>{p.id}</td>
              <td>{p.group_assignment}</td>
              <td>{p.current_step}/8</td>
              <td>{p.cs_year || "—"}</td>
              <td>{p.prior_programming_experience || "—"}</td>
              <td>{p.prior_ai_usage || "—"}</td>
              <td>{new Date(p.created_at).toLocaleDateString()}</td>
              <td>
                <button className="btn btn-primary btn-sm" onClick={() => viewDetail(p.id)}>
                  View
                </button>
              </td>
            </tr>
          ))}
          {participants.length === 0 && (
            <tr>
              <td colSpan="8" style={{ textAlign: "center" }}>
                No participants yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {detail && (
        <div className="admin-detail">
          <h3>Participant #{detail.participant.id}</h3>

          <div className="detail-section">
            <h4>Demographics</h4>
            <dl>
              <dt>Group</dt><dd>{detail.participant.group_assignment}</dd>
              <dt>Age Range</dt><dd>{detail.participant.age_range || "—"}</dd>
              <dt>Gender</dt><dd>{detail.participant.gender || "—"}</dd>
              <dt>CS Year</dt><dd>{detail.participant.cs_year || "—"}</dd>
              <dt>Programming Experience</dt><dd>{detail.participant.prior_programming_experience || "—"}</dd>
              <dt>AI Usage</dt><dd>{detail.participant.prior_ai_usage || "—"}</dd>
              <dt>Current Step</dt><dd>{detail.participant.current_step}/8</dd>
            </dl>
          </div>

          {detail.testResults.length > 0 && (
            <div className="detail-section">
              <h4>Test Results</h4>
              {detail.testResults.map((t) => (
                <div key={t.id} style={{ marginBottom: "1rem" }}>
                  <strong>{t.test_type}-test</strong>
                  {" — "}
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
              <h4>Code Submission</h4>
              <p>Duration: {detail.codeSubmission.duration_ms ? `${(detail.codeSubmission.duration_ms / 1000).toFixed(1)}s` : "—"}</p>
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

          {detail.codeChecks?.length > 0 && (
            <div className="detail-section">
              <h4>Code Checks ({detail.codeChecks.length})</h4>
              {detail.codeChecks.map((c) => (
                <div key={c.id} style={{ marginBottom: "1rem" }}>
                  <strong>{c.correct ? "Correct" : "Incorrect"}</strong>
                  {" — "}{c.language} — {new Date(c.created_at).toLocaleTimeString()}
                  <br />
                  <em>{c.agent_message}</em>
                  <pre className="code-block">{c.code}</pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
