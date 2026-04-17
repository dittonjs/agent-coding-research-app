import express from "express";
import archiver from "archiver";
import pool from "../db/connection.js";
import { requireAdmin } from "../middleware/auth.js";
import {
  findByUsername,
  verifyPassword,
  createSession,
  deleteSession,
} from "../models/users.js";
import { createStudy, getAllStudies, getActiveStudy, toggleStudyActive } from "../models/studies.js";

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

// GET /api/admin/studies
router.get("/studies", requireAdmin, async (req, res) => {
  try {
    const studies = await getAllStudies();
    const active = await getActiveStudy();
    res.json({ studies, activeStudyId: active?.id || null });
  } catch (err) {
    console.error("Admin studies error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// POST /api/admin/studies
router.post("/studies", requireAdmin, async (req, res) => {
  try {
    const { name, description, timerEnabled } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Study name is required." });
    }
    const study = await createStudy(name.trim(), description?.trim(), {
      timerEnabled: timerEnabled !== false,
    });
    res.json({ study });
  } catch (err) {
    console.error("Admin create study error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// PATCH /api/admin/studies/:id/active
router.patch("/studies/:id/active", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const study = await toggleStudyActive(id, isActive);
    if (!study) {
      return res.status(404).json({ error: "Study not found." });
    }
    const studies = await getAllStudies();
    const active = await getActiveStudy();
    res.json({ study, studies, activeStudyId: active?.id || null });
  } catch (err) {
    console.error("Admin toggle study error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// GET /api/admin/participants
router.get("/participants", requireAdmin, async (req, res) => {
  try {
    const { studyId } = req.query;

    let query = `
      SELECT
        p.id,
        p.group_assignment,
        p.current_step,
        p.age_range,
        p.gender,
        p.cs_year,
        p.prior_ai_usage,
        p.ethnicity,
        p.study_id,
        p.consent_timestamp,
        p.created_at
      FROM participants p
    `;
    const params = [];

    if (studyId) {
      query += " WHERE p.study_id = $1";
      params.push(studyId);
    }

    query += " ORDER BY p.created_at DESC";

    const result = await pool.query(query, params);
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

    const editorEvents = await pool.query(
      "SELECT * FROM editor_events WHERE participant_id = $1 ORDER BY batch_seq ASC",
      [id]
    );

    res.json({
      participant: participant.rows[0],
      testResults: testResults.rows,
      codeSubmission: codeSubmission.rows[0] || null,
      surveyResponses: surveyResponses.rows,
      chatMessages: chatMessages.rows,
      editorEvents: editorEvents.rows,
    });
  } catch (err) {
    console.error("Admin participant detail error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// Helper: escape a value for CSV
function csvEscape(val) {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function toCsvRow(values) {
  return values.map(csvEscape).join(",");
}

function toCsv(headers, rows) {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(toCsvRow(row));
  }
  return lines.join("\n");
}

// GET /api/admin/studies/:id/export
router.get("/studies/:id/export", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const study = await pool.query("SELECT * FROM studies WHERE id = $1", [id]);
    if (!study.rows[0]) {
      return res.status(404).json({ error: "Study not found." });
    }
    const studyName = study.rows[0].name.replace(/[^a-zA-Z0-9_-]/g, "_");

    // Fetch all participants for this study
    const participantsResult = await pool.query(
      "SELECT * FROM participants WHERE study_id = $1 ORDER BY id",
      [id]
    );
    const participants = participantsResult.rows;
    const pIds = participants.map((p) => p.id);

    if (pIds.length === 0) {
      return res.status(400).json({ error: "No participants in this study." });
    }

    // Fetch all related data
    const [testResults, codeSubmissions, surveyResponses, chatMessages, editorEvents, interactionEvents] =
      await Promise.all([
        pool.query("SELECT * FROM test_results WHERE participant_id = ANY($1) ORDER BY participant_id, test_type", [pIds]),
        pool.query("SELECT * FROM code_submissions WHERE participant_id = ANY($1) ORDER BY participant_id", [pIds]),
        pool.query("SELECT * FROM survey_responses WHERE participant_id = ANY($1) ORDER BY participant_id", [pIds]),
        pool.query("SELECT * FROM chat_messages WHERE participant_id = ANY($1) ORDER BY participant_id, created_at", [pIds]),
        pool.query("SELECT * FROM editor_events WHERE participant_id = ANY($1) ORDER BY participant_id, batch_seq", [pIds]),
        pool.query("SELECT * FROM interaction_events WHERE participant_id = ANY($1) ORDER BY participant_id, batch_seq", [pIds]),
      ]);

    // Index data by participant
    const testsByP = {};
    for (const t of testResults.rows) {
      if (!testsByP[t.participant_id]) testsByP[t.participant_id] = {};
      testsByP[t.participant_id][t.test_type] = t;
    }
    const subByP = {};
    for (const s of codeSubmissions.rows) {
      subByP[s.participant_id] = s;
    }
    const surveyByP = {};
    for (const s of surveyResponses.rows) {
      if (!surveyByP[s.participant_id]) surveyByP[s.participant_id] = {};
      surveyByP[s.participant_id][s.survey_type] = s;
    }

    // ── CSV 1: participants.csv ──
    // Collect all unique survey response keys
    const surveyKeys = new Set();
    for (const s of surveyResponses.rows) {
      if (s.responses && typeof s.responses === "object") {
        for (const key of Object.keys(s.responses)) {
          surveyKeys.add(key);
        }
      }
    }
    const sortedSurveyKeys = [...surveyKeys].sort();

    const pHeaders = [
      "participant_id", "group_assignment", "current_step",
      "age_range", "gender", "ethnicity", "cs_year", "prior_ai_usage",
      "pre_test_score", "pre_test_total", "pre_test_duration_ms", "pre_test_skipped",
      "post_test_score", "post_test_total", "post_test_duration_ms", "post_test_skipped",
      "code_submission_duration_ms", "code_submitted", "code_gave_up",
      ...sortedSurveyKeys.map((k) => `survey_${k}`),
      "created_at",
    ];
    const pRows = participants.map((p) => {
      const pre = testsByP[p.id]?.pre;
      const post = testsByP[p.id]?.post;
      const sub = subByP[p.id];
      const survey = surveyByP[p.id]?.post;

      return [
        p.id, p.group_assignment, p.current_step,
        p.age_range, p.gender, p.ethnicity, p.cs_year, p.prior_ai_usage,
        pre?.results?.correctCount ?? "", pre?.results?.totalSteps ?? "",
        pre?.results?.durationMs ?? "", pre?.results?.skipped ?? "",
        post?.results?.correctCount ?? "", post?.results?.totalSteps ?? "",
        post?.results?.durationMs ?? "", post?.results?.skipped ?? "",
        sub?.duration_ms ?? "", sub ? "yes" : "no", sub?.gave_up ? "yes" : "no",
        ...sortedSurveyKeys.map((k) => survey?.responses?.[k] ?? ""),
        p.created_at,
      ];
    });

    // ── CSV 2: chat_messages.csv ──
    const chatHeaders = ["participant_id", "message_id", "role", "content", "code_snapshot", "created_at"];
    const chatRows = chatMessages.rows.map((m) => [
      m.participant_id, m.id, m.role, m.content, m.code_snapshot || "", m.created_at,
    ]);

    // ── CSV 3: editor_events.csv ──
    const editorHeaders = ["participant_id", "timestamp_ms", "source", "change_detail"];
    const editorRows = [];
    for (const batch of editorEvents.rows) {
      const events = Array.isArray(batch.events) ? batch.events : [];
      for (const ev of events) {
        let detail = "";
        if (ev.fullContent !== undefined) {
          detail = ev.source === "language-change"
            ? `${ev.fromLanguage} -> ${ev.toLanguage}`
            : "full content replaced";
        } else if (ev.changes) {
          detail = ev.changes.map((c) => {
            const loc = `L${c.range?.startLine}:${c.range?.startCol}`;
            if (c.text === "" && c.rangeLength > 0) return `deleted ${c.rangeLength} chars at ${loc}`;
            const preview = (c.text || "").slice(0, 100).replace(/\n/g, "\\n");
            if (c.rangeLength > 0) return `replaced ${c.rangeLength} chars with "${preview}" at ${loc}`;
            return `inserted "${preview}" at ${loc}`;
          }).join("; ");
        }
        editorRows.push([batch.participant_id, ev.ts, ev.source, detail]);
      }
    }

    // ── CSV 4: interaction_events.csv ──
    const interactionHeaders = ["participant_id", "session_id", "timestamp_ms", "event_type", "url", "target", "detail"];
    const interactionRows = [];
    for (const batch of interactionEvents.rows) {
      const events = Array.isArray(batch.events) ? batch.events : [];
      for (const ev of events) {
        let target = "";
        if (ev.target) {
          const parts = [];
          if (ev.target.tag) parts.push(ev.target.tag);
          if (ev.target.id) parts.push(`#${ev.target.id}`);
          if (ev.target.className) parts.push(`.${ev.target.className.split(" ")[0]}`);
          if (ev.target.text) parts.push(`"${ev.target.text.slice(0, 50)}"`);
          target = parts.join("");
        }

        let detail = "";
        if (ev.type === "click") detail = `x=${ev.x},y=${ev.y}`;
        else if (ev.type === "keydown") {
          detail = ev.modifiers ? `${ev.modifiers.join("+")}+${ev.key}` : ev.key;
        }
        else if (ev.type === "input") detail = ev.value ?? `len=${ev.valueLength}`;
        else if (ev.type === "change") detail = ev.value ?? "";
        else if (ev.type === "scroll") detail = `x=${ev.scrollX},y=${ev.scrollY}`;
        else if (ev.type === "visibility") detail = ev.state;

        interactionRows.push([
          batch.participant_id, batch.session_id, ev.ts, ev.type, ev.url || "", target, detail,
        ]);
      }
    }

    // Build zip
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${studyName}_export.zip"`);

    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("error", (err) => {
      console.error("Archive error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Export failed." });
      }
    });

    // Wait for the archive stream to fully flush to the response
    const streamDone = new Promise((resolve, reject) => {
      res.on("finish", resolve);
      res.on("error", reject);
    });

    archive.pipe(res);

    archive.append(toCsv(pHeaders, pRows), { name: "participants.csv" });
    archive.append(toCsv(chatHeaders, chatRows), { name: "chat_messages.csv" });
    archive.append(toCsv(editorHeaders, editorRows), { name: "editor_events.csv" });
    archive.append(toCsv(interactionHeaders, interactionRows), { name: "interaction_events.csv" });

    archive.finalize();
    await streamDone;
  } catch (err) {
    console.error("Export error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Export failed." });
    }
  }
});

export default router;
