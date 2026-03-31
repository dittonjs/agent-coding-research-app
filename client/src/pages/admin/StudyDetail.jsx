import { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { useAdmin } from "./AdminLayout";

export default function StudyDetail() {
  const { studyId } = useParams();
  const { studies, handleToggleActive, handleLogout } = useAdmin();
  const [participants, setParticipants] = useState([]);
  const [exporting, setExporting] = useState(false);

  const study = studies.find((s) => s.id === parseInt(studyId, 10));

  useEffect(() => {
    fetch(`/api/admin/participants?studyId=${studyId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.participants) setParticipants(data.participants);
      })
      .catch(() => {});
  }, [studyId]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/admin/studies/${studyId}/export`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Export failed.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="?(.+?)"?$/);
      a.download = match ? match[1] : `study_${studyId}_export.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  }, [studyId]);

  if (!study) return <p>Study not found.</p>;

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h2>{study.name}</h2>
        <button className="btn btn-logout" onClick={handleLogout}>Logout</button>
      </div>

      <Link to="/admin" className="btn btn-secondary btn-sm">
        &larr; Back to Studies
      </Link>

      <div className="study-detail-header">
        {study.description && (
          <p className="study-description">{study.description}</p>
        )}
        <div className="study-detail-meta">
          <span>Created: {new Date(study.created_at).toLocaleDateString()}</span>
          <span>Timer: {study.timer_enabled ? "Enabled" : "Disabled"}</span>
          <button
            className={`btn btn-sm ${study.is_active ? "btn-active-study" : "btn-inactive-study"}`}
            onClick={() => handleToggleActive(study.id, !study.is_active)}
          >
            {study.is_active ? "Active \u2014 Click to Deactivate" : "Inactive \u2014 Click to Activate"}
          </button>
          <button
            className="btn btn-sm btn-export"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </div>

      <h3>Participants ({participants.length})</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Group</th>
            <th>Step</th>
            <th>CS Year</th>
            <th>AI Usage</th>
            <th>Created</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {participants.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.group_assignment}</td>
              <td>{p.current_step}/8</td>
              <td>{p.cs_year || "\u2014"}</td>
              <td>{p.prior_ai_usage || "\u2014"}</td>
              <td>{new Date(p.created_at).toLocaleDateString()}</td>
              <td>
                <Link to={`/admin/studies/${studyId}/participants/${p.id}`} className="btn btn-primary btn-sm">
                  View
                </Link>
              </td>
            </tr>
          ))}
          {participants.length === 0 && (
            <tr>
              <td colSpan="7" style={{ textAlign: "center" }}>
                No participants yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
