import "dotenv/config";
import pool from "./db/connection.js";

try {
  await pool.query("DELETE FROM interaction_events");
  await pool.query("DELETE FROM editor_events");
  await pool.query("DELETE FROM language_changes");
  await pool.query("DELETE FROM code_checks");
  await pool.query("DELETE FROM chat_messages");
  await pool.query("DELETE FROM survey_responses");
  await pool.query("DELETE FROM code_submissions");
  await pool.query("DELETE FROM test_results");
  await pool.query("DELETE FROM participants");
  await pool.query("DELETE FROM studies");
  await pool.query("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE is_admin = FALSE)");
  await pool.query("DELETE FROM users WHERE is_admin = FALSE");

  console.log("All study data cleared.");
} catch (err) {
  console.error("Error resetting study data:", err);
  process.exit(1);
}

await pool.end();
