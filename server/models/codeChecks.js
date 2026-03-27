import pool from "../db/connection.js";

export async function saveCodeCheck(participantId, code, language, correct, agentMessage) {
  const result = await pool.query(
    `INSERT INTO code_checks (participant_id, code, language, correct, agent_message)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [participantId, code, language, correct, agentMessage]
  );
  return result.rows[0];
}

export async function getCodeChecks(participantId) {
  const result = await pool.query(
    "SELECT * FROM code_checks WHERE participant_id = $1 ORDER BY created_at ASC",
    [participantId]
  );
  return result.rows;
}
