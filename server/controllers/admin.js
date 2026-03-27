import express from "express";
import pool from "../db/connection.js";
import { requireAdmin } from "../middleware/auth.js";
import {
  findByUsername,
  verifyPassword,
  createSession,
  deleteSession,
} from "../models/users.js";

const router = express.Router();

// POST /api/admin/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  try {
    const user = await findByUsername(username);
    if (!user || !user.is_admin) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const sessionId = await createSession(user.id);

    res.cookie("session_id", sessionId, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    res.json({ user: { id: user.id, username: user.username, isAdmin: true } });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// POST /api/admin/logout
router.post("/logout", requireAdmin, async (req, res) => {
  try {
    const sessionId = req.cookies.session_id;
    await deleteSession(sessionId);
    res.clearCookie("session_id");
    res.json({ message: "Logged out." });
  } catch (err) {
    console.error("Admin logout error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// GET /api/admin/me
router.get("/me", (req, res) => {
  if (req.user && req.user.isAdmin) {
    res.json({ user: req.user });
  } else {
    res.json({ user: null });
  }
});

// GET /api/admin/participants
router.get("/participants", requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.group_assignment,
        p.current_step,
        p.age_range,
        p.gender,
        p.cs_year,
        p.prior_programming_experience,
        p.prior_ai_usage,
        p.consent_timestamp,
        p.created_at
      FROM participants p
      ORDER BY p.created_at DESC
    `);

    res.json({ participants: result.rows });
  } catch (err) {
    console.error("Admin participants error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// GET /api/admin/participants/:id
router.get("/participants/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const participant = await pool.query(
      "SELECT * FROM participants WHERE id = $1",
      [id]
    );

    if (!participant.rows[0]) {
      return res.status(404).json({ error: "Participant not found." });
    }

    const testResults = await pool.query(
      "SELECT * FROM test_results WHERE participant_id = $1 ORDER BY test_type",
      [id]
    );

    const codeSubmission = await pool.query(
      "SELECT * FROM code_submissions WHERE participant_id = $1 ORDER BY created_at DESC LIMIT 1",
      [id]
    );

    const surveyResponses = await pool.query(
      "SELECT * FROM survey_responses WHERE participant_id = $1",
      [id]
    );

    const chatMessages = await pool.query(
      "SELECT id, role, content, created_at FROM chat_messages WHERE participant_id = $1 ORDER BY created_at ASC",
      [id]
    );

    const codeChecks = await pool.query(
      "SELECT * FROM code_checks WHERE participant_id = $1 ORDER BY created_at ASC",
      [id]
    );

    res.json({
      participant: participant.rows[0],
      testResults: testResults.rows,
      codeSubmission: codeSubmission.rows[0] || null,
      surveyResponses: surveyResponses.rows,
      chatMessages: chatMessages.rows,
      codeChecks: codeChecks.rows,
    });
  } catch (err) {
    console.error("Admin participant detail error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

export default router;
