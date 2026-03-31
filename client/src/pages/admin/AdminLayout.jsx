import { useState, useEffect, createContext, useContext } from "react";
import { Outlet, useNavigate } from "react-router-dom";

const AdminContext = createContext();

export function useAdmin() {
  return useContext(AdminContext);
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // Login form
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Shared state
  const [studies, setStudies] = useState([]);
  const [activeStudyId, setActiveStudyId] = useState(null);

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
    if (admin) loadStudies();
  }, [admin]);

  async function loadStudies() {
    const res = await fetch("/api/admin/studies");
    const data = await res.json();
    if (res.ok) {
      setStudies(data.studies);
      setActiveStudyId(data.activeStudyId);
    }
  }

  async function handleToggleActive(studyId, isActive) {
    const res = await fetch(`/api/admin/studies/${studyId}/active`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    if (res.ok) {
      const data = await res.json();
      setStudies(data.studies);
      setActiveStudyId(data.activeStudyId);
    }
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
    navigate("/admin");
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
    <AdminContext.Provider value={{ studies, activeStudyId, loadStudies, handleToggleActive, handleLogout }}>
      <Outlet />
    </AdminContext.Provider>
  );
}
