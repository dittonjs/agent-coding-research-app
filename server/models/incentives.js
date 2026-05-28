import pool from "../db/connection.js";

// Records the gift-card contact info and advances the participant to the final
// step in a single transaction. The incentive row is linked to the study, but
// never to the participant — so contact PII cannot be tied back to anonymous
// responses. On decline, no incentive row is written; we just finish the study.
export async function recordIncentiveAndComplete(participant, { name, email, declined }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (!declined) {
      await client.query(
        "INSERT INTO incentives (study_id, name, email) VALUES ($1, $2, $3)",
        [participant.study_id || null, name, email]
      );
    }

    const result = await client.query(
      "UPDATE participants SET current_step = 9 WHERE id = $1 RETURNING *",
      [participant.id]
    );

    await client.query("COMMIT");
    return result.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
