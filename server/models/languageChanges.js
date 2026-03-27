import pool from "../db/connection.js";

export async function saveLanguageChange(participantId, fromLanguage, toLanguage, codeSnapshot) {
  const result = await pool.query(
    `INSERT INTO language_changes (participant_id, from_language, to_language, code_snapshot)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [participantId, fromLanguage, toLanguage, codeSnapshot]
  );
  return result.rows[0];
}

export async function getLanguageChanges(participantId) {
  const result = await pool.query(
    "SELECT * FROM language_changes WHERE participant_id = $1 ORDER BY created_at ASC",
    [participantId]
  );
  return result.rows;
}
