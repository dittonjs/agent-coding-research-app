import pool from "../db/connection.js";

export async function saveTestResult(participantId, testType, results) {
  const result = await pool.query(
    `INSERT INTO test_results (participant_id, test_type, results)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [participantId, testType, JSON.stringify(results)]
  );
  return result.rows[0];
}

export async function getTestResults(participantId) {
  const result = await pool.query(
    "SELECT * FROM test_results WHERE participant_id = $1",
    [participantId]
  );
  return result.rows;
}
