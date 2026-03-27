import pool from "../db/connection.js";

export async function saveChatMessage(participantId, role, content, codeSnapshot, selectionInfo) {
  const result = await pool.query(
    `INSERT INTO chat_messages (participant_id, role, content, code_snapshot, selection_info)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [participantId, role, content, codeSnapshot, selectionInfo ? JSON.stringify(selectionInfo) : null]
  );
  return result.rows[0];
}

export async function getChatHistory(participantId) {
  const result = await pool.query(
    "SELECT * FROM chat_messages WHERE participant_id = $1 ORDER BY created_at ASC",
    [participantId]
  );
  return result.rows;
}

export async function getChatMessageCount(participantId) {
  const result = await pool.query(
    "SELECT COUNT(*) as count FROM chat_messages WHERE participant_id = $1 AND role = 'user'",
    [participantId]
  );
  return parseInt(result.rows[0].count, 10);
}
