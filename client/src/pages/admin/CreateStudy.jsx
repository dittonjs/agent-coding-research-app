import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAdmin } from "./AdminLayout";

export default function CreateStudy() {
  const { loadStudies, handleLogout } = useAdmin();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [creating, setCreating] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);

    const res = await fetch("/api/admin/studies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, timerEnabled }),
    });

    if (res.ok) {
      const data = await res.json();
      await loadStudies();
      navigate(`/admin/studies/${data.study.id}`);
    }
    setCreating(false);
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h2>Create New Study</h2>
        <button className="btn btn-logout" onClick={handleLogout}>Logout</button>
      </div>

      <Link to="/admin" className="btn btn-secondary btn-sm">
        &larr; Back to Studies
      </Link>

      <form className="create-study-form" onSubmit={handleSubmit}>
        <label>
          Study Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Spring 2026 — Section A"
          />
        </label>
        <label>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Notes to help you remember what this study was for..."
          />
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={timerEnabled}
            onChange={(e) => setTimerEnabled(e.target.checked)}
          />
          Enable coding challenge timer (10 min)
        </label>
        <button className="btn btn-primary" type="submit" disabled={creating}>
          {creating ? "Creating..." : "Create Study"}
        </button>
      </form>
    </div>
  );
}
