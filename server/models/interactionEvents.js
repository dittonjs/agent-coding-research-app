import pool from "../db/connection.js";

export async function saveInteractionEvents(participantId, sessionId, events, batchSeq) {
  const result = await pool.query(
    `INSERT INTO interaction_events (participant_id, session_id, events, batch_seq)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [participantId, sessionId, JSON.stringify(events), batchSeq]
  );
  return result.rows[0];
}

export async function getInteractionEvents(participantId) {
  const result = await pool.query(
    "SELECT * FROM interaction_events WHERE participant_id = $1 ORDER BY batch_seq ASC",
    [participantId]
  );
  return result.rows;
}
