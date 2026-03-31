import pool from "../db/connection.js";

export async function createStudy(name, description, { timerEnabled = true } = {}) {
  // Deactivate all other studies, new one becomes active
  await pool.query("UPDATE studies SET is_active = FALSE WHERE is_active = TRUE");
  const result = await pool.query(
    `INSERT INTO studies (name, description, is_active, timer_enabled) VALUES ($1, $2, TRUE, $3) RETURNING *`,
    [name, description || null, timerEnabled]
  );
  return result.rows[0];
}

export async function getAllStudies() {
  const result = await pool.query(
    "SELECT * FROM studies ORDER BY created_at DESC"
  );
  return result.rows;
}

export async function getActiveStudy() {
  const result = await pool.query(
    "SELECT * FROM studies WHERE is_active = TRUE LIMIT 1"
  );
  return result.rows[0] || null;
}

export async function getStudyById(id) {
  const result = await pool.query(
    "SELECT * FROM studies WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
}

export async function toggleStudyActive(id, isActive) {
  if (isActive) {
    // Deactivate all others first
    await pool.query("UPDATE studies SET is_active = FALSE WHERE is_active = TRUE");
  }
  const result = await pool.query(
    "UPDATE studies SET is_active = $1 WHERE id = $2 RETURNING *",
    [isActive, id]
  );
  return result.rows[0];
}
