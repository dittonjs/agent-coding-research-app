import pool from "../db/connection.js";

export async function saveEditorEvents(participantId, events, batchSeq) {
  const result = await pool.query(
    `INSERT INTO editor_events (participant_id, events, batch_seq)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [participantId, JSON.stringify(events), batchSeq]
  );
  return result.rows[0];
}

export async function getEditorEvents(participantId) {
  const result = await pool.query(
    "SELECT * FROM editor_events WHERE participant_id = $1 ORDER BY batch_seq ASC",
    [participantId]
  );
  return result.rows;
}
