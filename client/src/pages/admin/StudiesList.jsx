import { Link } from "react-router-dom";
import { useAdmin } from "./AdminLayout";

export default function StudiesList() {
  const { studies, handleLogout } = useAdmin();

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h2>Admin Dashboard</h2>
        <button className="btn btn-logout" onClick={handleLogout}>Logout</button>
      </div>

      <div className="studies-header">
        <h3>Studies ({studies.length})</h3>
        <Link to="/admin/studies/new" className="btn btn-primary btn-sm">
          + New Study
        </Link>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Status</th>
            <th>Created</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {studies.map((s) => (
            <tr key={s.id}>
              <td><strong>{s.name}</strong></td>
              <td className="study-desc-cell">{s.description || "\u2014"}</td>
              <td>
                <span className={`study-status ${s.is_active ? "study-status-active" : "study-status-inactive"}`}>
                  {s.is_active ? "Active" : "Inactive"}
                </span>
              </td>
              <td>{new Date(s.created_at).toLocaleDateString()}</td>
              <td>
                <Link to={`/admin/studies/${s.id}`} className="btn btn-primary btn-sm">
                  View
                </Link>
              </td>
            </tr>
          ))}
          {studies.length === 0 && (
            <tr>
              <td colSpan="5" style={{ textAlign: "center" }}>
                No studies yet. Create one to get started.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
