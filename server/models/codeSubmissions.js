import pool from "../db/connection.js";

export async function saveCodeSubmission(participantId, code, durationMs, gaveUp = false) {
  const result = await pool.query(
    `INSERT INTO code_submissions (participant_id, code, duration_ms, gave_up)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [participantId, code, durationMs, gaveUp]
  );
  return result.rows[0];
}

export async function getCodeSubmission(participantId) {
  const result = await pool.query(
    "SELECT * FROM code_submissions WHERE participant_id = $1 ORDER BY created_at DESC LIMIT 1",
    [participantId]
  );
  return result.rows[0] || null;
}
