import { findSession } from "../models/users.js";

// Middleware that loads the current user from the session cookie.
// If a valid session exists, req.user is set to the user object.
// If no session or invalid session, req.user is left undefined.
// This middleware runs on every request so routes can check req.user.
export async function loadUser(req, res, next) {
  const sessionId = req.cookies.session_id;

  if (!sessionId) {
    return next();
  }

  try {
    const session = await findSession(sessionId);
    if (session) {
      req.user = {
        id: session.user_id,
        username: session.username,
        email: session.email,
        isAdmin: session.is_admin,
      };
    }
  } catch (err) {
    console.error("Error loading session:", err);
  }

  next();
}

// Middleware that requires authentication.
// If req.user is not set, returns a 401 JSON response.
// Use this on routes that require a logged-in user.
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "You must be logged in." });
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
}
