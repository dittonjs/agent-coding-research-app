import express from "express";
import {
  createUser,
  findByUsername,
  findByEmail,
  verifyPassword,
  createSession,
  deleteSession,
} from "../models/users.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// POST /api/auth/register
// Creates a new user account and logs them in by setting a session cookie.
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ error: "Username, email, and password are required." });
  }

  try {
    const existingUsername = await findByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ error: "Username is already taken." });
    }

    const existingEmail = await findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ error: "Email is already registered." });
    }

    const user = await createUser(username, email, password);
    const sessionId = await createSession(user.id);

    res.cookie("session_id", sessionId, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    res.status(201).json({
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// POST /api/auth/login
// Logs in a user by verifying credentials and setting a session cookie.
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required." });
  }

  try {
    const user = await findByUsername(username);
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const sessionId = await createSession(user.id);

    res.cookie("session_id", sessionId, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    res.json({
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// POST /api/auth/logout
// Logs out the current user by clearing the session cookie.
router.post("/logout", requireAuth, async (req, res) => {
  try {
    const sessionId = req.cookies.session_id;
    await deleteSession(sessionId);
    res.clearCookie("session_id");
    res.json({ message: "Logged out." });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// GET /api/auth/me
// Returns the currently logged-in user, or null if not logged in.
router.get("/me", (req, res) => {
  if (req.user) {
    res.json({ user: req.user });
  } else {
    res.json({ user: null });
  }
});

export default router;
