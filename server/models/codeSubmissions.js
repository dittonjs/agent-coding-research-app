import pool from "../db/connection.js";

export async function saveCodeSubmission(participantId, code, durationMs) {
  const result = await pool.query(
    `INSERT INTO code_submissions (participant_id, code, duration_ms)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [participantId, code, durationMs]
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
